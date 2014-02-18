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



License:
========

MIT