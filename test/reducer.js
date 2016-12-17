var assert = require('assert');
var kevoree = require('kevoree-library');

var reducer = require('../lib/util/reducer');
var readModel = require('./util/readModel');

// setup
var factory = new kevoree.factory.DefaultKevoreeFactory();
var saver = factory.createJSONSerializer();
// var loader = factory.createJSONLoader();
// function noop() {}
// var logger = {
// 	info: noop,
// 	debug: noop,
// 	warn: noop,
// 	error: noop,
// 	setLevel: noop,
// 	setFilter: noop
// };

describe('reducer(model, master, client)', function () {

	it('empty model', function () {
		var model = factory.createContainerRoot();
		var reducedModel = reducer(model, 'master', 'client');

		assert.equal(saver.serialize(model), saver.serialize(reducedModel));
	});

	it('extraneous nodes are removed', function (done) {
		this.slow(100);
		var model = readModel('3-nodes.json');
		var reducedModel = reducer(model, 'node0', 'node2');
		var node1 = reducedModel.findNodesByID('node1');
		assert.equal(node1, null);
		done();
	});
});
