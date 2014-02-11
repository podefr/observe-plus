/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
 module.exports = function Core(Prototype) {

 	var _prototype = Prototype,
 		_object = null;

 	this.setObject = function setObject(object) {
 		_object = object;
 		_prototype.observe(object, this.treatEvents.bind(this));
 	};

 	this.treatEvents = function treatEvents(events) {
 		events.forEach(function (event) {

 		});
 	};

 	this.addListener = function addListener(property, name, callback, scope) {
 		_callbacks[property] = _callbacks[property] || [];

 		_callbacks[property].push([callback, scope]);
 	};

 };