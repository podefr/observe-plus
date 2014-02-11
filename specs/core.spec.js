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
			core = new Core(Prototype);
		});

		it("THEN creates a new core", function () {
			expect(typeof core).to.equal("object");
		});

		describe("WHEN setting the object to observe", function () {
			var observedObject,
				callback;

			beforeEach(function () {
				observedObject = {};
				sinon.spy(core, "treatEvents");
				core.setObject(observedObject);
				callback = Prototype.observe.args[0][1];
				callback();
			});

			afterEach(function () {
				core.treatEvents.restore();
			});

			it("THEN observes changes on the observed object", function () {
				expect(Prototype.observe.called).to.be.true;
				expect(Prototype.observe.args[0][0]).to.equal(observedObject);
				expect(core.treatEvents.called).to.be.true;
			});

			describe("WHEN a change happens on the object", function () {
				beforeEach(function () {
					callback(1, 2, 3, 4);
				});

				it("THEN calls the callback with core as the this object", function () {
					expect(core.treatEvents.lastCall.thisValue).to.equal(core);
					expect(core.treatEvents.lastCall.args[0]).to.equal(1);
					expect(core.treatEvents.lastCall.args[1]).to.equal(2);
					expect(core.treatEvents.lastCall.args[2]).to.equal(3);
					expect(core.treatEvents.lastCall.args[3]).to.equal(4);
				});
			});

		});
	});
});