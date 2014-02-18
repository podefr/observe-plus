Observe+
===========

Observe+ is a library based on [Object.observe](http://wiki.ecmascript.org/doku.php?id=harmony:observe) that adds the following features:

- fine grained observe on individual properties/index/event types
- pause/resume to do bach updates on the model before publishing all the events
- observe once to remove the event listener after an event has fired.

What is Object.observe?
========================

http://addyosmani.com/blog/the-future-of-data-binding-is-object-observe/

Compatible browsers:
====================

Check Kangax' ES compat table to see where Object.observe (ES7) is available : http://kangax.github.io/es5-compat-table/es6/#Object.observe_%28part_of_b_ES7_/b_%29

Installation:
=============

```bash
npm install observe-plus
```

Usage:
=====

```js
var observePlus = require("observe-plus");
```

Observing objects:
------------------

```js
var plainObject = {};

var observer = observePlus.observeObject(plainObject);
```

Observing generic events on the object such as property added, updated, removed:

```js
// Listening to properties being added to the object
var dispose = observer.observe("new", function (publishedEvent) {
	// When a property will be added to the object,
	// this callback will be called with this === scope
	// and publishedEvent as the original event such as, for example:
	publishedEvent.name == "newProperty";
	publishedEvent.object === plainObject;
	publishedEvent.type == "new";
}, scope /* optional */);

// This will trigger the listeners that have subscribed to "new"
plainObject.newProperty = "value";

// This will add a listener to properties being updated
observer.observe("update", function (publishedEvent) { ... }, scope /* optional */);

// This listener will be called only once and then disposed
observer.observeOnce("update", function (publishedEvent) { ... }, scope /* optional */);

plainObject.newProperty = "newValue";

observer.observe("delete", function (publishedEvent) { ... }, scope /* optional */);

// The listener will be called only once and then disposed
observer.observeOnce("delete", function (publishedEvent) { ... }, scope /* optional */);

delete plainObject.newProperty;

// When you're done with the listener, you can remove it by calling dispose:
dispose();
```

Observing events on specific properties of the object:

```js
var dispose = observer.observe("newProperty", function (publishedEvent) {
	// When newProperty will be added/modified or removed,
	// this callback will be called with this === scope
	// and publishedEvent as the original event such as, for example:
	publishedEvent.name === "newProperty";
	publishedEvent.object === plainObject;
	publishedEvent.type === "new";
}, scope /* optional */);

// This will call the callback with the new event
plainObject.newProperty = "value";

// This will call the callback with the update event
plainObject.newProperty = "newValue";

// This will call the callback with the delete event
delete plainObject.newProperty;

// This will not call the callback as it's not listening to events on anotherProperty
plainObject.anotherProperty = "value";
```

Observing arrays:
-----------------

```js
var plainArray = [];

var observer = observePlus.observeArray(plainArray);
```

```js
// Listening to changes on the array such as item added or removed
observer.observe("splice", function (publishedEvent) {
	//
}, scope /* optional */);

plainArray.push("item");

// Listening to updates on the items
observer.observe("update", function (publishedEvent) {
	//
}, scope /* optional */);

plainArray.pop();

observer.observeIndex(10, function (publishedEvent) {
	//
}, scope /* optional */);

plainArray[10] = "item":
```

Trick: if you use Object.observe on the array, you can also listen to length changes:

```js
var observer = observePlus.observeObject(plainArray);

observer.observe("length", function (publishedEvent) {

}, scope /* optional */);
```

Pause/resume:
-------------

The events are fired asynchronously, on the next turn of the event loop. This should allow for rendering to be delayed until all computation is done. If you still want to delay the trigger further, you can pause the observer and resume it later, by using the pause/resume API:

```js
// Pause the observer
observer.pause();

// do something on object/array;

// resume the observer, which will trigger all the listeners with the events:
observer.resume();
```

Note that resume() will also trigger the callbacks asynchronously, to be consistent with Object.observe and Array.observe.

License:
========

MIT