/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014-2015 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
"use strict";

var Core = require("./core");

module.exports = function observeObject(observedObject) {

    var _core = new Core(Object);

    _core.setObject(observedObject);

    return {
        observeValue: function (property, callback, scope) {
            return _core.addListener("name", property, callback, scope);
        },

        observeValueOnce: function (property, callback, scope) {
            return _core.addListenerOnce("name", property, callback, scope);
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