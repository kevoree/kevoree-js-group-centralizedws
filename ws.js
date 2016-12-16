var RWebSocket = require('./lib/client/RWebSocket');

var client = new RWebSocket('ws://kevtop.irisa.fr:9000');

client.onopen = function () {
	console.log('on open');
};

client.onmessage = function (event) {
	console.log('on message', event.data);
};

client.onclose = function () {
	console.log('on close');
};

client.onerror = function () {
	console.log('on error');
};

client.connect();
