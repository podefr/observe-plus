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
                            name: "newProperty"
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
                            name: "newProperty"
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
});