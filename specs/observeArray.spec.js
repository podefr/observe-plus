/*global describe, it, beforeEach */
/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014-2015 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
"use strict";

var chai = require("chai");
var expect = chai.expect;
var asap = require("asap");
var sinon = require("sinon");

var observeArray = require("../src/observe-plus").observe;

describe("GIVEN an observed array", function () {

    var array, observer;

    beforeEach(function () {
        array = [];
        observer = observeArray(array);
    });

    describe("WHEN observing newly added items", function () {
        var dispose, spy;

        beforeEach(function () {
            spy = sinon.spy();
            dispose = observer.observe("splice", spy);
        });

        afterEach(function () {
            spy.reset();
        });

        it("THEN shouldn't publish any event before a new item is added", function (done) {
            asap(function () {
                expect(spy.called).to.be.false;
                done();
            });
        });

        describe("WHEN a new item is added", function () {
            beforeEach(function () {
                array.push("newItem");
            });

            it("THEN should publish a splice event", function (done) {
                asap(function () {
                    expect(spy.lastCall.args[0]).to.eql({
                        type: 'splice',
                        object: ['newItem'],
                        index: 0,
                        removed: [],
                        addedCount: 1
                    });
                    done();
                });
            });

            it("THEN published only one event", function (done) {
                asap(function () {
                    expect(spy.callCount).to.equal(1);
                    done();
                });
            });

            describe("WHEN destroying", function () {
                beforeEach(function () {
                    observer.destroy();

                    array.push("value");
                });

                it("THEN doesn't publish events anymore", function (done) {
                    asap(function () {
                        expect(spy.callCount).to.equal(1);
                        done();
                    });
                });
            });

            describe("WHEN the item is modified", function () {
                beforeEach(function () {
                    observer.observe("update", spy);
                    array[0] = "updatedItem";
                });

                it("THEN calls the observer with the updated event", function (done) {
                    asap(function () {
                        expect(spy.lastCall.args[0]).to.eql({
                            type: "update",
                            object: ["updatedItem"],
                            name: "0",
                            oldValue: "newItem"
                        });
                        done();
                    });
                });
            });

            describe("WHEN the property is deleted", function () {
                beforeEach(function () {
                    observer.observe("splice", spy);
                    array.pop();
                });

                it("THEN calls the observer with the splice event", function (done) {
                    asap(function () {
                        expect(spy.lastCall.args[0]).to.eql({
                            type: "splice",
                            object: [],
                            index: 0,
                            removed: ["newItem"],
                            addedCount: 0
                        });
                        done();
                    });
                });
            });
        });
    });

    describe("WHEN observing specific indexes", function () {
        var spy;

        beforeEach(function () {
            spy = sinon.spy();
            observer.observeValue(0, spy);
            array.push("value");
            array[0] = "newValue";
        });

        afterEach(function () {
            sinon.spy();
        });

        it("THEN publishes an event with the new value and a new event with the old value", function (done) {
            asap(function () {
                expect(spy.firstCall.args[0]).to.eql({
                    type: "splice",
                    object: ["newValue"],
                    index: "0",
                    removed: [],
                    addedCount: 1
                });

                expect(spy.lastCall.args[0]).to.eql({
                    type: "update",
                    name: "0",
                    object: ["newValue"],
                    oldValue: "value"
                });
                done();
            });
        });
    });

    describe("WHEN observing nested properties", function () {
        var spy;

        beforeEach(function () {
            spy = sinon.spy();
            observer.observeValue("0.nested.property", spy);
            array.push({
                nested: {
                    property: true
                }
            });
        });

        afterEach(function () {
            spy.reset();
        });

        it("THEN publishes an event with the new value", function (done) {
            asap(function () {
                expect(spy.firstCall.args[0]).to.eql({
                    type: "splice",
                    object: array,
                    index: "0.nested.property",
                    removed: [],
                    addedCount: 1
                });
                done();
            });
        });

        describe("WHEN the nested property is updated", function () {
            beforeEach(function () {
                array[0].nested.property = false;
            });

            it("THEN publishes an event with the new value", function (done) {
                asap(function () {
                    expect(spy.secondCall.args[0]).to.eql({
                        type: "update",
                        object: array,
                        name: "0.nested.property",
                        oldValue: true
                    });
                    done();
                });
            });
        });

        describe("WHEN the nested property is deleted", function () {
            beforeEach(function () {
                delete array[0].nested.property;
            });

            it("THEN publishes a delete event", function (done) {
                asap(function () {
                    expect(spy.secondCall.args[0]).to.eql({
                        type: "delete",
                        object: array,
                        name: "0.nested.property",
                        oldValue: true
                    });
                    done();
                });
            });
        });

        describe("WHEN a parent object of the nested property is deleted", function () {
            beforeEach(function () {
                delete array[0].nested;
            });

            it("THEN publishes a delete event", function (done) {
                asap(function () {
                    expect(spy.secondCall.args[0]).to.eql({
                        type: "delete",
                        object: array,
                        name: "0.nested.property",
                        oldValue: true
                    });
                    done();
                });
            });
        });
    });

    describe("WHEN observing specific indexes only once", function () {
        var dispose, spy;

        beforeEach(function () {
            spy = sinon.spy();
            dispose = observer.observeValueOnce(0, spy);
            array.push("value");
            array[0] = "newValue";
        });

        it("THEN the observer is called", function (done) {
            asap(function () {
                expect(spy.firstCall.args[0]).to.eql({
                    type: "splice",
                    index: "0",
                    object: ["newValue"],
                    removed: [],
                    addedCount: 1
                });
                done();
            });
        });

        it("THEN is disposed of", function (done) {
            asap(function () {
                expect(dispose()).to.be.false;
                done();
            });
        });
    });

    describe("WHEN pausing the updates", function () {
        var spy;

        beforeEach(function () {
            spy = sinon.spy();

            observer.observe("splice", spy);
            observer.pause();
        });

        describe("WHEN a property changes", function () {
            beforeEach(function () {
                array.push("value");
                array.pop();
            });

            it("THEN the observers aren't called", function (done) {
                asap(function () {
                    expect(spy.called).to.be.false;
                    done();
                });
            });

            describe("WHEN resuming publishing the updates", function () {
                beforeEach(function () {
                    observer.resume();
                });

                it("THEN calls all the observers in order", function (done) {
                    asap(function () {
                        expect(spy.firstCall.args[0].addedCount).to.equal(1);
                        expect(spy.secondCall.args[0].removed.length).to.equal(1);
                        done();
                    });
                });

                describe("WHEN the updates are paused and resumed again", function () {
                    beforeEach(function () {
                        spy.reset();
                        observer.pause();
                        array.push("lastValue");
                        observer.resume();
                    });

                    it("THEN only publishes the new event", function (done) {
                        asap(function () {
                            expect(spy.callCount).to.equal(1);
                            done();
                        });
                    });
                });
            });
        });
    });
});


