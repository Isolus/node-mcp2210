var MCP2210 = require('../MCP2210');
var mcp2210 = MCP2210.MCP2210;

MCP2210.list(function(devices) {
	console.dir(devices);
});
var dev = new mcp2210();

dev.getChipSettings(true, function(err, data) {

	console.log("getChipSettings: ", err);

	data.GP[0].PinDesignation = MCP2210.GP_PIN_DESIGNATION_CS;
	data.GP[0].GPIODirection = MCP2210.GPIO_DIRECTION_OUTPUT;
	data.GP[0].GPIOOutput = 1;

	dev.setChipSettings(data, true, function(err, data) {
		console.log("setChipSettings: ", err);
	});

});
