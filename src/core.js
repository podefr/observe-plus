/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014-2015 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
"use strict";

var asap = require("asap");

module.exports = function Core(Prototype) {
    var _prototype = Prototype,
        _object = null,
        _callbacks = {},
        _isPaused = false,
        _savedEvents = [];

    this.setObject = function setObject(object) {
        if (typeof _prototype.observe != "function") {
            throw new Error("Make sure that the harmony options are enabled in this runtime. " +
                "Run node with the --harmony option or navigate to " +
                "chrome://flags/#enable-javascript-harmony in Chrome. " +
                "Check out https://github.com/podefr/observe-plus for more info");
        }
        _object = object;
        _prototype.observe(object, this.treatEvents);
    };

    this.unsetObject = function unsetObject() {
        _prototype.unobserve(_object, this.treatEvents);
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
                var callbacksForProperty = _callbacks[propertyName],
                    eventPropertyName = ev[propertyName];

                if (callbacksForProperty && callbacksForProperty[eventPropertyName]) {
                    callbacksForProperty[eventPropertyName].forEach(executeCallback);
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
        asap(function () {
            _isPaused = false;
            publishEvents(_savedEvents);
            _savedEvents = [];
        });
    };

};