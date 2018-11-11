class Port {
	constructor (port) {
		this.port = port;
	}

	getPort () {
		return this.port++;
	}
}

module.exports = Port;
