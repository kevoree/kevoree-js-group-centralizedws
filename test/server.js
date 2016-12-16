var assert = require('assert');
// var kevoree = require('kevoree-library');
var WebSocket = require('ws');

var serverFactory = require('../lib/server');
var KCoreMock = require('./lib/KCoreMock');
var RegisterMessage = require('../lib/protocol/RegisterMessage');

var PORT = 9000;

// setup
// var factory = new kevoree.factory.DefaultKevoreeFactory();
// var saver = factory.createJSONSerializer();
// var loader = factory.createJSONLoader();
function noop() {/*noop*/}
var logger = {
	info: noop,
	debug: noop,
	warn: noop,
	error: noop
};

describe('server.create(logger, port, kCore)', function () {
	this.timeout(500);
	this.slow(100);

	var server;
	var kCoreMock;

	before('create Kevoree Core mock', function () {
		kCoreMock = new KCoreMock();
	});

	beforeEach('create server on port ' + PORT, function () {
		server = serverFactory.create(logger, PORT, kCoreMock);
	});

	afterEach('close server', function () {
		server.close();
	});

	it('server is reachable', function (done) {
		var client = new WebSocket('ws://localhost:' + PORT);
		client.on('open', function () {
			client.close();
			done();
		});
	});

	it('registered client is stored', function (done) {
		this.slow(350);
		var client = new WebSocket('ws://localhost:' + PORT);
		client.on('open', function () {
			var rMsg = new RegisterMessage('node0');
			client.send(rMsg.toRaw());

			// give the server the time to process the request
			setTimeout(function () {
				assert.equal(Object.keys(serverFactory.client2name).length, 1);
				assert.equal(serverFactory.client2name[client], 'node0');
				client.close();
				done();
			}, 100);
		});
	});

	it('client closed is removed from registered store', function (done) {
		this.slow(500);
		var client = new WebSocket('ws://localhost:' + PORT);
		client.on('open', function () {
			var rMsg = new RegisterMessage('node0');
			client.send(rMsg.toRaw());

			// give the server the time to process the request
			setTimeout(function () {
				client.close();
				setTimeout(function () {
					assert.equal(Object.keys(serverFactory.client2name).length, 0);
					assert.equal(serverFactory.client2name[client], undefined);
					done();
				}, 100);
			}, 100);
		});
	});

	it('unpingable client should be unregistered', function () {
		// TODO this is not easily testable ? (maybe by unblackboxing the register/pull/push commands)
	});
});
