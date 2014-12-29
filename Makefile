# observe-plus.js - https://github.com/podefr/observe-plus
# Copyright(c) 2014-2015 Olivier Scherrer <pode.fr@gmail.com>
# MIT Licensed


test:
	mocha --harmony specs/*

watch:
	mocha --watch --harmony specs/*

jshint:
	jshint src

.PHONY: test watch clean jshint