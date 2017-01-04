var kGroupMock = require('./kGroupMock');

function InstanceMock(nodeName, name) {
	this.nodeName = nodeName;
	this.name = name;
	this.currentModel = null;
	this.kInstance = kGroupMock;
}

InstanceMock.prototype = {
	getNodeName: function () {
		return this.nodeName;
	},

	getKevoreeCore: function () {
		var self = this;
		return {
			getCurrentModel: function () {
				return self.currentModel;
			},
			deploy: function () {},
			on: function () {}
		};
	},

	getModelEntity: function () {
		return this.kInstance;
	}
};

module.exports = InstanceMock;
