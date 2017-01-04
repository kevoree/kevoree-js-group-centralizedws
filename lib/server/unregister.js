function statusLog(status) {
	if (status && status.length > 0) {
		return ', status='+status+'';
	}

	return '';
}

/*
 * Called when a client disconnects or becomes unreachable
 */
module.exports = function unregister(logger, client2name, client, code, status) {
	var clientName = client2name[client.id];
	if (clientName) {
		// client is registered

		logger.info('client "' + clientName + '" left (id='+client.id+',code=' + code + statusLog(status) + ')');
		delete client2name[client.id];
		logger.info('unregistered: ' + clientName);
		// clear heartbeat interval if any
		clearInterval(client.heartBeat);
	} else {
		// unregistered client
		// noop
	}
};
