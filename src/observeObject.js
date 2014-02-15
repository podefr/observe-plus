/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
 var Core = require("./core");

 module.exports = function observeObject(observedObject) {

    var _core = new Core(Object);

    _core.setObject(observedObject);

    return {
        observe: function (type, callback, scope) {
            return _core.addListener("type", type, callback, scope);
        },

        observeProperty: function (property, callback, scope) {
            return _core.addListener("name", property, callback, scope);
        },

        observeOnce: function (type, callback, scope) {
            return _core.addListenerOnce("type", type, callback, scope);
        },

        observePropertyOnce: function (property, callback, scope) {
            return _core.addListenerOnce("name", property, callback, scope);
        },

        pause: _core.pause,

        resume: _core.resume
    };

 };