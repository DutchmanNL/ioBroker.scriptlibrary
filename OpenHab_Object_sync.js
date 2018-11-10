// @ts-check

//******************************************
//*****************Dutchman*****************
//*** interact openhab items wih iObroker***
//*******************V 0.9.2**************** 
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
    var connection_state = obj.state.val;
    console.log("OpenHab_Sync : Change on OpenHab connection");
    console.log("#####################################################################################################")                
    console.log("#####################################################################################################")
    console.log("#####################################################################################################")            
    log("OpenHab connection : " + connected + " ||| Syncronizing items selected in function : " + devices);
    console.log("#####################################################################################################")                
    console.log("#####################################################################################################")
    console.log("#####################################################################################################")


    var lockstate_timer = setTimeout(function () {
    //Store connection state in variable preventing triggers to process data 
    connected = connection_state;
    syncronizing = true;

	        //Seperate values in variable "device" to seperate devices
            const str = device + ' ';
            var str_array = str.split(',');
            for (let i = 0; i < str_array.length; i++) {
                var target = str_array.length - 1;
    
                str_array[i] = str_array[i].replace(/^\s*/, "").replace(/\s*$/, "");
    
    //            try{
    
                //retrieve device name for all found devices, replace unsupportet characters 
                const objid = str_array[i];
                const objvalue = getState(str_array[i]).val;
                console.debug("Device " + objid + " Found in GoogleHome function");
                let objname = objid;
    
                lockstate[objid] = false;
                console.log("Verify value in object array, current state of " + objid + " = " + lockstate[objid] );
    
                //Replace unsupported characters for OpenHab
                objname = objname.split('.').join("__");
                objname = objname.split('-').join("___");
                objname = objname.split('#').join("____");
                
                console.log("Device name " + objid + " translated to " + objname);
                console.log("Value of " + objid + " written to openhab.0.items." + objname + "  || with value " + getState(objid).val);
    
                // Write current value of origin to OpenHab
                setState("openhab.0.items." + objname, getState(objid).val);
                
    
    //            }   catch(e){
                    
    //                console.warn("No OpenHab item found for " + objid + " ||| " + objname + " Should be created !!!");
                    
    //            }
    
                if (getState("openhab.0.info.connection").val === true && i == target) {
    
                    //Reset variables preventing triggers to process data 
                    connected = true;
                    syncronizing = false;
    
                    console.log("#####################################################################################################")                
                    console.log("#####################################################################################################")
                    console.log("#####################################################################################################")
                    console.log("Syncronisation finished, " + i + " devices and their current states syncronised to OpenHab");
                    console.log("################OpenHab connection = " + connected + " , ready for processing data###################")                
                    console.log("#####################################################################################################")
                    console.log("#####################################################################################################")
    
                    console.log("OpenHab connection = " + connected + " , ready for processing data");
                
                    
                } else if (getState("openhab.0.info.connection").val === false && i == target){
    
                    //Reset variables preventing triggers to process data 
                    connected = false;
                    syncronizing = false;
    
    
                    console.log("#####################################################################################################")                
                    console.log("#####################################################################################################")
                    console.log("#####################################################################################################")
                    console.log("Syncronisation finished, " + i + " devices and their current states syncronised to OpenHab");
                    console.log("#####################################################################################################")                
                    console.log("#####################################################################################################")
                    console.log("#####################################################################################################")
    
    
                    console.warn("OpenHab connection = " + connected + " , values will not be syncronised !!!");
    
                } else if (i == "1"){
             
                    log("Total amount of devices found " + target);
             
            }
    
        }
	}, 10000);    
        return connected, lockstate;
});


on({id: "javascript.0.test_1", change: "ne"}, function (obj) {
    console.log("shelly.0.SHSW-1#058A41#1.Relay0.Switch  =  " + lockstate["shelly.0.SHSW-1#058A41#1.Relay0.Switch"]);
    console.log("shelly.0.SHSW-1#5B34B9#1.Relay0.Switch  =  " + lockstate["shelly.0.SHSW-1#5B34B9#1.Relay0.Switch"]);
    console.log("shelly.0.SHSW-1#327C1A#1  =  " + lockstate["shelly.0.SHSW-1#5B34B9#1.Relay0.Switch"]);    
    
//    console.log(objid + " = " + lockstate[objid]);
//    console.log(objid + " = " + lockstate[objid]);
//    console.log(objid + " = " + lockstate[objid]);    
    
    
});




//Trigger on value changes in origin devices based on enum name
on({ id: device, change: 'any', ack: true }, function (obj) {
    var objname = obj.id;
    var objvalue = obj.state.val;

    // Test if this state change needs to be synced
    if (!isSyncNecessary(obj.id, obj.state.val)) return;


    if (connected === true && syncronizing === false) {

        // Lock oject state for additonal changes
        lockstate[objname] = true;
        
        // to-do : add timer to reset lockstate

        //Replace unsupported characters for OpenHab
        objname = objname.split('.').join("__");
        objname = objname.split('-').join("___");
        objname = objname.split('#').join("____");
        // ^ you do this multiple times throughout the code, so this should probably be a function

        console.log("Value of origin changed, syncronizing to OpenHab : " + objname + "  || with value " + objvalue);
        const openhabID = "openhab.0.items." + objname;
        rememberExpectedStateChange(openhabID, objvalue);
        setState(openhabID, objvalue);

        // ######################################################################################
        // ############# Migging Logic to show devices which are missing in OpenHab #############
        // ######################################################################################            

    } else if (connected === false) {

        // Log warning OpenHab connection not active
        console.error("OpenHab adapter not connected, ignore syncronisation of value change to original device");

    }

});


/*
// Trigger on value changes within OpenHab item tree and syncronise value to origin if current is different
on({ id: /^openhab.0.items\./, change: "any", ack: true }, function (obj) {
    // ^ we should probably ignore ack=false changes
    var objname = obj.native.name;
    var objvalue = obj.state.val;

    // Test if this state change needs to be synced
    if (!isSyncNecessary(obj.id, obj.state.val)) return;

    // Only run device syncronisation when OpenHab connection is active
    if (connected === true && syncronizing === false) {

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
        if (objvalue != null) {
            // You probably wanted to test if objvalue != null (single =) because that tests against NULL and UNDEFINED

            log("Value of item in OpenHab change, syncronizing to device " + objname + " with value : " + objvalue);
            rememberExpectedStateChange(objname, objvalue);
            setState(objname, objvalue);

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

*/

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
