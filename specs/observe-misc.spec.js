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
                        index: 0,
                        removed: [],
                        addedCount: 2
                    });
                    done();
                });
            });

        });



    });

});