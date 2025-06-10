// Galaxy's Edge Beacon Emulator for Flipper Zero
// --------------------------------------------------------
// Original script and credit for payload data forked from : https://github.com/TitaNets/SWGE-Flipper-Zero-Beacons
// --------------------------------------------------------
// This application allows the emulation of beacons emitted by the droids from Droid Depot, 
// including any of their personality chips and those located in the Galaxy's Edge theme park. 
// The application was designed for Flipper Zero devices capable of running JavaScript code and 
// supporting the loading of the blebeacon module. The application was successfully tested with 
// the Momentum firmware.
//
// The script must be uploaded to the apps\Scripts folder. 
// To execute it, navigate from the Flipper Zero's screen to Apps and then to the Scripts option.

let eventLoop = require("event_loop");
let gui = require("gui");
let submenuView = require("gui/submenu");
let dialogView = require("gui/dialog");

let blebeacon = require("blebeacon");
let notify = require("notification");

let commonPrefix = [
	0x09, 0xFF,	// Payload Size
	0x83, 0x01	// Company ID
];

print("Initializing beacons...");
// Show a loading message while creating variables

function extractNames(array) {
	let names = [];
	for (let i = 0; i < array.length; i++) {
		let obj = array[i];
		if (obj && obj.name !== undefined) {
			names.push(obj.name);
		}
	}
	return names;
}

function clearScreen() {
    // Print several new lines to effectively "clear" the console
    for (let i = 0; i < 20; i++) {
        print("\n");
    }
}
// Function to create the full payload array from a prefix and suffix
function createPayload(prefix, suffix) {
	let ix = 0;
	notify.blink("blue", "short");
	
    // Create a Uint8Array with the total length of commonPrefix and suffix
    let combinedArray = Uint8Array(commonPrefix.length + prefix.length + suffix.length);

    // Fill the combinedArray with the elements from commonPrefix
    for (let i = 0; i < commonPrefix.length; i++) {
        combinedArray[ix] = commonPrefix[i]; ix++;
    }
	
	// Fill the combinedArray with the elements from prefix
    for (let i = 0; i < prefix.length; i++) {
        combinedArray[ix] = prefix[i]; ix++;
    }

    // Fill the combinedArray with the elements from suffix
    for (let i = 0; i < suffix.length; i++) {
        combinedArray[ix] = suffix[i]; ix++;
    }

    return combinedArray;
}

// Function to convert an array of numbers to a hex string
function uint8ArrayToHexString(array, ixStart) {
    let hexString = '';
	if(ixStart === undefined) ixStart = 0;
	
    for (let i = ixStart; i < array.length; i++) {
        let value = array[i]; // Access the byte value using 'value'

        // Convert value to hex string
        let hex = value.toString(16);

        // Ensure the hex string is two characters long
        hex = hex.length === 1 ? '0' + hex : hex;

        // Append the hex value and a '-' character
        hexString += hex;
        if (i < array.length - 1) {
            hexString += '-';
        }
    }
	
	hexString = hexString.toUpperCase();	
    return hexString;
}

// Function to stop any active beacon
function stopBroadcast() {
    if (blebeacon.isActive()) {
        blebeacon.stop();
		notify.error();
    }
}

// Function to broadcast a beacon
function broadcastBeacon(payload) {
    let macAddress = Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00]); // Default MAC address (all zeros)
    blebeacon.setConfig(macAddress, 0x1F, 100, 300); // Set beacon configuration
    blebeacon.setData(payload); // Set the beacon data
    blebeacon.start(); // Start broadcasting
	notify.success();
}

// Define location beacons with payloads
print("  - location...");
let locationPrefix = [0x0A, 0x04];
let locationBeacons = [
    { id: 0x00, name: "Marketplace 1", payload: createPayload(locationPrefix, [0x01, 0x02, 0xA6, 0x01]) },
    { id: 0x01, name: "Marketplace 2", payload: createPayload(locationPrefix, [0x01, 0x0C, 0xA6, 0x01]) },
	{ id: 0x02, name: "Marketplace (WDW)", payload: createPayload(locationPrefix, [0x06, 0x18, 0xBA, 0x01]) },    
	{ id: 0x03, name: "Droid Depot (Behind)", payload: createPayload(locationPrefix, [0x02, 0x02, 0xA6, 0x01]) },
    { id: 0x04, name: "Droid Depot (DL)", payload: createPayload(locationPrefix, [0x03, 0x18, 0xBA, 0x01]) },    
	{ id: 0x05, name: "Resistance", payload: createPayload(locationPrefix, [0x03, 0x02, 0xA6, 0x01]) },
	{ id: 0x06, name: "First Order 1", payload: createPayload(locationPrefix, [0x07, 0x02, 0xA6, 0x01]) },
	{ id: 0x07, name: "First Order 2", payload: createPayload(locationPrefix, [0x07, 0x0C, 0xA6, 0x01]) },    
	{ id: 0x08, name: "Dok-Ondar's", payload: createPayload(locationPrefix, [0x06, 0x0C, 0xA6, 0x01]) },
    { id: 0x09, name: "Dok-Ondar's (WDW)", payload: createPayload(locationPrefix, [0x06, 0x02, 0xA6, 0x01]) },	
	{ id: 0x0A, name: "Oga's Detector", payload: createPayload(locationPrefix, [0x05, 0x02, 0xA6, 0x01]) },	
    { id: 0x0B, name: "Oga's Entrance", payload: createPayload(locationPrefix, [0x05, 0x0C, 0xA6, 0x01]) },
	{ id: 0x0C, name: "Somewhere", payload: createPayload(locationPrefix, [0x04, 0x02, 0xA6, 0x01]) }	
];

