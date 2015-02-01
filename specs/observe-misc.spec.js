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
                        nestedArrayProperty: ["", function () {}, undefined, 0, 147, false, {}]
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
        var arr = [], spy;
        beforeEach(function () {
            spy = sinon.spy();
            observer.observe("splice", spy);
            dataStructure[0].arrayProperty[2][0].property.push(arr);
        });

        it("THEN publishes a splice event", function (done) {
            asap(function () {
                expect(spy.firstCall.args[0]).to.eql({
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
                    expect(spy.secondCall.args[0]).to.eql({
                        type: "splice",
                        object: dataStructure,
                        index: "0.arrayProperty.2.0.property.3.0",
                        removed: [],
                        addedCount: 1
                    });
                    done();
                });
            });
        });
    });
});