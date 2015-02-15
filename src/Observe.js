/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014-2015 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
"use strict";

var asap = require("asap");
var loop = require("simple-loop");
var nestedProperty = require("nested-property");

var eventFactory = require("./eventFactory");

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
        _rootObject = rootObject || observedObject,
        disposeOnAdd;

    // If no observe found, throw an error
    if (typeof Object.observe != "function" || typeof Array.observe != "function") {
        throw new Error("Make sure that the harmony options are enabled in this runtime. " +
            "Run node with the --harmony option or navigate to " +
            "chrome://flags/#enable-javascript-harmony in Chrome. " +
            "Check out https://github.com/podefr/observe-plus for more info");
    }

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
        (Array.isArray(observedObject ) ? Array : Object).unobserve(observedObject, treatEvents);
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
                if (strategies.byEventType[eventType]) {
                    strategies.byEventType[eventType](eventType, ev);
                } else {
                    strategies.defaut(eventType, ev);
                }
            });
        });
    }

    // When observing a "name" property, the logic is sligthly different than other properties
    var strategies = {
        byEventType: {
            name: function (eventType, ev) {
                loop(_callbacks[eventType], function (callbacks, property) {
                    var namespacedName = getNamespacedName(ev),
                        oldValue = getValueFromPartialPath(property, namespacedName, ev.oldValue);

                    var newEvent = eventFactory.create(ev, {
                        eventType: eventType,
                        rootObject: _rootObject,
                        oldValue: oldValue,
                        namespacedName: property
                    });

                    if (newEvent.type == "update" &&
                        oldValue === nestedProperty.get(_rootObject, property)) {
                        return;
                    }

                    if (nestedProperty.isIn(_rootObject, property, ev.object)) {
                        callbacks.forEach(executeCallback.bind(null, newEvent, ev));
                    }
                });
            }
        },
        defaut: function (eventType, ev) {
            if (_callbacks[eventType] && _callbacks[eventType][ev[eventType]]) {
                var namespacedName = getNamespacedName(ev);

                var newEvent = eventFactory.create(ev, {
                    eventType: eventType,
                    rootObject: _rootObject,
                    namespacedName: namespacedName
                });

                if (nestedProperty.isIn(_rootObject, namespacedName, ev.object)) {
                    _callbacks[eventType][ev[eventType]].forEach(executeCallback.bind(null, newEvent, ev));
                }
            }
        }
    };

    function getNamespacedName(event) {
        if (event.hasOwnProperty("name")) {
            return createNamespace(namespace, event.name);
        } else {
            return createNamespace(namespace, event.index);
        }
    }

    /**
     * ------------------------------------------------------
     * INITIALIZATION
     * ------------------------------------------------------
     */

    // Make sure we only observe Arrays and Objects
    if (!isValidValueToObserve(observedObject)) {
        throw new TypeError("observe must be called with an Array or an Object");
    }

    // Decide which Observe to use, Object.observe or Array.observe
    if (Array.isArray(observedObject)) {
        Array.observe(observedObject, treatEvents);
        disposeOnAdd = this.addListener("type", "splice", onSplice);
    } else {
        Object.observe(observedObject, treatEvents);
        disposeOnAdd = this.addListener("type", "add", onAdd);
    }

    var disposeOnDelete = this.addListener("name", namespace, function (event) {
        if (event.type == "delete") {
            this.destroy();
            disposeOnDelete();
            disposeOnAdd();
        }
    }, this);

    // And now, recursively walk the array/object to watch nested arrays/objects
    loop(observedObject, function (value, key) {
        var newNamespace;

        if (isValidValueToObserve(value)) {
            newNamespace = createNamespace(namespace, key);
            new Observe(value, newNamespace, _callbacks, _rootObject);
        }
    });

    function onAdd(event) {
        var value = event.object[event.name],
            key = event.name,
            newNamespace;

        if (isValidValueToObserve(value)) {
            newNamespace = createNamespace(namespace, key);
            new Observe(value, newNamespace, _callbacks, _rootObject);
        }
    }

    function onSplice(event, originalEvent) {
        if (originalEvent.addedCount > 0) {
            originalEvent.object
                .slice(originalEvent.index, originalEvent.index + originalEvent.addedCount)
                .forEach(function (value, index) {
                    if (isValidValueToObserve(value)) {
                        var newNamespace = createNamespace(namespace, originalEvent.index + index);
                        new Observe(value, newNamespace, _callbacks, _rootObject);
                    }
                });
        }
    }
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

function subtractPath(path1, path2) {
    return path1.split(path2 + ".").join("");
}

function getValueFromPartialPath(fullPath, partialPath, object) {
    return nestedProperty.get(object, subtractPath(fullPath, partialPath));
}