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

var observeArray = require("../src/observe-plus").observe;

describe("GIVEN an observed array", function () {

    var array,
        observer,
        aggregatedEvents;

    function resetAggregatedEvents() {
        aggregatedEvents = [];
    }

    beforeEach(function () {
        array = [];
        observer = observeArray(array);
    });

    describe("WHEN observing newly added items", function () {

        var dispose;

        beforeEach(function () {
            resetAggregatedEvents();
            dispose = observer.observe("splice", function (ev) {
                aggregatedEvents.push([ev, "observer1"]);
            });
        });

        it("THEN shouldn't publish any event before a new item is added", function (done) {
            asap(function () {
                expect(aggregatedEvents.length).to.equal(0);
                done();
            });
        });

        describe("WHEN a new item is added", function () {
            beforeEach(function () {
                array.push("newItem");
            });

            it("THEN should publish a splice event", function (done) {
                asap(function () {
                    var firstEvent = aggregatedEvents[0][0],
                        observerName = aggregatedEvents[0][1];

                    expect(firstEvent.index).to.equal(0);
                    expect(firstEvent.type).to.equal("splice");
                    expect(firstEvent.object[0]).to.equal("newItem");
                    expect(observerName).to.equal("observer1");
                    done();
                });
            });

            it("THEN published only one event", function (done) {
                asap(function () {
                    expect(aggregatedEvents.length).to.equal(1);
                    done();
                });
            });

            describe("WHEN destroying", function () {
                beforeEach(function () {
                    resetAggregatedEvents();
                    observer.destroy();

                    array.push("value");
                });

                it("THEN doesn't publish events anymore", function (done) {
                    asap(function () {
                        expect(aggregatedEvents.length).to.equal(0);
                        done();
                    });
                });
            });

            describe("WHEN the item is modified", function () {
                beforeEach(function () {
                    resetAggregatedEvents();
                    observer.observe("update", function (ev) {
                        aggregatedEvents.push([ev]);
                    });
                    array[0] = "updatedItem";
                });

                it("THEN calls the observer with the updated event", function (done) {
                    asap(function () {
                        var firstEvent = aggregatedEvents[0][0];

                        expect(firstEvent.type).to.equal("update");
                        expect(firstEvent.object[0]).to.equal("updatedItem");
                        done();
                    });
                });
            });

            describe("WHEN the property is deleted", function () {
                beforeEach(function () {
                    resetAggregatedEvents();
                    observer.observe("splice", function (ev) {
                        aggregatedEvents.push([ev]);
                    });
                    array.pop();
                });

                it("THEN calls the observer with the splice event", function (done) {
                    asap(function () {
                        var firstEvent = aggregatedEvents[0][0];

                        expect(firstEvent.type).to.equal("splice");
                        expect(firstEvent.object.length).to.equal(0);
                        done();
                    });
                });
            });
        });
    });

    describe("WHEN observing specific indexes", function () {
        beforeEach(function () {
            resetAggregatedEvents();
            observer.observeValue(0, function (ev) {
                aggregatedEvents.push([ev]);
            });
            array.push("value");
            array[0] = "newValue";
        });

        it("THEN publishes an event with the new value and a new event with the old value", function (done) {
            asap(function () {
                var firstEvent = aggregatedEvents[0][0];
                expect(firstEvent.type).to.equal("splice");
                expect(firstEvent.index).to.equal("0");
                expect(firstEvent.object[0]).to.equal("newValue");

                var lastEvent = aggregatedEvents[1][0];
                expect(lastEvent.type).to.equal("update");
                expect(lastEvent.name).to.equal("0");
                expect(lastEvent.object[0]).to.equal("newValue");
                expect(lastEvent.oldValue).to.equal("value");
                done();
            });
        });
    });

    describe("WHEN observing nested properties", function () {
        beforeEach(function () {
            resetAggregatedEvents();
            observer.observeValue("0.nested.property", function (ev) {
                aggregatedEvents.push([ev]);
            });
            array.push({
                nested: {
                    property: true
                }
            });
        });

        it("THEN publishes an event with the new value", function (done) {
            asap(function () {
                var event = aggregatedEvents[0][0];
                expect(event).to.eql({
                    type: "splice",
                    object: array,
                    index: "0.nested.property",
                    removed: [],
                    addedCount: 1,
                    oldValue: undefined
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
                    var event = aggregatedEvents[1][0];
                    expect(event).to.eql({
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
                    var event = aggregatedEvents[1][0];
                    expect(event).to.eql({
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
                    var event = aggregatedEvents[1][0];
                    expect(event).to.eql({
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
        var dispose;

        beforeEach(function () {
            resetAggregatedEvents();
            dispose = observer.observeValueOnce(0, function (ev) {
                aggregatedEvents.push([ev]);
            });
            array.push("value");
            array[0] = "newValue";
        });

        it("THEN the observer is called", function (done) {
            asap(function () {
                var firstEvent = aggregatedEvents[0][0];
                expect(firstEvent.type).to.equal("splice");
                expect(firstEvent.index).to.equal("0");
                expect(firstEvent.object[0]).to.equal("newValue");
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
        beforeEach(function () {
            observer.observe("splice", function (ev) {
                aggregatedEvents.push([ev]);
            });
            observer.pause();
        });

        describe("WHEN a property changes", function () {
            beforeEach(function () {
                resetAggregatedEvents();
                array.push("value");
                array.pop();
            });

            it("THEN the observers aren't called", function (done) {
                asap(function () {
                    expect(aggregatedEvents.length).to.equal(0);
                    done();
                });
            });

            describe("WHEN resuming publishing the updates", function () {
                beforeEach(function () {
                    observer.resume();
                });

                it("THEN calls all the observers in order", function (done) {
                    asap(function () {
                        var firstEvent = aggregatedEvents[0][0],
                            secondEvent = aggregatedEvents[1][0];

                        expect(firstEvent.addedCount).to.equal(1);
                        expect(secondEvent.removed.length).to.equal(1);
                        done();
                    });
                });

                describe("WHEN the updates are paused and resumed again", function () {
                    beforeEach(function () {
                        resetAggregatedEvents();
                        observer.pause();
                        array.push("lastValue");
                        observer.resume();
                    });

                    it("THEN only publishes the new event", function (done) {
                        asap(function () {
                            expect(aggregatedEvents.length).to.equal(1);
                            done();
                        });
                    });
                });
            });
        });
    });
});