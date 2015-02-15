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

var observe = require("../src/observe-plus").observe;

describe("GIVEN an observed array", function () {
    var array, observer;

    beforeEach(function () {
        array = [];
        observer = observe(array);
    });

    describe("WHEN observing addedCount", function () {
        var spy;

        beforeEach(function () {
            spy = sinon.spy();
            observer.addListener("addedCount", 2, spy);
        });

        describe("WHEN items are added", function () {
            beforeEach(function () {
                array.push(1, 2);
            });

            it("THEN triggers an event", function (done) {
                asap(function () {
                    expect(spy.firstCall.args[0]).to.eql({
                        type: "splice",
                        object: array,
                        index: "0",
                        removed: [],
                        addedCount: 2
                    });
                    done();
                });
            });
        });
    });
});

describe("GIVEN a very complex data structure", function () {
    var dataStructure, observer;

    beforeEach(function () {
        dataStructure = [
            {
                arrayProperty: [
                    ["value1", "value2"],
                    ["value3", "value4"],
                    [{ property: ["deeply", "nested", "array"]}]
                ],
                objectProperty: {
                    property1: true,
                    property2: null,
                    property3: {
                        nestedArrayProperty: ["", 147, {}]
                    },
                    property4: {
                        deeplyNestedObject: {
                            anotherArray: [
                                0, 1, 2, 3
                            ]
                        }
                    }
                }
            }
        ];
        observer = observe(dataStructure);
    });

    describe("WHEN pushing an item to a deeply nested array", function () {
        var arr = ['value'], spliceSpy;
        beforeEach(function () {
            spliceSpy = sinon.spy();
            observer.observe("splice", spliceSpy);
            dataStructure[0].arrayProperty[2][0].property.push(arr);
        });

        it("THEN publishes a splice event", function (done) {
            asap(function () {
                expect(spliceSpy.firstCall.args[0]).to.eql({
                    type: "splice",
                    object: dataStructure,
                    index: "0.arrayProperty.2.0.property.3",
                    removed: [],
                    addedCount: 1
                });
                done();
            })
        });

        describe("WHEN adding another! nested array to the newly added one", function () {
            beforeEach(function () {
                dataStructure[0].arrayProperty[2][0].property[3].push("very nested!");
            });

            it("THEN publishes a very nested event", function (done) {
                asap(function () {
                    expect(spliceSpy.secondCall.args[0]).to.eql({
                        type: "splice",
                        object: dataStructure,
                        index: "0.arrayProperty.2.0.property.3.1",
                        removed: [],
                        addedCount: 1
                    });
                    done();
                });
            });

            describe("WHEN modifying the nested array", function () {
                var updateSpy;

                beforeEach(function () {
                    updateSpy = sinon.spy();
                    observer.observe("update", updateSpy);
                    dataStructure[0].arrayProperty[2][0].property[3][1] = "updated very nested!";
                });

                it("THEN publishes an update event", function (done) {
                    asap(function () {
                        expect(updateSpy.firstCall.args[0]).to.eql({
                            type: "update",
                            object: dataStructure,
                            name: "0.arrayProperty.2.0.property.3.1",
                            oldValue: "very nested!"
                        });
                        done();
                    });
                });

                describe("WHEN splicing out an item", function () {
                    var spliceSpy;

                    beforeEach(function () {
                        spliceSpy = sinon.spy();
                        observer.observe("splice", spliceSpy);
                        dataStructure[0].arrayProperty[2][0].property[3].splice(0, 1);

                    });

                    it("THEN publishes a delete event", function (done) {
                        asap(function () {
                            expect(spliceSpy.firstCall.args[0]).to.eql({
                                type: "splice",
                                object: dataStructure,
                                index: "0.arrayProperty.2.0.property.3.0",
                                removed: ["value"],
                                addedCount: 0
                            });
                            done();
                        });
                    });
                });
            });
        });
    });

    describe("WHEN replacing parts of the data structure with a new similar one", function () {
        var updateSpy1, updateSpy2;

        beforeEach(function () {
            updateSpy1 = sinon.spy();
            updateSpy2 = sinon.spy();
            observer.observeValue("0.objectProperty.property4.deeplyNestedObject.anotherArray.1", updateSpy1);
            observer.observeValue("0.objectProperty.property4.deeplyNestedObject.anotherArray.2", updateSpy2);
            dataStructure[0].objectProperty.property4 = {
                deeplyNestedObject: {
                    anotherArray: [
                        0, 2, 2, 3
                    ]
                }
            };
        });

        it("THEN publishes an event for the updated item", function (done) {
            asap(function () {
                expect(updateSpy1.firstCall.args[0]).to.eql({
                    type: "update",
                    object: dataStructure,
                    name: "0.objectProperty.property4.deeplyNestedObject.anotherArray.1",
                    oldValue: 1
                });
                done();
            });
        });

        it("THEN doesn't publish an event for the non updated item", function (done) {
            asap(function () {
                expect(updateSpy2.called).to.be.false;
                done();
            });
        });
    });

    describe.only("WHEN removing parts of the structure", function () {
        beforeEach(function () {
            delete dataStructure[0].objectProperty;
            delete dataStructure[0].arrayProperty;
        });

        it("THEN unobserves the removed objects to allow garbage collection", function (done) {
            asap(function () {
                console.log("break");

                dataStructure.push("tester");
                done();
            });
        });
    });
});