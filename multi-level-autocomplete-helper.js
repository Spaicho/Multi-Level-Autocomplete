/**
 * 	File containing helper functions to use multi-level-autocomplete widget
 * 
 */
    var savedUserFindValue = $("#savedUserFindValue");

function attachMultiLevelAutocomplete(input,select){
	   
	//inputs for search
    var userInput = $("#criterionInput");
    var userSelect = $("#filteringForm select");
    
    //fields to save/get user inputs while displaying non-editable search bar
    //hack ie : set to window to be considered globals for JSP in IE 
    window.savedUserFindValue = $("#savedUserFindValue");
    window.savedUserFindBy = $("#savedUserFindBy");
    
    //fields used to query server when an autoCompleted entry is selected
    var isAutoComplete = $("#isAutoComplete");
    var autoCompleteFindValue = $("#autoCompleteFindValue");
    var autoCompleteFindBy = $("#autoCompleteFindBy");
    
    //Misc
    var hook = $("#hookForAutocomplete");
    var obsPerimeter = $('#obsPerimeter').val();
    var findBy = $(userSelect).val();
    
    
    $( input ).multi-level-autocomplete({
		autoFocus: false, 
		delay		: 100,
		minLength	: 0, 
		messages	: {
			noResults: '',
		    results: function() {}
		},
		appendTo 	: hook,
		sources  	: [
			{ settings:
				{	id : "Recents",
					label : "Recents",
					isDisplayEmpty : false,
					child : {
						idProp:"key",
						labelProp:"value",
					}
				},
				source: getRecentClientsPerObs,
				args:[obsPerimeter]
			},
			{ settings:
				{	id : "Favorites",
					label : "Favorites",
					isDisplayEmpty : false,
					child : {
						idProp:"id",
						labelProp:"name",
					}
				},
				source: getFavoritesClientJson
			},
			{ settings:
				{	id : "Results",
					label : "Results",
					minLength : getMinLengthPerSearchMode,
					showFirst : true,
					async: true, 
					isDisplayEmpty : false,
					child : {
						idProp: "ricos",
						isList: isCphSearch,
						args: [userSelect],
						source: loadCphForItem,
					}
					
				},
				source: getClientsFromDB,
				args:[input,select]
			}
		],
		source : function(request,response){
			this.prepareSources(response);
		},
		
		select: function( event, ui ) {	
			//console.log('select triggered !');
			setAutocomplete(isAutoComplete,autoCompleteFindValue,autoCompleteFindBy,ui.item.id);
			doSearch();
		},
		focus: function( event, ui ) {
			console.log("focused ui item : " + ui.item.label + " deepSize : "+ ui.item.deepSize + " deepRenderSize : "+ ui.item.deepRenderSize);
			event.preventDefault();
			event.stopImmediatePropagation();
		},
		close: function( event, ui ) {
			//console.log('close triggered !');
		},
    })
    .click(function(event){
    	if(! isNonEditableSearchView){
    		$( input ).multi-level-autocomplete("search");
    	}
    })
    ;
    //$( input ).multi-level-autocomplete("destroy");
}

function getMinLengthPerSearchMode (){
	
	var MIN_LENGTH_FOR_RICOS_TCA = 1;
	var MIN_LENGTH_FOR_OTHER = 3;

	return ($("#filteringForm select").val() == "RICOS" || $("#filteringForm select").val() == "TCA") ? MIN_LENGTH_FOR_RICOS_TCA : MIN_LENGTH_FOR_OTHER;
}

function saveUserSearchInputs(input,select,clientId,ClientName){
	$('#savedUserFindValue').val($( input ).val().trim()); 
	$('#savedUserFindBy').val($( select ).val());
}

function saveUserInput(userInput,savedUserFindValue){
	$(savedUserFindValue).val($(userInput).val()); 
}

function retrieveAndClearUserInput(input){
	var res = $(input).val(); 
	$(input).val("");
	return res;
}

function setAutocomplete(flag, input, select, inputVal, selectVal){
	//flag is true mean server will use these fields to perform search
	$(flag).val(true);
	$(input).val(inputVal);
	$(select).val("RICOS");
}

function unsetAutocomplete(flag, input, select){
	//flag is false mean server will use usual fields to perform search
	$(flag).val(false);
	$(input).val("");
	$(select).val("");
}

function setNonEditableSearchView(input, select, inputVal){
	
	saveUserInput(input,savedUserFindValue);
	var inputDiv = $("#criterionInputDiv");
	
	$(input).val ( inputVal );
	$(input).attr('readonly', 'readonly');
	$(input).addClass('non-editable-view-input');
	$(inputDiv).addClass('non-editable-view-input');
	
	$(select).prop( "disabled", true );
	$(select).attr( "disabled", "disabled" );
	$(select).addClass('non-editable-view-input');
	
	showNonEditableViewButtons();
	isNonEditableSearchView = true;
	
	$("#editSearchInputButton").removeClass("ui-icon-undo");
	$("#editSearchInputButton").addClass("ui-icon-search");
	$("#editSearchInputButton").attr("title","Search");

	var clicks = 0;
	
	$(input).on('mousedown', function handler1(evt1) {
		$(input).on('mouseup mousemove', function handler2(evt2) {
		    if (evt2.type === 'mouseup' && (Math.abs(evt1.pageX - evt2.pageX) < 5 || Math.abs(evt1.pageY - evt2.pageY) < 5)) {
		    	
	    		clicks++;
	    		
	    		if (clicks == 1) {
                    setTimeout(function() {
                        if (clicks == 1) {
                            //alert('click');
                            unsetNonEditableSearchView(input,select);
           		    	 	$(input).off("mousedown", handler1);
           		    	 
                        } else if (clicks == 2) {
                            //alert('dblclick');
                        } else {
                            //alert('tripleclick');
                        }
                        clicks = 0;
                    }, 300);
                }
		    	
		    } else {
		    	//alert("drag");
		    }
		  $(input).off('mouseup mousemove', handler2);
	  });
	});
}

function unsetNonEditableSearchView(input, select){
	
	var savedInputVal = retrieveAndClearUserInput(savedUserFindValue);
	var inputDiv = $("#criterionInputDiv");
	
	$(input).val( savedInputVal );
	$(input).removeAttr('readonly');
	$(inputDiv).removeClass('non-editable-view-input');
	$(input).removeClass('non-editable-view-input');

	$(input).select();
	
	$(select).removeAttr( "disabled");
	$(select).removeClass('non-editable-view-input');
	
	showEditableViewButtons ();
	
	if($(select).val()!=='Name'){
		$("#activeCptyOnlyButton").hide();
	}
	
	$("#editSearchInputButton").removeClass("ui-icon-search");
	$("#editSearchInputButton").addClass("ui-icon-undo");
	$("#editSearchInputButton").attr("title","Cancel search");
	
	isNonEditableSearchView = false;

}

function showNonEditableViewButtons (){
	$(".non-editable-view-button").show();
	$(".editable-view-button").hide();
}

function showEditableViewButtons (){
	$(".non-editable-view-button").hide();
	$(".editable-view-button").show();
}
