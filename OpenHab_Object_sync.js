// @ts-check

//******************************************
//*****************Dutchman*****************
//*** interact openhab items wih iObroker***
//*******************V 0.8.9**************** 
//******************************************
//******************************************

// Declare function name which includes all states of devicesa to be acessible by GoogleHome
var devices = "GoogleHome";

// ################################################################
// ################################################################
// ############## Don't change anything below here ! ##############
// ################################################################
// ################################################################

var connected;
var syncronizing = false;
var device, timeout;
var lockstate = {};

/** 
 * @type {Map<string, any>}
 * A map of all expected state changes to prevent infinite loops.
 * Maps each controlled state to its expected value
 */
const expectedStateChanges = new Map();
// Any deviation from the expected value larger than this value
// will be synced anyways
const tolerance = 1.0;

// Read all enums related to enum.functions
/** @type {any[]} */
const functions = getEnums('functions');

// Loop on all values and store members of value "device" to variable
for (const func of functions) {
    if (func.name === devices) {
        device = func.members;
        console.debug(device);
    }
}

// Set status to current state of OpenHab connection
if (getState("openhab.0.info.connection").val === true) {

    connected = true;

} else {

    connected = false;
}

log("GoogleHome Script started || OpenHab connection = " + connected);

// Trigger on connection change, snycronise current values to OpenHab datapoints
on({ id: "openhab.0.info.connection", change: "ne" }, function (obj) {
    log("GoogleHome : Change on OpenHab connection ");

    //Set connection status to false to prevent incorrect state syncronisation
    connected = false;
    syncronizing = true;
    log("OpenHab connection = " + connected + "Syncronizing current values to openhab");

    //Clear possible running timeout
    (function () { if (timeout) { clearTimeout(timeout); timeout = null; } })();
    // Any reason you're wrapping that in a function?
    // if (timeout) { clearTimeout(timeout); timeout = null; } should do just fine

    // Start timer of 10 seconde to ensure all objects are syncronised from iobroker
    timeout = setTimeout(function () {

        // This value is never read. Why do you need it?
//        var objvalue = obj.state.val;
        // Set status to valse to prevent changes from OpenHab items to Original devices during initial syncronisation


        //Seperate values in variable "device" to seperate devices
        const str = device + ' ';
        var str_array = str.split(',');
        for (let i = 0; i < str_array.length; i++) {
            var target = str_array.length - 1;
            log("Total amount of devices found " + target);

            str_array[i] = str_array[i].replace(/^\s*/, "").replace(/\s*$/, "");

            //        try{

            //retrieve device name for all found devices, replace unsupportet characters 
            // This line is basically
            // const objid = getObject(str_array[i])._id;
            // identical to
            const objid = str_array[i];
            const objvalue = getState(str_array[i]).val;
            console.debug("Device " + objid + " Found in GoogleHome function");
            // Why?
            let objname = objid;
            
            //Replace unsupported characters for OpenHab
            objname = objname.split('.').join("__");
            objname = objname.split('-').join("___");
            objname = objname.split('#').join("____");
            console.debug("Device name translated to " + objname);

            log("Value of " + objid + " written to openhab.0.items." + objname + "  || with value " + getState(objid).val);
            setState("openhab.0.items." + objname, getState(objid).val);

            //        }   catch(e){}

            log("Syncronisation finished");

            if (getState("openhab.0.info.connection").val === true && i == target) {

                connected = true;
                syncronizing = false;

                log("OpenHab connection = " + connected + " , ready for processing data");
            }

        }

        //Timer for connection wait, should be removed later as soon as script provides status correclty wehen sync is finished
    }, 10000);

    return connected
});

/**
 * Tests if a state change needs to be synced
 * @param {string} objID The ID of the state to be checked
 * @param {any} objVal The value of the state to be checked
 */
function isSyncNecessary(objID, objVal) {
    // Check if we expected this state change to prevent infinite loops
    if (expectedStateChanges.has(objID)) {
        // We expected this change - don't sync it unless its value has
        // drastically changed for some reason
        const expectedValue = expectedStateChanges.get(objID);
        expectedStateChanges.delete(objID);

        // Only compare numbers with tolerance
        if (typeof expectedValue === "number" && Math.abs(expectedValue - objVal) < tolerance) {
            // This change is within the tolerance, ignore it
            return false;
        } else if (typeof expectedValue !== "number" && expectedValue === objVal) {
            // Any non-number values should only be ignored if they didn't change
            return false;
        }
    }
    return true;
}

/**
 * Remembers the expected value for a state change
 * @param {string} objID The ID of the state
 * @param {any} expectedValue The expected value for the state
 */
