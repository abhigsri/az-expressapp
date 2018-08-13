/**
 * Ready function to expose JS pre-initialization
 */
$(document).ready(function(){
    regHand();
    
    settings = Settings.getSettings();
	if($.isEmptyObject(settings))
		settings = new Settings();
	fillInit(); // This fn will check for local storage for basically Remember Me user faeture
    //console.log(settings);
});


var stp = false;
var pagesize = 500;
var page = 0;
var allDevices = [];
var listDevices = new Array();
var arrOrgGroups = [];
var arrOrgDevices = [];

function fillInit(){
    var uname, rem, pswd = '';
    
	if(settings.uid !== undefined){
        uname = settings.uid;
    }
    if(settings.remember !== undefined){
        rem = settings.remember;
        pswd = settings.pwd;
    }
    window.localStorage.clear();
    settings.uid = uname;
    
    settings.remember = rem;
    settings.pwd = pswd;
    settings.save();
    $('#txtUserName').val(settings.uid);
    if(settings.remember == 1){
        $("input[name='remMe']").attr('checked', true).checkboxradio("refresh");
       
        $('#txtPassword').val(settings.pwd);
    }

}

function regHand(){
    
	// Home page login btn handler
    $('#btnLogin').tap(function(e){
        e.preventDefault();
        var userName = $.trim($('#txtUserName').val());
        var userPassword = $.trim($('#txtPassword').val());
        
        if(userName && userPassword){
            settings.uid = userName == '' ?  '' : userName;
            settings.pwd = userPassword == '' ? '' : userPassword;
            
            settings.save();
            InitCall();
            $.mobile.pageContainer.pagecontainer('change', '#pushNotification', {transition: 'slide'});
        }else
            drawToast('.alertDiv', 'Username or Password is missing!', '2000');
        
    });
    
    //backBtn handler
    $('#backBtn').on('tap', function(e){
        e.preventDefault();
        $.mobile.pageContainer.pagecontainer('change', '#login', {transition: 'slide'});
    });
    
    // remember me option handler
    $('#remMe').change(function(e){
        e.preventDefault();
        console.log(this);
        if($(this).is(':checked')){
            settings.remember = 1;
        }else{
            settings.remember = 0;
        }
    });
    
    //PN char count handler
    $('#txtPN').on('input propertychange', function(e) {
        CharLimit(this, 206);
        var len = $(this).val().length;
        $('.info-charCount').html((206 - len));
    });
    //btn push
    $('#btnPush').tap(function(e){
        e.preventDefault();
        var settings = Settings.getSettings();
        if($('#txtPN').val() && arrOrgDevices.length){
            var pushMsg = $('#txtPN').val();
            var pnData = {
                      "MessageBody" : pushMsg,
                      "Application" : "AirWatch Agent",
                      "MessageType" : "Push",
                      "BulkValues":{"Value": arrOrgDevices} //HT4AYJT02053
                      }
            console.log(JSON.stringify(pnData));
            var push = ajaxCall(settings.uid, settings.pwd, settings.baseURI+'mdm/devices/messages/bulkpush?searchby=DeviceId', 'POST', pushSuccess, errorFn, pnData);
            push.setREQUEST().callREQUEST();
            
        }else
            drawToast('.alertDiv', 'Invalid request.', '2000');
        
    });
    
    // Org change handler
    $('#divorgGroups').on('change', 'input:radio', function(e){
        e.preventDefault();
        $(this).dropdown("toggle");
        var settings = Settings.getSettings();
        var dataId = $(this).attr('data-Id');
        if($(this).is(':checked')){
            //var devices = ajaxCall(settings.uid, settings.pwd, settings.baseURI+'mdm/devices/search?lgid='+dataId+'&pagesize=6000', 'GET', orgUsersSuccess, errorFn);
            //devices.setREQUEST().callREQUEST();
            
            listDevicesSearch(dataId);
        }
    });
    
    // User group change handler
    $('#divuserGroups').on('change', 'input:radio', function(e){
        e.preventDefault();
        $(this).dropdown("toggle");
        var settings = Settings.getSettings();
        var dataId = $(this).attr('data-Id');
        if($(this).is(':checked')){
            var devices = ajaxCall(settings.uid, settings.pwd, settings.baseURI+'mdm/smartgroups/'+dataId+'/devices', 'GET', orgUsersSuccess, errorFn);
            devices.setREQUEST().callREQUEST();
        }
    });
    
    // Tags change handler
    $('#divorgTags').on('change', 'input:radio', function(e){
        e.preventDefault();
        $(this).dropdown("toggle");
        var settings = Settings.getSettings();
        var dataId = $(this).attr('data-Id');
        if($(this).is(':checked')){
            var devices = ajaxCall(settings.uid, settings.pwd, settings.baseURI+'mdm/tags/'+dataId+'/devices', 'GET', orgUsersSuccess, errorFn);
            devices.setREQUEST().callREQUEST();
        }
    });
    
    // Adv search handler
    $('#adv-search-form').on('submit', function(e){
        e.preventDefault();
        var settings = Settings.getSettings();
        $('#advSearch').modal('hide');
        var data = $(this).find(":input").filter(function () {
            return $.trim(this.value).length > 0
        }).serialize();
        //console.log(data);
        var devices = ajaxCall(settings.uid, settings.pwd, settings.baseURI+'mdm/devices/search?'+ data, 'GET', orgUsersSuccess, errorFn);
        devices.setREQUEST().callREQUEST();
    });
    
    // Adv app search handler
    $('#adv-app-search-form').on('submit', function(e){
        e.preventDefault();
        var settings = Settings.getSettings();
        $('#advAppSearch').modal('hide');
        var data = $(this).find(":input").filter(function () {
            return $.trim(this.value).length > 0
        }).serialize();
        data = data == '' ? '' : '&'+data;
        //console.log(data);
        var app = ajaxCall(settings.uid, settings.pwd, settings.baseURI+'mam/apps/search?status=active'+ data, 'GET', orgAppSuccess, errorFn);
        app.setREQUEST().callREQUEST();
    });
    
    // App change handler
    $('#divorgApps').on('change', 'input:radio', function(e){
        e.preventDefault();
        $(this).dropdown("toggle");
        var settings = Settings.getSettings();
        var dataId = $(this).attr('data-Id');
        var dataType = $(this).attr('data-Type');
        if($(this).is(':checked')){
            var devices = ajaxCall(settings.uid, settings.pwd, settings.baseURI+'mam/apps/'+dataType+'/'+dataId+'/devices?status=installed&pagesize=6000', 'GET', orgAppUsersSuccess, errorFn);
            devices.setREQUEST().callREQUEST();
        }
    });
    
    // Device selections handler
    $('#divorgDevices').on('change', 'input:checkbox', function(e){
        e.preventDefault();
        var dataId = $(this).attr('data-Id');
        
        if($(this).is(':checked') && !dataId){
            arrOrgDevices = [];
            $('.ui-checkbox label').addClass('ui-checkbox-on');
            $('.ui-checkbox input').attr('checked', true);
            $('input[type="checkbox"]').each(function() {
                if($(this).attr('data-Id'))
                    arrOrgDevices.push($(this).attr('data-Id'));
            });   
        }else if($(this).is(':checked')){
            if($.inArray(dataId, arrOrgDevices) == -1){
                arrOrgDevices.push(dataId);
            }
        }else{
            if(!dataId){
                $('.ui-checkbox label').removeClass('ui-checkbox-on').addClass('ui-checkbox-off');
                $('.ui-checkbox input').attr('checked', false);    
                arrOrgDevices = [];
            }else{
                arrOrgDevices.splice(arrOrgDevices.indexOf(dataId),1);
                $('.select-all label').removeClass('ui-checkbox-on').addClass('ui-checkbox-off');
                $('.select-all input').attr('checked', false);
            }
        }
    });
    
}

