/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014-2015 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
"use strict";

var arrayEvent = {
    type: "",
    index: "",
    object: null,
    removed: [],
    addedCount: 0
};

var objectEvent = {
    type: "",
    name: "",
    object: null,
    oldValue: undefined
};

module.exports = {
    create: function (ev) {
        return JSON.parse(JSON.stringify(ev));
    }
};