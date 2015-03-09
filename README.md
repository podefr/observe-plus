# Observe+ (Now observes on nested objects/arrays!)

Observe+ is a library based on [Object.observe/Array.observe](http://wiki.ecmascript.org/doku.php?id=harmony:observe) that adds the following features:

- [x] fine-grained observe on individual properties/index/event types
- [x] observe nested objects and arrays
- [x] pause/resume to do batch updates on the data structure before publishing all the events
- [x] observe once to remove the event listener after an event has fired
- [x] disposable pattern for removing listeners

## What is Object.observe?

http://addyosmani.com/blog/the-future-of-data-binding-is-object-observe/

Reference: http://arv.github.io/ecmascript-object-observe/

### Compatible browsers:

Check Kangax' ES compat' table to see where Object.observe (ES7) is available : http://kangax.github.io/es5-compat-table/es6/#Object.observe_%28part_of_b_ES7_/b_%29

## Installation:

```bash
npm install observe-plus
```

## How to use?

Remember that you need to have Object.observe and Array.observe in order for observe-plus to work:

### In node.js

Run with the --harmony option:

```bash
node --harmony myscript.js
```

### In Chrome

enable the harmony flag, navigate to [chrome://flags/#enable-javascript-harmony](chrome://flags/#enable-javascript-harmony)

## API

```js
var observePlus = require("observe-plus");
```

### Observing objects:

Object.observe() listens to changes happening on an object. Usually, we are interested in two types of events:

- When a property is added, updated, or removed from an object:

```js
var object = {};
// I want to know when a new property is added
object.newProperty = "value";

// and when a property is updated
object.newProperty = "newValue";

// or when it's removed
delete object.newProperty;
```

- When the value of a specific property changes:

```js
var object = { property: "value"};

// I want to observe object.property to know when the value changes:
object.property = "newValue";
object.property = "otherValue";

```

Observe+ allows to listen to these two types.

#### Observing generic events on the object such as property added, updated, removed:

```js
var plainObject = {};

var observer = observePlus.observe(plainObject);

// Listening to properties being added to the object
var dispose = observer.observe("add", function (publishedEvent) {
	// When a property is be added to the object,
	// this callback will be called with this === scope
	// and publishedEvent as the original event such as, for example:
	publishedEvent.name == "newProperty";
	publishedEvent.object === plainObject;
	publishedEvent.type == "add";
	publishedEvent.value == "value";
}, scope /* optional */);

// This will trigger the listeners that have subscribed to "add"
plainObject.newProperty = "value";

// This will add a listener to properties being updated
observer.observe("update", function (publishedEvent) { ... }, scope /* optional */);

// This listener will be called only once and then disposed of
observer.observeOnce("update", function (publishedEvent) { ... }, scope /* optional */);

// This will trigger the listeners that have subscribed to "update"
plainObject.newProperty = "newValue";

// This listener will be called when a property is deleted from the object
observer.observe("delete", function (publishedEvent) { ... }, scope /* optional */);

// This listener will be called only once and then disposed of
observer.observeOnce("delete", function (publishedEvent) { ... }, scope /* optional */);

// This will trigger the listeners that have subscribed to "delete"
delete plainObject.newProperty;

// When you're done with a listener, you can remove it by calling the dispose function that is the observe() method returned.
// All the observe methods return a dispose function.
dispose();
```

#### Observing changes on specific properties of the object:

```js
// Listening to changes on the "newProperty" property
var dispose = observer.observeValue("newProperty", function (publishedEvent) {
	// When newProperty will be added/modified or removed,
	// this callback will be called with this === scope
	// and publishedEvent as the original event such as, for example:
	publishedEvent.name === "newProperty";
	publishedEvent.object === plainObject;
	publishedEvent.type === "add";
	publishedEvent.value === "value";
}, scope /* optional */);

// Or similar, but the listener will be called only once:
observer.observeOnce("newProperty", function (publishedEvent) { ...}, scope /* optional */);

// This will call the callback with the "add" event
plainObject.newProperty = "value";

// This will call the callback with the "update" event
plainObject.newProperty = "newValue";

// This will call the callback with the "delete" event
delete plainObject.newProperty;

// This will not call the callback as it's not listening to events on anotherProperty
plainObject.anotherProperty = "value";

// When you're done with a listener, you can remove it by calling the dispose function that is the observe() method returned.
// All the observe methods return a dispose function.
dispose();
```

Stop observing changes on this object:

```js
observer.unobserve();
```

### Observing arrays:

As for arrays, we may be interested in:

- Listening to changes on the array such as item added/removed (splice) or updated (update):

```js
var array = [];
// I want to know when an item is added:
array.push("newItem");

// When an item is updated
array[0] = "updatedItem";

// When an item is removed
array.splice(0, 1);
```

- Listening to changes on a specific index of the array:

```js
var array = ["item"];

// I want to know when array[0] is updated:
array[0] = "newValue";
array[0] = "otherValue";
```

#### Observing generic events on the array such as item added, updated, removed:

```js
var plainArray = [];

var observer = observePlus.observe(plainArray);

// Listening to changes on the array such as item added or removed
var dispose = observer.observe("splice", function (publishedEvent) { ... }, scope /* optional */);

// Listening to splice events only once:
observer.observeOnce("splice", function (publishedEvent) { ... }, scope /* optional */);

// This will trigger all the listeners that have subscribed to "splice"
plainArray.push("item");

// Listening to updates on the items
observer.observe("update", function (publishedEvent) { ... }, scope /* optional */);

// This will trigger all the listeners that have subscribed to "update"
plainArray[0] = "newValue";

// This will again trigger all the listeners that have subscribed to "splice"
plainArray.pop();

// When you're done with a listener, you can remove it by calling the dispose function that is the observe() method returned.
// All the observe methods return a dispose function.
dispose();
```

#### Observing events on specific items from the array:

```js
var dispose = observer.observeValue(10, function (publishedEvent) { ... }, scope /* optional */);

// Or to listen index 10 only once:
observer.observerIndexOnce(10, function (publishedEvent) { ... }, scope /* optional */);

// This will trigger all the listeners that have subscribed to changes on item 10:
plainArray[10] = "item";

// Removing the listener
dispose();
```

Trick: if you use Object.observe on the array, you can also listen to "length" changes as it's a property of the object

```js
var observer = observePlus.observe(plainArray);

observer.observeValue("length", function (publishedEvent) { ... }, scope /* optional */);
```

Stop observing changes:

```js
observer.unobserve();
```

### Observing nested properties!

Observe+ can also watch for generic events or events on specific items/properties from nested objects and arrays!

Given this data structure:

```js
var dataStructure = [
    {
        id: 0,
        name: "Alice",
        colors: ["red", "green"]
    },

    {
        id: 1,
        name: "Bob",
        colors: ["yellow", "pink"]
    },
    
    {
        id: 2,
        name: "Carol",
        colors: ["purple"]
    }
];
```

I can watch this dataStructure:

```js
var observer = object.observe(dataStructure);
```

then I can watch if Alice's preferred color changes:

```js
observer.observeValue("0.colors.0", function (event) {
    // do something when 0.colors.0 changes.
    // event.value will hold the new color
    // event.oldValue will hold the old color
});


// Will trigger the event
dataStructure[0].colors[0] = "blue";
```

### Pause/resume:

The events are fired asynchronously, on the next turn of the event loop. This should allow for rendering to be delayed until all computation is done. If you still want to delay the trigger further, you can pause the observer and resume it later, by using the pause/resume API:

```js
// Pause the observer
observer.pause();

// do something on object/array;

// resume the observer, which will trigger all the listeners with the events:
observer.resume();
```

Note that resume() will also trigger the callbacks asynchronously, to be consistent with Object.observe and Array.observe.

## Changelog

## 3.0.3 - Beta - 08 MAR 2015

* All events have an oldValue property

### 3.0.2 - Beta - 05 MAR 2015

* Fix bug where oldValue was incorrectly resolved to undefined

### 3.0.1 - Beta - 05 MAR 2015

* Fix various bugs when modifying parent of observed nested objects that would prevent
some events being properly published

### 3.0.0 - Beta - 25 FEB 2015

* Fix a bug preventing splice events from triggering
* Fix performance issue when triggering events for many event listeners
* Update documentation

### 3.0.0 - Alpha - 17 FEB 2015

* Can observe nested objects and arrays
* Add current value of the watched property to the event object
* Unified observeArray and observeObject using polymorphism
* Using destroy terminology instead of unobserve
* Add isPaused method

### 2.1.0 - 28 DEC 2014

* Added .observe that either uses observeArray or observeObject depending on the type of the model to watch
* [Breaking Change] observeIndex(Once) and observeProperty(Once) are renamed to observeValue(Once).
* [Breaking Change] Removed bower support and standalone versions of observe-plus for the browser.

### 2.0 - 28 DEC 2014

Beta versions

### 1.0.1 - 5 MAR 2014

* Now throws an error when trying to observe an object in a runtime that doesn't have Object.observe

### 1.0.0

first release

## License:

MIT