const hap = require('hap-nodejs');
const Mac = require('./mac.js');
const Port = require('./port.js');

const macHelper = new Mac();
const portHelper = new Port(51827);

// Helper for gathering further characteristic info
const getCharacteristicInfo = (c) => ({
	name: c.displayName,
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
	}

	factory (opts, input, output, bus) {
		const mac = macHelper.getMac();
		const port = portHelper.getPort();

		// Generate a new accessory
		const accessory = new hap.Accessory(opts.displayName, hap.uuid.generate(mac));
		accessory.getService(hap.Service.AccessoryInformation)
			.setCharacteristic(hap.Characteristic.Manufacturer, opts.manufacturer || 'Footurama')
			.setCharacteristic(hap.Characteristic.Model, opts.model || 'ftrm-homekit')
			.setCharacteristic(hap.Characteristic.SerialNumber, opts.serialNumber || '42');

		// Add service
		accessory.addService(this.service);

		// Wire up characteristics
		const inputNames = opts.input.map((i) => i.name);
		const outputNames = opts.output.map((i) => i.name);
		const wireup = (c) => {
			const {name, r, w} = getCharacteristicInfo(c);
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
		};
		this.service.characteristics.forEach(wireup);
		this.service.optionalCharacteristics.forEach(wireup);

		// Publish accessory
		accessory.publish({
			port: port,
			username: mac,
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
