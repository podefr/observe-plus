# observe-plus.js - https://github.com/podefr/observe-plus
# Copyright(c) 2014 Olivier Scherrer <pode.fr@gmail.com>
# MIT Licensed
all: clean observe-plus.js observe-plus.min.js

clean:
	rm -f ./observe-plus.js
	rm -f ./observe-plus.min.js

observe-plus.js:
	browserify -r ./src/observe-plus.js:observe-plus -o observe-plus.js

observe-plus.min.js:
	cat license-mini > observe-plus.min.js
	uglifyjs observe-plus.js >> observe-plus.min.js

test:
	mocha specs/*

watch:
	mocha --watch --harmony specs/*

.PHONY: test watch clean