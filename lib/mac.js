const os = require('os');

class Mac {
	constructor (mac) {
		if (mac === undefined) {
			const ifaces = os.networkInterfaces();
			mac = Object.keys(ifaces).reduce((mac, name) => {
				if (mac) return mac;
				if (ifaces[name][0].mac && !ifaces[name][0].internal) return ifaces[name][0].mac;
			}, undefined);
		}

		this.mac = mac.split(':');
		this.cnt = 0;
	}

	getMac () {
		this.mac[0] = this.cnt.toString(16);
		if (this.mac[0].length < 2) this.mac[0] = '0' + this.mac[0];
		this.cnt++;
		return this.mac.join(':');
	}
}

module.exports = Mac;
