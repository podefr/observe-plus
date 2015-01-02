/*global describe, it, beforeEach */
/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014-2015 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
"use strict";

var chai = require("chai");
var expect = chai.expect;

var observePlus = require("../src/observe-plus");

describe("GIVEN observePlus", function () {
    describe("WHEN I call the observe method with the wrong type", function () {
        it("THEN throws a TypeError", function () {
            expect(function () {
                observePlus.observe();
            }).to.throw("observe must be called with an Array or an Object");
        });
    });
});