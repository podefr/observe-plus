/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
var chai = require("chai");
var sinon = require("sinon");
var expect = chai.expect;

var Core = require("../src/core");

describe("GIVEN core", function () {
	var core,
		Prototype = {};

	describe("WHEN initialised", function () {
		beforeEach(function () {
			Prototype.observe = sinon.spy();
			core = new Core(Object);
		});

		it("THEN creates a new core", function () {
			expect(typeof core).to.equal("object");
		});

		describe("WHEN setting the object to observe", function () {
			var observedObject;

			beforeEach(function () {
				observedObject = {};
				core.setObject(observedObject);
			});

			it("THEN observes changes on the observed object", function () {
				expect(Prototype.observe.called).to.true;
				expect(Prototype.observe.args[0]).to.equal(observedObject);
				expect(Prototype.observe.args[1]).to.equal(core.treatEvents);
			});
		});
	});
});