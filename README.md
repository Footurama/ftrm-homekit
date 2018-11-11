# Footurama Package: Homekit

This is glue code to [HAP-NodeJS](https://github.com/KhaosT/HAP-NodeJS).

## API

Requiring an accessory factory:
```js
require('ftrm-homekit')(serviceName)
```

The ```serviceName``` can be looked up here: https://github.com/KhaosT/HAP-NodeJS/blob/v0.4.41/lib/gen/HomeKitTypes.js.

Each service definition includes mandatory and optional characteristics. They are wired up to inputs and outputs with the same name.

Configuration:

 * ```input```: An Array of objects:
   * ```name```: The characteristic's name. This might be a read-only characteristic or a read/writable. Mandatory.
   * ```pipe```: The pipe to wire up the characteristic.
   * ```value```: Default value.
 * ```output```: An Array of objects:
   * ```name```: The characteristic's name. This must be a read/writable characteristic. Mandatory.
   * ```pipe```: The pipe to wire up the characteristic.
 * ```displayName```: The accessory's displayed name. Mandatory.
 * ```manufacturer```: The manufacturer's name.
 * ```model```: The model's name.
 * ```pin```: The paring pin. Must be in the format: ```/[0-9]{3}-[0-9]{2}-[0-9]{3}/```

## Example

```js
module.exports = [require('ftrm-homekit')('TemperatureSensor'), {
	input: [{name: 'CurrentTemperature', pipe: 'temperture'}],
	output: [],
	displayName: 'Room Temperature'
}];
```
