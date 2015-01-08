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

        _observe.observeValue = _observe.addListener.bind(_observe, "name");
        _observe.observeValueOnce = _observe.addListenerOnce.bind(_observe, "name");
        _observe.observe = _observe.addListener.bind(_observe, "type");
        _observe.observeOnce = _observe.addListenerOnce.bind(_observe, "type");

        return _observe;
    }
};