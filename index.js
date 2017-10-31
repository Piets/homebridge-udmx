var usb = require('usb'),
    buffer = require('buffer'),
    colorsys = require('colorsys');

var Service, Characteristic;

// These variables specify the anyma uDMX device
var vendorId = 0x16c0;
var productId = 0x5dc;

// Buffer used to store the current DMX values
var dmxBuffer = Buffer.alloc(0);

//Search for uDMX
var udmxDevice = usb.findByIds(vendorId, productId);
if (udmxDevice) {
    udmxDevice.open();
}

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-udmx", "uDMX", udmx);
};

function udmx(log, config) {
    this.log = log;
    
    this.name = config.name;

    this.channel = config.channel;
    this.rgb = config.rgb;

    this.power = 0;
    this.brightness = 100;
    this.saturation = 0;
    this.hue = 0;

    // Make sure the dmxBuffer has enough size
    var highestChannel = this.channel + 2;
    if (!this.rgb) {
        highestChannel = this.channel;
    }

    if (dmxBuffer.length < highestChannel) {
        var oldBuffer = dmxBuffer;
        dmxBuffer = Buffer.alloc(highestChannel);
        oldBuffer.copy(dmxBuffer);
        sendDMXBuffer();
    }
}

udmx.prototype = {
    getServices: function () {
        let informationService = new Service.AccessoryInformation();
        informationService
        .setCharacteristic(Characteristic.Manufacturer, "Anyma")
        .setCharacteristic(Characteristic.Model, "uDMX")
        .setCharacteristic(Characteristic.SerialNumber, "696-777-"+this.channel);

        let lightbulbService = new Service.Lightbulb(this.name);
        var bulb = this;

        lightbulbService
        .getCharacteristic(Characteristic.On)
        .on('get', function(callback) {
            callback(null, bulb.power);
        })
        .on('set', function(value, callback) {
            bulb.power = value;
            bulb.setColor();
            callback();
        });

        lightbulbService
        .addCharacteristic(Characteristic.Brightness)
        .on('get', function(callback) {
            callback(null, bulb.brightness);
        })
        .on('set', function(value, callback) {
            bulb.brightness = value;
            bulb.setColor();
            callback();
        });

        if (this.rgb) {
            lightbulbService
            .addCharacteristic(Characteristic.Hue)
            .on('get', function(callback) {
                callback(null, bulb.hue);
            })
            .on('set', function(value, callback) {
                bulb.hue = value;
                bulb.setColor();
                callback();
            });
    
            lightbulbService
            .addCharacteristic(Characteristic.Saturation)
            .on('get', function(callback) {
                callback(null, bulb.saturation);
            })
            .on('set', function(value, callback) {
                bulb.saturation = value;
                bulb.setColor();
                callback();
            });
        }

        this.informationService = informationService;
        this.lightbulbService = lightbulbService;
        return [informationService, lightbulbService];
    },

    setColor: function () {
        if (this.rgb) {
            var color = colorsys.hsv_to_rgb({
                h: this.hue,
                s: this.saturation,
                v: this.brightness
            });

            if (!this.power) {
                color.r = 0;
                color.g = 0;
                color.b = 0;
            }

            dmxBuffer.writeUInt8(color.r, this.channel - 1);
            dmxBuffer.writeUInt8(color.g, this.channel);
            dmxBuffer.writeUInt8(color.b, this.channel + 1);

        } else {
            var value = this.brightness

            if (!this.power) {
                value = 0;
            }

            dmxBuffer.writeUInt8(value, this.channel - 1);
        }

        sendDMXBuffer();
    }
};

function sendDMXBuffer() {
    if (udmxDevice) {
            udmxDevice.controlTransfer(0x40, 0x0002, dmxBuffer.length, 0, dmxBuffer, function(error) {});
    }
}
