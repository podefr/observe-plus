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
            observeValue:_observe.addListener.bind(_observe, "name"),

            observeValueOnce: _observe.addListenerOnce.bind(_observe, "name"),

            observe: _observe.addListener.bind(_observe, "type"),

            observeOnce: _observe.addListenerOnce.bind(_observe, "type"),

            unobserve: _observe.destroy.bind(_observe),

            pause: _observe.pause,

            resume: _observe.resume
        };
    }
};