function InitCall(){
    var settings = Settings.getSettings();
    var org = ajaxCall(settings.uid, settings.pwd, settings.baseURI+'system/groups/570/children', 'GET', orgGroupSuccess, errorFn);
    org.setREQUEST().callREQUEST();
    
    var usr = ajaxCall(settings.uid, settings.pwd, settings.baseURI+'mdm/smartgroups/search?organizationgroupid=570', 'GET', userGroupSuccess, errorFn);
    usr.setREQUEST().callREQUEST();
    
    var tag = ajaxCall(settings.uid, settings.pwd, settings.baseURI+'mdm/tags/search?organizationgroupid=570', 'GET', orgTagSuccess, errorFn);
    tag.setREQUEST().callREQUEST();
    
    var app = ajaxCall(settings.uid, settings.pwd, settings.baseURI+'mam/apps/search?status=active', 'GET', orgAppSuccess, errorFn);
    app.setREQUEST().callREQUEST();
        
    InitCallforDevices(settings.uid, settings.pwd);

}

function InitCallforDevices(uid, pwd){
    if(!stp){
        var dev = ajaxCall(uid, pwd, settings.baseURI+'mdm/devices/search?pagesize=500&page='+page, 'GET', allDevicesSuccess, errorFn);
        dev.setREQUEST().callREQUEST();
        page++;
    }
}

