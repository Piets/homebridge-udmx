# homebridge-udmx
Anyma uDMX plugin for homebridge to control RGB and W LEDs via DMX protocol.

## Installation

1. Install homebridge using: `npm install -g homebridge`
2. Install homebridge-udmx using: `npm install -g homebridge-udmx`
3. Update your configuration file.  See below for examples.


## Example Configuration


    {
        "accessory": "uDMX",
        "name": "RGB Strip",

        "channel": 1,
        "rgb": true
    },
    {
        "accessory": "uDMX",
        "name": "White Strip",

        "channel": 4,
        "rgb": false
    }