function rememberExpectedStateChange(objID, expectedValue) {
    expectedStateChanges.set(objID, expectedValue);
}

//Trigger on value changes in origin devices based on enum name
on({ id: device, change: 'any', ack: true }, function (obj) {
    // ^ we should probably ignore ack=false changes
    var objname = obj.id;
    var objid = obj.id;
    var objvalue = obj.state.val;


    // Test if this state change needs to be synced
    if (!isSyncNecessary(obj.id, obj.state.val)) return;


    if (connected === true && syncronizing === false && lockstate[objid] !== true) {

        //Replace unsupported characters for OpenHab
        objname = objname.split('.').join("__");
        objname = objname.split('-').join("___");
        objname = objname.split('#').join("____");
        // ^ you do this multiple times throughout the code, so this should probably be a function
        log("Value of origin changed, syncronizing to OpenHab : " + objname + "  || with value " + objvalue);
        const openhabID = "openhab.0.items." + objname;
        rememberExpectedStateChange(openhabID, objvalue);
        setState(openhabID, objvalue);

        // test object usage, write HM-Devivces
        bounce_locker(openhabID);
        bounce_locker(obj.id);
//        lockstate[openhabID] = true;
//        lockstate[objid] = true;

        // ######################################################################################
        // ############# Migging Logic to show devices which are missing in OpenHab #############
        // ######################################################################################            

    } else if (connected === false || syncronizing === false) {
        // I guess you meant OR, not AND
        // since this message should be printed when either not connected or not synchronizing

        // Log warning OpenHab connection not active
        console.warn("OpenHab adapter not connected, ignore syncronisation of value change to original device");

    }

});



// Trigger on value changes within OpenHab item tree and syncronise value to origin if current is different
on({ id: /^openhab.0.items\./, change: "any", ack: true }, function (obj) {
    // ^ we should probably ignore ack=false changes
    var objid = obj.id
    var objname = obj.native.name;
    var objvalue = obj.state.val;

    // test object usage, write HM-Devivces
    bounce_locker(obj.id);

    // Test if this state change needs to be synced
    if (!isSyncNecessary(obj.id, obj.state.val)) return;

    // Only run device syncronisation when OpenHab connection is active
    if (connected === true && syncronizing === false && objid !== true) {

        // Replacce OpenHab character to original state name
        var find = ["____"];
        var replace = ['#'];
        objname = replaceStr(objname, find, replace);

        find = ["___"];
        replace = ['-'];
        objname = replaceStr(objname, find, replace);

        find = ["__"];
        replace = ['.'];
        objname = replaceStr(objname, find, replace);

        // Only change value to origin object when current state is different from source and target
        if (objvalue !== null && lockstate[objid] !== true && objvalue !== getState(objname).val) {
            // You probably wanted to test if objvalue != null (single =) because that tests against NULL and UNDEFINED

            log("Value of item in OpenHab change, syncronizing to device " + objname + " with value : " + objvalue);
            rememberExpectedStateChange(objname, objvalue)
            setState(objname, objvalue);
            
            // test object usage, write HM-Devivces
            bounce_locker(objname);
            bounce_locker(obj.id);

            // Syncronise state of origin device with OpenHab item in case of empty value (should not happen)
        } else {
            var objname_source = obj.native.name;
            const openhabID = "openhab.0.items." + objname_source;
            const expectedValue = getState(objname).val;
            rememberExpectedStateChange(openhabID, expectedValue);
            setState(openhabID, expectedValue);

        }

    } else if (connected === false || syncronizing === false) {
        // I guess you meant OR, not AND
        // since this message should be printed when either not connected or not synchronizing

        // Log warning OpenHab connection not active
        console.warn("OpenHab adapter not connected, ignore syncronisation of value change to original device");

    }
    
});

// Replacement function to items where reguar replace with split fails 
function replaceStr(str, find, replace) {
    for (var i = 0; i < find.length; i++) {
        str = str.replace(new RegExp(find[i], 'gi'), replace[i]);
    }
    return str;
}

// Lockstate to prevent bouncing values
function bounce_locker(obj_id) {
    
    log("#######################    Start Lockstate funtion   #######################")
    log(obj_id + " Current lockstate = " +lockstate[obj_id]);
    lockstate[obj_id] = true;
    log(obj_id + " New lockstate = " +lockstate[obj_id]);
	
	timeout = setTimeout(function () {
    
    
    lockstate[obj_id] = false;
    log(obj_id + " After timer lockstate = " +lockstate[obj_id]);
    log("#######################    End Lockstate funtion   #######################")
    
  }, 5000);	
	
}