function allDevicesSuccess(result, responseText, jqXHR){
    //var jsonResp = JSON.parse(result); //postResponse is the success resp of $.post
    //$.extend(listDevices.Devices, result.Devices);
    //listDevices = result;
    //$('#ajaxload').modal('hide');
    if(result){
        $.each(result.Devices, function(i, item) {
            allDevices.push(item);
        });
        var settings = Settings.getSettings();
        InitCallforDevices(settings.uid, settings.pwd);
        allDevices = $(allDevices).sort(sortMyDevices);
        
    }else{
        console.log('Response :: '+JSON.stringify(responseText)+'-'+JSON.stringify(jqXHR));
        stp = true;
    }
}

function CharLimit(input, maxChar) {
    var len = $(input).val().length;
    if (len > maxChar) {
        $(input).val($(input).val().substring(0, maxChar));
    }
}

function pushSuccess(result){
    //console.log(JSON.stringify(result));
    //var msg = JSON.stringify(result);
    //drawToast('.alertDiv', 'AcceptedItems: '+ result.AcceptedItems+'<br> FailedItems: '+result.FailedItems+'<br> TotalItems: '+result.TotalItems, '5000');
    $('.alertDiv').html('<div class="alert alert-warning"><i class="close fa fa-times-circle fa-lg" data-dismiss="alert" aria-label="close"></i><div> Total Devices : '+result.TotalItems+'</div><div> Accepted Devices : '+result.AcceptedItems+'</div><div> Failed Devices : '+result.FailedItems+'</div></div>');
}

function orgGroupSuccess(apResult){
    //console.log('ORG :: '+JSON.stringify(apResult));
    $('#divorgGroups').html('');
    if(toType(apResult) === 'array'){
        var tmp = [];
        tmp.push('<div class="dropdown"><button id="" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Org Groups<span class="caret"></span></button><ul class="dropdown-menu col-xs-12" aria-labelledby="dLabel" style="overflow: auto;height: 200px;"><fieldset id="" data-role="controlgroup">');
        if(apResult.length){
            $.each(apResult, function(i, val){
                   tmp.push('<div class=" row-devider arpt-chckbox"><div class="col-xs-12 input-group disable-action"><input data-Id="'+val.Id.Value+'" type="radio" name="chk-option" id="chk-org-'+i+'" /><label for="chk-org-'+i+'" >'+val.Name+'</label></div></div>');
                   });
            $('#divorgGroups').append(tmp.join('')+'</fieldset></ul></div>');
        }
        $('#divorgGroups').trigger('create').trigger('updatelayout');
        $('.alertDiv').html('<div class="alert alert-warning"><i class="close fa fa-times-circle fa-lg" data-dismiss="alert" aria-label="close"></i><strong>'+--tmp.length+' Org Groups found.</strong></div>');
    }else
        drawToast('.alertDiv', 'Some problem occurred!', '2000');
        
}

function userGroupSuccess(apResult){
    //console.log('USER :: '+JSON.stringify(apResult.SmartGroups));
    $('#divuserGroups').html('');
    if(toType(apResult.SmartGroups) === 'array'){
        var tmp = [];
        tmp.push('<div class="dropdown"><button id="" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">SmartGroups<span class="caret"></span></button><ul class="dropdown-menu col-xs-12" aria-labelledby="dLabel" style="overflow: auto;height: 200px;"><fieldset id="" data-role="controlgroup">');
        if(apResult.SmartGroups.length){
            $.each(apResult.SmartGroups, function(i, val){
                   tmp.push('<div class=" row-devider arpt-chckbox"><div class="col-xs-12 input-group disable-action"><input data-Id="'+val.SmartGroupID+'" type="radio" name="chk-option" id="chk-user-'+i+'" /><label for="chk-user-'+i+'" >'+val.Name+'</label></div></div>');
                   });
            $('#divuserGroups').append(tmp.join('')+'</fieldset></ul></div>');
        }
        $('#divuserGroups').trigger('create').trigger('updatelayout');
        $('.alertDiv').html('<div class="alert alert-warning"><i class="close fa fa-times-circle fa-lg" data-dismiss="alert" aria-label="close"></i><strong>'+--tmp.length+' SmartGroups found.</strong></div>');
    }else
        drawToast('.alertDiv', 'Some problem occurred!', '2000');
        
}

