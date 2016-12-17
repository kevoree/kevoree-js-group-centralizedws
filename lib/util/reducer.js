var kevoree = require('kevoree-library');

/**
 * Reduces a clone of the given model to only the given "master"
 * and "client" node names
 *
 * @param {Object} model    a Kevoree model
 * @param {String} master   a Kevoree node name (eg. master node)
 * @param {String} client   a Kevoree node name (eg. client node)
 */
function reducer(model, master, client) {
	var factory = new kevoree.factory.DefaultKevoreeFactory();
	var cloner = factory.createModelCloner();

	var clonedModel = cloner.clone(model);

	clonedModel.nodes.array.forEach(function (node) {
		if (node.name !== master && node.name !== client) {
			node.delete();
		}
	});

	return clonedModel;
}

module.exports = reducer;
