/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
 module.exports = function observeObject(observedObject) {

    var _typeCallbacks = {},
        _propertyCallbacks = {},
        _isPaused = false,
        _savedEvents = [];

    Object.observe(observedObject, function core(events) {
        if (_isPaused) {
            _savedEvents = _savedEvents.concat(events);
        } else {
            publishEvents(events);
        }
     });

    function publishEvents(events) {
        events.forEach(function (ev) {
            function executeCallback(callback) {
                try {
                    callback(ev);
                } catch (err) {
                }
            }

            if (_typeCallbacks[ev.type]) {
                _typeCallbacks[ev.type].forEach(executeCallback);
            }

            if (_propertyCallbacks[ev.name]) {
                _propertyCallbacks[ev.name].forEach(executeCallback);
            }
        });
    }

    function clearSavedEvents() {
        _savedEvents = [];
    }

    function storeCallback(array, item, callback) {
        (array[item] = array[item] || []).push(callback);
    }

    function removeCallback(array, item, callback) {
        var indexOfCB = array[item].indexOf(callback);
        if (indexOfCB >= 0) {
            array[item].splice(indexOfCB, 1);
            return true;
        } else {
            return false;
        }
    }

    return {
        observe: function (type, callback) {
            storeCallback(_typeCallbacks, type, callback);
            return function dispose() {
                return removeCallback(_typeCallbacks, type, callback);
            };
        },

        observeProperty: function (property, callback) {
            storeCallback(_propertyCallbacks, property, callback);
            return function dispose() {
                return removeCallback(_propertyCallbacks, property, callback);
            };
        },

        observeOnce: function (type, callback) {
            var dispose = this.observe(type, function () {
                callback.apply(this, arguments);
                dispose();
            });
            return dispose;
        },

        observePropertyOnce: function (property, callback) {
            var dispose = this.observeProperty(property, function () {
                callback.apply(this, arguments);
                dispose();
            });
            return dispose;
        },

        pause: function () {
            _isPaused = true;
        },

        resume: function () {
            _isPaused = false;
            publishEvents(_savedEvents);
            clearSavedEvents();
        }
    };

 };