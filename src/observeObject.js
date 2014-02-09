/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */

 module.exports = function observeObject(observedObject) {

    var _callbacks = {};

    Object.observe(observedObject, function core(events) {
        events.forEach(function (ev) {
            var callbacks = _callbacks[ev.type] || [];

            callbacks.forEach(function (callback) {
                try {
                    callback(ev.name, ev.object[ev.name], ev.oldValue, ev.object);
                } catch (err) {
                }
            });
        });
     });

    return {
        observe: function (type, callback) {
            (_callbacks[type] = _callbacks[type] || []).push(callback);
            return function dispose() {
                var indexOfCB = _callbacks[type].indexOf(callback);
                if (indexOfCB >= 0) {
                    _callbacks[type].splice(indexOfCB, 1);
                    return true;
                } else {
                    return false;
                }
            };
        }
    };

 };