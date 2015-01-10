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

var observeObject = require("../src/observe-plus").observe;

describe("GIVEN an observed object", function () {

    var pojo,
        observer,
        aggregatedEvents;

    function resetAggregatedEvents() {
        aggregatedEvents = [];
    }

    beforeEach(function () {
        pojo = {};
        observer = observeObject(pojo);
    });

    describe("WHEN observing newly added properties", function () {

        var dispose;

        beforeEach(function () {
            resetAggregatedEvents();
            dispose = observer.observe("add", function (ev) {
                aggregatedEvents.push([ev, "observer1"]);
            });
        });

        it("THEN shouldn't publish any event before a new property is added", function (done) {
            asap(function () {
                expect(aggregatedEvents.length).to.equal(0);
                done();
            });
        });

        describe("WHEN a new property is added", function () {
            beforeEach(function () {
                pojo.newProperty = "newValue";
            });

            it("THEN should publish a new event", function (done) {
                asap(function () {
                    var firstEvent = aggregatedEvents[0][0],
                        observerName = aggregatedEvents[0][1];

                    expect(firstEvent.type).to.equal("add");
                    expect(firstEvent.name).to.equal("newProperty");
                    expect(firstEvent.object.newProperty).to.equal("newValue");
                    expect(observerName).to.equal("observer1");
                    done();
                });
            });

            it("THEN only published one event", function (done) {
                asap(function () {
                    expect(aggregatedEvents.length).to.equal(1);
                    done();
                });
            });

            describe("WHEN destroying", function () {
                beforeEach(function () {
                    resetAggregatedEvents();
                    observer.destroy();

                    pojo.anotherProperty = "value";
                });

                it("THEN doesn't publish events anymore", function (done) {
                    asap(function () {
                        expect(aggregatedEvents.length).to.equal(0);
                        done();
                    });
                });
            });

            describe("WHEN the property is modified", function () {
                beforeEach(function () {
                    resetAggregatedEvents();
                    observer.observe("update", function (ev) {
                        aggregatedEvents.push([ev]);
                    });
                    pojo.newProperty = "updatedValue";
                });

                it("THEN calls the observer with the updated event", function (done) {
                    asap(function () {
                        var firstEvent = aggregatedEvents[0][0];

                        expect(firstEvent.type).to.equal("update");
                        expect(firstEvent.name).to.equal("newProperty");
                        expect(firstEvent.object.newProperty).to.equal("updatedValue");
                        expect(firstEvent.oldValue).to.equal("newValue");
                        done();
                    });
                });
            });

            describe("WHEN the property is deleted", function () {
                beforeEach(function () {
                    resetAggregatedEvents();
                    observer.observe("delete", function (ev) {
                        aggregatedEvents.push([ev]);
                    });
                    delete pojo.newProperty;
                });

                it("THEN calls the observer with undefined and the old value", function (done) {
                    asap(function () {
                        var firstEvent = aggregatedEvents[0][0];

                        expect(firstEvent.name).to.equal("newProperty");
                        expect(firstEvent.object.newProperty).to.be.undefined;
                        expect(firstEvent.oldValue).to.equal("newValue");
                        done();
                    });
                });
            });
        });

        describe("WHEN a new observer is added", function () {
            var dispose2;

            beforeEach(function () {
                resetAggregatedEvents();
                dispose2 = observer.observe("add", function (ev) {
                    aggregatedEvents.push([ev, "observer2"]);
                });
            });

            describe("WHEN an observer is disposed of", function () {
                var isDisposedOf = false;

                beforeEach(function () {
                    isDisposedOf = dispose();
                });

                describe("WHEN a new property is added", function () {
                    beforeEach(function () {
                        resetAggregatedEvents();
                        pojo.newProperty = {};
                    });

                    it("THEN doesn't call the disposed observer anymore", function (done) {
                        asap(function () {
                            var numberOfCallbacksCalled = aggregatedEvents.length,
                                firstObserverName = aggregatedEvents[0][1];

                            expect(numberOfCallbacksCalled).to.equal(1);
                            expect(firstObserverName).to.equal("observer2");

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
        var dispose;

        beforeEach(function () {
            resetAggregatedEvents();
            dispose = observer.observeValue("newProperty", function (ev) {
                aggregatedEvents.push([ev]);
            });
            pojo.newProperty = "newValue";
        });

        it("THEN publishes an event with the new value and the old value", function (done) {
            asap(function () {
                var firstEvent = aggregatedEvents[0][0];
                expect(firstEvent.name).to.equal("newProperty");
                expect(firstEvent.object.newProperty).to.equal("newValue");
                expect(firstEvent.oldValue).to.be.undefined;
                done();
            });
        });
    });

    xdescribe("WHEN observing nested properties", function () {
        beforeEach(function () {
            resetAggregatedEvents();
            observer.observeValue("newProperty.nested.property", function (ev) {
                console.log('ev', ev);
                aggregatedEvents.push([ev]);
            });
            pojo.newProperty = {
                nested: {
                    property: true
                }
            };
        });

        it("Then publishes an event", function (done) {
             asap(function () {
                var firstEvent = aggregatedEvents[0][0];
                 expect(firstEvent.name).to.equal("newProperty.nested.property");
                 expect(firstEvent.object.newProperty.nested.property).to.be.true;
                 done();
             });
        });

        describe("WHEN the nested property is modified", function () {
            beforeEach(function () {
                pojo.newProperty.nested.property = false;
            });

            it("THEN publishes an update event", function (done) {
                var lastEvent = aggregatedEvents[1][0];
                expect(lastEvent.name).to.equal("newProperty.nested.property");
                expect(lastEvent.object.newProperty.nested.property).to.be.false;
                done();
            });
        });
    });

    describe("WHEN observing only once", function () {
        var dispose;
        beforeEach(function () {
            resetAggregatedEvents();
            dispose = observer.observeOnce("add", function (ev) {
                aggregatedEvents.push([ev]);
            });
        });

        describe("WHEN the property is added", function () {
            beforeEach(function () {
                pojo.newProperty = "value";
            });

            it("THEN calls the observer", function (done) {
                asap(function () {
                    var firstEvent = aggregatedEvents[0][0];
                    expect(firstEvent.name).to.equal("newProperty");
                    expect(firstEvent.object.newProperty).to.equal("value");
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
        var dispose;
        beforeEach(function () {
            resetAggregatedEvents();
            dispose = observer.observeValueOnce("newProperty", function (ev) {
                aggregatedEvents.push([ev]);
            });
            pojo.newProperty = "value";
        });

        it("THEN calls the observer", function (done) {
            asap(function () {
                var firstEvent = aggregatedEvents[0][0];
                expect(firstEvent.name).to.equal("newProperty");
                expect(firstEvent.object.newProperty).to.equal("value");
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
            observer.observeValue("newProperty", function (ev) {
                aggregatedEvents.push([ev]);
            });
            observer.pause();
        });

        describe("WHEN a property changes", function () {
            beforeEach(function () {
                resetAggregatedEvents();
                pojo.newProperty = "value";
                pojo.newProperty = "newValue";
                delete pojo.newProperty;
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
                            secondEvent = aggregatedEvents[1][0],
                            thirdEvent = aggregatedEvents[2][0];

                        expect(firstEvent.type).to.equal("add");
                        expect(secondEvent.type).to.equal("update");
                        expect(thirdEvent.type).to.equal("delete");
                        done();
                    });
                });

                describe("WHEN the updates are paused and resumed again", function () {
                    beforeEach(function () {
                        resetAggregatedEvents();
                        observer.pause();
                        pojo.newProperty = "lastValue";
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