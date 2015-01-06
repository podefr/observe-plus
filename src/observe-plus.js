/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014-2015 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
"use strict";

var Observe = require("./Observe");
var loop = require("simple-loop");


module.exports = {
    observe: function observe(observedObject) {
        var _observe = new Observe(observedObject);

        return {
            observeValue: function observeValue(index, callback, scope) {
                return _observe.addListener("name", index, callback, scope);
            },

            observeValueOnce: function observeValueOnce(index, callback, scope) {
                return _observe.addListenerOnce("name", index, callback, scope);
            },

            observe: function observe(type, callback, scope) {
                return _observe.addListener("type", type, callback, scope);
            },

            observeOnce: function observeOnce(type, callback, scope) {
                return _observe.addListenerOnce("type", type, callback, scope);
            },

            unobserve: _observe.destroy.bind(_observe),

            pause: _observe.pause,

            resume: _observe.resume
        };
    }
};