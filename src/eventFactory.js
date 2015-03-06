/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014-2015 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
"use strict";

function shallowCopy(object) {
    return Object.keys(object).reduce(function (copy, property) {
        copy[property] = object[property];
        return copy;
    }, {});
}

module.exports = {
    // This stuff works but it's a mess.
    // At least it's hidden in this file
    create: function (ev, properties) {
        var copy = shallowCopy(ev);

        copy.object = properties.rootObject;

        if ("name" in copy) {
            copy.name = properties.namespacedName;
        } else {
            copy.index = properties.namespacedName;
        }

        if (copy.type != "add" && (copy.type != "splice" || copy.addedCount === 0)) {
            copy.oldValue = properties.oldValue;
        }

        if ("value" in properties) {
            copy.value = properties.value;
        }

        return copy;
    }
};