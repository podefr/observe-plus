all: clean observe-plus.js

clean:
	rm -f observe-plus.js

observe-plus.js:
	browserify -e ../src/observe-plus.js -o observe-plus.js -s observe-plus

.PHONY: clean
