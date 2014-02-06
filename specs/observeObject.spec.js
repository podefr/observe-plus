/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
var chai = require("chai");
var sinon = require("sinon");
var expect = chai.expect;

var observeObject = require("../src/observe-plus").observeObject;


describe("GIVEN an observed object", function () {

	var pojo,
		observer;

	beforeEach(function () {
		pojo = {};
		observer = observeObject(pojo);
	});

	describe("WHEN observing newly added properties", function () {

		var newEvent = false;

		beforeEach(function () {
			observer.observe("new", function gotaname(addedProperty, propertyValue) {
				newEvent = [addedProperty, propertyValue];
			});
		});

		it("THEN shouldn't publish any event before a new property is added", function () {
			expect(newEvent).to.be.false;
		});

		describe("WHEN a new property is added", function () {
			beforeEach(function () {
				pojo.newProperty = "myValue";
			});

			it("THEN should publish a new event", function (done) {
				process.nextTick(function () {
					expect(newEvent[0]).to.equal("newProperty");
					expect(newEvent[1]).to.equal("myValue");
					done();
				});
			});
		});


	});

});