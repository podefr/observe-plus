/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014-2015 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
"use strict";

module.exports = {
    // This stuff works but it's a mess.
    // At least it's hidden in this file
    create: function (ev, properties) {
        var copy = JSON.parse(JSON.stringify(ev));

        copy.object = properties.rootObject;

        if ("name" in copy) {
            copy.name = properties.namespacedName;
            if (copy.type != "add" && properties.eventType == "name") {
               copy.oldValue = properties.oldValue;
            }
        } else {
            copy.index = properties.namespacedName;
        }

        if ("value" in properties) {
            copy.value = properties.value;
        }

        return copy;
    }
};