describe("GIVEN an array with a nested array ", function () {
    var array, observer;

    beforeEach(function () {
        array = [{nested: []}];
        observer = observeArray(array);
    });

    describe("WHEN observing splice events", function () {
        var spy;

        beforeEach(function () {
            spy = sinon.spy();
            observer.observe("splice", spy);
        });

        afterEach(function () {
            spy.reset();
        });

        describe("WHEN a value is added to the nested array", function () {
            beforeEach(function () {
                array[0].nested.push(1);
            });

            it("THEN publishes an event", function (done) {
                asap(function () {
                    expect(spy.firstCall.args[0]).to.eql({
                        type: 'splice',
                        object: array,
                        index: '0.nested.0',
                        removed: [],
                        addedCount: 1
                    });
                    done();
                });
            });
        });
    });

    describe("WHEN observing update events", function () {
        var spy;

        beforeEach(function () {
            spy = sinon.spy();
            observer.observe("update", spy);
            array[0].nested.push(1);
        });

        afterEach(function () {
            spy.reset();
        });

        describe("WHEN a value in the nested array is updated", function () {
            beforeEach(function () {
                array[0].nested[0] = 2
            });

            it("THEN publishes an event", function (done) {
                asap(function () {
                    expect(spy.firstCall.args[0]).to.eql({
                        type: 'update',
                        object: array,
                        name: '0.nested.0',
                        oldValue: 1
                    });
                    done();
                });
            });
        });
    });

    describe("WHEN observing update events", function () {
        var spy;

        beforeEach(function () {
            spy = sinon.spy();
            observer.observe("update", spy);
            array[0].nested.push(1);
        });

        afterEach(function () {
            spy.reset();
        });

        describe("WHEN the nested array is updated", function () {
            beforeEach(function () {
                array[0].nested = [];
            });

            it("THEN publishes an event", function (done) {
                asap(function () {
                    expect(spy.firstCall.args[0]).to.eql({
                        type: 'update',
                        object: array,
                        name: '0.nested',
                        oldValue: [1]
                    });
                    done();
                });
            });
        });
    });
});