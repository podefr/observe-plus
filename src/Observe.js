/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014-2015 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
"use strict";

var asap = require("asap");
var loop = require("simple-loop"),
    nestedProperty = require("nested-property");

function isValidValueToObserve(val) {
    return val !== null && typeof val == "object";
}

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function subtractPath(path1, path2) {
    return path1.split(path2 + ".").join("");
}

function getValueFromPartialPath(fullPath, partialPath, object) {
    return nestedProperty.get(object, subtractPath(fullPath, partialPath));
}

module.exports = function Observe(observedObject, namespace, callbacks, rootObject) {
    var _callbacks = callbacks || {},
        _isPaused = false,
        _savedEvents = [],
        _prototype = null;

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

    this.isPaused = function isPaused() {
        return _isPaused;
    };

    this.resume = function resume() {
        asap(function () {
            _isPaused = false;
            publishEvents(_savedEvents);
            _savedEvents = [];
        });
    };

    this.destroy = function destroy() {
        _prototype.unobserve(observedObject, treatEvents);
    };

    if (observedObject === null || typeof observedObject != "object") {
        throw new TypeError("observe must be called with an Array or an Object");
    }

    _prototype = Array.isArray(observedObject) ? Array : Object;

    if (typeof _prototype.observe != "function") {
        throw new Error("Make sure that the harmony options are enabled in this runtime. " +
            "Run node with the --harmony option or navigate to " +
            "chrome://flags/#enable-javascript-harmony in Chrome. " +
            "Check out https://github.com/podefr/observe-plus for more info");
    }

    _prototype.observe(observedObject, treatEvents);

    function treatEvents(events) {
        if (_isPaused) {
            _savedEvents = _savedEvents.concat(events);
        } else {
            publishEvents(events);
        }
    }

    function publishEvents(events) {
        events.forEach(function (ev) {
            function executeCallback(newEvent, callbackArray) {
                var callback = callbackArray[0],
                    thisObj = callbackArray[1];
                try {
                    callback.call(thisObj, newEvent);
                } catch (err) {
                }
            }

            Object.keys(_callbacks).forEach(function (eventType) {
                var callbacksForEventType = _callbacks[eventType],
                    eventPropertyName = ev[eventType],
                    newEvent;

                if (eventType == "name") {

                    newEvent = clone(ev);
                    newEvent.object = rootObject || observedObject;
                    var namespacedName = namespace ? namespace + "." + ev.name : ev.name;

                    loop(callbacksForEventType, function (callbacks, property) {
                        if (nestedProperty.isIn(rootObject || observedObject, property, newEvent.object)) {
                            if (newEvent.type === "update" &&
                                getValueFromPartialPath(property, namespacedName, ev.oldValue) === nestedProperty.get(rootObject || observedObject, property)) {
                                return;
                            }
                            if (newEvent.hasOwnProperty("name")) {
                                newEvent.name = property;
                            }
                            if (newEvent.hasOwnProperty("index")) {
                                newEvent.index = property;
                            }
                            newEvent.oldValue = getValueFromPartialPath(property, namespacedName, ev.oldValue);
                            callbacks.forEach(executeCallback.bind(null, newEvent));
                        }
                    });

                } else {
                    if (callbacksForEventType && callbacksForEventType[eventPropertyName]) {
                        callbacksForEventType[eventPropertyName].forEach(executeCallback.bind(null, ev));
                    }
                }

            });
        });
    }

    loop(observedObject, function (value, key) {
        var newNamespace;

        if (isValidValueToObserve(value)) {
            newNamespace = namespace ? namespace + "." + key : key;

            new Observe(value, newNamespace, _callbacks, rootObject || observedObject);
        }
    });

    this.addListener("type", "add", function (event) {
        var value = event.object[event.name],
            key = event.name,
            newNamespace;

        if (isValidValueToObserve(value)) {
            newNamespace = namespace ? namespace + "." + key : key;

            new Observe(value, newNamespace, _callbacks, rootObject || observedObject);
        }
    });

    this.addListener("type", "splice", function (event) {
        if (event.addedCount > 0) {
            event.object
                .slice(event.index, event.addCount)
                .forEach(function (value, index) {
                    if (isValidValueToObserve(value)) {
                        var newNamespace = namespace ? namespace + "." + index : index;

                        new Observe(value, newNamespace, _callbacks, rootObject || observedObject);
                    }
                });
        }
    });

};