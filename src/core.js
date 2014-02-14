/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
 module.exports = function Core(Prototype) {

 	var _prototype = Prototype,
 		_object = null,
 		_callbacks = {};

 	this.setObject = function setObject(object) {
 		_object = object;
 		_prototype.observe(object, this.treatEvents.bind(this));
 	};

 	this.treatEvents = function treatEvents(events) {
 		 events.forEach(function (ev) {
            function executeCallback(callbackArray) {
            	var callback = callbackArray[0],
            		thisObj = callbackArray[1];
                try {
                    callback.call(thisObj, ev);
                } catch (err) {
                }
            }

            Object.keys(_callbacks).forEach(function (propertyName) {
            	if (_callbacks[propertyName] && _callbacks[propertyName][ev[propertyName]]) {
            		_callbacks[propertyName][ev[propertyName]].forEach(executeCallback);
            	}
            });
        });
 	};

 	this.addListener = function addListener(propertyName, propertyValue, callback, scope) {
 		_callbacks[propertyName] = _callbacks[propertyName] || {};

 		_callbacks[propertyName][propertyValue] = _callbacks[propertyName][propertyValue] || [];
 		_callbacks[propertyName][propertyValue].push([callback, scope]);
 	};

 };