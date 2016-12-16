var kevoree = require('kevoree-library');

/*
 * Called when a client asked for a push
 */
module.exports = function push(logger, client2name, client, pMsg, kCore) {
	logger.info('push: ' + client2name[client]);
	var factory = new kevoree.factory.DefaultKevoreeFactory();
	var loader = factory.createJSONLoader();
	try {
		var model = loader.loadModelFromString(pMsg.getModel()).get(0);
		// TODO improve push process
		kCore.deploy(model);
	} catch (err) {
		logger.error('erroneous model received (push ignored)');
	}
};
