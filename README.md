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
observer.observe("new", function (publishedEvent) {
	// When a property will be added to the object,
	// this callback will be called with this === scope
	// and publishedEvent as the original event such as, for example:
	publishedEvent.name === "newProperty";
	publishedEvent.object === plainObject;
	publishedEvent.type === "new";
}, scope /* optional */);

plainObject.newProperty = "value";

observer.observe("update", function (publishedEvent) { ... }, scope /* optional */);

plainObject.newProperty = "newValue";

observer.observe("delete", function (publishedEvent) { ... }, scope /* optional */);

delete plainObject.newProperty;
```

Observing events on specific properties of the object:

```js
observer.observe("newProperty", function (publishedEvent) {
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

License:
========

MIT