function orgTagSuccess(apResult){
    //console.log('TAG :: '+JSON.stringify(apResult.Tags));
    $('#divorgTags').html('');
    if(toType(apResult.Tags) === 'array'){
        var tmp = [];
        tmp.push('<div class="dropdown"><button id="" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Org Tags<span class="caret"></span></button><ul class="dropdown-menu col-xs-12" aria-labelledby="dLabel" style="overflow: auto;height: 200px;"><fieldset id="" data-role="controlgroup">');
        if(apResult.Tags.length){
            $.each(apResult.Tags, function(i, val){
                   tmp.push('<div class=" row-devider arpt-chckbox"><div class="col-xs-12 input-group disable-action"><input data-Id="'+val.Id.Value+'" type="radio" name="chk-option" id="chk-tag-'+i+'" /><label for="chk-tag-'+i+'" >'+val.TagName+'</label></div></div>');
                   });
            $('#divorgTags').append(tmp.join('')+'</fieldset></ul></div>');
        }
        $('#divorgTags').trigger('create').trigger('updatelayout');
        $('.alertDiv').html('<div class="alert alert-warning"><i class="close fa fa-times-circle fa-lg" data-dismiss="alert" aria-label="close"></i><strong>'+--tmp.length+' Tags found.</strong></div>');
    }else
        drawToast('.alertDiv', 'Some problem occurred!', '2000');
}

function orgAppSuccess(apResult){
    //console.log('APPS :: '+JSON.stringify(apResult));
    $('#divorgApps').html('');
    if(apResult && toType(apResult.Application) === 'array'){
        var tmp = [];
        tmp.push('<div class="dropdown"><button id="" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Applications<span class="caret"></span></button><ul class="dropdown-menu col-xs-12" aria-labelledby="dLabel" style="overflow: auto;height: 200px;"><fieldset id="" data-role="controlgroup">');
        if(apResult.Application.length){
            $.each(apResult.Application, function(i, val){
                   tmp.push('<div class=" row-devider arpt-chckbox"><div class="col-xs-12 input-group disable-action"><input data-Type="'+val.AppType+'" data-Id="'+val.Id.Value+'" type="radio" name="chk-option" id="chk-app-'+i+'" /><label for="chk-app-'+i+'" >'+val.ApplicationName+'</label></div></div>');
                   });
            $('#divorgApps').append(tmp.join('')+'</fieldset></ul></div>');
        }
        $('#divorgApps').trigger('create').trigger('updatelayout');
        $('.alertDiv').html('<div class="alert alert-warning"><i class="close fa fa-times-circle fa-lg" data-dismiss="alert" aria-label="close"></i><strong>'+--tmp.length+' Applications found.</strong></div>');
    }else
        drawToast('.alertDiv', 'Some problem occurred!', '2000');
}

