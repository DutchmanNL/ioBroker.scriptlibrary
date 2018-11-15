

//*********************************************
//****************** Dutchman *****************
//*** Syncronise OpenUab item with iObroker ***
//********************* V1.0 ****************** 
//*********************************************
//*********************************************

// Declare function name which includes all states of devicesa to be acessible by GoogleHome
var devices = "GoogleHome";
var logging = false

// ################################################################
// ################################################################
// ############## Don't change anything below here ! ##############
// ################################################################
// ################################################################

var connected;
var syncronizing = false;
var device, timeout;

// Read all enums related to enum.functions
const functions = getEnums('functions');

// Loop on all values and store members of value "device" to variable
for (const func of functions) {
    if (func.name === devices) {
        device = func.members;
        if (logging === true){console.log(device)}
    }
}

// Set status to current state of OpenHab connection
if (getState("openhab.0.info.connection").val === true) {

    connected = true;

} else {

    connected = false;
}

if (logging === true){log("GoogleHome Script started || OpenHab connection = " + connected)}

// Trigger on connection change, snycronise current values to OpenHab datapoints
on({ id: "openhab.0.info.connection", val: true, change: "ne" }, function (obj) {
    var connection_state = obj.state.val;
    if (logging === true){console.log("OpenHab_Sync : Change on OpenHab connection")}
    if (logging === true){console.log("#####################################################################################################")}                
    if (logging === true){console.log("#####################################################################################################")}
    if (logging === true){console.log("#####################################################################################################")}           
    console.log("##### OpenHab connection : " + connected + " ||| Syncronizing items selected in function : " + devices);
    if (logging === true){console.log("#####################################################################################################")}                
    if (logging === true){console.log("#####################################################################################################")}
    if (logging === true){console.log("#####################################################################################################")}

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
    
            //retrieve device name for all found devices, replace unsupportet characters 
            const objid = str_array[i];
            const objvalue = getState(str_array[i]).val;
            if (logging === true){console.debug("Device " + objid + " Found in GoogleHome function")}
            let objname = objid;

            //Replace unsupported characters for OpenHab
            objname = objname.split('.').join("__");
            objname = objname.split('-').join("___");
            objname = objname.split('#').join("____");
            
            if (logging === true){console.log("Device name " + objid + " translated to " + objname)}
            if (logging === true){console.log("Value of " + objid + " written to openhab.0.items." + objname + "  || with value " + getState(objid).val)}

            // Write current value of origin to OpenHab
            
            if(!getObject("openhab.0.items." + objname)) {
              
                  
              console.error("Item openhab.0.items." + objname + " Does not exist, please create item in OpenHab");
                
                    
            } else {
                        
                setState("openhab.0.items." + objname, getState(objid).val);
                        
            }
    
            if (getState("openhab.0.info.connection").val === true && i == target) {
        
                //Reset variables preventing triggers to process data 
                connected = true;
                syncronizing = false;
        
                if (logging === true){console.log("#####################################################################################################")}                
                if (logging === true){console.log("#####################################################################################################")}
                if (logging === true){console.log("#####################################################################################################")}
                console.log("#### Syncronisation finished, " + i + " devices and their current states syncronised to OpenHab #####");
                if (logging === true){console.log("############### OpenHab connection = " + connected + " , ready for processing data ##################")}                
                if (logging === true){console.log("#####################################################################################################")}
                if (logging === true){console.log("#####################################################################################################")}
                if (logging === true){console.log("#####################################################################################################")}
    
                console.log("###***### OpenHab connection = " + connected + " , ready for processing data ###***###");
            
                        
                } else if (getState("openhab.0.info.connection").val === false && i == target){
        
                    //Reset variables preventing triggers to process data 
                    connected = false;
                    syncronizing = false;
        
        
                    if (logging === true){console.log("#####################################################################################################")}                
                    if (logging === true){console.log("#####################################################################################################")}
                    if (logging === true){console.log("#####################################################################################################")}
                    if (logging === true){console.log("Syncronisation finished, " + i + " devices and their current states syncronised to OpenHab")}
                    if (logging === true){console.log("#####################################################################################################")}                
                    if (logging === true){console.log("#####################################################################################################")}
                    if (logging === true){console.log("#####################################################################################################")}
        
                    if (logging === true){console.error("OpenHab connection = " + connected + " , values will not be syncronised !!!")}
        
                } else if (i == "1"){
                 
                    if (logging === true){console.log("Total amount of devices found " + target)}
                 
            }
        
        }
    }, 10000);      
    
    return connected, syncronizing;

    
});

//Trigger on value changes in origin devices based on enum name
on({ id: device, change: 'ne'}, function (obj) {
    var objname = obj.id;
    var objvalue = obj.state.val;
    
    // retrieve data last change of previous value and calculate difference with current time
    // We do this to prevent multiple status changes within a given time-frame (5 seconds) to prevent loops in code
    var diff_time = (new Date().getTime()) - (obj.oldState ? obj.oldState.lc : "");

    if (logging === true){console.log("Device trigger " + objname + " with value " + objvalue + " and previous change time diff  = " + diff_time)}

    if (connected === true && syncronizing === false && diff_time > 5000) {

        //Replace unsupported characters for OpenHab
        objname = objname.split('.').join("__");
        objname = objname.split('-').join("___");
        objname = objname.split('#').join("____");

        if (logging === true){console.log("Value of origin changed, syncronizing to OpenHab : " + objname + "  || with value " + objvalue)}

        const openhabID = "openhab.0.items." + objname;
        
        if(!getObject("openhab.0.items." + objname)) {
                  
                  
          console.error("Item openhab.0.items." + objname + " Does not exist, please create item in OpenHab");
                
                    
        } else {
                    
            setState(openhabID, objvalue);
                    
        }
        
    } else if (connected === false) {

        // Log warning OpenHab connection not active
        console.error("OpenHab adapter not connected, ignoring syncronisation of value changes from origin to OpenHab");

    } else if (diff_time < 5000) {
        
        // write error to console if previous change time is < 5 seconds
        if (logging === true){console.error("Previous change of device " + objname + "less than 5 seconds ago, ignoring value change")}
        
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

    // Replace OpenHab character to original state name
    var find = ["____"];
    var replace = ['#'];
    objname = replaceStr(objname, find, replace);

    find = ["___"];
    replace = ['-'];
    objname = replaceStr(objname, find, replace);

    find = ["__"];
    replace = ['.'];
    objname = replaceStr(objname, find, replace);

    if (connected === true && syncronizing === false && diff_time > 5000 && objvalue !== getState(objname).val && objvalue != null) {

        if (logging === true){console.log("Value of item in OpenHab change, syncronizing to device " + objname + " with value : " + objvalue)}
        setState(objname, objvalue);

    } else if (diff_time < 5000){

        // write error to console if previous change time is < 5 seconds
        if (logging === true){{console.error("Previous change of device " + objname + "less than 5 seconds ago, ignoring value change")}

    } else if (connected === false) {
A
        // Log warning OpenHab connection not active
        console.error("OpenHab adapter not connected, ignore syncronisation of item values from OpenHab Origin")}
        
    }

});


// Replacement function to items where reguar replace with split fails 
function replaceStr(str, find, replace) {
    for (var i = 0; i < find.length; i++) {
        str = str.replace(new RegExp(find[i], 'gi'), replace[i]);
    }
    return str;
}
