//******************************************
//*****************Dutchman*****************
//*** interact openhab items wih iObroker***
//*******************V 0.3****************** 
//******************************************
//******************************************

// Declare function name which includes all states of devices to be acessible by GoogleHome
var devices = "GoogleHome";


// ############## Don't change anything below here ! ##############

// Read all enums related to enum.functions
functions = getEnums('functions');

// Loop on all values and store members of function "device" to variable
for (var i in functions){
    if (functions[i].name == devices){
        var device = functions[i].members;
        log(device);
    }
}

//Seperate values in variable "device" to seperate devices
str = device + ' ';
var str_array = str.split(',');
for(i = 0; i < str_array.length; i++) {
    str_array[i] = str_array[i].replace(/^\s*/, "").replace(/\s*$/, "");

    try{
        
        //retrieve device name for all found devices, replace empty spaces in name by _
        var objid = getObject(str_array[i])._id;
        var objnameT =  getObject(str_array[i]).common.name;
        var objname = objnameT.split(' ').join('_');
        var objvalue = getState(str_array[i]).val;

        log(objid);
    
    }   catch(e){} 

}



//Trigger on value changes in origin devices based on enum name
on({id: device, change: 'any'}, function(obj) {
    var objname = obj.id;
    var objvalue = obj.state.val;
    log(objname);

    // Replacce '.' to '__' equal to state names of devices origin 
    var find = ['.'];
    var replace = ["__"];
    objname = objname.split('.').join("__");

    find = ["-"];
    replace = ['___'];
    objname = replaceStr(objname, find, replace);
    
    
    log(objname);
    if (objvalue !== getState("openhab.0.items." + objname).val){
        
    setState("openhab.0.items." + objname, objvalue);
    }
});


// Trigger on value changes within OpenHab item tree and syncronise value to origin if current is different
on({id: /^openhab.0.items\./, change: "any"}, function (obj) {
    var objname = obj.native.name;
    var objvalue = obj.state.val;
    
    // Replacce '__' to '.' equal to state names of devices origin 
    var find = ["___"];
    var replace = ['-'];
    objname = replaceStr(objname, find, replace);

    find = ["__"];
    replace = ['.'];
    objname = replaceStr(objname, find, replace);

    //Only change value to origin object when current state is different from source and target
    if (objvalue !== getState(objname).val && objvalue !== null){
        
        log("write state openhab to source");
        setState(objname, objvalue);
        
    } else if (objvalue === null){
        var objname_source = obj.native.name;
        setState("openhab.0.items." + getObject(objname).common.name, getState(objname_source).val);
        
    }
});

// Replacement function to items where reguar replace fails 
function replaceStr(str, find, replace) {
    for (var i = 0; i < find.length; i++) {
        str = str.replace(new RegExp(find[i], 'gi'), replace[i]);
    }
    return str;
}
