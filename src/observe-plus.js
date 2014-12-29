/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014-2015 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
"use strict";

var observeArray = require("./observeArray"),
    observeObject = require("./observeObject");

module.exports = {
    observe: function (model) {
        if (Array.isArray(model)) {
            return observeArray.apply(null, arguments);
        } else if (typeof model == "object") {
            return observeObject.apply(null, arguments);
        }
        throw new TypeError("observe must be called with an Array or an Object");
    },
	observeArray: observeArray,
	observeObject: observeObject
};