var WebSocket = require('ws');
var kevoree = require('kevoree-library');

var RegisteredMessage = require('../protocol/RegisteredMessage');
var shortid = require('../util/shortid');
var unregister = require('./unregister');
var reducer = require('../util/reducer');
var findMasterNode = require('../util/find-master-node');

var HEARTBEAT_INTERVAL = process.env.KEV_CWSG_HB || 15000; // TODO monkey-patch for now
var PONG_TIMEOUT = 5000;

/*
 * Called when a client asked for registration
 */
module.exports = function register(logger, client2name, client, pMsg, instance) {
	if (client2name[client.id]) {
		logger.warn('node "' + client2name[client.id] + '" is already registered (id=' + client.id + ')');

	} else {
		client.id = shortid(10);
		client2name[client.id] = pMsg.getNodeName();
		logger.info('node "' + pMsg.getNodeName() + '" registered (id=' + client.id + ')');

		var factory = new kevoree.factory.DefaultKevoreeFactory();
		var loader = factory.createJSONLoader();
		var cloner = factory.createModelCloner();
		var model = null;

		try {
			model = loader.loadModelFromString(pMsg.getModel()).get(0);
		} catch (e) {
			logger.warn('erroneous model received from "' + pMsg.getNodeName() + '" registration');
			logger.warn(e.stack);
		}

		if (model) {
			var group = instance.getModelEntity();
			var masterName = findMasterNode(group).name;
			logger.debug('reducing register model for master "' + masterName + '" and client "' + pMsg.getNodeName() + '"...');
			var registerModel = reducer(model, masterName, pMsg.getNodeName());
			var compare = factory.createModelCompare();
			var kCore = instance.getKevoreeCore();
			var currentModel = cloner.clone(kCore.getCurrentModel());
			compare.merge(registerModel, currentModel).applyOn(registerModel);
			// fs.writeFileSync('/tmp/master-register-'+pMsg.getNodeName()+'.json', JSON.stringify(JSON.parse(factory.createJSONSerializer().serialize(registerModel)), null, 2), 'utf8');
			kCore.deploy(registerModel);
		}

		// send registered ack back to client
		client.send(new RegisteredMessage().toRaw());

		// heartbeat process once every HEARTBEAT_INTERVAL ms
		client.heartBeat = setInterval(function () {
			if (client.readyState === WebSocket.OPEN) {
				// create a random message
				client.pingMsg = shortid();
				// send it as a ping
				client.ping(client.pingMsg, null, false);

				// register a timeout to be executed in PONG_TIMEOUT ms
				client.pingTimeout = setTimeout(function () {
					// unable to receive answer to ping...unregister
					clearInterval(client.heartBeat);
					unregister(logger, client2name, client, 4042, 'no pong answer');
				}, PONG_TIMEOUT);
			} else {
				clearInterval(client.heartBeat);
				unregister(logger, client2name, client, 4043, 'cannot ping client (connection is not opened)');
			}
		}, HEARTBEAT_INTERVAL);

		// compare pong messages to last stored pingMsg
		client.on('pong', function (pong) {
			var pongMsg = pong + '';
			if (pongMsg === client.pingMsg) {
				// pong answer === ping message
				// => all good
				clearTimeout(client.pingTimeout);
			} else {
				// pong answer !== ping message
				// => wrong state (close & unregister)
				client.close(4043, 'pong answer differs from ping');
			}
		});
	}
};
