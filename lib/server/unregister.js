var kevsTpl = require('../util/kevs-tpl');

function statusLog(status) {
	if (status && status.length > 0) {
		return ', status=' + status + '';
	}

	return '';
}

/*
 * Called when a client disconnects or becomes unreachable
 */
module.exports = function unregister(logger, client2name, client, instance, code, status) {
	var clientName = client2name[client.id];
	if (clientName) {
		// client is registered
		logger.info('node "' + clientName + '" disconnected (id=' + client.id + ',code=' + code + statusLog(status) + ')');
		delete client2name[client.id];
		delete client.id;
		// clear heartbeat interval if any
		clearInterval(client.heartBeat);

		if (code != 1000) {
			// a registered node disconnected from master => execute onDisconnect kevscript if any
			var onDisconnectKevs = instance.getDictionary().getString('onDisconnect', instance.dic_onDisconnect.defaultValue).trim();
			if (onDisconnectKevs.length > 0) {
				onDisconnectKevs = kevsTpl(onDisconnectKevs, instance.getName(), clientName);
				logger.debug('submitting onDisconnect KevScript:');
				logger.debug(onDisconnectKevs);
				try {
					instance.getKevoreeCore().submitScript(onDisconnectKevs);
				} catch (err) {
					logger.warn('onDisconnect KevScript interpretation error: ' + instance.getName());
					logger.warn(err.stack);
				}
			}
		}
	}
};
