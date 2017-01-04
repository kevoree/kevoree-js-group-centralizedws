var fs = require('fs');
var kevoree = require('kevoree-library');
var shortid = require('../util/shortid');
var unregister = require('./unregister');
var reducer = require('../util/reducer');
var findMasterNode = require('../util/find-master-node');

var HEARTBEAT_INTERVAL = 15000;
var PONG_TIMEOUT = 5000;

/*
 * Called when a client asked for registration
 */
module.exports = function register(logger, client2name, client, pMsg, instance) {
	client2name[client.id] = pMsg.getNodeName();
	logger.info('client "' + pMsg.getNodeName() + '" connected (id='+client.id+')');

	var factory = new kevoree.factory.DefaultKevoreeFactory();
	var loader = factory.createJSONLoader();
	var cloner = factory.createModelCloner();
	var model;

	try {
		model = loader.loadModelFromString(pMsg.getModel()).get(0);
		// get out of try/catch if loadModelFromString didn't fail otherwise
		// it could catch unwanted errors
	} catch (err) {
		err.message = 'Unable to parse register model from "'+pMsg.getNodeName()+'"';
		throw err;
	}

	var group = instance.getModelEntity();
	var masterName = findMasterNode(group).name;
	logger.debug('reducing register model for master "'+masterName+'" and client "'+pMsg.getNodeName()+'"...');
	var registerModel = reducer(model, masterName, pMsg.getNodeName());
	var compare = factory.createModelCompare();
	var kCore = instance.getKevoreeCore();
	var currentModel = cloner.clone(kCore.getCurrentModel());
	factory.root(currentModel);
	compare.merge(registerModel, currentModel).applyOn(registerModel);
	fs.writeFileSync('/tmp/master-register-'+pMsg.getNodeName()+'.json', JSON.stringify(JSON.parse(factory.createJSONSerializer().serialize(registerModel)), null, 2), 'utf8');
	kCore.deploy(registerModel);

	// heartbeat process once every HEARTBEAT_INTERVAL ms
	client.heartBeat = setInterval(function () {
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
};
