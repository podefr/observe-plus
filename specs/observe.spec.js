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

var Observe = require("../src/Observe");

describe("GIVEN Observe", function () {
    describe("WHEN initialized without an object or array", function () {
        it("THEN throws a TypeError", function () {
            expect(function () {
                new Observe();
            }).to.throw("observe must be called with an Array or an Object");
            expect(function () {
                new Observe(null);
            }).to.throw("observe must be called with an Array or an Object");
            expect(function () {
                new Observe(1);
            }).to.throw("observe must be called with an Array or an Object");
        });
    });

    describe("WHEN initialized with an object", function () {
         var observedObject, observe;

        beforeEach(function () {
            observedObject = {};
            observe = new Observe(observedObject);
        });

        describe("WHEN listening to changes on a property", function () {
            var callback, dispose;

            beforeEach(function () {
                callback = sinon.spy();
                dispose = observe.addListener("name", "newProperty", callback);
            });

            describe("AND the property is added", function () {
                beforeEach(function () {
                    observedObject.newProperty = "value";
                });

                it("THEN calls the callback", function (done) {
                    asap(function () {
                        expect(callback.calledOnce).to.be.true;

                        expect(callback.lastCall.args[0]).to.eql({
                            type: "add",
                            object: observedObject,
                            name: "newProperty",
                            value: "value",
                            oldValue: undefined
                        });
                        done();
                    });
                });

                describe("WHEN disposing of the listener", function () {
                    beforeEach(function () {
                        dispose();
                    });

                    describe("WHEN the property is updated", function () {
                        beforeEach(function () {
                            observedObject.newProperty = "newValue";
                        });

                        it("THEN doesn't call the callback anymore", function (done) {
                            asap(function () {
                                expect(callback.calledTwice).to.be.false;
                                done();
                            });
                        });
                    });
                });
            });

            describe("WHEN pausing the event publishing", function () {
                beforeEach(function () {
                    observe.pause();
                });

                it("THEN tells that the publishing is paused", function () {
                    expect(observe.isPaused()).to.equal(true);
                });

                describe("WHEN the property is updated", function () {
                    beforeEach(function () {
                        observedObject.newProperty = "value";
                        observedObject.newProperty = "newValue";
                        delete observedObject.newProperty;
                    });

                    it("THEN doesn't publish any event", function (done) {
                        asap(function () {
                            expect(callback.calledThrice).to.be.false;
                            done();
                        });
                    });

                    describe("WHEN resuming the event publishing", function () {
                        beforeEach(function () {
                            observe.resume();
                        });

                        it("THEN tells that the publishing isn't paused", function (done) {
                            asap(function () {
                                expect(observe.isPaused()).to.equal(false);
                                done();
                            });
                        });

                        it("THEN publishes all the events", function (done) {
                            asap(function () {
                                expect(callback.calledThrice).to.be.true;
                                done();
                            });
                        });
                    });
                });
            });
        });

        describe("WHEN listening only once to changes on a property", function () {
            var callback, dispose;

            beforeEach(function () {
                callback = sinon.spy();
                dispose = observe.addListenerOnce("name", "newProperty", callback);
            });

            describe("AND the property is added", function () {
                beforeEach(function () {
                    observedObject.newProperty = "value";
                });

                it("THEN calls the callback", function (done) {
                    asap(function () {
                        expect(callback.calledOnce).to.be.true;
                        expect(callback.lastCall.args[0]).to.eql({
                            type: "add",
                            object: observedObject,
                            name: "newProperty",
                            value: "value",
                            oldValue: undefined
                        });
                        done();
                    });
                });

                describe("WHEN the property is updated", function () {
                    beforeEach(function () {
                        observedObject.newProperty = "newValue";
                    });

                    it("THEN doesn't call the callback", function (done) {
                        asap(function () {
                            expect(callback.calledTwice).to.be.false;
                            done();
                        });
                    });
                });
            });

            describe("WHEN disposing of the listener", function () {
                beforeEach(function () {
                    dispose();
                });

                describe("WHEN the property is updated", function () {
                    beforeEach(function () {
                        observedObject.newProperty = "newValue";
                    });

                    it("THEN doesn't call the callback anymore", function (done) {
                        asap(function () {
                            expect(callback.calledOnce).to.be.false;
                            done();
                        });
                    });
                });
            });
        });
    });

    describe("WHEN pop is called on an observedArray", function () {
        var observedArray, observe, callback;

        beforeEach(function () {
            observedArray = [1, 2];
            callback = sinon.spy();
            observe = new Observe(observedArray);
            observe.addListener("type", "splice", callback);
            observedArray.pop();

        });

        it("THEN publishes a splice event", function (done) {
            asap(function () {
                expect(callback.calledOnce).to.be.true;
                expect(callback.lastCall.args[0]).to.eql({
                    type: "splice",
                    object: observedArray,
                    index: "1",
                    removed: [2],
                    addedCount: 0
                });
                done();
            });
        });

        describe("WHEN destroying the observer", function () {
            beforeEach(function () {
                observe.destroy();

                observedArray.pop();
            });

            it("THEN doesn't publish events anymore", function (done) {
                asap(function () {
                    expect(callback.calledTwice).to.be.false;
                    done();
                });
            });
        });
    });


});