// Define droid beacons with payloads
print("  - droids...");
let droidPrefix = [0x03, 0x04, 0x44, 0x81];
let droidBeacons = [
	{ id: 0x00, name: "R2-D2", payload: createPayload(droidPrefix, [0x82, 0x01]) },
	{ id: 0x01, name: "BB-8", payload: createPayload(droidPrefix, [0x82, 0x02]) },
	{ id: 0x02, name: "C1-10P", payload: createPayload(droidPrefix, [0x8A, 0x0B]) },
	{ id: 0x03, name: "D-O", payload: createPayload(droidPrefix, [0x8A, 0x0C]) },
	{ id: 0x04, name: "BD-1", payload: createPayload(droidPrefix, [0x8A, 0x0E]) },	
	{ id: 0x04, name: "A-LT", payload: createPayload(droidPrefix, [0x82, 0x0F]) },	
	{ id: 0x05, name: "Drum Kit", payload: createPayload(droidPrefix, [0x82, 0x10]) },
];

// Define personality chip beacons with payloads
print("  - personality chips...");
let personalityChipBeacons = [
	{ id: 0x00, name: "Blue (R5-D4)", payload: createPayload(droidPrefix, [0x8A, 0x03]) },
	{ id: 0x01, name: "Gray (U9-C4)", payload: createPayload(droidPrefix, [0x82, 0x04]) },
	{ id: 0x02, name: "Red 1 (QT-KT)", payload: createPayload(droidPrefix, [0x92, 0x05]) },
	{ id: 0x03, name: "Orange (R4-P17)", payload: createPayload(droidPrefix, [0x8A, 0x06]) },
	{ id: 0x04, name: "Purple (M5-BZ)", payload: createPayload(droidPrefix, [0x82, 0x07]) },
	{ id: 0x05, name: "Black (BB-9E)", payload: createPayload(droidPrefix, [0x92, 0x08]) },
	{ id: 0x06, name: "Red 2 (CB-23)", payload: createPayload(droidPrefix, [0x82, 0x09]) },
	{ id: 0x07, name: "Yellow (CH-33P)", payload: createPayload(droidPrefix, [0x8A, 0x0A]) },
	{ id: 0x08, name: "Navy (RG-G1)", payload: createPayload(droidPrefix, [0x82, 0x0D]) },
];

// declare view instances
let views = {
    beaconTypes: submenuView.makeWith({
        header: "Choose Beacon Type",
        items: [
			"Location Beacons",
            "Droid Beacons",
            "Personality Chip Beacons",
            "Exit app",
        ],
    }),
	broadcasting: dialogView.make(),
	droidBeacons: submenuView.makeWith({
		header: "Choose Droid Beacon",
		items: extractNames(droidBeacons),
    }),
	locationBeacons: submenuView.makeWith({
		header: "Choose Location Beacon",
		items: extractNames(locationBeacons),
    }),
	personalityChipBeacons: submenuView.makeWith({
		header: "Choose Personality Chip Beacon",
		items: extractNames(personalityChipBeacons),
    }),
};

let events = [
	{ view: views.locationBeacons, beacons: locationBeacons },
	{ view: views.droidBeacons, beacons: droidBeacons },
	{ view: views.personalityChipBeacons, beacons: personalityChipBeacons },
];

print("Starting...");
notify.blink("magenta", "long");
delay(500);
clearScreen();

eventLoop.subscribe(views.beaconTypes.chosen, function (_sub, index, gui, eventLoop, views) {
    if (index === 0) {
		gui.viewDispatcher.switchTo(views.locationBeacons);
    } else if (index === 1) {
		gui.viewDispatcher.switchTo(views.droidBeacons);
    } else if (index === 2) {
		gui.viewDispatcher.switchTo(views.personalityChipBeacons);
    } else if (index === 3) {
        eventLoop.stop();
    }
}, gui, eventLoop, views);

for (let i = 0; i < events.length; i++) {
	let beaconView=events[i].view;
	let beacons=events[i].beacons;
	eventLoop.subscribe(beaconView.chosen, function (_sub, index, gui, eventLoop, views, beacons) {
		let selectedBeacon = beacons[index];
		broadcastBeacon(selectedBeacon.payload);
		views.broadcasting.set("header", "Broadcasting\n" + selectedBeacon.name);
		views.broadcasting.set("text", uint8ArrayToHexString(selectedBeacon.payload, 5) + "\nPress OK to stop.");
		views.broadcasting.set("center", "Stop");
		gui.viewDispatcher.switchTo(views.broadcasting);
	}, gui, eventLoop, views, beacons);
}
	
eventLoop.subscribe(views.broadcasting.input, function (_sub, button, gui, views) {
	if (button === "center") {
		stopBroadcast();
		gui.viewDispatcher.switchTo(views.beaconTypes);
	}
}, gui, views);


function mainMenu() {
	gui.viewDispatcher.switchTo(views.beaconTypes);
	eventLoop.run();
}

stopBroadcast();
mainMenu();