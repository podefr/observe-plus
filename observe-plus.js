require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var process=require("__browserify_process");
// Use the fastest possible means to execute a task in a future turn
// of the event loop.

// linked list of tasks (single, with head node)
var head = {task: void 0, next: null};
var tail = head;
var flushing = false;
var requestFlush = void 0;
var isNodeJS = false;

function flush() {
    /* jshint loopfunc: true */

    while (head.next) {
        head = head.next;
        var task = head.task;
        head.task = void 0;
        var domain = head.domain;

        if (domain) {
            head.domain = void 0;
            domain.enter();
        }

        try {
            task();

        } catch (e) {
            if (isNodeJS) {
                // In node, uncaught exceptions are considered fatal errors.
                // Re-throw them synchronously to interrupt flushing!

                // Ensure continuation if the uncaught exception is suppressed
                // listening "uncaughtException" events (as domains does).
                // Continue in next event to avoid tick recursion.
                if (domain) {
                    domain.exit();
                }
                setTimeout(flush, 0);
                if (domain) {
                    domain.enter();
                }

                throw e;

            } else {
                // In browsers, uncaught exceptions are not fatal.
                // Re-throw them asynchronously to avoid slow-downs.
                setTimeout(function() {
                   throw e;
                }, 0);
            }
        }

        if (domain) {
            domain.exit();
        }
    }

    flushing = false;
}

if (typeof process !== "undefined" && process.nextTick) {
    // Node.js before 0.9. Note that some fake-Node environments, like the
    // Mocha test runner, introduce a `process` global without a `nextTick`.
    isNodeJS = true;

    requestFlush = function () {
        process.nextTick(flush);
    };

} else if (typeof setImmediate === "function") {
    // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
    if (typeof window !== "undefined") {
        requestFlush = setImmediate.bind(window, flush);
    } else {
        requestFlush = function () {
            setImmediate(flush);
        };
    }

} else if (typeof MessageChannel !== "undefined") {
    // modern browsers
    // http://www.nonblocking.io/2011/06/windownexttick.html
    var channel = new MessageChannel();
    channel.port1.onmessage = flush;
    requestFlush = function () {
        channel.port2.postMessage(0);
    };

} else {
    // old browsers
    requestFlush = function () {
        setTimeout(flush, 0);
    };
}

function asap(task) {
    tail = tail.next = {
        task: task,
        domain: isNodeJS && process.domain,
        next: null
    };

    if (!flushing) {
        flushing = true;
        requestFlush();
    }
};

module.exports = asap;


},{"__browserify_process":7}],2:[function(require,module,exports){
/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
 var asap = require("asap");

 module.exports = function Core(Prototype) {

 	var _prototype = Prototype,
 		_object = null,
 		_callbacks = {},
 		_isPaused = false,
 		_savedEvents = [];

 	this.setObject = function setObject(object) {
 		_object = object;
 		_prototype.observe(object, this.treatEvents.bind(this));
 	};

 	this.treatEvents = function treatEvents(events) {
 		 if (_isPaused) {
 		 	_savedEvents = _savedEvents.concat(events);
 		 } else {
 		 	publishEvents(events);
 		 }
 	};

 	function publishEvents(events) {
		events.forEach(function (ev) {
            function executeCallback(callbackArray) {
            	var callback = callbackArray[0],
            		thisObj = callbackArray[1];
                try {
                    callback.call(thisObj, ev);
                } catch (err) {
                }
            }

            Object.keys(_callbacks).forEach(function (propertyName) {
            	if (_callbacks[propertyName] && _callbacks[propertyName][ev[propertyName]]) {
            		_callbacks[propertyName][ev[propertyName]].forEach(executeCallback);
            	}
            });
        });
 	}

 	this.addListener = function addListener(propertyName, propertyValue, callback, scope) {
 		var item = [callback, scope];
 		_callbacks[propertyName] = _callbacks[propertyName] || {};

 		_callbacks[propertyName][propertyValue] = _callbacks[propertyName][propertyValue] || [];
 		_callbacks[propertyName][propertyValue].push(item);

 		return function dispose() {
 			var index = _callbacks[propertyName][propertyValue].indexOf(item);
 			if (index >= 0) {
 				_callbacks[propertyName][propertyValue].splice(index, 1);
 				return true;
 			} else {
 				return false;
 			}
 		};
 	};

 	this.addListenerOnce = function addListenerOnce(propertyName, propertyValue, callback, scope) {
 		var dispose = this.addListener(propertyName, propertyValue, function () {
 			callback.apply(scope, arguments);
 			dispose();
 		});
 		return dispose;
 	};

 	this.pause = function pause() {
 		_isPaused = true;
 	};

 	this.resume = function resume() {
 		asap(function () {
	 		_isPaused = false;
	 		publishEvents(_savedEvents);
	 		_savedEvents = [];
 		});
 	};

 };
},{"asap":1}],"IIlIZC":[function(require,module,exports){
/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */

 module.exports = {
 	observeArray: require("./observeArray"),
 	observeObject: require("./observeObject")
 };
},{"./observeArray":5,"./observeObject":6}],"observe-plus":[function(require,module,exports){
module.exports=require('IIlIZC');
},{}],5:[function(require,module,exports){
/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
 var Core = require("./core");

 module.exports = function observeArray(observedArray) {

    var _core = new Core(Array);

    _core.setObject(observedArray);

    return {
        observeIndex: function (index, callback, scope) {
            return _core.addListener("name", index, callback, scope);
        },

        observeIndexOnce: function (index, callback, scope) {
            return _core.addListenerOnce("name", index, callback, scope);
        },

        observe: function (type, callback, scope) {
        	return _core.addListener("type", type, callback, scope);
        },

        observeOnce: function (type, callback, scope) {
			return _core.addListenerOnce("type", type, callback, scope);
        },

        pause: _core.pause,

        resume: _core.resume
    };

 };
},{"./core":2}],6:[function(require,module,exports){
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
},{"./core":2}],7:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}]},{},[])