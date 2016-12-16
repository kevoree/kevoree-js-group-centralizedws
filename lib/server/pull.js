var kevoree = require('kevoree-library');

/*
 * Called when a client asked for a pull
 */
module.exports = function pull(logger, client2name, client, kCore) {
	logger.info('pull requested: ' + client2name[client]);
	var factory = new kevoree.factory.DefaultKevoreeFactory();
	var saver = factory.createJSONSerializer();
	var modelStr = saver.serialize(kCore.getCurrentModel());
	client.send(modelStr);
};
