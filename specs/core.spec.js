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
				var callback,
					dispose,
					thisObj;

				beforeEach(function () {
					thisObj = {};
					callback = sinon.spy();

					dispose = core.addListener("name", "property", callback, thisObj);
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
						expect(callback.calledOn(thisObj)).to.be.true;
					});
				});

				describe("WHEN disposing of a listener", function () {
					var isDisposed = false;

					beforeEach(function () {
						isDisposed = dispose();
					});

					it("THEN disposes of the listener", function () {
						expect(isDisposed).to.equal(true);
					});

					describe("WHEN new changes happen on the object", function () {
						beforeEach(function () {
							core.treatEvents([createEvent("add", "property", "value")]);
						});

						it("THEN doesnt call the listener anymore", function () {
							expect(callback.called).to.be.false;
						});
					});

					describe("WHEN trying to dispose again", function () {
						beforeEach(function () {
							isDisposed = dispose();
						});

						it("THEN doesnt do anything", function () {
							expect(isDisposed).to.be.false;
						});
					});
				});
			});

			describe("WHEN observing changes only once", function () {
				var dispose,
					callback;

				beforeEach(function () {
					callback = sinon.spy();
					dispose = core.addListenerOnce("name", "property", callback);
				});

				describe("WHEN the property is added", function () {
					beforeEach(function () {
						event1 = createEvent("add", "property", "value");
						core.treatEvents([event1]);
					});

					it("THEN calls the observer", function () {
						expect(callback.calledOnce).to.be.true;
					});

					it("THEN is disposed of", function () {
						expect(dispose()).to.be.false;
					});
				});
			});
		});
	});
});