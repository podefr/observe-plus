require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
 //var asap = require("asap");

 module.exports = function Core(Prototype) {

 	var _prototype = Prototype,
 		_object = null,
 		_callbacks = {},
 		_isPaused = false,
 		_savedEvents = [];

 	this.setObject = function setObject(object) {
 		_object = object;
 		_prototype.observe(object, this.treatEvents.bind(this));
 	};

 	this.treatEvents = function treatEvents(events) {
 		 if (_isPaused) {
 		 	_savedEvents = _savedEvents.concat(events);
 		 } else {
 		 	publishEvents(events);
 		 }
 	};

 	function publishEvents(events) {
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
 	}

 	this.addListener = function addListener(propertyName, propertyValue, callback, scope) {
 		var item = [callback, scope];
 		_callbacks[propertyName] = _callbacks[propertyName] || {};

 		_callbacks[propertyName][propertyValue] = _callbacks[propertyName][propertyValue] || [];
 		_callbacks[propertyName][propertyValue].push(item);

 		return function dispose() {
 			var index = _callbacks[propertyName][propertyValue].indexOf(item);
 			if (index >= 0) {
 				_callbacks[propertyName][propertyValue].splice(index, 1);
 				return true;
 			} else {
 				return false;
 			}
 		};
 	};

 	this.addListenerOnce = function addListenerOnce(propertyName, propertyValue, callback, scope) {
 		var dispose = this.addListener(propertyName, propertyValue, function () {
 			callback.apply(scope, arguments);
 			dispose();
 		});
 		return dispose;
 	};

 	this.pause = function pause() {
 		_isPaused = true;
 	};

 	this.resume = function resume() {
 		//asap(function () {
	 		_isPaused = false;
	 		publishEvents(_savedEvents);
	 		_savedEvents = [];
 		//});
 	};

 };
},{}],"IIlIZC":[function(require,module,exports){
/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */

 module.exports = {
 	observeArray: require("./observeArray"),
 	observeObject: require("./observeObject")
 };
},{"./observeArray":4,"./observeObject":5}],"observe-plus":[function(require,module,exports){
module.exports=require('IIlIZC');
},{}],4:[function(require,module,exports){
/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
 var Core = require("./core");

 module.exports = function observeArray(observedArray) {

    var _core = new Core(Array);

    _core.setObject(observedArray);

    return {
        observeIndex: function (index, callback, scope) {
            return _core.addListener("name", index, callback, scope);
        },

        observeIndexOnce: function (index, callback, scope) {
            return _core.addListenerOnce("name", index, callback, scope);
        },

        observe: function (type, callback, scope) {
        	return _core.addListener("type", type, callback, scope);
        },

        observeOnce: function (type, callback, scope) {
			return _core.addListenerOnce("type", type, callback, scope);
        },

        pause: _core.pause,

        resume: _core.resume
    };

 };
},{"./core":1}],5:[function(require,module,exports){
/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
 var Core = require("./core");

 module.exports = function observeObject(observedObject) {

    var _core = new Core(Object);

    _core.setObject(observedObject);

    return {
        observe: function (type, callback, scope) {
            return _core.addListener("type", type, callback, scope);
        },

        observeProperty: function (property, callback, scope) {
            return _core.addListener("name", property, callback, scope);
        },

        observeOnce: function (type, callback, scope) {
            return _core.addListenerOnce("type", type, callback, scope);
        },

        observePropertyOnce: function (property, callback, scope) {
            return _core.addListenerOnce("name", property, callback, scope);
        },

        pause: _core.pause,

        resume: _core.resume
    };

 };
},{"./core":1}]},{},[])