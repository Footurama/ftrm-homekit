const mockFirstMac = '78:4f:43:92:18:bf';
const lo0 = [ {
	address: '127.0.0.1',
	netmask: '255.0.0.0',
	family: 'IPv4',
	mac: '00:00:00:00:00:00',
	internal: true
} ];
const en0 = [ {
	address: 'fe80::1424:d6d7:ca6:c882',
	netmask: 'ffff:ffff:ffff:ffff::',
	family: 'IPv6',
	mac: mockFirstMac,
	scopeid: 6,
	internal: false
} ];
const en1 = [ {
	address: 'fe80::1424:d6d7:ca6:c882',
	netmask: 'ffff:ffff:ffff:ffff::',
	family: 'IPv6',
	mac: '78:4f:43:92:18:be',
	scopeid: 6,
	internal: false
} ];
const mockNetworkInterfaces = jest.fn(() => ({lo0, en0, en1}));
jest.mock('os', () => ({ networkInterfaces: mockNetworkInterfaces }));

const Mac = require('../mac.js');

test('return macs', () => {
	const MAC = '12:34:56:78:90:ab'.split(':');
	const m = new Mac(MAC.join(':'));
	MAC[0] = '00';
	expect(m.getMac()).toEqual(MAC.join(':'));
	MAC[0] = '01';
	expect(m.getMac()).toEqual(MAC.join(':'));
	MAC[0] = '02';
	expect(m.getMac()).toEqual(MAC.join(':'));
});

test('return 10th mac', () => {
	const MAC = '12:34:56:78:90:ab'.split(':');
	const m = new Mac(MAC.join(':'));
	m.cnt = 10;
	MAC[0] = '0a';
	expect(m.getMac()).toEqual(MAC.join(':'));
});

test('return 16th mac', () => {
	const MAC = '12:34:56:78:90:ab'.split(':');
	const m = new Mac(MAC.join(':'));
	m.cnt = 16;
	MAC[0] = '10';
	expect(m.getMac()).toEqual(MAC.join(':'));
});

test('default to first local mac', () => {
	const m = new Mac();
	expect(m.mac.join(':')).toEqual(mockFirstMac);
});

test('order by iface name', () => {
	mockNetworkInterfaces.mockReturnValue({lo0, en1, en0});
	const m = new Mac();
	expect(m.mac.join(':')).toEqual(mockFirstMac);
});
