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
         var observe,
             observedObject = {};

        beforeEach(function () {
            observe = new Observe(observedObject);
        });


    });
});