/**
 * global function ajaxCall to expose JS pre-initialization
 */

(function(global){
    var ajaxCall = function(userName, userPwd, callingUrl, callingMethod, successFN, errorFN, dataPN){
        return new ajaxCall.init(userName, userPwd, callingUrl, callingMethod, successFN, errorFN, dataPN);
    }
    
    var setBasic = {
        
    };
    
    ajaxCall.prototype = {
        
        setAUTH: function(){
            return 'Basic ' + btoa(this.userName + ':' + this.userPwd);
        },
        
        setREQUEST: function(){
            var auth = this.setAUTH();
            $.ajaxSetup({
                beforeSend: function(xhr){
                    xhr.setRequestHeader('Authorization', auth);
                    xhr.setRequestHeader('Accept', "application/json");
                    xhr.setRequestHeader('aw-tenant-code', "d7wqLVugVLaaPSm4mGk0DVF3W0rEQNEnklvoQ8KnYNA=");
                }
            });
            return this;
        },
        
        callREQUEST: function(){
            $.ajax({
                url: this.callingUrl,
                type: this.callingMethod,
                dataType: 'json',
                crossDomain: true,
                data: this.dataPN,
                success: this.successFN,
                error: this.errorFN
            });
            return this;
        }
        
    };
    
    ajaxCall.init = function(userName, userPwd, callingUrl, callingMethod, successFN, errorFN, dataPN){
        var self = this;
        self.userName = userName || '';
        self.userPwd = userPwd || '';
        self.callingUrl = callingUrl || '';
        self.callingMethod = callingMethod || '';
        self.successFN = successFN || '';
        self.errorFN = errorFN || '';
        self.dataPN = dataPN || '';
    }
    
    ajaxCall.init.prototype = ajaxCall.prototype;
    
    global.ajaxCall = ajaxCall;
    
    
    
}(window));

function errorFn(jqXHR, error, errorThrown){
    var message;
    if(jqXHR.responseJSON)
        drawToast('.alertDiv', 'Error : ' + jqXHR.responseJSON.message, '2000');
    else
        drawToast('.alertDiv', 'Error : Unknown error!', '2000');
        //console.log(JSON.stringify(jqXHR)+'::'+JSON.stringify(error)+'::'+JSON.stringify(errorThrown));
};