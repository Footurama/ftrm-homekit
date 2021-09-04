const hap = require('hap-nodejs');
const crypto = require('crypto');

// Helper for gathering further characteristic info
const getCharacteristicInfo = (c) => ({
	name: c.constructor.name,
	r: c.props.perms.includes(hap.Perms.PAIRED_READ),
	w: c.props.perms.includes(hap.Perms.PAIRED_WRITE)
});

class Accessory {
	constructor (service) {
		this.Service = hap.Service[service];
	}

	check (opts) {
		if (opts.displayName === undefined) throw new Error(`Option displayName is mandatory`);

		// Create new service
		this.service = new this.Service();

		const inputNames = opts.input.map((i) => i.name);
		const outputNames = opts.output.map((i) => i.name);
		this.service.characteristics.forEach((c) => {
			const {name, r, w} = getCharacteristicInfo(c);

			// Check if Characteristics has corresponding input or output
			if (w) {
				if (!outputNames.includes(name)) {
					throw new Error(`Output ${name} is mandatory`);
				}
			} else if (r) {
				if (!inputNames.includes(name)) {
					throw new Error(`Input ${name} is mandatory`);
				}
			}
		});

		// Generate MAC and port using the given information
		const hash = crypto.createHash('md5');
		hash.update(opts.displayName);
		opts.input.map(({name, pipe}) => `${name}=${pipe}`).sort().forEach((item) => hash.update(item));
		opts.output.map(({name, pipe}) => `${name}=${pipe}`).sort().forEach((item) => hash.update(item));
		const digest = hash.digest();

		if (opts.mac === undefined) {
			const macRaw = digest.slice(0, 6);

			// mask out group and local address bits
			macRaw[0] &= 0xfc;

			// Convert buffer to MAC address
			const macStr = macRaw.toString('hex');
			opts.mac = [0, 2, 4, 6, 8, 10].map((i) => macStr.slice(i, i + 2)).join(':');
		}

		if (opts.port === undefined) {
			const portRaw = digest.slice(6, 8);

			// Make sure to use only ports in the upper half
			// of the port range
			portRaw[0] |= 0x80;
			opts.port = portRaw.readUInt16BE(0);
		}
	}

	factory (opts, input, output, bus) {
		// Generate a new accessory
		const accessory = new hap.Accessory(opts.displayName, hap.uuid.generate(opts.mac));
		accessory.getService(hap.Service.AccessoryInformation)
			.setCharacteristic(hap.Characteristic.Manufacturer, opts.manufacturer || 'Footurama')
			.setCharacteristic(hap.Characteristic.Model, opts.model || 'ftrm-homekit')
			.setCharacteristic(hap.Characteristic.SerialNumber, opts.serialNumber || '42');

		// Add service
		accessory.addService(this.service);

		// Wire up characteristics
		const inputNames = opts.input.map((i) => i.name);
		const outputNames = opts.output.map((i) => i.name);
		const characteristicNames = [
			...this.service.characteristics.map((c) => getCharacteristicInfo(c).name),
			...this.service.optionalCharacteristics.map((c) => getCharacteristicInfo(c).name)
		];
		characteristicNames.forEach((name) => {
			// Ignore un-wired characteristics
			if (!inputNames.includes(name) && !outputNames.includes(name)) return;

			// Get characteristic from service
			// Optional characteristics will be added on-the-go
			const c = this.service.getCharacteristic(hap.Characteristic[name]);
			const {r, w} = getCharacteristicInfo(c);
			if (w) {
				if (!outputNames.includes(name)) return;

				// React on changes of writable characteristics
				c.on('set', (value, cb) => {
					output[name].value = value;
					cb(null);
				});

				// Update characteristic if input changed
				if (r && inputNames.includes(name)) {
					input[name].on('update', (value) => c.updateValue(value));
				}
			} else if (r) {
				if (!inputNames.includes(name)) return;

				// Update characteristic if input changed
				input[name].on('update', (value) => c.updateValue(value));
			}
		});

		// Publish accessory
		accessory.publish({
			port: opts.port,
			username: opts.mac,
			pincode: opts.pin || '123-45-678'
		});

		// Return unpublish Function
		return () => new Promise((resolve) => {
			accessory.unpublish();
			setTimeout(resolve, 500);
		});
	}
}

module.exports = Accessory;
