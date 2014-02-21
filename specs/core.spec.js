/**
 * observe-plus.js - https://github.com/podefr/observe-plus
 * Copyright(c) 2014 Olivier Scherrer <pode.fr@gmail.com>
 * MIT Licensed
 */
var chai = require("chai");
var sinon = require("sinon");
var expect = chai.expect;
var asap = require("asap");

var Core = require("../src/core");

function createEvent(type, name, value, oldValue) {
    return {
        type: type,
        name: name,
        value: value,
        oldValue: oldValue
    };
}

describe("GIVEN core", function () {
    var core,
        Prototype = {};

    describe("WHEN initialised", function () {
        beforeEach(function () {
            Prototype.observe = sinon.spy();
            core = new Core(Prototype);
        });

        it("THEN creates a new core", function () {
            expect(typeof core).to.equal("object");
        });

        describe("WHEN setting the object to observe", function () {
            var observedObject,
                callback;

            beforeEach(function () {
                observedObject = {};
                sinon.spy(core, "treatEvents");
                core.setObject(observedObject);
                callback = Prototype.observe.args[0][1];
                callback([]);
            });

            afterEach(function () {
                core.treatEvents.restore();
            });

            it("THEN observes changes on the observed object", function () {
                expect(Prototype.observe.called).to.be.true;
                expect(Prototype.observe.args[0][0]).to.equal(observedObject);
                expect(core.treatEvents.called).to.be.true;
            });

            describe("WHEN there's a listener on a specific property name", function () {
                var callback,
                    dispose,
                    thisObj,
                    order = [];

                beforeEach(function () {
                    thisObj = {};
                    callback = sinon.spy();

                    dispose = core.addListener("name", "property", callback, thisObj);
                    core.addListener("name", "property", function () {
                        order.push("observer2");
                    });
                    core.addListener("name", "property", function () {
                        order.push("observer3");
                    });
                });

                describe("AND changes happen on the object", function () {
                    var event1,
                        event2;

                    beforeEach(function () {
                        event1 = createEvent("add", "property", "value");
                        event2 = createEvent("add", "anotherProperty", "value");
                        core.treatEvents([event1, event2]);
                    });

                    it("THEN calls the listeners that match", function () {
                        expect(callback.called).to.be.true;
                        expect(callback.lastCall.args[0]).to.equal(event1);
                        expect(callback.calledOnce).to.be.true;
                        expect(callback.calledOn(thisObj)).to.be.true;
                    });

                    it("THEN calls the listeners in order", function () {
                        expect(order[0]).to.equal("observer2");
                        expect(order[1]).to.equal("observer3");
                    });

                    describe("WHEN a listener throws an error", function () {
                        beforeEach(function () {
                            order = [];
                            core.addListener("name", "property", function () {
                                throw new Error("buggy listener");
                            });
                            core.addListener("name", "property", function () {
                                order.push("observer4");
                            });
                            core.treatEvents([event1]);
                        });

                        it("THEN ignores the listener and continues to the next one", function () {
                            expect(order[0]).to.equal("observer2");
                            expect(order[1]).to.equal("observer3");
                            expect(order[2]).to.equal("observer4");
                        });
                    });
                });

                describe("WHEN disposing of a listener", function () {
                    var isDisposed = false;

                    beforeEach(function () {
                        isDisposed = dispose();
                    });

                    it("THEN disposes of the listener", function () {
                        expect(isDisposed).to.equal(true);
                    });

                    describe("WHEN new changes happen on the object", function () {
                        beforeEach(function () {
                            core.treatEvents([createEvent("add", "property", "value")]);
                        });

                        it("THEN doesnt call the listener anymore", function () {
                            expect(callback.called).to.be.false;
                        });
                    });

                    describe("WHEN trying to dispose again", function () {
                        beforeEach(function () {
                            isDisposed = dispose();
                        });

                        it("THEN doesnt do anything", function () {
                            expect(isDisposed).to.be.false;
                        });
                    });
                });
            });

            describe("WHEN observing changes only once", function () {
                var dispose,
                    callback;

                beforeEach(function () {
                    callback = sinon.spy();
                    dispose = core.addListenerOnce("name", "property", callback);
                });

                describe("WHEN the observer is disposed of", function () {
                    var isDisposed;

                    beforeEach(function () {
                        isDisposed = dispose();
                        core.treatEvents([createEvent("add", "property", "value")]);
                    });

                    it("THEN the observer is never called", function () {
                        expect(callback.called).to.be.false;
                    });
                });

                describe("WHEN the property is added", function () {
                    beforeEach(function () {
                        event1 = createEvent("add", "property", "value");
                        core.treatEvents([event1]);
                    });

                    it("THEN calls the observer", function () {
                        expect(callback.calledOnce).to.be.true;
                    });

                    it("THEN is disposed of", function () {
                        expect(dispose()).to.be.false;
                    });
                });
            });

            describe("WHEN pausing the updates", function () {
                var callback;

                beforeEach(function () {
                    callback = sinon.spy();

                    core.addListener("name", "property", callback);
                    core.pause();
                });

                describe("WHEN a property changes", function () {
                    var event1,
                        event2,
                        event3;

                    beforeEach(function () {
                        event1 = createEvent("add", "property", "value");
                        event2 = createEvent("update", "property", "newValue");
                        event3 = createEvent("delete", "property");
                        core.treatEvents([event1, event2, event3]);
                    });

                    it("THEN the observers aren't called", function () {
                        expect(callback.called).to.be.false;
                    });

                    describe("WHEN resuming publishing the updates", function () {
                        beforeEach(function () {
                            core.resume();
                        });

                        it("THEN doesnt call the callbacks synchronously", function () {
                            expect(callback.called).to.be.false;
                        });

                        it("THEN calls all the observers in order at the next turn of the event loop", function (done) {
                            asap(function () {
                                expect(callback.firstCall.calledWith(event1)).to.be.true;
                                expect(callback.secondCall.calledWith(event2)).to.be.true;
                                expect(callback.thirdCall.calledWith(event3)).to.be.true;
                                expect(callback.callCount).to.equal(3);
                                done();
                            });
                        });

                        describe("WHEN the updates are paused and resumed again", function () {
                            beforeEach(function () {
                                callback.reset();
                                core.pause();
                                core.treatEvents([createEvent("add", "property", "value")]);
                                core.resume();
                            });

                            it("THEN only publishes the new event", function (done) {
                                asap(function () {
                                    expect(callback.callCount).to.equal(1);
                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});