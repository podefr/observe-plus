/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
var chai = require("chai");
var sinon = require("sinon");
var expect = chai.expect;

var Core = require("../src/core");

function createEvent(type, name, value, oldValue) {
	return {
		type: type,
		name: name,
		value: value,
		oldValue: oldValue
	};
}

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
				callback([]);
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
				var event1,
					event2,
					event3;

				beforeEach(function () {
					event1 = createEvent("add", "property", "value");
					event2 = createEvent("update", "property", "newValue", "value");
					event3 = createEvent("delete", "property", undefined, "newValue");
					callback([event1, event2, event3]);
				});

				it("THEN calls the callback with core as the this object", function () {
					expect(core.treatEvents.lastCall.thisValue).to.equal(core);
					expect(core.treatEvents.lastCall.args[0][0]).to.equal(event1);
					expect(core.treatEvents.lastCall.args[0][1]).to.equal(event2);
					expect(core.treatEvents.lastCall.args[0][2]).to.equal(event3);
				});
			});

			describe("WHEN there's a listener on a specific property name", function () {
				var callback;

				beforeEach(function () {
					var thisObj = {};
					callback = sinon.spy();

					core.addListener("name", "property", callback, thisObj);
				});

				describe("AND changes happen on the object", function () {
					var event1,
						event2;

					beforeEach(function () {
						event1 = createEvent("add", "property", "value");
						event2 = createEvent("add", "anotherProperty", "value");
						core.treatEvents([event1, event2]);
					});

					it("THEN calls the listeners that matches", function () {
						expect(callback.called).to.be.true;
						expect(callback.lastCall.args[0]).to.equal(event1);
						expect(callback.calledOnce).to.be.true;
					});
				});
			});

		});
	});
});