/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */

 module.exports = function observeArray(observedArray) {

    var _typeCallbacks = {},
        _indexCallbacks = {},
        _isPaused = false,
        _savedEvents = [];

    Array.observe(observedArray, function core(events) {
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

            if (_indexCallbacks[ev.index]) {
                _indexCallbacks[ev.index].forEach(executeCallback);
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

        observeIndex: function (index, callback) {
            storeCallback(_indexCallbacks, index, callback);
            return function dispose() {
                return removeCallback(_indexCallbacks, index, callback);
            };
        },

        observeOnce: function (type, callback) {
            var dispose = this.observe(type, function () {
                callback.apply(this, arguments);
                dispose();
            });
            return dispose;
        },

        observeIndexOnce: function (index, callback) {
            var dispose = this.observeIndex(index, function () {
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