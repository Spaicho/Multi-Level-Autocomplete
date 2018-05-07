/**
 * Get the favorite client's list.
 *
 * @return
 */
function getFavoriteClientList() {
	var url = '/CCCWeb/favoriteClient.do?' + $('#favoriteClientForm')
			.serialize();
	$.ajax( {
		dataType : "html",
		type : "GET",
		url : url,
		error : function(XMLHttpRequest, textStatus, errorThrown) {
			alert("Error while setting the client");
			stopBusyBox();
		},
		success : function(data, textStatus) {
			/* update the favoris clients list */
			$('#favoritesClients').replaceWith(data);
			setFavoriteClientButton(favoriteInputButton(),currentClient);
			stopBusyBox();
		}
	});
}

/**
 * Add the given counterparty to the favorite client list.
 *
 * @param counterpartyId
 * @return
 */
function addFavoriteClient(counterpartyId) {
	startBusyBox();
	var url = '/CCCWeb/favoriteClient.do';
	var dataString = $('#favoriteClientForm').serialize() + '&counterpartyId='
			+ counterpartyId;
	$.ajax( {
		dataType : "html",
		type : "POST",
		data : dataString,
		url : url,
		error : function(XMLHttpRequest, textStatus, errorThrown) {
			alert("Error while setting the client");
			stopBusyBox();
		},
		success : function(data, textStatus) {
			/* update the favoris clients list */
			$('#favoritesClients').replaceWith(data);
			setFavoriteClientButton(favoriteInputButton(),currentClient);
			stopBusyBox();
		}
	});
}

/**
 * Remove the selected counterparty from the list
 */
function removeCpty(counterpartyId) {
	var callFromButton = typeof  counterpartyId == 'undefined' ? false : true;
	startBusyBox();
	var url = '/CCCWeb/favoriteClient.do?__method=DELETE';
	var parameters = $('#favoriteClientForm').serialize();
	
	//counterpatyId defined mean call is from button
	if(callFromButton){
		parameters = parameters + '&counterpartyId=' + counterpartyId;
	}
		
	$.ajax( {
		dataType : "html",
		type : "POST",
		data : parameters,
		url : url,
		error : function(XMLHttpRequest, textStatus, errorThrown) {
			alert("Error while setting the client");
			stopBusyBox();
		},
		success : function(data, textStatus) {
			/* update the favoris clients list */
			$('#favoritesClients').replaceWith(data);
			setFavoriteClientButton(favoriteInputButton(),currentClient);
			/* set div visible */
			if(! callFromButton){
				var DivRef = document.getElementById('favoritesClients');
				DivRef.style.display = "block";
				DivRef.style.zIndex = 500;
			}
			stopBusyBox();
		}
	});
}

/**
 * PRIVATE
 */
function useSelectedFavoriteClientImpl() {
	// first get the selected counterparty
	var selectedCpty = $('#favoritesClientsList option:selected');
	if(selectedCpty.val() == null || selectedCpty.val() == "") {
		// warning message because no counterparty has been selected
		alert("Please select a client");
	} else {
		// set the isActiveCP value
		if($('#isActiveCPBox').attr('checked')){
	    	document.filteringForm.isActiveCP.value = true;
		} else {
			document.filteringForm.isActiveCP.value = false;
		}
		// call the parent useSelectedFavoriteClient JS function
		useSelectedFavoriteClient(selectedCpty.val(), selectedCpty.text());
	}
}

//list of favroites in the session, stored for in a field for js
function getFavoritesClientJson(){
	return JSON.parse($("#jsFavoritesClientJson").text());
}

function isClientFavorite(id){
	var res = $.grep(getFavoritesClientJson(),function(e){return e.id == id});
	return (res.length > 0);
}

function setFavoriteClientButton(element,id){
	console.log('setFavoriteClientButton');
	console.log(element);
	if(isClientFavorite(id)){
		$(element)
			.attr("title", "Remove favorite client")
			.addClass("ui-icon-star")
			.removeClass("ui-icon-star-b")
			.off("click")
			.on("click", function(event){
				console.log(event.target);
				console.log("remove favorite");
				removeCpty(id)
				});
	} else {
		$(element)
			.attr("title", "Add favorite client")
			.addClass("ui-icon-star-b")
			.removeClass("ui-icon-star")
			.off("click")
			.on("click", function(event){
				console.log(event.target);
				console.log("add favorite");
				addFavoriteClient(id);
			});
	}
	console.log(element);
	
}

var favoriteInputButton = function (){return $("#favoriteInputButton")};

$(document).ready(function() {
	/* when the page is ready, load the favorite client's list */
	//getFavoriteClientList();
});
