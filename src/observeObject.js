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
                callback(ev.name, ev.object[ev.name], ev.oldValue, ev.object);
            });
        });
     });

    return {
        observe: function (type, callback) {
            (_callbacks[type] = _callbacks[type] || []).push(callback);
        }
    };

 };