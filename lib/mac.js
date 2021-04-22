const os = require('os');

class Mac {
	constructor (mac) {
		if (mac === undefined) {
			const ifaces = os.networkInterfaces();
			mac = Object.entries(ifaces).filter(([key, iface]) => !iface[0].internal).sort((a, b) => {
				if (a[0] > b[0]) return 1;
				if (a[0] < b[0]) return -1;
				return 0;
			}).find(([key, iface]) => iface[0].mac)[1][0].mac;
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
