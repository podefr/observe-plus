all: observe-plus.js


clean:
    rm -f observe-plus.js

observe-plus.js:
    browserify -e ../index.js -o observe-plus.js -s observe-plus

.PHONY: clean
