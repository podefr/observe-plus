/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014-2015 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
"use strict";

var asap = require("asap");
var loop = require("simple-loop"),
    nestedProperty = require("nested-property");

/**
 * Observe can observe a top level object/array, or a nested object/array within itself
 * @param observedObject the object/array being observed, can be top, or a nested one
 * @param namespace if it's a nested array/object, the namespace is useful to remember the path from the top to itself
 * @param callbacks if it's a nested array/object, we keep the callbacks from the top one
 * @param rootObject if it's a nested array/object we keep a reference to the top rootObject
 * @constructor
 */
module.exports = function Observe(observedObject, namespace, callbacks, rootObject) {
    var _callbacks = callbacks || {},
        _isPaused = false,
        _savedEvents = [],
        _prototype = null;

    /**
     * ------------------------------------------------------
     * PUBLIC API
     * ------------------------------------------------------
     */

    /**
     * Add a listener for a given value of the event's object
     * @param propertyName the property on the event object that we want to listen to
     * @param propertyValue the value of the property for which we want to trigger an event
     * @param callback the callback to execute
     * @param scope within which scope
     * @returns {dispose}
     */
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

    /**
     * Same as addListener, but disposes itself after being called
     * @param propertyName the property on the event object that we want to listen to
     * @param propertyValue the value of the property for which we want to trigger an event
     * @param callback the callback to execute
     * @param scope within which scope
     * @returns {dispose}
     */
    this.addListenerOnce = function addListenerOnce(propertyName, propertyValue, callback, scope) {
        var dispose = this.addListener(propertyName, propertyValue, function () {
            callback.apply(scope, arguments);
            dispose();
        });
        return dispose;
    };

    /**
     * Pause triggering the events. They'll be published again when calling resume.
     * In the meantime, you can safely apply any change to the observed object/array.
     */
    this.pause = function pause() {
        _isPaused = true;
    };

    /**
     * Check to see if it's paused
     * @returns {boolean}
     */
    this.isPaused = function isPaused() {
        return _isPaused;
    };

    /**
     * Will trigger all the events that have been stashed while the observation was paused
     */
    this.resume = function resume() {
        asap(function () {
            _isPaused = false;
            publishEvents(_savedEvents);
            _savedEvents = [];
        });
    };

    /**
     * Stop observing
     */
    this.destroy = function destroy() {
        _prototype.unobserve(observedObject, treatEvents);
    };

    /**
     * ------------------------------------------------------
     * THE LOGIC FOR PUBLISHING EVENTS
     * ------------------------------------------------------
     */

    // Either we publish the events, or we stash them for later
    function treatEvents(events) {
        if (_isPaused) {
            _savedEvents = _savedEvents.concat(events);
        } else {
            publishEvents(events);
        }
    }

    function executeCallback(newEvent, originalEvent, callbackArray) {
        var callback = callbackArray[0],
            thisObj = callbackArray[1];
        try {
            callback.call(thisObj, newEvent, originalEvent);
        } catch (err) {
        }
    }

    // When we have a bunch of fresh events, or stashed events, we loop through them to publish the relevant events
    function publishEvents(events) {
        events.forEach(function (ev) {
            Object.keys(_callbacks).forEach(function (eventType) {
                if (strategies[eventType]) {
                    strategies[eventType](eventType, ev);
                } else {
                    strategies.defaut(eventType, ev);
                }
            });
        });
    }

    // When observing a "name" property, the logic is sligthly different than other properties
    var strategies = {
        name: function (eventType, ev) {
            var namespacedName;

            var newEvent = clone(ev);

            newEvent.object = rootObject || observedObject;

            if (ev.hasOwnProperty("name")) {
                namespacedName = createNamespace(namespace, ev.name);
            } else {
                namespacedName = createNamespace(namespace, ev.index);
            }

            loop(_callbacks[eventType], function (callbacks, property) {
                if (nestedProperty.isIn(rootObject || observedObject, property, newEvent.object)) {
                    if (newEvent.type === "update" &&
                        getValueFromPartialPath(property, namespacedName, ev.oldValue) === nestedProperty.get(rootObject || observedObject, property)) {
                        return;
                    }
                    if (newEvent.hasOwnProperty("name")) {
                        newEvent.name = property;
                        if (newEvent.type !== "add") {
                            newEvent.oldValue = getValueFromPartialPath(property, namespacedName, ev.oldValue);
                        }
                    } else {
                        newEvent.index = property;

                    }

                    callbacks.forEach(executeCallback.bind(null, newEvent, ev));
                }
            });
        },
        defaut: function (eventType, ev) {
            var newEvent = clone(ev);
            newEvent.object = rootObject || observedObject;

            if (newEvent.hasOwnProperty("name")) {
                newEvent.name = createNamespace(namespace, ev.name);
            } else {
                newEvent.index = createNamespace(namespace, ev.index);
            }

            if (_callbacks[eventType] && _callbacks[eventType][ev[eventType]]) {
                _callbacks[eventType][ev[eventType]].forEach(executeCallback.bind(null, newEvent, ev));
            }
        }
    };

    /**
     * ------------------------------------------------------
     * INITIALIZATION
     * ------------------------------------------------------
     */

    // Make sure we only observe Arrays and Objects
    if (observedObject === null || typeof observedObject != "object") {
        throw new TypeError("observe must be called with an Array or an Object");
    }

    // Decide which Observe to use, Object.observe or Array.observe
    _prototype = Array.isArray(observedObject) ? Array : Object;

    // If no observe found, throw an error
    if (typeof _prototype.observe != "function") {
        throw new Error("Make sure that the harmony options are enabled in this runtime. " +
            "Run node with the --harmony option or navigate to " +
            "chrome://flags/#enable-javascript-harmony in Chrome. " +
            "Check out https://github.com/podefr/observe-plus for more info");
    }

    // Actually observe
    _prototype.observe(observedObject, treatEvents);

    // And now, recursively walk the array/object to watch nested arrays/objects
    loop(observedObject, function (value, key) {
        var newNamespace;

        if (isValidValueToObserve(value)) {
            newNamespace = createNamespace(namespace, key);

            new Observe(value, newNamespace, _callbacks, rootObject || observedObject);
        }
    });

    // Also listen to add events, for when a new object/array is added!
    this.addListener("type", "add", function (event) {
        var value = event.object[event.name],
            key = event.name,
            newNamespace;

        if (isValidValueToObserve(value)) {
            newNamespace = createNamespace(namespace, key);
            new Observe(value, newNamespace, _callbacks, rootObject || observedObject);
        }
    });

    // Same, but if a new item is added to an array
    this.addListener("type", "splice", function (event, originalEvent) {
        if (event.addedCount > 0) {
            event.object
                .slice(originalEvent.index, event.addedCount)
                .forEach(function (value, index) {
                    if (isValidValueToObserve(value)) {
                        debugger;
                        var newNamespace = createNamespace(namespace, originalEvent.index + index);
                        new Observe(value, newNamespace, _callbacks, rootObject || observedObject);
                    }
                });
        }
    });
};

function createNamespace(namespace, key) {
    // the double quotes at the end are to ensure that the returned value is always a string.
    // if key was a number, it wouldn't be a string, and if it was 0, the created namespace would
    // be falsy.
    return namespace ? namespace + "." + key : key + "";
}

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