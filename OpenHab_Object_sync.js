// @ts-check

//******************************************
//*****************Dutchman*****************
//*** interact openhab items wih iObroker***
//*******************V 0.9.4**************** 
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
    console.log("#####################################################################################################");                
    console.log("#####################################################################################################");
    console.log("#####################################################################################################");           
    log("OpenHab connection : " + connected + " ||| Syncronizing items selected in function : " + devices);
    console.log("#####################################################################################################");                
    console.log("#####################################################################################################");
    console.log("#####################################################################################################");


//    var lockstate_timer = setTimeout(function () {
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
    
                //Replace unsupported characters for OpenHab
                objname = objname.split('.').join("__");
                objname = objname.split('-').join("___");
                objname = objname.split('#').join("____");
                
                console.log("Device name " + objid + " translated to " + objname);
                console.log("Value of " + objid + " written to openhab.0.items." + objname + "  || with value " + getState(objid).val);
    
                // Write current value of origin to OpenHab
                
                try{
                    
                    setState("openhab.0.items." + objname, getState(objid).val);
                    
                    
                } catch(e){
                    
                    console.error("No OpenHab item found for " + objid);
                    console.error("Create device + " + " in Openhab or remove from GoogleHome function");
                    
                }
                
    
    //            }   catch(e){
                    
    //                console.warn("No OpenHab item found for " + objid + " ||| " + objname + " Should be created !!!");
                    
    //            }
    
                if (getState("openhab.0.info.connection").val === true && i == target) {
    
                    //Reset variables preventing triggers to process data 
                    connected = true;
                    syncronizing = false;
    
                    console.log("#####################################################################################################");                
                    console.log("#####################################################################################################");
                    console.log("#####################################################################################################");
                    console.log("Syncronisation finished, " + i + " devices and their current states syncronised to OpenHab");
                    console.log("################OpenHab connection = " + connected + " , ready for processing data###################");                
                    console.log("#####################################################################################################");
                    console.log("#####################################################################################################");
    
                    console.log("OpenHab connection = " + connected + " , ready for processing data");
                
                    
                } else if (getState("openhab.0.info.connection").val === false && i == target){
    
                    //Reset variables preventing triggers to process data 
                    connected = false;
                    syncronizing = false;
    
    
                    console.log("#####################################################################################################");                
                    console.log("#####################################################################################################");
                    console.log("#####################################################################################################");
                    console.log("Syncronisation finished, " + i + " devices and their current states syncronised to OpenHab");
                    console.log("#####################################################################################################");                
                    console.log("#####################################################################################################");
                    console.log("#####################################################################################################");
    
    
                    console.warn("OpenHab connection = " + connected + " , values will not be syncronised !!!");
    
                } else if (i == "1"){
             
                    log("Total amount of devices found " + target);
             
            }
    
        }
//	}, 10000);    
        return connected, syncronizing;
});

//Trigger on value changes in origin devices based on enum name
on({ id: device, change: 'ne'}, function (obj) {
    var objname = obj.id;
    var objvalue = obj.state.val;
    
    // retrieve data off last change of previous value and calculate difference with current time
    // We do this to prevent multiple status changes within a given time-frame (5 seconds) to prevent loops in code
    var diff_time = (new Date().getTime()) - (obj.oldState ? obj.oldState.lc : "");

    console.log("Device trigger " + objname + " with value " + objvalue + " and previous change time diff  = " + diff_time);

    if (connected === true && syncronizing === false && diff_time > 5000) {

        //Replace unsupported characters for OpenHab
        objname = objname.split('.').join("__");
        objname = objname.split('-').join("___");
        objname = objname.split('#').join("____");
        // ^ you do this multiple times throughout the code, so this should probably be a function

        console.log("Value of origin changed, syncronizing to OpenHab : " + objname + "  || with value " + objvalue);
        const openhabID = "openhab.0.items." + objname;
        
        
        // tried error logging if device does not exist, not working other logic needed :/
            setState(openhabID, objvalue);

        // ######################################################################################
        // ############# Migging Logic to show devices which are missing in OpenHab #############
        // ######################################################################################            


    } else if (connected === false) {

        // Log warning OpenHab connection not active
        console.error("OpenHab adapter not connected, ignore syncronisation of value change from origin to OpenHab");

    } else if (diff_time < 5000) {
        
        // write error to console if previous change time is < 5 seconds
        console.error("Previous change of device " + objname + "less than 5 seconds ago, ignoring value change");
        
    }

});


// Trigger on value changes within OpenHab item tree and syncronise value to origin if current is different
on({ id: /^openhab.0.items\./, change: "any"}, function (obj) {
    // ^ we should probably ignore ack=false changes
    var objname = obj.native.name;
    var objvalue = obj.state.val;
    // retrieve data off last change of previous value and calculate difference with current time
    // We do this to prevent multiple status changes within a given time-frame (5 seconds) to prevent loops in code
    var diff_time = (new Date().getTime()) - (obj.oldState ? obj.oldState.lc : "");

    // Only run device syncronisation when OpenHab connection is active AND last change on value of item is > 5 seconds
    // Only change value to origin object when current state is different from source and target
    if (connected === true && syncronizing === false && diff_time > 5000 && objvalue !== getState(objname).val && objvalue != null) {

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

        console.log("Value of item in OpenHab change, syncronizing to device " + objname + " with value : " + objvalue);
        setState(objname, objvalue);

    } else if (diff_time < 5000){

        // write error to console if previous change time is < 5 seconds
        console.error("Previous change of device " + objname + "less than 5 seconds ago, ignoring value change");

    } else if (connected === false) {
        // I guess you meant OR, not AND
        // since this message should be printed when either not connected or not synchronizing

        // Log warning OpenHab connection not active
        console.error("OpenHab adapter not connected, ignore syncronisation of from OpenHab to Origin");
        
    }

});


// Replacement function to items where reguar replace with split fails 
function replaceStr(str, find, replace) {
    for (var i = 0; i < find.length; i++) {
        str = str.replace(new RegExp(find[i], 'gi'), replace[i]);
    }
    return str;
}
