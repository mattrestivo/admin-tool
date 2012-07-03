(function($){

	// static
	var plotOptions = {
		series: {
			lines: { show: true },
			points: { show: true }
		},
		xaxis: { mode: "time",
		 		 timeformat: "%m/%d"
		}
	};
	
	
	var imgLoader = "http://a.espncdn.com/i/loading/d6d6d6.777.gif";
	
	getContentIdMemCacheKey = function(alertId,contentType){
		if ( contentType == 'video' ){
			return 'espn.alerts.'+alertId+'.videoId';
		} else if ( contentType == 'story' ){
			return 'espn.alerts.'+alertId+'.storyId';
		}
	}
	
	getMemCacheTTL = function(){
		return 604800; // 7 days
	}

	// move these to base.js?
	ISODateString = function(d){
		function pad(n){return n<10 ? '0'+n : n}
		return d.getUTCFullYear()+'-'
		+ pad(d.getUTCMonth()+1)+'-'
		+ pad(d.getUTCDate())+'T'
		+ pad(d.getUTCHours())+':'
		+ pad(d.getUTCMinutes())+':'
		+ pad(d.getUTCSeconds())+'Z'
	}

	sortMessagesByTime = function(objects){
		if ( objects && objects.length > 0 ){
			objects = objects.sort(function(a,b) {
				//aCreated = new Date(a.time).getTime();
				//bCreated = new Date(b.time).getTime();
				aCreated = new Date(a.created).getTime();
				bCreated = new Date(b.created).getTime();
				return parseFloat(bCreated) - parseFloat(aCreated);
			});
		}
		return objects;
	}
	
	nearestDayTimestamp = function(date){
		date = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
		date.setUTCHours(0);
		date.setUTCMinutes(0);
		date.setUTCSeconds(0);
		date.setUTCMilliseconds(0);
		return date.getTime();
	}

	/* to update past alerts */
	$('body').on('change','.changeContentId',function(e){
		$this = $(this);
		value = $this.val();
		contentType = $this.attr('data-contentType');
		alertId = $this.attr('data-alertId');
		$this.after('<img src="'+imgLoader+'" class="loading" />');
		if ( value != null ){
			//$this.attr('disabled',true);
			$.ajax({
				url: '/alerts/memcache/memcachedSet?cacheKey='+getContentIdMemCacheKey(alertId,contentType)+'&out='+value+'&cacheTTL='+getMemCacheTTL(),
				success: function(j){
					if ( !j.error ){
						//$this.attr('disabled',false);
					} else {
						alert('Error updating the videoId. (1)');
					}
					$this.siblings('.loading').remove();
				}, error: function(j){
					//$this.attr('disabled',false);
					$this.siblings('.loading').remove();
				}
			});
		}
	});

	graphSentAlerts = function(data,graphEl){
		
		//log('graphing these alerts!');
		//log(data);
		espn.alerts.graph = [];

		a = {alerts: data};
		
		
		// does this work?
		/*for (var i = 0; i < a.alerts.length; ++i) {
			a.alerts[i][0] -= 60 * 60 * 1000 * (new Date().getTimezoneOffset()/60); // to adjust to the proper offset?
		}*/
		
		if ( a && a.alerts && a.alerts.length > 0 ){
			count = 0;
			localOffset = new Date().getTimezoneOffset() * 60000;
			lastTs = 0;
			toPlot = [];
			today = new Date();
			today = nearestDayTimestamp(today);
			for(var i=0;i<a.alerts.length;i++){
				tsAlert = new Date(a.alerts[i].created);
				tsAlert = nearestDayTimestamp(tsAlert);

				if ( lastTs != tsAlert ){
					//log('found a new date at index '+i+', resetting the count.');
					count = 0;
				}

				count++;

				// if it exsits, and the timestamps match, it's the same day, update the existing array
				if ( toPlot.length > 0 && tsAlert == toPlot[toPlot.length-1][0] ){
					//log('add to existing. '+tsAlert+','+count);
					toPlot[toPlot.length-1][1] = toPlot[toPlot.length-1][1]+1;

					// otherwise, insert it
				} else {
					if ( toPlot.length > 0 ){
						missingDays = (tsAlert-toPlot[toPlot.length-1][0]) / 86400000;
						for (var j=1; j<missingDays; j++){
							newTs = toPlot[toPlot.length-1][0]+86400000;
							toPlot.push([newTs,0]);
						}
					}
					toPlot.push([tsAlert,count]);
					lastTs = tsAlert;
				}

			}
			espn.alerts.graph.push(toPlot);
			$(graphEl).html('').css({width: "290px",height: "120px"});
			$.plot($(graphEl), espn.alerts.graph, plotOptions);

		} else {
			//log('no alerts to graph');
			if ( a.error ){
				$(graphEl).html(a.error);
			} else {
				$(graphEl).html('');
			}
		}

		
	}

	/* public facing function */
	espn.alerts.refresh_timeout = null;
	espn.alerts.loadAndWriteStatsAndMessages = function(dataObj,el,graphEl){
		
		$(el).html('<img src="'+imgLoader+'" class="loader" style="text-align: center;" />');
		$(graphEl).html('<img src="'+imgLoader+'" class="loader" style="text-align: center;" />');
		
		dataObj.html = '';
		dataObj.apikey = 'k63bb77qjahygsjepf5qu7de';
		if ( !dataObj.limit ){
			dataObj.limit = 30;
		}
		
		espn.api({
			method: 'alerts/',
			data: dataObj,
			dataType: 'jsonp',
			success: function(json){
				
				graphSentAlerts(json.alerts,graphEl);
				h = '';

				if ( json.alerts && json.alerts.length > 0 ){

					h += '<div id="messages">';
					list = sortMessagesByTime(json.alerts);
					lastId = -1;
					count = 0;
					unreadCount = 0;
					for(var i=0;i<list.length;i++){
						a = list[i];
						text = a.text||'';
						time = a.created||'';
						id = a.id||i;
						videoId = storyId = '';
						dateObj = new Date(time);
						hours = dateObj.getHours();
						mins = dateObj.getMinutes() < 10 ? '0' + dateObj.getMinutes() : dateObj.getMinutes();
						day = dateObj.getDay();
						days = ["sun","mon","tue","wed","thu","fri","sat"];
						apiURL = 'alerts/?alertId='+id+'&apikey='+dataObj.apikey;
						if ( espn.alerts.testEnvironment ){
							apiURL = 'test/' + apiURL;
						}
						apiURL = 'http://api.espn.com/' + apiURL;
						if ( a.data && (a.data.videoId || a.data.storyId) ){
							if ( parseInt(a.data.videoId) > 0 ){
								videoId = a.data.videoId;
							}
							if ( parseInt(a.data.storyId) > 0 ){
								storyId = a.data.storyId;
							}
						}
						if ( id != lastId ){
							h += '<div class="message">';
							h += '<div class="logo"></div>';
							h += '<div class="text">'+text+'</div>';
							h += '<div class="clear"></div>';
							h += '<div class="meta">';
							h += '<span class="actual-time">(<a style="text-decoration: none;" target="_new" href="'+apiURL+'">'+days[day]+' '+ hours +':'+ mins +'</a>)</span>';
							h += '<span class="rel-time" title="'+ISODateString(dateObj)+'"></span>';
							h += '<input class="changeContentId" style="margin-bottom:0px;" data-alertId="'+id+'" data-contentType="video" value="'+videoId+'" placeholder="videoId" size="8" /> ';
							h += '<input class="changeContentId" style="margin-top:0px;" data-alertId="'+id+'" value="'+storyId+'" data-contentType="story" placeholder="storyId" size="8" /> ';
							h += '</div>';
							h += '</div>';
							lastId = id;
							count++;
						}
					}
					if ( count == 0 ){
						h += '<div class="message unread"><center><b>No recent notifications</b></div>'
					}
					h += '</div>';
					h += '</div>';
					
					$(el).html(h);
					$('.rel-time').timeago();
					espn.alerts.refresh_timeout = clearTimeout(espn.alerts.refresh_timeout);
					espn.alerts.refresh_timeout = setTimeout(function(){
						espn.alerts.loadAndWriteStatsAndMessages(dataObj,el,graphEl);
					},60000);
					
				} else {
					$(el).html('');
				}
			}
		});	
	}

})(jQuery);