if ( !espn ){ var espn = {}; }
espn.alerts = {};
espn.utils = {};
espn.utils.log = function(x){
	if ( console ){
		console.log(x);
	}
}
espn.utils.reload = function(){
	window.location.reload(true);
}
var log = function(x){espn.utils.log(x)};

// helpers
(function($){

	espn.api = function(j){
		if ( j ){
			
			// inits;
			obj = j;
			testStr = '';
			if ( j.url ){ obj.url = j.url; }
			if ( espn.alerts.testEnvironment ){ testStr = 'test/' }
			j.method ? obj.url = 'http://api.espn.com/' + testStr + j.method : obj.url = j.url;
			if ( j.dataType ){ obj.dataType = j.dataType; }
			
			// request
			if ( obj.url ){
				$.ajax(obj);
			}
			
		}
	}

})(jQuery);