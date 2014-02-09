/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
var chai = require("chai");
var sinon = require("sinon");
var expect = chai.expect;
var asap = require("asap");

var observeObject = require("../src/observe-plus").observeObject;

describe("GIVEN an observed object", function () {

	var pojo,
		observer;

	beforeEach(function () {
		pojo = {};
		observer = observeObject(pojo);
	});

	describe("WHEN observing newly added properties", function () {

		var aggregatedEvents,
			dispose;

		function resetAggregatedEvents() {
			aggregatedEvents = [];
		}

		beforeEach(function () {
			resetAggregatedEvents();
			dispose = observer.observe("new", function (addedProperty, propertyValue) {
				aggregatedEvents.push([addedProperty, propertyValue, "observer1"]);
			});
		});

		it("THEN shouldn't publish any event before a new property is added", function () {
			expect(aggregatedEvents.length).to.equal(0);
		});

		describe("WHEN a new property is added", function () {
			beforeEach(function () {
				pojo.newProperty = "newValue";
			});

			it("THEN should publish a new event", function (done) {
				asap(function () {
					expect(aggregatedEvents[0][0]).to.equal("newProperty");
					expect(aggregatedEvents[0][1]).to.equal("newValue");
					expect(aggregatedEvents[0][2]).to.equal("observer1");
					done();
				});
			});

			it("THEN only published one event", function (done) {
				asap(function () {
					expect(aggregatedEvents.length).to.equal(1);
					done();
				});
			});

			describe("WHEN the property is modified", function () {
				beforeEach(function () {
					resetAggregatedEvents();
					observer.observe("updated", function (updatedProperty, propertyNewValue, propertyOldValue) {
						aggregatedEvents.push([updatedProperty, propertyNewValue, propertyOldValue]);
					});
					pojo.newProperty = "updatedValue";
				});

				it("THEN calls the observer with the new value, the old value, and the name of the property", function (done) {
					asap(function () {
						expect(aggregatedEvents[0][0]).to.equal("newProperty");
						expect(aggregatedEvents[0][1]).to.equal("updatedValue");
						expect(aggregatedEvents[0][2]).to.equal("newValue");
						done();
					});
				});
			});

			describe("WHEN the property is deleted", function () {
				beforeEach(function () {
					resetAggregatedEvents();
					observer.observe("deleted", function (deletedProperty, propertyNewValue, propertyOldValue) {
						aggregatedEvents.push([deletedProperty, propertyNewValue, propertyOldValue]);
					});
					delete pojo.newProperty;
				});

				it("THEN calls the observer with undefined and the old value", function (done) {
					asap(function () {
						expect(aggregatedEvents[0][0]).to.equal("newProperty");
						expect(aggregatedEvents[0][1]).to.be.undefined;
						expect(aggregatedEvents[0][2]).to.equal("newValue");
						done();
					});
				});
			});
		});

		describe("WHEN a new observer is added", function () {
			var dispose2;

			beforeEach(function () {
				resetAggregatedEvents();
				dispose2 = observer.observe("new", function (addedProperty, propertyValue) {
					aggregatedEvents.push([addedProperty, propertyValue, "observer2"]);
				});
			});

			describe("WHEN two new properties are added", function () {
				beforeEach(function () {
					pojo.newProperty = [];
					pojo.anotherNewProperty = function () {};
				});

				it("THEN calls all the observers in order", function (done) {
					asap(function () {
						expect(aggregatedEvents[0][0]).to.equal("newProperty");
						expect(aggregatedEvents[0][1]).to.equal(pojo.newProperty);
						expect(aggregatedEvents[0][2]).to.equal("observer1");

						expect(aggregatedEvents[1][0]).to.equal("newProperty");
						expect(aggregatedEvents[1][1]).to.equal(pojo.newProperty);
						expect(aggregatedEvents[1][2]).to.equal("observer2");

						expect(aggregatedEvents[2][0]).to.equal("anotherNewProperty");
						expect(aggregatedEvents[2][1]).to.equal(pojo.anotherNewProperty);
						expect(aggregatedEvents[2][2]).to.equal("observer1");

						expect(aggregatedEvents[3][0]).to.equal("anotherNewProperty");
						expect(aggregatedEvents[3][1]).to.equal(pojo.anotherNewProperty);
						expect(aggregatedEvents[3][2]).to.equal("observer2");
						done();
					});
				});
			});

			describe("WHEN a new buggy observer is added", function () {
				var dispose3,
					dispose4;

				beforeEach(function () {
					resetAggregatedEvents();
					dispose3 = observer.observe("new", function () {
						throw new Error("buggy observer");
					});
					dispose4 = observer.observe("new", function (addedProperty, propertyValue) {
						aggregatedEvents.push([addedProperty, propertyValue, "observer4"]);
					});
				});

				describe("WHEN a new property is added", function () {
					beforeEach(function () {
						pojo.newProperty = {};
					});

					it("THEN calls all the observers even when one throws an error", function (done) {
						asap(function () {
							expect(aggregatedEvents[0][0]).to.equal("newProperty");
							expect(aggregatedEvents[0][1]).to.equal(pojo.newProperty);
							expect(aggregatedEvents[0][2]).to.equal("observer1");

							expect(aggregatedEvents[1][0]).to.equal("newProperty");
							expect(aggregatedEvents[1][1]).to.equal(pojo.newProperty);
							expect(aggregatedEvents[1][2]).to.equal("observer2");

							expect(aggregatedEvents[2][0]).to.equal("newProperty");
							expect(aggregatedEvents[2][1]).to.equal(pojo.newProperty);
							expect(aggregatedEvents[2][2]).to.equal("observer4");
							done();
						});
					});
				});
			});

			describe("WHEN an observer is disposed of", function () {
				var isDisposedOf = false;

				beforeEach(function () {
					isDisposedOf = dispose();
				});

				describe("WHEN a new property is added", function () {
					beforeEach(function () {
						resetAggregatedEvents();
						pojo.newProperty = {};
					});

					it("THEN doesn't call the disposed observer anymore", function (done) {
						asap(function () {
							expect(aggregatedEvents[0][0]).to.equal("newProperty");
							expect(aggregatedEvents[0][1]).to.equal(pojo.newProperty);
							expect(aggregatedEvents[0][2]).to.equal("observer2");

							done();
						});
					});

					it("THEN tells if the observer can be disposed of", function () {
						expect(isDisposedOf).to.be.true;
					});

					describe("WHEN an observer has been disposed of", function () {
						beforeEach(function () {
							isDisposedOf = dispose();
						});

						it("THEN tells that it can't be disposed of anymore", function () {
							expect(isDisposedOf).to.be.false;
						});
					});
				});
			});
		});
	});


});