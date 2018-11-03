//******************************************
//*****************Dutchman*****************
//*** interact openhab items wih iObroker***
//*******************V 0.6****************** 
//******************************************
//******************************************

// Declare function name which includes all states of devices to be acessible by GoogleHome
var devices = "GoogleHome";

// ################################################################
// ################################################################
// ############## Don't change anything below here ! ##############
// ################################################################
// ################################################################

var connected;
var syncronizing;
var device, timeout;
var objid;
var objnameT;
var objname;
var objvalue;
var find;
var replace;
var objid;

// Read all enums related to enum.functions
functions = getEnums('functions');

// Loop on all values and store members of function "device" to variable
for (var i in functions){
    if (functions[i].name == devices){
        device = functions[i].members;
        log(device);
    }
}

// Set status to current state of OpenHab connection
if (getState("openhab.0.info.connection").val === true) {
    
    connected = true;
    
} else {
   
    connected = false;
}

log("OpenHab connection = " + connected);

// Trigger on connection change, snycronise current values to OpenHab datapoints
on({id: "openhab.0.info.connection", change: "ne"}, function (obj) {
    log("GoogleHome : Change on OpenHab connection ");
    
    //Set connection status to false to prevent incorrect state syncronisation
    connected = false;
    syncronizing= true;
    log("OpenHab connection = " + connected);
    
    //Clear possible running time
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

        try{
        
        //retrieve device name for all found devices, replace unsupportet characters 
        objid = getObject(str_array[i])._id;
        objvalue = getState(str_array[i]).val;
        log("Device " + objid + " Found in GoogleHome function");
        objname =  getObject(str_array[i])._id;
        
        //Replace unsupported characters for OpenHab
        objname = objname.split('.').join("__");
        objname = objname.split('-').join("___");
        objname = objname.split('#').join("____");
        log("Device name translated to " + objname);

        log("Value of source written to openhab.0.items." + objname + "  || with value " +  getState(objid).val);
        setState("openhab.0.items." + objname, getState(objid).val);

        
        }   catch(e){}
        
        if (getState("openhab.0.info.connection").val === true && i == target){    
                        
            connected = true;
            syncronizing = false;
            log("OpenHab connection at array end = " + connected);
        }

    }

    //Timer for connection wait
    }, 5000);

return connected});
//timeout = setTimeout(function () {log(connected);}, 12000);


//Trigger on value changes in origin devices based on enum name
on({id: device, change: 'any'}, function(obj) {
    var objname = obj.id;
    var objvalue = obj.state.val;

    if (connected === true && syncronizing === false ){
        
        //Replace unsupported characters for OpenHab
        objname = objname.split('.').join("__");
        objname = objname.split('-').join("___");
        objname = objname.split('#').join("____");
    
    
        if (objvalue !== getState("openhab.0.items." + objname).val ){
            log("Value of origin changed, syncronizing to OpenHab : " + objname + "  || with value " +  objvalue);
            setState("openhab.0.items." + objname, objvalue);
        } else if (connected === false){
            
            console.warn("OpenHab adapter not connected, ignore syncronisation of value change to original device");
        
        }    
    }
});



// Trigger on value changes within OpenHab item tree and syncronise value to origin if current is different
on({id: /^openhab.0.items\./, change: "any"}, function (obj) {
    var objname = obj.native.name;
    var objvalue = obj.state.val;    

    // Only run device syncronisation when OpenHab connection is active
    if (connected === true && syncronizing === false ){

        // Replacce '__' to '.' equal to state names of devices origin 
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
        
        // Syncronise state of origin device with OpenHab item in case of empty value
        } else if (objvalue === null ){
            var objname_source = obj.native.name;
            setState("openhab.0.items." + objname_source, getState(objname).val);
        
        }
    
    } else if (connected === false){
        
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