// fetch devices success function
function orgUsersSuccess(apResult){
    /*console.log('DEVICE :: '+JSON.stringify(apResult.Device));
    
    if(apResult.Devices !== undefined)
        apResult.Devices = $(apResult.Devices).sort(sortMySGDevices);
    else
        apResult.Device = $(apResult.Device).sort(sortMyTagDevices);
    
    console.log('DEVICE :: '+JSON.stringify(apResult.Device));*/
    
    $('#divorgDevices').html('');
    $('.alertDiv').html('');
    if(apResult){
        var tmp = [];
        tmp.push('<div class="dropdown"><button id="" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Devices<span class="caret"></span></button><ul class="dropdown-menu col-xs-12" aria-labelledby="dLabel" style="overflow: auto;height: 200px;"><fieldset id="" data-role="controlgroup"><div class=" row-devider arpt-chckbox"><div id="select-all" class="col-xs-12 input-group disable-action select-all"><input data-Id="" type="checkbox" name="" id="chk-device" /><label for="chk-device" >Select All</label></div></div>');
        if(toType(apResult.Devices) === 'array' && apResult.Devices.length){
            $.each(apResult.Devices, function(i, val){
                var label = val.DeviceFriendlyName == undefined ? val.Name : val.DeviceFriendlyName;
                var dataId = val.Id.Value == undefined ? val.Id : val.Id.Value;
                   tmp.push('<div class=" row-devider arpt-chckbox"><div class="col-xs-12 input-group disable-action"><input data-Id="'+dataId+'" type="checkbox" name="chk-device" id="chk-device-'+i+'" class="check" /><label for="chk-device-'+i+'" >'+label+'</label></div></div>');
                   });
            $('#divorgDevices').append(tmp.join('')+'</fieldset></ul></div>');
        }else if(toType(apResult.Device) === 'array' && apResult.Device.length){
            $.each(apResult.Device, function(i, val){
                   tmp.push('<div class=" row-devider arpt-chckbox"><div class="col-xs-12 input-group disable-action"><input data-Id="'+val.DeviceId+'" type="checkbox" name="chk-device" id="chk-device-'+i+'" class="check" /><label for="chk-device-'+i+'" >'+val.FriendlyName+'</label></div></div>');
                   });
            $('#divorgDevices').append(tmp.join('')+'</fieldset></ul></div>');
        }else
            drawToast('.alertDiv', 'No device available for this selection!', '2000');
        $('#divorgDevices').trigger('create').trigger('updatelayout');
        $('.alertDiv').html('<div class="alert alert-warning"><i class="close fa fa-times-circle fa-lg" data-dismiss="alert" aria-label="close"></i><strong>'+--tmp.length+' Devices found.</strong></div>');
    
    }else
        drawToast('.alertDiv', 'Some problem occurred!', '2000');
        //alert('Some problem occurred!');
}

// fetch devices based on app selection success function
function orgAppUsersSuccess(apResult){
    //console.log('AppDEVICE :: '+JSON.stringify(apResult));
    $('#divorgDevices').html('');
    $('.alertDiv').html('');
    if(apResult){
        var tmp = [];
        tmp.push('<div class="dropdown"><button id="" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Devices<span class="caret"></span></button><ul class="dropdown-menu col-xs-12" aria-labelledby="dLabel" style="overflow: auto;height: 200px;"><fieldset id="" data-role="controlgroup"><div class=" row-devider arpt-chckbox"><div id="select-all" class="col-xs-12 input-group disable-action select-all"><input data-Id="" type="checkbox" name="" id="chk-device" /><label for="chk-device" >Select All</label></div></div>');
        //var settings = Settings.getSettings();
        //var devices = ajaxCall(settings.uid, settings.pwd, settings.baseURI+'mdm/devices/search?pagesize=6000', 'GET', function(result){
            //console.log('AllDEVICE :: '+JSON.stringify(allDevices));
        if(allDevices){
            $('.alertDiv').html('');
            $.each(allDevices, function(i, val){
                var index = $.inArray( val.Id.Value, apResult.DeviceId );
                if( index != -1 ) {
                    //console.log( val );
                    tmp.push('<div class=" row-devider arpt-chckbox"><div class="col-xs-12 input-group disable-action"><input data-Id="'+val.Id.Value+'" type="checkbox" name="chk-device" id="chk-device-'+i+'" class="check" /><label for="chk-device-'+i+'" >'+val.DeviceFriendlyName+'</label></div></div>');
                }
                //console.log(i+' :: '+JSON.stringify(val.Id.Value));
            });
        }else
            $('.alertDiv').html('<div class="alert alert-warning"><i class="close fa fa-times-circle fa-lg" data-dismiss="alert" aria-label="close"></i><strong>Info!</strong> It will take approx 20-30 sec to complete this request, please wait and then reselect an application from the list.</div>');
            //drawToast('.alertDiv', 'Data not ready, please wait!', '2000');
        $('#divorgDevices').append(tmp.join('')+'</fieldset></ul></div>');
        $('#divorgDevices').trigger('create').trigger('updatelayout');
        $('.alertDiv').html('<div class="alert alert-warning"><i class="close fa fa-times-circle fa-lg" data-dismiss="alert" aria-label="close"></i><strong>'+--tmp.length+' Devices found.</strong></div>');
        //}, errorFn);
        //devices.setREQUEST().callREQUEST();
       
    }else
        drawToast('.alertDiv', 'Some problem occurred!', '2000');
}

