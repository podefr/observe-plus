/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
 module.exports = function Core(Prototype) {

 	var _prototype = Prototype,
 		_object = null,
 		_typeCallbacks = {};
 		_nameCallbacks = {};

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
            if (_nameCallbacks[ev.name]) {
                _nameCallbacks[ev.name].forEach(executeCallback);
            }

            if (_typeCallbacks[ev.type]) {
                _typeCallbacks[ev.type].forEach(executeCallback);
            }
        });
 	};

 	this.addNameListener = function addNameListener(name, callback, scope) {
 		_nameCallbacks[name] = _nameCallbacks[name] || [];
 		_nameCallbacks[name].push([callback, scope]);
 	};

 	this.addTypeListener = function addTypeListener(type, callback, scope) {
 		_typeCallbacks[type] = _typeCallbacks[type] || [];
 		_typeCallbacks[type].push([callback, scope]);
 	};

 };