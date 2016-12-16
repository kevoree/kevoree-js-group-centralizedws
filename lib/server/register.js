var shortid = require('../util/shortid');
var unregister = require('./unregister');

var HEARTBEAT_INTERVAL = 15000;
var PONG_TIMEOUT = 5000;

/*
 * Called when a client asked for registration
 */
module.exports = function register(logger, client2name, client, pMsg) {
	client2name[client] = pMsg.getNodeName();
	logger.info('registered: ' + pMsg.getNodeName());

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
