(function($){
	
	// inits;
	
	// dom ready
	$(function(){
	
		$objs = $('a.save');

		$objs.on('click', function(){
			$obj = $(this);
			if ( $obj && espn.user.udid ){
				dataObj = { "udid": espn.user.udid };
				if ( $('#email') && $('#token') && $('#applicationId') ){ // to support adding users.
					dataObj.email = $('#email').val();
					dataObj.token = $('#token').val();
					dataObj.applicationId  = $('#applicationId').val();
					dataObj.format  = $('#format').val();
				}
				ajaxObj = {
					"url": $obj.attr('data-apiurl'),
					"data": dataObj,
					"success": function(j){
						if ( !j.error ){
							if ( (j.status && j.status == "success") || j.user ){
								wlString = window.location+'';
								( wlString.indexOf('?') > -1 ) ? espn.utils.reload() : window.location.href = wlString + '?udid='+ espn.user.udid;
							} else {
								log('unknown error');
							}
						} else {
							log(j.error);
						}
						return false;
					}
				};
				espn.api(ajaxObj);
			}
			return false;
		});
	
	});
	
})(jQuery);