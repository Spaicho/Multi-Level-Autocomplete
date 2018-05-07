/**
 * Manage async loading of clients from server.
 * 
 */

function getClientsFromDB (input,select){
	
	var MAX_RESULT_SIZE = 15000;
	
	// get all the inputs into an array.
	var $inputs = $('#filteringForm input, #filteringForm select');
	var dataString = '';
	$inputs.each(function(i, el) {
		dataString = dataString + el.name + '=' + $(el).val() + '&';
	});

	var result =[];
	var promise = new $.Deferred();	
	
	$.ajax({
		async:true,
		dataType: "json",
		type: "post",
		data: dataString,
		url: "/CCCWeb/filterClientList.do?do=searchClient",
		error: function (XMLHttpRequest, textStatus, errorThrown) {
			console.log(textStatus);
			promise.reject(result);
		},
		success: function(data, textStatus) {
			if(data.rows.length > MAX_RESULT_SIZE){
				console.log("Too many results, truncated to : "+ MAX_RESULT_SIZE);
			}
			result = data.rows.slice(0,MAX_RESULT_SIZE);
			promise.resolve(result);
		}
	});
	
	return promise;
}


function isCphSearch (userSelect){
	return $(userSelect).val() === "CPH";
}

var loadCphForItem = function (item){
	
	$("#filteringForm [name='searchGroups']").val('false');
	$("#filteringForm [name='cphElements']").val('true');

	var $inputs = $('#filteringForm input, #filteringForm select');
	var dataString = '';
	$inputs.each(function(i, el) {
		var val = el.name =='criterion' ? item.label : $(el).val();
		dataString = dataString + el.name + '=' + val + '&';
	});
	
	var promise  = new $.Deferred();
		
	$.ajax({
		async:true,
		dataType: "json",
		type: "post",
		data: dataString,
		url: "/CCCWeb/filterClientList.do?do=searchClient",
		error: function (XMLHttpRequest, textStatus, errorThrown) {
			console.log(textStatus);
			promise.reject();
		},
		success: function(data, textStatus) {
			//TODO : this is a model layer ! don't create view elements here !
			item.initialSize = 10;
			item.pageSize = 500;
			//item.isListLoaded = true;

			item.items = $.map(data.rows, function (item2) {
				var res = {
					isList : false,
					id: item2.ricos,
					label: item2.label,
			    }
				res.parent = item;
				return  res;
			});
			
			item.size = data.rows.length;
			item.deepSize = data.rows.length;
			item.renderSize = 0;
			item.deepRenderSize = 0;
			//here update deepSize
			var iter = item;
			while(iter.parent){
				iter = iter.parent;
				iter.deepSize += data.rows.length;
			}
			promise.resolve();
		}
	});
		
	$("#filteringForm [name='cphElements']").val('false');
	$("#filteringForm [name='searchGroups']").val('true');
	
	return promise;
}
