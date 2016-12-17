// var assert = require('assert');

var clientFactory = require('../lib/client');
var KCoreMock = require('./util/KCoreMock');
// var RegisterMessage = require('../lib/protocol/RegisterMessage');
// var PullMessage = require('../lib/protocol/PullMessage');

var PORT = 9000;

function noop() {/*noop*/}
var logger = {
	info: noop,
	debug: noop,
	warn: noop,
	error: noop
};

describe('client.create(logger, port, kCore)', function () {
	this.timeout(500);
	this.slow(100);

	var client;
	var kCoreMock;

	before('create Kevoree Core mock', function () {
		kCoreMock = new KCoreMock();
	});

	beforeEach('create server on port ' + PORT, function () {
		client = clientFactory.create(logger, PORT, kCoreMock);
	});

	afterEach('close client', function () {
		client.close();
	});
	//
	// it('should send a model back when pull', function (done) {
	//
	// });
});
