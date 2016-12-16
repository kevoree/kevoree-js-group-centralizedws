var AbstractGroup = require('kevoree-entities/lib/AbstractGroup');
var server = require('./server');
var client = require('./client');

function logger(log, tag) {
	return {
		info: function (msg) {
			log.info('CentralizedWSGroup', tag + ' ' + msg);
		},
		debug: function (msg) {
			log.debug('CentralizedWSGroup', tag + ' ' + msg);
		},
		warn: function (msg) {
			log.warn('CentralizedWSGroup', tag + ' ' + msg);
		},
		error: function (msg) {
			log.error('CentralizedWSGroup', tag + ' ' + msg);
		}
	};
}

var CentralizedWSGroup = AbstractGroup.extend({
	toString: 'CentralizedWSGroup',
	tdef_version: 1,

	dic_isMaster:  { optional: false, defaultValue: false, fragmentDependant: true },
	dic_masterNet: { optional: false, defaultValue: 'lo.ipv4', fragmentDependant: true },
	dic_port:      { optional: false, defaultValue: 9000 },

	start: function (done) {
		var isMaster = this.dictionary.getBoolean('isMaster', this.dic_isMaster.defaultValue);
		var masterNet = this.dictionary.getString('masterNet', this.dic_masterNet.defaultValue);
		var port = this.dictionary.getNumber('port', this.dic_port.defaultValue);

		if (isMaster) {
			this.server = server.create(logger(this.log, '['+this.name+'][master]'), port, this.getKevoreeCore());
			done();

		} else {
			var rMasterNet = masterNet.match(/^([a-z0-9A-Z]+)\.([a-z0-9A-Z]+)$/);
			if (rMasterNet.length > 0) {
				try {
					this.client = client.create(logger(this.log, '['+this.name+'][client]'), port, this.getModelEntity(), rMasterNet[1], rMasterNet[2]);
					done();
				} catch (err) {
					done(err);
				}

			} else {
				done(new Error('"masterNet" param must comply with ' + /^[a-z0-9A-Z]+\.[a-z0-9A-Z]+$/));
			}
		}
	},

	stop: function (done) {
		var isMaster = this.dictionary.getBoolean('isMaster', this.dic_isMaster.defaultValue);

		if (isMaster) {
			if (this.server) {
				// TODO close active connections before closing server? (check that .close() does it)
				this.server.close();
			}
		} else {
			if (this.client) {
				this.client.close();
			}
		}

		done();
	},

	update: function (done) {
		this.log.warn(this.toString(), 'TODO update() method');
		done();
	}
});

module.exports = CentralizedWSGroup;
