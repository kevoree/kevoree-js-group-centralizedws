var PullMessage = require('./PullMessage');
var PushMessage = require('./PushMessage');
var PushKevSMessage = require('./PushKevSMessage');
var RegisterMessage = require('./RegisterMessage');

/**
 * Parses message to a valid PushMessage or PullMessage type
 * @param msg
 * @returns {PushMessage|PullMessage|RegisterMessage}
 */
function parse(msg) {
  if (typeof msg === 'object') {
    // data is a MessageEvent not a raw string
    msg = msg.data;
  }

  var model;
  if (msg.startsWith(RegisterMessage.TYPE)) {
		// register/nodeName/modelStr
    var payload = msg.substring(RegisterMessage.TYPE.length + 1);
		var index = 0;
		var ch = payload.charAt(index);
		while (index < payload.length && ch !== '/') {
			index++;
			ch = payload[index];
		}
		var nodeName = payload.substring(0, index);
		return new RegisterMessage(nodeName, payload.substring(index + 1));
  }

  if (msg.startsWith(PushMessage.TYPE + '/')) {
		// push/modelStr
    model = msg.substring(PushMessage.TYPE.length + 1);
    return new PushMessage(model);
  }

  if (msg.startsWith(PushKevSMessage.TYPE + '/')) {
		// push/kevsStr
    model = msg.substring(PushKevSMessage.TYPE.length + 1);
    return new PushKevSMessage(model);
  }

  if (msg.startsWith(PullMessage.TYPE)) {
		// pull
    return new PullMessage();
  }

  return null;
}

module.exports = {
	parse: parse
};
