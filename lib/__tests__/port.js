const Port = require('../port.js');

test('return ports', () => {
	const startPort = 123;
	const p = new Port(startPort);
	expect(p.getPort()).toBe(startPort + 0);
	expect(p.getPort()).toBe(startPort + 1);
	expect(p.getPort()).toBe(startPort + 2);
});
