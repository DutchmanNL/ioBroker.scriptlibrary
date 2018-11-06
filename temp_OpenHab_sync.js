//******************************************
//*****************Dutchman*****************
//*** interact openhab items wih iObroker***
//*******************V 0.8.1**************** 
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
functions = getEnums('functions');

// Loop on all values and store members of value "device" to variable
for (var i in functions){
    if (functions[i].name == devices){
        device = functions[i].members;
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
on({id: "openhab.0.info.connection", change: "ne"}, function (obj) {
    log("GoogleHome : Change on OpenHab connection ");
    
    //Set connection status to false to prevent incorrect state syncronisation
    connected = false;
    syncronizing= true;
    log("OpenHab connection = " + connected + "Syncronizing current values to openhab");
    
    //Clear possible running timeout
    (function () {if (timeout) {clearTimeout(timeout); timeout = null;}})();
    
    // Start timer of 10 seconde to ensure all objects are syncronised from iobroker
    timeout = setTimeout(function () {
    
        var objvalue = obj.state.val;
    // Set status to valse to prevent changes from OpenHab items to Original devices during initial syncronisation
    

    //Seperate values in variable "device" to seperate devices
    str = device + ' ';
    var str_array = str.split(',');
    for(i = 0; i < str_array.length; i++) {
        var target = str_array.length - 1;
        log("Total amount of devices found " + target );
        
        str_array[i] = str_array[i].replace(/^\s*/, "").replace(/\s*$/, "");

//        try{
        
        //retrieve device name for all found devices, replace unsupportet characters 
        objid = getObject(str_array[i])._id;
        objvalue = getState(str_array[i]).val;
        console.debug("Device " + objid + " Found in GoogleHome function");
        objname =  getObject(str_array[i])._id;
        
        //Replace unsupported characters for OpenHab
        objname = objname.split('.').join("__");
        objname = objname.split('-').join("___");
        objname = objname.split('#').join("____");
        console.debug("Device name translated to " + objname);

        log("Value of " + objid + " written to openhab.0.items." + objname + "  || with value " +  getState(objid).val);
        setState("openhab.0.items." + objname, getState(objid).val);

        
//        }   catch(e){}
        
        log("Syncronisation finished");
        
        if (getState("openhab.0.info.connection").val === true && i == target){    
                        
            connected = true;
            syncronizing = false;
            
            log("OpenHab connection = " + connected + " , ready for processing data");
        }

    }

    //Timer for connection wait, should be removed later as soon as script provides status correclty wehen sync is finished
    }, 10000);

return connected});

//Trigger on value changes in origin devices based on enum name
on({id: device, change: 'any'}, function(obj) {
    var objname = obj.id;
    var objvalue = obj.state.val;
    var timecheck;

/*
    if (getDateObject(((new Date().getTime()) - getState(obj.id).lc)).getSeconds() > 5 || (getDateObject(((new Date().getTime()) - getState(obj.id).lc)).getMinutes()) > 0) {
        timecheck = true;
        log(obj.id);
        log(timecheck);
        log("Minutes" + getDateObject(((new Date().getTime()) - getState(obj.id).lc)).getMinutes());
        log("Seconds" + getDateObject(((new Date().getTime()) - getState(obj.id).lc)).getSeconds());
        
    } else {
        timecheck = false;
        log(obj.id);
        log(timecheck);
        log("Minutes" + getDateObject(((new Date().getTime()) - getState(obj.id).lc)).getMinutes());
        log("Seconds" + getDateObject(((new Date().getTime()) - getState(obj.id).lc)).getSeconds());
        
    }

*/

// ######################################################################################
// ################### Migging Logic to prevent loop in value changes ###################
// ######################################################################################

    if (connected === true && syncronizing === false && timecheck === true){
        // Global operation lock, do not process value changes
        operation_lock_Device = true;
  
        //Replace unsupported characters for OpenHab
        objname = objname.split('.').join("__");
        objname = objname.split('-').join("___");
        objname = objname.split('#').join("____");
    
        // check if value in OpenHab is different from source, if Yes write state of device to OpenHab
        if (objvalue !== getState("openhab.0.items." + objname).val ){
            log("Value of origin changed, syncronizing to OpenHab : " + objname + "  || with value " +  objvalue);
            setState("openhab.0.items." + objname, objvalue);
        } else if (connected === false){
            
            // Log warning OpenHab connection not active
            console.warn("OpenHab adapter not connected, ignore syncronisation of value change to original device");
            
        // ######################################################################################
        // ############# Migging Logic to show devices which are missing in OpenHab #############
        // ######################################################################################            
            
        }    
    }

});



// Trigger on value changes within OpenHab item tree and syncronise value to origin if current is different
on({id: /^openhab.0.items\./, change: "any"}, function (obj) {
    var objid = obj.id;
    var objname = obj.native.name;
    var objvalue = obj.state.val;    
    
    var timecheck;
    
    var current_time = (new Date().getTime())
    var lc_time = getState(obj.id).lc
    var diff_time = current_time - lc_time

/*    
    // Only handle changes IF last change of object > 5000 miliseconds
    if ((new Date().getTime()) - getState(obj.id).lc > 5000){
        timecheck = true;
        log(obj.id);
        log(timecheck);
        log("last change > 5000 milisec, execute")
        
    } else {
        timecheck = false;
        log(obj.id);
        log(timecheck);
        console.warn("last change < 5000 milisec, ignored")
        
    }    

    log('############# Time Check #############');    
    
    console.debug(objvalue);
    console.debug(connected);
    console.debug(syncronizing);
    log("Operation_Lock = " + operation_lock);
*/

// ######################################################################################
// ################### Migging Logic to prevent loop in value changes ###################
// ######################################################################################


    // Only run device syncronisation when OpenHab connection is active
    if (connected === true && syncronizing === false && timecheck === true ){
        
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
        if (objvalue !== getState(objname).val && objvalue !== null){
        
            log("Value of item in OpenHab change, syncronizing to device " + objname + " with value : " + objvalue);
            setState(objname, objvalue);
        
        // Syncronise state of origin device with OpenHab item in case of empty value (should not happen)
        } else if (objvalue === null ){
            var objname_source = obj.native.name;
            setState("openhab.0.items." + objname_source, getState(objname).val);
        
        }
    
    } else if (connected === false && syncronizing === false){
        
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