// fetch devices from allDevices array
function listDevicesSearch(data){
    $('#divorgDevices').html('');
    $('.alertDiv').html('');
    var tmp = [];
    tmp.push('<div class="dropdown"><button id="" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Devices<span class="caret"></span></button><ul class="dropdown-menu col-xs-12" aria-labelledby="dLabel" style="overflow: auto;height: 200px;"><fieldset id="" data-role="controlgroup"><div class=" row-devider arpt-chckbox"><div id="select-all" class="col-xs-12 input-group disable-action select-all"><input data-Id="" type="checkbox" name="" id="chk-device" /><label for="chk-device" >Select All</label></div></div>');
    if(allDevices){
        $('.alertDiv').html('');
        $.each(allDevices, function(i, val){
            //var index = $.inArray( val.LocationGroupId.Id.Value, data );
            
            //console.log('VAL:'+val.LocationGroupId.Id.Value);
            if( val.LocationGroupId.Id.Value == data ) {
                //console.log('DATA:'+data);
                tmp.push('<div class=" row-devider arpt-chckbox"><div class="col-xs-12 input-group disable-action"><input data-Id="'+val.Id.Value+'" type="checkbox" name="chk-device" id="chk-device-'+i+'" class="check" /><label for="chk-device-'+i+'" >'+val.DeviceFriendlyName+'</label></div></div>');
            }
            //console.log(i+' :: '+JSON.stringify(val.Id.Value));
        });
    }else
        $('.alertDiv').html('<div class="alert alert-warning"><i class="close fa fa-times-circle fa-lg" data-dismiss="alert" aria-label="close"></i><strong>Info!</strong> It will take approx 20-30 sec to complete this request, please wait and then reselect an application from the list.</div>');
    
    $('#divorgDevices').append(tmp.join('')+'</fieldset></ul></div>');
    $('#divorgDevices').trigger('create').trigger('updatelayout');
    $('.alertDiv').html('<div class="alert alert-warning"><i class="close fa fa-times-circle fa-lg" data-dismiss="alert" aria-label="close"></i><strong>'+--tmp.length+' Devices found.</strong></div>');
}

function toType(obj){
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
}

function drawToast(dom, message, timer) {
    $("<div class='ui-corner-all bg-danger'><b class=''>"+message+"</b></div>")
    .css({ 'display': 'block', 'margin-left': '0px',
         'width': 'auto', 'border': '1px solid #a1a1a1', 'padding': '3px 3px', 'text-align': 'center', 'opacity': '1', 'border-radius': '.5em', 'z-Index': '9999' })
    .appendTo(dom).delay(timer)
    .fadeOut(400, function(){$(this).remove();});
}


function sortMyDevices(a, b){
    //console.log('TMP OBj :: '+JSON.stringify(a["DeviceFriendlyName"]));
    return b["DeviceFriendlyName"] < a["DeviceFriendlyName"] ? 1 : -1;
}

function sortMyTagDevices(a, b){
    console.log('TMP OBj :: '+JSON.stringify(a["FriendlyName"]));
    return b["FriendlyName"] < a["FriendlyName"] ? 1 : -1;
}

function sortMySGDevices(a, b){
    //console.log('TMP OBj :: '+JSON.stringify(a["DeviceFriendlyName"]));
    return b["Name"] < a["Name"] ? 1 : -1;
}

/*
*** setting the local storage ***
*/
function Settings(user, pswd, remembered, baseURL, appVersion){
    var _db = window.localStorage;
    var _tableName = 'usersUAT';

    this.uid = user;
    this.pwd = pswd;
    this.remember = remembered;
    
    this.baseURI = 'https://emm.sita.aero/api/';
    this.appVersion = '1.0.0';
    
    this.save = function(){
      _db.setItem(_tableName, JSON.stringify(this));
    };

    this.load = function(){
      return JSON.parse(_db.getItem(_tableName));
    };
}
Settings.getSettings = function(){
   var settings = new Settings().load();
   return (settings === null) ? {} : new Settings(settings.uid, settings.pwd, settings.remember, settings.baseURI, settings.appVersion);
}