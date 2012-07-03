(function($){
	
	var sendToTypes = [5,21]; // define the types that can be sent-to here!
	var sendAPIKey = 'sym6qjsmg9edngamvewahygh';
	var tags = $('#tags');
	var stats = $('#stats');
	
	sendAlert = function(){
		
		text = $('#text').val();
		
		testText = (espn.alerts.testEnvironment) ? "TEST " : "";
		
		if ( espn.alerts.sendAccess && confirm('READY TO SEND?\n\n' + testText + text ) ){
			
			category = $('#category').val();
			type = $('#type').val();
			categories = [];
			filterValues = [];
			filterNames = [];
			storyId = $('#storyId').val();
			videoId = $('#videoId').val();
			headline = $('#headline').val();
			
			$tags = $('#tags div');
			
			for(var i=0;i<$tags.length;i++){
				categories[categories.length] = $($tags[i]).attr('data-category');
				filterNames[filterNames.length] = $($tags[i]).attr('data-filterName');
				filterValues[filterValues.length] = $($tags[i]).attr('data-filterValue');
			}
			
			if ( category < 0 && categories && categories.length > 0 ){
				category = categories[0];
			}
			
			categories = categories.join(',');
			filterNames = filterNames.join(',');
			filterValues = filterValues.join(',');
			
			dataObj = {
				category: category,
				categories: categories,
				type: type,
				filterNames: filterNames,
				filterValues: filterValues,
				action: "put",
				userName: espn.alerts.user,
				apikey: sendAPIKey,
				headline: headline,
				text: text
			};
			if ( storyId && storyId != -1 ){ dataObj.storyId = storyId; }
			if ( videoId && videoId != -1 ){ dataObj.videoId = videoId; }
			
			espn.api({
				method: 'alert/',
				data: dataObj,
				dataType: "jsonp",
				success: function(a){
					if ( a.success ){
						if ( a.success+'' == 'false'){
							if ( a.message ){
								alert(a.message);
							} else {
								alert('The http request succeeded, but an error occured and the alert was not sent (1).');
							}
						} else {
							resetForm();
							//espn.utils.reload();
						}
					} else {
						alert('The alert was not sent (2).');
					}
				}, error: function(){
					alert('The alert was not sent (3).');
				}
			});
			
		} else {
			alert('This alert will not be sent. (4)');
		}
		
	}
	
	createPropertiesObj = function(obj){
		tag = {};
		tag.type = obj.type||$('#type option:selected').val();
		tag.category = obj.category||$('#category option:selected').val();
		tag.filterName = obj.filterName||'news';
		tag.filterValue = obj.filterValue||'1';
		tag.name = obj.name||type+'.'+category+'.'+filterName+'.'+filterValue;
		tag.html = htmlTag(tag)||null; // subfunction all presentation views;
		return tag;
	};
	
	convertToPropertiesObj = function(s){
		obj = {};
		if ( typeof s === "string" ){
			propsArray = s.split('|');
			if ( propsArray.length == 4 ){
				obj.category = propsArray[0];
				obj.type = propsArray[1];
				obj.filterName = propsArray[2];
				obj.filterValue = propsArray[3];
			}
		}
		return obj;
	}
	
	resetForm = function(){
		$("#tags").html('');
		$('input#videoId').val('');
		$('input#storyId').val('');
		$('textarea#text').val('');
		$("select#category,select#type")[0].selectedIndex = 0;
		espn.alerts.loadAndWriteStatsAndMessages({types:sendToTypes.toString()},'#alerts-recent','#alerts-graph');
		return false;
	}
	
	htmlTag = function(tag){
		return '<div class="tag" data-category="'+tag.category+'" data-type="'+tag.type+'" data-filterName="'+tag.filterName+'" data-filterValue="'+tag.filterValue+'">'+tag.name+' <span><a href="#">x</a></span></div>'
	};
	
	$(function(){
		
		// static
		var autoCompleteField = $('#lookup');
		var categorySelectElement = $('#category');
		var categorySelectElements = $('#category, #piggybackCategory');
		var deleteTagElements = '#tags .tag span a';
		var cats = [];
		var sendElement = 'button.submit';
		var tags = $('#tags');
		
		// to update the view
		$.subscribe("espn.alerts.filterchange", function(propertiesObj) {
			espn.alerts.loadAndWriteStatsAndMessages(propertiesObj,'#alerts-recent','#alerts-graph');
		});
		
		// autocomplete helpers
		fnSelect = function(event,ui){
			
			propertiesObj = convertToPropertiesObj(ui.item.value);
			
			// if they are adding a different category alert, do not allow them to add filters that apply incorrectly cross-cat
			foundDifferentCatFilters = false;
			foundMoreThanTwoCats = false;
			tags.children('div').each(function(){
				if ( propertiesObj.category != $(this).attr('data-category') ){ // if they are different categories, check to make sure the filters wont collide on other cats.
 					if (propertiesObj.filterName != $(this).attr('data-filterName') && !(propertiesObj.filterName == 'fantasynews' || $(this).attr('data-filterName') == 'fantasynews') ){ // if there are different filterNames and it's not fantasy
						foundDifferentCatFilters = true;
					}
				}
			});
			
			if ( $.inArray(propertiesObj.category, cats) == -1 ){
				cats[cats.length] = propertiesObj.category;
			}
			if ( cats.length > 2 ){
				foundMoreThanTwoCats = true;
			}
			
			if ( !foundDifferentCatFilters ){
				propertiesObj.name = ui.item.label;
				h = htmlTag(propertiesObj);
				tags.append(h);
				$.publish('espn.alerts.filterchange',[propertiesObj]);
				autoCompleteField.attr('value','');
			} else {
				msg = 'You cannot add this category and filter combination! \n\n' + cats;
				if ( foundMoreThanTwoCats ){
					msg = 'You cannot send to more than two categories.';
				}
				alert(msg);
			}
			
			return false;
		}
		
		fnFocus = function(event,ui){
			autoCompleteField.attr('value',ui.item.label);
			return false;
		}
		
		fnSource = function(s,r){
			returnArray = [];
			sports = espn.alerts.categories;
			term = s.term.toLowerCase();
			for (var n=0;n<sports.length;n++){
				
				if ( sports[n].notifications && sports[n].notifications.sport ){
					cat = sports[n].notifications.category;
					for ( var o=0;o<sports[n].notifications.sport.length;o++){
						if ( sports[n].notifications.sport[o] ){
							if ( $.inArray(sports[n].notifications.sport[o].type, sendToTypes) > -1 && (sports[n].notifications.sport[o].description.toLowerCase().indexOf(term) > -1) ){
								l = sports[n].notifications.sport[o].description;
								v = cat + '|' + sports[n].notifications.sport[o].type + '|' + sports[n].notifications.sport[o].name + '|' + sports[n].notifications.sport[o].value;
								if (sports[n].notifications.sport[o].category){
									cat = sports[n].notifications.sport[o].category;
								}
								returnArray[returnArray.length] = {label: l, value: v};
							}
						}
					}
				}
				
				leagues = sports[n].leagues;
				if ( leagues ){
					for (var i=0;i<leagues.length;i++){

						// get the avail types, global cat
						notifications = leagues[i].notifications;
						category = leagues[i].category;
						leagueName = leagues[i].name;

						// lets add the sport root options to the return array
						leagueOptions = notifications.league;
						if ( leagueOptions ){
							for (var a=0;a<leagueOptions.length;a++){
								if ( $.inArray(leagueOptions[a].type, sendToTypes) > -1 && (leagueOptions[a].description.toLowerCase().indexOf(term) > -1 || leagueName.toLowerCase().indexOf(term) > -1) ){
									cat = leagueOptions[a].category||category;
									l = leagueOptions[a].description;
									v = cat + '|' + leagueOptions[a].type + '|' + leagueOptions[a].name + '|' + leagueOptions[a].value;
									returnArray[returnArray.length] = {label: l, value: v};
								}
							}

							// pull out global league types
							teamOptions = notifications.teams;
							athleteOptions = notifications.athletes;
							eventsOptions = notifications.events;

							if ( leagues[i].teams ){
								teams = leagues[i].teams;
								for (var a=0;a<teams.length;a++){

									abbrev = teams[a].abbrev||'';
									name = teams[a].name||'';
									teamId = teams[a].id;
									athletes = teams[a].athletes;

									// lets add the team options to the return array
									for (var b=0;b<teamOptions.length;b++){
										if ( $.inArray(teamOptions[b].type, sendToTypes) > -1 && (name.toLowerCase().indexOf(term) > -1 || abbrev.toLowerCase().indexOf(term) > -1) ){
											cat = teamOptions[b].category||category;
											l = name + ' ' + teamOptions[b].description;
											if ( cat == 5 ){
												l = l + ' (FB)';
											}
											v = cat + '|' + teamOptions[b].type + '|' + teamOptions[b].name + '|' + teamId;
											returnArray[returnArray.length] = {label: l, value: v};
										}
									}

									// lets add the team athlete options to the return array
									if ( athletes && athleteOptions ){
										for (var b=0;b<athletes.length;b++){

											name = athletes[b].name;
											athleteId = athletes[b].id;

											for (var c=0;c<athleteOptions.length;c++){
												if ( $.inArray(athleteOptions[c].type, sendToTypes) > -1 && (name.toLowerCase().indexOf(term) > -1) ){
													cat = athleteOptions[c].category||category;
													l = name + ' ' + athleteOptions[c].description;
													v = cat + '|' + athleteOptions[c].type + '|' + athleteOptions[c].name + '|' + athleteId;
													returnArray[returnArray.length] = {label: l, value: v};
												}
											}

										}
									}

								}
							} else if ( athleteOptions || eventsOptions ){
								// let's add the league-root's athletes
								athletes = leagues[i].athletes;
								events = leagues[i].events;

								if ( athleteOptions && athletes ){

									// lets add the athletes options to the return array
									for (var b=0;b<athletes.length;b++){
										name = athletes[b].name;
										athleteId = athletes[b].id;

										for (var c=0;c<athleteOptions.length;c++){
											if ( $.inArray(athleteOptions[c].type, sendToTypes) > -1 && (name.toLowerCase().indexOf(term) > -1) ){
												cat = athleteOptions[c].category||category;
												l = name + ' ' + athleteOptions[c].description;
												v = cat + '|' + athleteOptions[c].type + '|' + athleteOptions[c].name + '|' + athleteId;
												returnArray[returnArray.length] = {label: l, value: v};
											}
										}
									}

								}

								if ( eventsOptions && events ){

									// lets add the events options to the return array
									for (var b=0;b<events.length;b++){
										name = events[b].name;
										eventId = events[b].id;

										for (var c=0;c<eventsOptions.length;c++){
											if ( $.inArray(eventsOptions[c].type, sendToTypes) > -1 && (name.toLowerCase().indexOf(term) > -1) ){
												cat = eventsOptions[c].category||category;
												l = name + ' ' + eventsOptions[c].description;
												v = cat + '|' + eventsOptions[c].type + '|' + eventsOptions[c].name + '|' + eventId;
												returnArray[returnArray.length] = {label: l, value: v};
											}
										}
									}

								}
							}
						}
					}
				}
			}
			r(returnArray);
		}

		// init autocomplete
		autoCompleteField.autocomplete({
			source: fnSource,
			focus: fnFocus,
			select: fnSelect
		});
		
		// update categories based on api.
		selOptions = [];
		if ( espn.alerts.categories ){
			sports = espn.alerts.categories;
			lastCategoryId = -1; // this is to prevent soccer from showing up n times. // shouldn't need this anymore.
			for (var n=0;n<sports.length;n++){
				if ( sports[n].notifications && sports[n].notifications.sport ){
					key = sports[n].notifications.category;
					for ( var o=0;o<sports[n].notifications.sport.length;o++){
						if ( sports[n].notifications.sport[o] ){
							txt = sports[n].notifications.sport[o].description;
							if (sports[n].notifications.sport[o].category){
								key = sports[n].notifications.sport[o].category;
							}
							if ( key != null && txt ){
								if ( lastCategoryId != key ){
									selOptions.push('<option value="' + key + '">' + txt + '</option>');
									lastCategoryId = key;
								}
							}
						}
					}
				}
				leagues = sports[n].leagues;
				if ( leagues ){
					for (var i=0;i<leagues.length;i++){
						key = leagues[i].category;
						txt = leagues[i].name;
						if ( key == 10 ){ txt = "Soccer"; }
						if ( lastCategoryId != key ){
							selOptions.push('<option value="' + key + '">' + txt + '</option>');
							lastCategoryId = key;
						}
					}
				}
			}
		}
		/* hack here to add to the category drop down */
		/*selOptions.push('<option value="20">MLB Fantasy</option>');
		selOptions.push('<option value="21">NFL Fantasy</option>');
		selOptions.push('<option value="10">Soccer</option>');
		selOptions.push('<option value="36">Olympics</option>');*/
		categorySelectElements.append(selOptions.join(''));
		
		// bind to select elements
		categorySelectElements.change(function (e) {
			
			$option = $(this).children('option:selected');
			if ( $(this).attr('id') == categorySelectElement.attr('id') || parseInt($option.val()) == -1 ){
				tags.html('');
				stats.html('');
			}
			
			if ( parseInt($option.val()) != -1 ){

				// load the day's games into the select via the espn events api
				// still tbd if we need to do this

				// insert the sport-root news alert
				propertiesObj = createPropertiesObj({name: $option.html()});
				/*if ( propertiesObj.name.indexOf('News') == -1 ){
					propertiesObj.name += ' News';
				}*/
				if ( propertiesObj.category == 20 || propertiesObj.category == 21 ){
					propertiesObj.filterName = "fantasynews";
				}
				h = htmlTag(propertiesObj);
				/* hack for fantasy pref */
				tags.append(h);
				$.publish('espn.alerts.filterchange', [propertiesObj]);
				
				// this needs to be updated to listen to changes to the #tags div
				// espn.alerts.loadAndWriteMessages(propertiesObj,'.recent-alerts');

			}

		});
		
		// remove elements
		$('body').on('click',deleteTagElements,function(e){
			$tagEl = $(this).closest('div.tag');
			$sibling = $($tagEl.siblings()[0])||{};
			$tagEl.remove();
			dataObj = {};
			if ( $sibling ){
				dataObj.category = $sibling.attr('data-category');
				dataObj.type = $sibling.attr('data-type');
				dataObj.filterName = $sibling.attr('data-filterName');
				dataObj.filterValue = $sibling.attr('data-filterValue');
			}
			$.publish('espn.alerts.filterchange', [dataObj]);
			e.preventDefault();
		});
		
		// bind ajaxian send
		$('body').on('click',sendElement,function(e){
			sendAlert();
			e.preventDefault();
		});
		
		// bind the story and video preview loading
		$('body').on('blur','#videoId,#storyId',function(e){
			value = $(this).val();
			if ( value != null && value.trim() != '' ){
				type = $(this).attr('id').replace('Id','');
				updateElement = $('#details #'+type).html('');
				espn.api({
					url: 'http://qam.espn.go.com/alerts/admin/send/json/' + type + '?id=' + value,
					dataType: 'jsonp',
					success: function(j){
						h = '';
						if ( !j.error ){
							/*h = '<div><b>'+type.substring(0,1).toUpperCase()+type.substring(1)+':</b> '+j.headline;
							if ( j.description ){
								h += '<div class="desc">'+j.description+'</div>';
							}*/
							$('#text').attr('value',j.caption)
							//h += '</div>';
						}
						updateElement.html(h).parent().show();
					}, error: function(j){
						updateElement.html('<div>' + type + ': could not load content</div>').parent().show();
					}
				});
			}
		});
		
		// bind to the #tags change.
		
		// onload: breaking news alerts
		espn.alerts.loadAndWriteStatsAndMessages({types:sendToTypes.toString()},'#alerts-recent','#alerts-graph');
		
		// autocomplete failed
		if ( !espn.alerts.categories ){
			alert('autocomplete failed to init. (no data)');
		}

	}); // end jquery ready

})(jQuery);