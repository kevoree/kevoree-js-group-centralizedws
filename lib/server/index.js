var WebSocket = require('ws');
var kevoree = require('kevoree-library');

var Protocol = require('../protocol/Protocol');
var RegisterMessage = require('../protocol/RegisterMessage');
var PushMessage = require('../protocol/PushMessage');
var PushKevSMessage = require('../protocol/PushKevSMessage');
var PullMessage = require('../protocol/PullMessage');
var shrink = require('../util/shrink');
var shortid = require('../util/shortid');
var reducer = require('../util/reducer');
var findMasterNode = require('../util/find-master-node');

var register = require('./register');
var pull = require('./pull');
var push = require('./push');
var unregister = require('./unregister');

var client2name = {};

function onMessage(logger, server, client, msg, instance) {
	var pMsg = Protocol.parse(msg);
	if (pMsg) {
		switch (pMsg.getType()) {
			case RegisterMessage.TYPE:
				register(logger, client2name, client, pMsg, instance);
				break;

			case PullMessage.TYPE:
				pull(logger, client2name, client, instance);
				break;

			case PushMessage.TYPE:
				push(logger, server, client2name, client, pMsg, instance);
				break;

			case PushKevSMessage.TYPE:
				// TODO
				logger.debug('kevs push are not handled yet');
				// push(logger, client2name, client, pMsg, instance);
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

function onConnection(logger, server, client, instance) {
	client.id = shortid(10);
	client.on('message', function (msg) {
		onMessage(logger, server, client, msg, instance);
	});

	client.on('close', function (code, status) {
		onClose(logger, client, code, status);
	});
}

module.exports = {
	client2name: client2name,
	create: function (logger, port, instance) {
		var server = new WebSocket.Server({ port: port }, function () {
			logger.info('listening on 0.0.0.0:' + port);
		});

		server.on('connection', function (client) {
			onConnection(logger, server, client, instance);
		});

		instance.getKevoreeCore().on('deployed', function () {
			var connectedNodes = [];
			var factory = new kevoree.factory.DefaultKevoreeFactory();
			var serializer = factory.createJSONSerializer();
			var model = instance.getKevoreeCore().getCurrentModel();

			if (model.generated_KMF_ID === server.modelId) {
				server.modelId = null;
				server.clients.forEach(function (client) {
					var clientNodeName = client2name[client.id];
					if (clientNodeName) {
						if (client.readyState === WebSocket.OPEN) {
							var group = instance.getModelEntity();
							var masterName = findMasterNode(group).name;
							var reducedModel = reducer(model, masterName, clientNodeName);
							var reducedModelStr = serializer.serialize(reducedModel);
							client.send(new PushMessage(reducedModelStr).toRaw());
							connectedNodes.push(clientNodeName);
						} else {
							// connection is not opened
							logger.warn('connection with "'+clientNodeName+'" is closed');
						}
					}
				});
				if (connectedNodes.length > 0) {
					logger.info('model sent to: ' + connectedNodes.join(', '));
				}
			} else {
				// send serialized model to every connected clients that are not registered nodes (because they should be editors)
				var modelStr = serializer.serialize(model);
				server.clients.forEach(function (client) {
					if (!client2name[client.id]) {
						if (client.readyState === WebSocket.OPEN) {
							client.send(modelStr);
						}
					}
				});
			}
		});

		return server;
	}
};
