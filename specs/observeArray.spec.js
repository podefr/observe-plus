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
		observer = observeArray(array);
	});

	describe("WHEN observing newly added items", function () {

		var dispose;

		beforeEach(function () {
			resetAggregatedEvents();
			dispose = observer.observe("splice", function (ev) {
				aggregatedEvents.push([ev, "observer1"]);
			});
		});

		it("THEN shouldnt publish any event before a new item is added", function () {
			expect(aggregatedEvents.length).to.equal(0);
		});

		describe("WHEN a new item is added", function () {
			beforeEach(function () {
				array.push("newItem");
			});

			it("THEN should publish a splice event", function () {
				asap(function () {
					var firstEvent = aggregatedEvents[0][0],
						observerName = aggregatedEvents[0][1];

					expect(firstEvent.index).to.equal(0);
					expect(firstEvent.type).to.equal("splice");
					expect(firstEvent.object[0]).to.equal("newItem");
					expect(observerName).to.equal("observer1");
				});
			});

			it("THEN published only one event", function () {
				asap(function () {
					expect(aggregatedEvents.length).to.equal(1);
				});
			});

			describe("WHEN the item is modified", function () {
				beforeEach(function () {
					resetAggregatedEvents();
					observer.observe("updated", function (ev) {
						aggregatedEvents.push([ev]);
					});
					array[0] = "updatedItem";
				});

				it("THEN calls the observer with the updated event", function () {
					asap(function () {
						var firstEvent = aggregatedEvents[0][0];

						expect(firstEvent.type).to.equal("updated");
						expect(firstEvent.object[0]).to.equal("updatedItem");
					});
				});
			});

			describe("WHEN the property is deleted", function () {
				beforeEach(function () {
					resetAggregatedEvents();
					observer.observe("splice", function (ev) {
						aggregatedEvents.push([ev]);
					});
					array.pop();
				});

				it("THEN calls the observer with the splice event", function () {
					asap(function () {
						var firstEvent = aggregatedEvents[0][0];

						expect(firstEvent.type).to.equal("splice");
						expect(firstEvent.object.length).to.equal(0);
					});
				});
			});
		});
	});

	describe("WHEN observing specific indexes", function () {
		beforeEach(function () {
			resetAggregatedEvents();
			observer.observeIndex(0, function (ev) {
				aggregatedEvents.push([ev]);
			});
			array.push("value");
			array[0] = "newValue";
		});

		it("THEN publishes an event with the new value and the old value", function (done) {
			asap(function () {
				var firstEvent = aggregatedEvents[0][0];
				expect(firstEvent.name).to.equal("0");
				expect(firstEvent.object[0]).to.equal("newValue");
				expect(firstEvent.oldValue).to.equal("value");
				done();
			});
		});
	});
});