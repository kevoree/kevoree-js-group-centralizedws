var RWebSocket = require('rwebsocket');
var shrink = require('../util/shrink');
var findMasterNode = require('./find-master-node');
var findMasterNets = require('./find-master-nets');

function getUri(log, port, group, masterNetName, masterNetValueName) {
	var uri = '';
	if (port === 443) {
		uri = 'wss://';
	} else {
		uri = 'ws://';
	}

	var masterNode = findMasterNode(group);
	if (masterNode) {
		var nets = findMasterNets(group, masterNode);
		if (nets[masterNetName]) {
			if (nets[masterNetName][masterNetValueName]) {
				return uri + nets[masterNetName][masterNetValueName] + ':' + port;
			} else {
				throw new Error('Unable to find network value named "'+masterNetValueName+'" for master node "'+masterNode.name+'"');
			}
		} else {
			throw new Error('Unable to find network "'+masterNetName+'" for master node "'+masterNode.name+'"');
		}
	} else {
		throw new Error('No master node found. Did you set one node "isMaster" to "true"?');
	}
}

module.exports = {
	create: function (log, port, group, masterNetName, masterNetValueName) {
		var uri = getUri(log, port, group, masterNetName, masterNetValueName);
		var client = new RWebSocket(uri);

		client.onopen = function () {
			log.info('connected to ' + uri);
		};

		client.onmessage = function (event) {
			log.info('message received: ' + shrink(event.data, 15));
		};

		client.onclose = function () {
			log.warn('connection lost with ' + uri + ' (retry in ' + client.retryInterval + 'ms)');
		};

		client.connect();

		return client;
	}
};
