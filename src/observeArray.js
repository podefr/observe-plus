/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014-2015 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
"use strict";

var Core = require("./core");

module.exports = function observeArray(observedArray) {

    var _core = new Core(Array);

    _core.setObject(observedArray);

    return {
        observeValue: function (index, callback, scope) {
            return _core.addListener("name", index, callback, scope);
        },

        observeValueOnce: function (index, callback, scope) {
            return _core.addListenerOnce("name", index, callback, scope);
        },

        observe: function (type, callback, scope) {
            return _core.addListener("type", type, callback, scope);
        },

        observeOnce: function (type, callback, scope) {
            return _core.addListenerOnce("type", type, callback, scope);
        },

        unobserve: _core.unsetObject.bind(_core),

        pause: _core.pause,

        resume: _core.resume
    };

};