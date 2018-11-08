const Accessory = require('./lib/accessory.js');

module.exports = (service) => {
	const accessory = new Accessory(service);
	accessory.check.bind(accessory);
	accessory.factory.bind(accessory);
	return accessory;
};
