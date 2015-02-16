Node.js library for Microchip's USB-to-SPI protocol converter MCP2210
=====================================================================

## Installation

You need a working installation of [HIDAPI](http://www.signal11.us/oss/hidapi/). Then you can install node-mcp2210 with npm: `npm install node-mcp2210`.

## Example

This a complete example to change the chip and SPI transfer settings and to transfer some bytes:

```javascript
var MCP2210 = require('MCP2210'),
	mcp2210 = MCP2210.MCP2210,
	dev = new mcp2210();

var chipSettings, transferSettings;

// load the chip settings, the first parameter selects the data source (isVolatile)
dev.getChipSettings(true, function(err, data) 
{
	if (err) {
		throw "mcp error"
	}
	data.GP[0].PinDesignation = MCP2210.GP_PIN_DESIGNATION_CS;
	data.GP[0].GPIODirection = MCP2210.GPIO_DIRECTION_OUTPUT;
	data.GP[0].GPIOOutput = 1;
	chipSettings = data;
});
// set the chip settings
dev.setChipSettings(chipSettings, true, function(err, data) 
{
	if (err) {
		throw "mcp error"
	}
});

dev.getSPITransferSettings(true, function(err, data) 
{
	if (err) {
		throw "mcp error"
	}
	data.ActiveChipSelectValue = 0xfffe;
	data.IdleChipSelectValue = 0xffff;
	data.BitRate = 6000000;
	data.BytesPerSPITransfer = 3;
	data.SPIMode = 0;

	transferSettings = data;
});
dev.setSPITransferSettings(transferSettings, true, function(err, rsp) {
	if (err) {
		throw "mcp error"
	}
});

// the next SPI transfer is 4 bytes long
transferSettings.BytesPerSPITransfer = 4;
dev.setSPITransferSettings(transferSettings, true, function(err, data) {
	if (err) {
		throw "mcp error"
	}
});

dev.SPISendReceive(new Buffer([0x87, 0x6c, 0x40, 0x00]), -1, function(err, data) {
	if (err) {
		throw "mcp error"
	}
});

dev.close();
```

## Available functions

  * mcp2210()
  * mcp2210(serial)
  * mcp2210(VID, PID, serial)

  * close()
  * sendUSBCmd(buffer, callback)
  * getChipSettings(isVolatile, callback)
  * setChipSettings(data, isVolatile, callback)
  * getSPITransferSettings(isVolatile, callback)
  * setSPITransferSettings(data, isVolatile, callback)
  * getUSBKeyParameters(callback)
  * setUSBKeyParameters(data, callback)
  * getManufacturerProductName(callback)
  * setManufacturerProductName(data, callback)
  * sendAccessPassword(pwd, callback)
  * readEEPROM(addr, callback)
  * writeEEPROM(addr, val, callback)
  * requestSPIBusRelease(val, callback)
  * getChipStatus(callback)
  * cancelSPITransfer(callback)
  * SPIDataTransfer(data, length, callback)
  * SPISendReceive(data, dataLength, callback)
  * getNumOfEventsFromInterruptPin(resetCounter, callback)
  * getGPIOPinDirection(callback)
  * setGPIOPinDirection(data, callback)
  * getGPIOPinValue(callback)
  * setGPIOPinValue(data, callback)

## License

**node-mcp2210** is licensed under [MIT license](https://github.com/Isolus/node-mcp2210/blob/master/LICENSE).

## Acknowledgement

The library is inspired by the C++ Library [MCP2210-Library](https://github.com/kerrydwong/MCP2210-Library).