const os = require('os');
const hap = require('hap-nodejs');

// Helper for generating accessory MACs
const ifaces = os.networkInterfaces();
const mainMac = Object.keys(ifaces).reduce((mac, name) => {
	if (mac) return mac;
	if (ifaces[name][0].mac && ifaces[name][0].mac !== '00:00:00:00:00:00') return ifaces[name][0].mac;
}, undefined);
const macTemplate = mainMac.split(':');
let macNumber = 0;
function genMac () {
	macTemplate[0] = macNumber.toString(16);
	if (macTemplate[0].length === 1) macTemplate[0] = '0' + macTemplate[0];
	macNumber++;
	return macTemplate.join(':');
}

// Helper for obtaining port numbers
let port = 51827;
function genPort () {
	return port++;
}

// Dictonary of all characteristics
const CharacteristicNameByUUID = Object.keys(hap.Characteristic).reduce((dict, name) => {
	const UUID = hap.Characteristic[name].UUID;
	if (UUID) dict[UUID] = name;
	return dict;
}, {});

// Helper for gathering further characteristic info
const getCharacteristicInfo = (c) => ({
	name: CharacteristicNameByUUID[c.UUID],
	r: c.props.perms.includes(hap.Characteristic.Perms.READ),
	w: c.props.perms.includes(hap.Characteristic.Perms.WRITE)
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
		const mac = genMac();
		const port = genPort();

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

				// Install setter
				c.on('set', (value, cb) => {
					output[name].value = value;
					cb(null);
				});

				// Install getter
				if (r && inputNames.includes(name)) {
					// A corresponding input reports the current value
					c.on('get', (cb) => cb(null, input[name].value));
				} else if (r) {
					// Read from the output
					c.on('get', (cb) => cb(null, output[name].value));
				}
			} else if (r) {
				if (!inputNames.includes(name)) return;

				// Install getter
				c.on('get', (cb) => cb(null, input[name].value));
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
		return () => accessory.unpublish();
	}
}

// Start homekit
hap.init();

module.exports = Accessory;
