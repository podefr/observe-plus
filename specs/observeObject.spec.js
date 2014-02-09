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
		observer,
		aggregatedEvents;

	function resetAggregatedEvents() {
		aggregatedEvents = [];
	}

	beforeEach(function () {
		pojo = {};
		observer = observeObject(pojo);
	});

	describe("WHEN observing newly added properties", function () {

		var dispose;

		beforeEach(function () {
			resetAggregatedEvents();
			dispose = observer.observe("new", function (ev) {
				aggregatedEvents.push([ev, "observer1"]);
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
					var firstEvent = aggregatedEvents[0][0],
						observerName = aggregatedEvents[0][1];

					expect(firstEvent.name).to.equal("newProperty");
					expect(firstEvent.object["newProperty"]).to.equal("newValue");
					expect(observerName).to.equal("observer1");
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
					observer.observe("updated", function (ev) {
						aggregatedEvents.push([ev]);
					});
					pojo.newProperty = "updatedValue";
				});

				it("THEN calls the observer with the new value, the old value, and the name of the property", function (done) {
					asap(function () {
						var firstEvent = aggregatedEvents[0][0];

						expect(firstEvent.name).to.equal("newProperty");
						expect(firstEvent.object["newProperty"]).to.equal("updatedValue");
						expect(firstEvent.oldValue).to.equal("newValue");
						done();
					});
				});
			});

			describe("WHEN the property is deleted", function () {
				beforeEach(function () {
					resetAggregatedEvents();
					observer.observe("deleted", function (ev) {
						aggregatedEvents.push([ev]);
					});
					delete pojo.newProperty;
				});

				it("THEN calls the observer with undefined and the old value", function (done) {
					asap(function () {
						var firstEvent = aggregatedEvents[0][0];

						expect(firstEvent.name).to.equal("newProperty");
						expect(firstEvent.object["newProperty"]).to.be.undefined;
						expect(firstEvent.oldValue).to.equal("newValue");
						done();
					});
				});
			});
		});

		describe("WHEN a new observer is added", function () {
			var dispose2;

			beforeEach(function () {
				resetAggregatedEvents();
				dispose2 = observer.observe("new", function (ev) {
					aggregatedEvents.push([ev, "observer2"]);
				});
			});

			describe("WHEN two new properties are added", function () {
				beforeEach(function () {
					pojo.newProperty = [];
					pojo.anotherNewProperty = function () {};
				});

				it("THEN calls all the observers in order", function (done) {
					asap(function () {
						var firstEvent = aggregatedEvents[0][0],
							firstObserverName = aggregatedEvents[0][1],
							secondEvent = aggregatedEvents[1][0],
							secondObserverName = aggregatedEvents[1][1],
							thirdEvent = aggregatedEvents[2][0],
							thirdObserverName = aggregatedEvents[2][1],
							fourthEvent = aggregatedEvents[3][0],
							fourthObserverName = aggregatedEvents[3][1];

						expect(firstEvent.name).to.equal("newProperty");
						expect(firstEvent.object["newProperty"]).to.equal(pojo.newProperty);
						expect(firstObserverName).to.equal("observer1");

						expect(secondEvent.name).to.equal("newProperty");
						expect(secondEvent.object["newProperty"]).to.equal(pojo.newProperty);
						expect(secondObserverName).to.equal("observer2");

						expect(thirdEvent.name).to.equal("anotherNewProperty");
						expect(thirdEvent.object["anotherNewProperty"]).to.equal(pojo.anotherNewProperty);
						expect(thirdObserverName).to.equal("observer1");

						expect(fourthEvent.name).to.equal("anotherNewProperty");
						expect(fourthEvent.object["anotherNewProperty"]).to.equal(pojo.anotherNewProperty);
						expect(fourthObserverName).to.equal("observer2");
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
					dispose4 = observer.observe("new", function (ev) {
						aggregatedEvents.push([ev, "observer4"]);
					});
				});

				describe("WHEN a new property is added", function () {
					beforeEach(function () {
						pojo.newProperty = {};
					});

					it("THEN calls all the observers even when one throws an error", function (done) {
						asap(function () {
							var firstEvent = aggregatedEvents[0][0],
								firstObserverName = aggregatedEvents[0][1],
								secondEvent = aggregatedEvents[1][0],
								secondObserverName = aggregatedEvents[1][1],
								thirdEvent = aggregatedEvents[2][0],
								thirdObserverName = aggregatedEvents[2][1];

							expect(firstEvent.name).to.equal("newProperty");
							expect(firstEvent.object["newProperty"]).to.equal(pojo.newProperty);
							expect(firstObserverName).to.equal("observer1");

							expect(secondEvent.name).to.equal("newProperty");
							expect(secondEvent.object["newProperty"]).to.equal(pojo.newProperty);
							expect(secondObserverName).to.equal("observer2");

							expect(thirdEvent.name).to.equal("newProperty");
							expect(thirdEvent.object["newProperty"]).to.equal(pojo.newProperty);
							expect(thirdObserverName).to.equal("observer4");
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
							var numberOfCallbacksCalled = aggregatedEvents.length,
								firstObserverName = aggregatedEvents[0][1];

							expect(numberOfCallbacksCalled).to.equal(1);
							expect(firstObserverName).to.equal("observer2");

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

	describe("WHEN observing specific properties", function () {
		var dispose;

		beforeEach(function () {
			resetAggregatedEvents();
			dispose = observer.observeProperty("newProperty", function (ev) {
				aggregatedEvents.push([ev]);
			});
			pojo.newProperty = "newValue";
		});

		it("THEN publishes an event with the new value and the old value", function (done) {
			asap(function () {
				var firstEvent = aggregatedEvents[0][0];
				expect(firstEvent.name).to.equal("newProperty");
				expect(firstEvent.object["newProperty"]).to.equal("newValue");
				expect(firstEvent.oldValue).to.be.undefined;
				done();
			});
		});
	});

	describe("WHEN observing only once", function () {
		var dispose;
		beforeEach(function () {
			resetAggregatedEvents();
			dispose = observer.observeOnce("new", function (ev) {
				aggregatedEvents.push([ev]);
			});
		});

		describe("WHEN the property is added", function () {
			beforeEach(function () {
				pojo.newProperty = "value";
			});

			it("THEN calls the observer", function (done) {
				asap(function () {
					var firstEvent = aggregatedEvents[0][0];
					expect(firstEvent.name).to.equal("newProperty");
					expect(firstEvent.object["newProperty"]).to.equal("value");
					done();
				});
			});

			it("THEN is disposed of", function () {
				asap(function () {
					expect(dispose()).to.be.false;
				});
			});
		});
	});

	describe("WHEN observing a property only once", function () {
		var dispose;
		beforeEach(function () {
			resetAggregatedEvents();
			dispose = observer.observePropertyOnce("newProperty", function (ev) {
				aggregatedEvents.push([ev]);
			});
		});

		describe("WHEN the property is added", function () {
			beforeEach(function () {
				pojo.newProperty = "value";
			});

			it("THEN calls the observer", function (done) {
				asap(function () {
					var firstEvent = aggregatedEvents[0][0];
					expect(firstEvent.name).to.equal("newProperty");
					expect(firstEvent.object["newProperty"]).to.equal("value");
					done();
				});
			});

			it("THEN is disposed of", function () {
				asap(function () {
					expect(dispose()).to.be.false;
				});
			});
		});
	});

	describe("WHEN pausing the updates", function () {
		beforeEach(function () {
			observer.observeProperty("newProperty", function (ev) {
				aggregatedEvents.push([ev]);
			});
			observer.pause();
		});

		describe("WHEN a property changes", function () {
			beforeEach(function () {
				resetAggregatedEvents();
				pojo.newProperty = "value";
				pojo.newProperty = "newValue";
				delete pojo.newProperty;
			});

			it("THEN the observers aren't called", function () {
				expect(aggregatedEvents.length).to.equal(0);
			});

			describe("WHEN resuming publishing the updates", function () {
				beforeEach(function () {
					observer.resume();
				});

				it("THEN calls all the observers in order", function () {
					asap(function () {
						var firstEvent = aggregatedEvents[0][0],
							secondEvent = aggregatedEvents[1][0],
							thirdEvent = aggregatedEvents[2][0];

						expect(firstEvent.type).to.equal("new");
						expect(secondEvent.type).to.equal("updated");
						expect(thirdEvent.type).to.equal("deleted");
					});
				});

				describe("WHEN the updates are paused and resumed again", function () {
					beforeEach(function () {
						observer.pause();
						pojo.newProperty = "lastValue";
						observer.resume();
					});

					it("THEN only publishes the new event", function () {
						asap(function () {
							var lastEvent = aggregatedEvents[0][0];

							expect(lastEvent.type).to.equal("new");
							expect(lastEvent.name).to.equal("newProperty");
							expect(lastEvent.object["newProperty"]).to.equal("lastValue");
						});
					});
				});
			});
		});
	});
});