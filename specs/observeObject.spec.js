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

var observeObject = require("../src/observe-plus").observe;

describe("GIVEN an observed object", function () {
    var pojo, observer;

    beforeEach(function () {
        pojo = {};
        observer = observeObject(pojo);
    });

    describe("WHEN observing newly added properties", function () {
        var dispose, spy;

        beforeEach(function () {
            spy = sinon.spy();
            dispose = observer.observe("add", spy);
        });

        it("THEN shouldn't publish any event before a new property is added", function (done) {
            asap(function () {
                expect(spy.callCount).to.equal(0);
                done();
            });
        });

        describe("WHEN a new property is added", function () {
            beforeEach(function () {
                pojo.newProperty = "newValue";
            });

            it("THEN should publish a new event", function (done) {
                asap(function () {
                    expect(spy.firstCall.args[0]).to.eql({
                        type: "add",
                        name: "newProperty",
                        object: pojo
                    });
                    done();
                });
            });

            it("THEN only published one event", function (done) {
                asap(function () {
                    expect(spy.callCount).to.equal(1);
                    done();
                });
            });

            describe("WHEN destroying", function () {
                beforeEach(function () {
                    observer.destroy();

                    pojo.anotherProperty = "value";
                });

                it("THEN doesn't publish events anymore", function (done) {
                    asap(function () {
                        expect(spy.callCount).to.equal(1);
                        done();
                    });
                });
            });

            describe("WHEN the property is modified", function () {
                beforeEach(function () {
                    observer.observe("update", spy);
                    pojo.newProperty = "updatedValue";
                });

                it("THEN calls the observer with the updated event", function (done) {
                    asap(function () {
                        expect(spy.secondCall.args[0]).to.eql({
                            type: "update",
                            name: "newProperty",
                            object: pojo,
                            oldValue: "newValue"
                        });
                        done();
                    });
                });
            });

            describe("WHEN the property is deleted", function () {
                beforeEach(function () {
                    observer.observe("delete", spy);
                    delete pojo.newProperty;
                });

                it("THEN calls the observer with undefined and the old value", function (done) {
                    asap(function () {
                        expect(spy.secondCall.args[0]).to.eql({
                            type: "delete",
                            name: "newProperty",
                            object: pojo,
                            oldValue: "newValue"
                        });
                        done();
                    });
                });
            });
        });

        describe("WHEN a new observer is added", function () {
            var dispose2;

            beforeEach(function () {
                dispose2 = observer.observe("add", spy);
            });

            describe("WHEN an observer is disposed of", function () {
                var isDisposedOf = false;

                beforeEach(function () {
                    isDisposedOf = dispose();
                });

                describe("WHEN a new property is added", function () {
                    beforeEach(function () {
                        pojo.newProperty = {};
                    });

                    it("THEN doesn't call the disposed observer anymore", function (done) {
                        asap(function () {
                            expect(spy.callCount).to.equal(1);

                            done();
                        });
                    });

                    it("THEN tells if the observer can be disposed of", function () {
                        expect(isDisposedOf).to.be.true;
                    });

                    describe("WHEN an observer has been disposed of", function () {
                        beforeEach(function () {
                            isDisposedOf = dispose();
                        });

                        it("THEN tells that it can't be disposed of anymore", function (done) {
                            expect(isDisposedOf).to.be.false;
                            done();
                        });
                    });
                });
            });
        });
    });

    describe("WHEN observing specific properties", function () {
        var dispose, spy;

        beforeEach(function () {
            spy = sinon.spy();
            dispose = observer.observeValue("newProperty", spy);
            pojo.newProperty = "newValue";
        });

        it("THEN publishes an event with the new value and the old value", function (done) {
            asap(function () {
                expect(spy.firstCall.args[0]).to.eql({
                    type: "add",
                    name: "newProperty",
                    object: pojo,
                    oldValue: undefined
                });
                done();
            });
        });
    });

    describe("WHEN observing nested properties", function () {
        var spy;

        beforeEach(function () {
            spy = sinon.spy();
            observer.observeValue("newProperty.nested.property", spy);
            pojo.newProperty = {
                nested: {
                    property: true
                }
            };
        });

        it("Then publishes an event", function (done) {
             asap(function () {
                 expect(spy.firstCall.args[0]).to.eql({
                     type: "add",
                     object: pojo,
                     name: "newProperty.nested.property",
                     oldValue: undefined
                 });
                 done();
             });
        });

        describe("WHEN the nested property is modified", function () {
            beforeEach(function () {
                pojo.newProperty.nested.property = false;
            });

            it("THEN publishes an update event", function (done) {
                asap(function () {
                    expect(spy.secondCall.args[0]).to.eql({
                        type: "update",
                        object: pojo,
                        name: "newProperty.nested.property",
                        oldValue: true
                    });
                    done();
                });
            });

            describe("WHEN a parent object is replaced and the value of the observed nested property changes", function () {
                beforeEach(function () {
                    pojo.newProperty.nested = {
                        property: true
                    };
                });

                it("THEN triggers a new event", function (done) {
                    asap(function () {
                        expect(spy.secondCall.args[0]).to.eql({
                            type: "update",
                            object: pojo,
                            name: "newProperty.nested.property",
                            oldValue: true
                        });
                        done();
                    });
                });
            });

            describe("WHEN a parent object is replaced and the value of the observed nested property doesn't change", function () {
                beforeEach(function () {
                    pojo.newProperty.nested = {
                        property: false
                    };
                });

                it("THEN doesn't trigger an event", function (done) {
                    asap(function () {
                        expect(spy.callCount).to.equal(2);
                        done();
                    });
                });
            });
        });

        describe("WHEN the nested property is deleted ", function () {
            beforeEach(function () {
                delete pojo.newProperty.nested;
            });

            it("THEN publishes a delete event", function (done) {
                asap(function () {
                    expect(spy.secondCall.args[0]).to.eql({
                        type: "delete",
                        name: "newProperty.nested.property",
                        object: pojo,
                        oldValue: true
                    });
                    done();
                });
            });
        });

        describe("WHEN a parent object of a nested property is deleted", function () {
            beforeEach(function () {
                delete pojo.newProperty;
            });

            it("THEN publishes a delete event", function (done) {
                asap(function () {
                    expect(spy.secondCall.args[0]).to.eql({
                        type: "delete",
                        name: "newProperty.nested.property",
                        object: pojo,
                        oldValue: true
                    });
                    done();
                });
            });
        });
    });

    describe("WHEN observing only once", function () {
        var dispose, spy;

        beforeEach(function () {
            spy = sinon.spy();
            dispose = observer.observeOnce("add", spy);
        });

        describe("WHEN the property is added", function () {
            beforeEach(function () {
                pojo.newProperty = "value";
            });

            it("THEN calls the observer", function (done) {
                asap(function () {
                    expect(spy.firstCall.args[0]).to.eql({
                        type: "add",
                        name: "newProperty",
                        object: pojo
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
    });

    describe("WHEN observing a property only once", function () {
        var dispose, spy;

        beforeEach(function () {
            spy = sinon.spy();
            dispose = observer.observeValueOnce("newProperty", spy);
            pojo.newProperty = "value";
        });

        it("THEN calls the observer", function (done) {
            asap(function () {
                expect(spy.firstCall.args[0]).to.eql({
                    type: "add",
                    object: pojo,
                    name: "newProperty",
                    oldValue: undefined
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
            observer.observeValue("newProperty", spy);
            observer.pause();
        });

        describe("WHEN a property changes", function () {
            beforeEach(function () {
                pojo.newProperty = "value";
                pojo.newProperty = "newValue";
                delete pojo.newProperty;
            });

            it("THEN the observers aren't called", function (done) {
                asap(function () {
                    expect(spy.callCount).to.equal(0);
                    done();
                });
            });

            describe("WHEN resuming publishing the updates", function () {
                beforeEach(function () {
                    observer.resume();
                });

                it("THEN calls all the observers in order", function (done) {
                    asap(function () {
                        expect(spy.firstCall.args[0].type).to.equal("add");
                        expect(spy.secondCall.args[0].type).to.equal("update");
                        expect(spy.thirdCall.args[0].type).to.equal("delete");
                        done();
                    });
                });

                describe("WHEN the updates are paused and resumed again", function () {
                    beforeEach(function () {
                        observer.pause();
                        pojo.newProperty = "lastValue";
                        observer.resume();
                    });

                    it("THEN only publishes the new event", function (done) {
                        asap(function () {
                            expect(spy.callCount).to.equal(4);
                            done();
                        });
                    });
                });
            });
        });
    });
});