/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
var chai = require("chai");
var sinon = require("sinon");
var expect = chai.expect;
var asap = require("asap");

var observeArray = require("../src/observe-plus").observeArray;

describe("GIVEN an observed array", function () {

	var array,
		observer,
		aggregatedEvents;

	function resetAggregatedEvents() {
		aggregatedEvents = [];
	}

	beforeEach(function () {
		array = [];
		observer = observeObject(array);
	});

});