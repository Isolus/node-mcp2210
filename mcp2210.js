var MCP2210Binding = require('./MCP2210.node');

function MCP2210Factory() {

	var factory = this;

	function MCP2210(arg0, arg1, arg2) {
		if (arg0 === undefined) {
			this.MCP2210 = MCP2210Binding.MCP2210();
		}
		else if (arg1 === undefined) {
			this.MCP2210 = MCP2210Binding.MCP2210(arg1);
		}
		else {
			this.MCP2210 = MCP2210Binding.MCP2210(arg0, arg1, arg2);
		}
	}

	MCP2210.prototype.close = function() {
		this.MCP2210.close();
	}

	MCP2210.prototype.sendUSBCmd = function(buffer, callback) {
		this.MCP2210.sendUSBCmd(buffer, callback);
	}

	MCP2210.prototype.getSPITransferSettings = function(isVolatile, callback) {

		var cmd = new Buffer(factory.COMMAND_BUFFER_LENGTH);
		cmd.fill(0);

		if (isVolatile) {
			cmd[0] = factory.CMD_GET_SPI_SETTING;
		} 
		else {
			cmd[0] = factory.CMD_GET_NVRAM_PARAM;
			cmd[1] = factory.CMDSUB_SPI_POWERUP_XFER_SETTINGS;
		}

		this.sendUSBCmd(cmd, function(error, rsp) {

			if (error) {
				callback(error, undefined);
				return;
			}

			var def = {};
			def.BitRate = rsp[7] << 24 | rsp[6] << 16 | rsp[5] << 8 | rsp[4];
			def.IdleChipSelectValue = (rsp[9] & 0x1) << 8 | rsp[8];
			def.ActiveChipSelectValue = (rsp[11] & 0x1) << 8 | rsp[10];
			def.CSToDataDelay = rsp[13] << 8 | rsp[12];
			def.LastDataByteToCSDelay = rsp[15] << 8 | rsp[14];
			def.SubsequentDataByteDelay = rsp[17] << 8 | rsp [16];
			def.BytesPerSPITransfer = rsp [19] << 8 | rsp [18];
			def.SPIMode = rsp[20];

			callback(false, def);

		});

	}

	MCP2210.prototype.setSPITransferSettings = function(data, isVolatile, callback) {

		var cmd = new Buffer(factory.COMMAND_BUFFER_LENGTH);
		cmd.fill(0);

		if (isVolatile) {
			cmd[0] = factory.CMD_SET_SPI_SETTING;
		} 
		else {
			cmd[0] = factory.CMD_SET_NVRAM_PARAM;
			cmd[1] = factory.CMDSUB_SPI_POWERUP_XFER_SETTINGS;
		}

		cmd[4] = data.BitRate & 0xff;
		cmd[5] = (data.BitRate & 0xff00) >> 8;
		cmd[6] = (data.BitRate & 0xff0000) >> 16;
		cmd[7] = (data.BitRate & 0xff000000) >> 24;

		cmd[8] = data.IdleChipSelectValue & 0xff;
		cmd[9] = (data.IdleChipSelectValue & 0x100) >> 8;

		cmd[10] = data.ActiveChipSelectValue & 0xff;
		cmd[11] = (data.ActiveChipSelectValue & 0x100) >> 8;

		cmd[12] = data.CSToDataDelay & 0xff;
		cmd[13] = (data.CSToDataDelay & 0xff00) >> 8;

		cmd[14] = data.LastDataByteToCSDelay & 0xff;
		cmd[15] = (data.LastDataByteToCSDelay & 0xff00) >> 8;

		cmd[16] = data.SubsequentDataByteDelay & 0xff;
		cmd[17] = (data.SubsequentDataByteDelay & 0xff00) >> 8;

		cmd[18] = data.BytesPerSPITransfer & 0xff;
		cmd[19] = (data.BytesPerSPITransfer & 0xff00) >> 8;

		cmd[20] = data.SPIMode;

		this.sendUSBCmd(cmd, function(error, rsp) {

			if (error) {
				callback(error, undefined);
				return;
			}

			callback(false, rsp);

		});

	}

	MCP2210.prototype.getChipSettings = function(isVolatile, callback) {
		
		var cmd = new Buffer(factory.COMMAND_BUFFER_LENGTH);
		cmd.fill(0);

		if (isVolatile) {
			cmd[0] = factory.CMD_GET_GPIO_SETTING;
		} 
		else {
			cmd[0] = factory.CMD_GET_NVRAM_PARAM;
			cmd[1] = factory.CMDSUB_POWERUP_CHIP_SETTINGS;
		}

		this.sendUSBCmd(cmd, function(error, rsp) {

			if (error) {
				callback(error, undefined);
				return;
			}

			var def = {};
			def.GP = [];
			for (var i = 0; i < 8; i++) {
				def.GP[i] = {};
				def.GP[i].PinDesignation = rsp[i + 4] & 0x3;
				def.GP[i].GPIOOutput = (rsp[13] >> i) & 0x1;
				def.GP[i].GPIODirection = (rsp[15] >> i) & 0x1;
			}
			def.GP[8] = {};
			def.GP[8].PinDesignation = rsp[12] & 0x3;
			def.GP[8].GPIOOutput = rsp[14] & 0x1;
			def.GP[8].GPIODirection = rsp[16] & 0x1;

			def.RemoteWakeUpEnabled = (rsp[17] & 0x10) >> 4;
			def.DedicatedFunctionInterruptPinMode = (rsp[17] & 0xE) >> 1;
			def.SPIBusReleaseMode = rsp[17] & 0x1;
			def.NVRamChipParamAccessControl = rsp[18];

			if (def.NVRamChipParamAccessControl == factory.CHIP_SETTINGS_PROTECTED_BY_PWD) {
				for (var i = 0; i < 8; i++) {
					def.password[i] = rsp[19 + i];
				}
			}

			callback(false, def);

		});

	}

	MCP2210.prototype.setChipSettings = function(data, isVolatile, callback) {

		var cmd = new Buffer(factory.COMMAND_BUFFER_LENGTH);
		cmd.fill(0);

		if (isVolatile) {
			cmd[0] = factory.CMD_SET_GPIO_SETTING;
		} 
		else {
			cmd[0] = factory.CMD_SET_NVRAM_PARAM;
			cmd[1] = factory.CMDSUB_POWERUP_CHIP_SETTINGS;
		}

		cmd[13] = 0;
		cmd[15] = 0;

		for (var i = 0; i < 8; i++) {
			cmd[i + 4] = data.GP[i].PinDesignation;
			cmd[13] |= data.GP[i].GPIOOutput << i;
			cmd[15] |= data.GP[i].GPIODirection << i;
		}

		cmd[12] = data.GP[8].PinDesignation;
		cmd[14] = data.GP[8].GPIOOutput;
		cmd[16] = data.GP[8].GPIODirection;
		cmd[17] = data.RemoteWakeUpEnabled << 4 | data.DedicatedFunctionInterruptPinMode << 1 | data.SPIBusReleaseMode;
		cmd[18] = data.NVRamChipParamAccessControl;

		if (data.NVRamChipParamAccessControl == factory.CHIP_SETTINGS_PROTECTED_BY_PWD) {
			for (var i = 0; i < 8; i++)
				cmd[19 + i] = data.password[i];
		}

		this.sendUSBCmd(cmd, function(error, rsp) {

			if (error) {
				callback(error, undefined);
				return;
			}

			callback(false, rsp);

		});

	}

	MCP2210.prototype.getUSBKeyParameters = function(callback) {

		var cmd = new Buffer(factory.COMMAND_BUFFER_LENGTH);
		cmd.fill(0);

		cmd[0] = CMD_GET_NVRAM_PARAM;
		cmd[1] = CMDSUB_USB_KEY_PARAMETERS;

		this.sendUSBCmd(cmd, function(error, rsp) {

			if (error) {
				callback(error, undefined);
				return;
			}

			var def = {};
			def.VID = rsp[13] << 8 | rsp[12];
			def.PID = rsp[15] << 8 | rsp[14];
			def.HostPowered = (rsp[29] & 0x80) >> 7;
			def.SelfPowered = (rsp[29] & 0x40) >> 6;
			def.RemoteWakeupCapable = (rsp[29] & 0x20) >> 5;
			def.RequestedCurrentAmountFromHost = rsp[30] * 2;

			callback(false, def);

		});

	}

	MCP2210.prototype.setUSBKeyParameters = function(data, callback) {
		
		var cmd = new Buffer(factory.COMMAND_BUFFER_LENGTH);
		cmd.fill(0);

		cmd[0] = CMD_GET_NVRAM_PARAM;
		cmd[1] = CMDSUB_USB_KEY_PARAMETERS;

		cmd[4] = data.VID & 0xff;
		cmd[5] = (data.VID & 0xff00) >> 8;

		cmd[6] = data.PID & 0xff;
		cmd[7] = (data.PID & 0xff00) >> 8;

		cmd[8] = data.HostPowered << 7 | def.SelfPowered << 6;
		cmd[9] = data.RequestedCurrentAmountFromHost;

		this.sendUSBCmd(cmd, function(error, rsp) {

			if (error) {
				callback(error, undefined);
				return;
			}

			callback(false, rsp);

		});

	}

	MCP2210.prototype.getManufacturerProductName = function(callback) {

		var cmd = new Buffer(factory.COMMAND_BUFFER_LENGTH);
		cmd.fill(0);

		cmd[0] = CMD_GET_NVRAM_PARAM;
		cmd[1] = CMDSUB_USB_MANUFACTURER_NAME;

		this.sendUSBCmd(cmd, function(error, rsp) {

			if (error) {
				callback(error, undefined);
				return;
			}

			var def = {};
			def.USBStringDescriptorLength = rsp[4];
			def.USBStringDescriptorID = rsp[5];

			def.def.ManufacturerProductName = [];
			for (var i = 0; i < def.USBStringDescriptorLength; i++) {
				def.ManufacturerProductName[i] = rsp[6 + i];
			}

			callback(false, def);

		});

	}

	MCP2210.prototype.setManufacturerProductName = function(data, callback) {

		var cmd = new Buffer(factory.COMMAND_BUFFER_LENGTH);
		cmd.fill(0);

		cmd[0] = CMD_SET_NVRAM_PARAM;
		cmd[1] = CMDSUB_USB_MANUFACTURER_NAME;

		cmd[4] = data.USBStringDescriptorLength;
		cmd[5] = 0x3;

		for (var i = 0; i < data.USBStringDescriptorLength; i++) {
			cmd[6 + i] = data.ManufacturerProductName[i];
		}

		this.sendUSBCmd(cmd, function(error, rsp) {

			if (error) {
				callback(error, undefined);
				return;
			}

			callback(false, rsp);

		});

	}

	MCP2210.prototype.sendAccessPassword = function(pwd,  callback) {

		var cmd = new Buffer(factory.COMMAND_BUFFER_LENGTH);
		cmd.fill(0);
	
		cmd[0] = CMD_SEND_PASSWORD;
	
		for (var i = 0; i < pwd.length; i++) {
			cmd[4 + i] = pwd[i];
		}

		this.sendUSBCmd(cmd, function(error, rsp) {

			if (error) {
				callback(error, undefined);
				return;
			}

			callback(false, rsp);

		});

	} 

	MCP2210.prototype.readEEPROM = function(addr,  callback) {

		var cmd = new Buffer(factory.COMMAND_BUFFER_LENGTH);
		cmd.fill(0);
	
		cmd[0] = CMD_READ_EEPROM_MEM;
		cmd[1] = addr;

		this.sendUSBCmd(cmd, function(error, rsp) {

			if (error) {
				callback(error, undefined);
				return;
			}

			callback(false, rsp[3]);

		});

	}

	MCP2210.prototype.writeEEPROM = function(addr, val, callback) {

		var cmd = new Buffer(factory.COMMAND_BUFFER_LENGTH);
		cmd.fill(0);
	
		cmd[0] = CMD_WRITE_EEPROM_MEM;
		cmd[1] = addr;
		cmd[2] = val;

		this.sendUSBCmd(cmd, function(error, rsp) {

			if (error) {
				callback(error, undefined);
				return;
			}

			callback(false, rsp);

		});

	}

	MCP2210.prototype.requestSPIBusRelease = function(val, callback) {

		var cmd = new Buffer(factory.COMMAND_BUFFER_LENGTH);
		cmd.fill(0);
	
		cmd[0] = CMD_SPI_BUS_RELEASE_REQ;
		cmd[1] = val;

		this.sendUSBCmd(cmd, function(error, rsp) {

			if (error) {
				callback(error, undefined);
				return;
			}

			callback(false, rsp);

		});

	}

	MCP2210.prototype.getChipStatus = function(callback) {

		var cmd = new Buffer(factory.COMMAND_BUFFER_LENGTH);
		cmd.fill(0);
	
		cmd[0] = CMD_GET_CHIP_STATUS;

		this.sendUSBCmd(cmd, function(error, rsp) {

			if (error) {
				callback(error, undefined);
				return;
			}

			var def = {};
			def.SPIBusReleaseExtReqStat = rsp[2];
			def.SPIBusCurrentOwner = rsp[3];
			def.AttemptedPWDAccesses = rsp[4];
			def.PasswordGuessed = rsp[5];

			callback(false, def);

		});

	}

	MCP2210.prototype.cancelSPITransfer = function(callback) {

		var cmd = new Buffer(factory.COMMAND_BUFFER_LENGTH);
		cmd.fill(0);
	
		cmd[0] = CMD_SPI_CANCEL;

		this.sendUSBCmd(cmd, function(error, rsp) {

			if (error) {
				callback(error, undefined);
				return;
			}

			var def = {};
			def.SPIBusReleaseExtReqStat = rsp[2];
			def.SPIBusCurrentOwner = rsp[3];
			def.AttemptedPWDAccesses = rsp[4];
			def.PasswordGuessed = rsp[5];

			callback(false, def);

		});

	}

	MCP2210.prototype.SPIDataTransfer = function(data, length, callback) {

		var cmd = new Buffer(factory.COMMAND_BUFFER_LENGTH);
		cmd.fill(0);

		cmd[0] = factory.CMD_SPI_TRANSFER;
		cmd[1] = length;

		for (var i = 0; i < length; i++) {
			cmd[i + 4] = data[i];
		}

		this.sendUSBCmd(cmd, function(error, rsp) {

			if (error) {
				callback(error, undefined);
				return;
			}

			var def = {};
			def.NumberOfBytesReceived = rsp[2];
			def.SPIEngineStatus = rsp[3];

			def.DataReceived = [];
			for (var i = 0; i < def.NumberOfBytesReceived; i++) {
				def.DataReceived[i] = rsp[i + 4];
			}

			callback(false, def);

		});

	}
	MCP2210.prototype.SPISendReceive = function(data, dataLength, callback) {

		var self = this;

		self.SPIDataTransfer(data, data.length, function(error, rsp) {

			if (error) {
				callback(error, undefined);
				return;
			}

			var res = rsp;
			while (res.SPIEngineStatus == factory.SPI_STATUS_STARTED_NO_DATA_TO_RECEIVE 
				|| res.SPIEngineStatus == factory.SPI_STATUS_SUCCESSFUL) 
			{

				self.SPIDataTransfer(data, (dataLength > 0) ? dataLength : data.length, function(error, rsp) {

					if (error) {
						callback(error, undefined);
						return;
					}

					res = rsp;

				});

			}

			callback(false, res);

		});

	}

	MCP2210.prototype.getNumOfEventsFromInterruptPin = function(resetCounter, callback) {

		var cmd = new Buffer(factory.COMMAND_BUFFER_LENGTH);
		cmd.fill(0);

		cmd[0] = CMD_GET_NUM_EVENTS_FROM_INT_PIN;
		cmd[1] = resetCounter;

		this.sendUSBCmd(cmd, function(error, rsp) {

			if (error) {
				callback(error, undefined);
				return;
			}

			var def = {};
			def.InterruptEventCounter = rsp[5] << 8 | rsp[4];

			callback(false, def);

		});

	}

	MCP2210.prototype.getGPIOPinDirection = function(callback) {

		var cmd = new Buffer(factory.COMMAND_BUFFER_LENGTH);
		cmd.fill(0);

		cmd[0] = CMD_GET_GPIO_PIN_DIR;

		this.sendUSBCmd(cmd, function(error, rsp) {

			if (error) {
				callback(error, undefined);
				return;
			}

			var def = {};
			def.GP = [];
			for (var i = 0; i < 8; i++) {
				def.GP[i].GPIODirection = (rsp[4] >> i) & 0x1;
			}

			def.GP[8].GPIODirection = rsp[5] & 0x1;

			callback(false, def);

		});

	}

	MCP2210.prototype.setGPIOPinDirection = function(data, callback) {

		var cmd = new Buffer(factory.COMMAND_BUFFER_LENGTH);
		cmd.fill(0);

		cmd[0] = CMD_SET_GPIO_PIN_DIR;

		cmd[4] = 0;
		for (var i = 0; i < 8; i++) {
			cmd[4] |= data.GP[i].GPIODirection << i;
		}
		
		cmd[5] = data.GP[8].GPIODirection;

		this.sendUSBCmd(cmd, function(error, rsp) {

			if (error) {
				callback(error, undefined);
				return;
			}

			callback(false, rsp);

		});

	}

	MCP2210.prototype.getGPIOPinValue = function(callback) {

		var cmd = new Buffer(factory.COMMAND_BUFFER_LENGTH);
		cmd.fill(0);

		cmd[0] = CMD_GET_GPIO_PIN_VAL;

		this.sendUSBCmd(cmd, function(error, rsp) {

			if (error) {
				callback(error, undefined);
				return;
			}

			var def = {};
			def.GP = [];
			for (var i = 0; i < 8; i++) {
				def.GP[i].GPIOOutput = (rsp[4] >> i) & 0x1;
			}

			def.GP[8].GPIOOutput = rsp[5] & 0x1;

			callback(false, def);

		});

	}

	MCP2210.prototype.setGPIOPinValue = function(data, callback) {

		var cmd = new Buffer(factory.COMMAND_BUFFER_LENGTH);
		cmd.fill(0);

		cmd[0] = CMD_SET_GPIO_PIN_VAL;

		cmd[4] = 0;
		for (var i = 0; i < 8; i++) {
			cmd[4] |= data.GP[i].GPIOOutput << i;
		}

		cmd[5] = data.GP[8].GPIOOutput;

		this.sendUSBCmd(cmd, function(error, rsp) {

			if (error) {
				callback(error, undefined);
				return;
			}

			callback(false, rsp);

		});

	}

	factory.MCP2210 = MCP2210;
	factory.MCP2210Binding = MCP2210Binding;
	factory.list = MCP2210Binding.list;

	factory.GPIO_DIRECTION_OUTPUT = 0;
	factory.GPIO_DIRECTION_INPUT = 1;
	factory.GP_PIN_DESIGNATION_GPIO = 0x0;
	factory.GP_PIN_DESIGNATION_CS = 0x1;
	factory.GP_PIN_DESIGNATION_DEDICATED = 0x2;
	factory.REMOTE_WAKEUP_DISABLED = 0x0;
	factory.REMOTE_WAVEUP_ENABLED = 0x1;
	factory.COUNT_HIGH_PULSES = 0x4;
	factory.COUNT_LOW_PULSES = 0x3;
	factory.COUNT_RISING_EDGES = 0x2;
	factory.COUNT_FALLING_EDGES = 0x1;
	factory.NO_INTERRUPT_COUNTING = 0x0;
	factory.CHIP_SETTINGS_NOT_PROTECTED = 0x0;
	factory.CHIP_SETTINGS_PROTECTED_BY_PWD = 0x40;
	factory.CHIP_SETTINGS_LOCKED = 0x80;
	factory.USB_STRING_DESCRIPTOR_ID = 0x03;
	factory.CMD_UNSPOORTED = 0x0;
	factory.CMD_GET_CHIP_STATUS = 0x10;
	factory.CMD_SPI_CANCEL = 0x11;
	factory.CMD_GET_NUM_EVENTS_FROM_INT_PIN = 0x12;
	factory.CMD_GET_GPIO_SETTING = 0x20;
	factory.CMD_SET_GPIO_SETTING = 0x21;
	factory.CMD_SET_GPIO_PIN_VAL = 0x30;
	factory.CMD_GET_GPIO_PIN_VAL = 0x31;
	factory.CMD_SET_GPIO_PIN_DIR = 0x32;
	factory.CMD_GET_GPIO_PIN_DIR = 0x33;
	factory.CMD_SET_SPI_SETTING = 0x40;
	factory.CMD_GET_SPI_SETTING = 0x41;   
	factory.CMD_SPI_TRANSFER = 0x42;
	factory.CMD_READ_EEPROM_MEM = 0x50;
	factory.CMD_WRITE_EEPROM_MEM = 0x51;  
	factory.CMD_SET_NVRAM_PARAM = 0x60;
	factory.CMD_GET_NVRAM_PARAM = 0x61;
	factory.CMD_SEND_PASSWORD = 0x70;
	factory.CMD_SPI_BUS_RELEASE_REQ = 0x80;
	factory.CMDSUB_SPI_POWERUP_XFER_SETTINGS = 0x10;
	factory.CMDSUB_POWERUP_CHIP_SETTINGS = 0x20;
	factory.CMDSUB_USB_KEY_PARAMETERS = 0x30;
	factory.CMDSUB_USB_PRODUCT_NAME = 0x40;
	factory.CMDSUB_USB_MANUFACTURER_NAME = 0x50;
	factory.OPERATION_SUCCESSFUL = 0;
	factory.ERROR_UNABLE_TO_OPEN_DEVICE = -1;
	factory.ERROR_UNABLE_TO_WRITE_TO_DEVICE = -2;
	factory.ERROR_UNABLE_TO_READ_FROM_DEVICE = -3;
	factory.ERROR_INVALID_DEVICE_HANDLE = -99;
	factory.COMMAND_BUFFER_LENGTH = 64;
	factory.RESPONSE_BUFFER_LENGTH = 64;
	factory.SPI_STATUS_FINISHED_NO_DATA_TO_SEND = 0x10;
	factory.SPI_STATUS_STARTED_NO_DATA_TO_RECEIVE = 0x20;
	factory.SPI_STATUS_SUCCESSFUL = 0x30;
}

module.exports = new MCP2210Factory();