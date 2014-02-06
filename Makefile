# observe-plus.js - https://github.com/podefr/observe-plus
# Copyright(c) 2014 Olivier Scherrer <pode.fr@gmail.com>
# MIT Licensed

test:
	mocha specs/*

watch:
	mocha --watch --harmony specs/*

.PHONY:
	test