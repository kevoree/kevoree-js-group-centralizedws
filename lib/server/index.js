var WebSocket = require('ws');

var Protocol = require('../protocol/Protocol');
var shrink = require('../util/shrink');

var register = require('./register');
var pull = require('./pull');
var push = require('./push');
var unregister = require('./unregister');

var client2name = {};

function onMessage(logger, client, msg, kCore) {
	var pMsg = Protocol.parse(msg);
	if (pMsg) {
		switch (pMsg.getType()) {
			case Protocol.REGISTER_TYPE:
				register(logger, client2name, client, pMsg);
				break;

			case Protocol.PULL_TYPE:
				pull(logger, client2name, client, kCore);
				break;

			case Protocol.PUSH_TYPE:
				push(logger, client2name, client, pMsg, kCore);
				break;

			default:
				logger.warn('unknown message type: ' + msg);
				break;
		}
	} else {
		logger.warn('invalid message format (msg: "' + shrink(msg, 15) + '")');
	}
}

function onClose(logger, client, code, status) {
	unregister(logger, client2name, client, code, status);
}

function onConnection(logger, client, kCore) {
	client.on('message', function (msg) {
		onMessage(logger, client, msg, kCore);
	});

	client.on('close', function (code, status) {
		onClose(logger, client, code, status);
	});
}

module.exports = {
	client2name: client2name,
	create: function (logger, port, kCore) {
		var server = new WebSocket.Server({ port: port }, function () {
			logger.info('listening on 0.0.0.0:' + port);
		});

		server.on('connection', function (client) {
			onConnection(logger, client, kCore);
		});

		return server;
	}
};
