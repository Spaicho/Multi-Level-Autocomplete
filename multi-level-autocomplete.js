/**
 * customcomplete widget for multi-level lists suggestions
 * 
 * lists and sub-lists could be configured separately to be async or sync, arrays or callbacks ...
 * sub-lists are by default lazy loaded 
 * 
 * see defaultConfig for full all supported settings.
 * see customcompleteHelper.js for example of using.
 * 
 * 
 * Dependence : jquery-ui-1.12.1
 */

$.widget( "custom.customcomplete", $.ui.autocomplete, {
	options: {
		sources: null
	},
	defaultConfig : {
		id : "",
		label : "",
		minLength : 0,
		isList : true,
		isMainList : true,
		showFirst : false,
		async:false,
		initialSize : 5,
		pageSize : 100,
		isDisplayEmpty : false,
		filter: false,
		child : {
			idProp : "id",
			labelProp : "label",
			isList : false,
		}
  	},

	/**
	 * sources preparation : provide an array of sources and then call this method in the source option
	 * 
	 */
	
	prepareSources : function (response){

		var sources = [];
		var that = this;
		
		//TODO : control list of sources here (should contains non-optional vars like source ...)
		
		//prepare sync first
		$.each(that.options.sources,function(index,element){
			
			if(!element.settings.async){
				var res = that._prepareSource(element,that.defaultConfig);
				that._addToSources(res,sources);
			}
		});
		
		//if no async response and return
		if(!this._containsAsyncSource(that.options.sources)){
			response(sources);
			return;
		}
	
		//prepare async last
		var allPromises = [];
		$(that.element).addClass('ui-autocomplete-loading');
	
		$.each(that.options.sources,function(index,element){
			if(element.settings.async){
				var promise = that._prepareSource(element,that.defaultConfig);
				allPromises.push(promise)
				
				promise.then(function(res){
					that._addToSources(res,sources);
				});
			} 
		});
		
		$.when.apply($,allPromises)
			.done(function(){
				response(sources);
			}).fail(function(){
				alert("A problem occured while loading clients suggestions from server.");
			}).always(function(){
				$(that.element).removeClass('ui-autocomplete-loading');
			});	
	},
	
	_containsAsyncSource : function (sources){
		var res = false;
		$.each(sources,function(index,element){
			if(element.settings.async){
				res = true;
				return false; //break loop
			}
		});
		return res;
	},
	
	_prepareSource : function (element, defaultConfig){
	
		var settings 	= element.settings;
		var source	 	= element.source;
		var args 		= element.args;
		
	  	var config = $.extend(true, {}, defaultConfig, settings);
	  	var result = config; //TODO :  take only needed fields of config
	  	result.size = 0;
	  	
	  	var minLength = $.isFunction(config.minLength) ? config.minLength.apply(this,null) : config.minLength;
	    if(this.term.length < minLength)
	      return config.async ? $.Deferred().resolve(result) : result;
	
	    if($.isArray(source)){
	      return this._constructSource(result, source);
	    }
	
	    if(config.async){
	      var that = this;
	      var promise = new $.Deferred();
	      source.apply(this,args)
	      	.done(function(data){
	      		var res = that._constructSource(result, data);
	      		promise.resolve(res);
	      	})
	      	.fail(function (){
	    	  promise.reject([]);
	      });
	      return promise;
	    } else {
	        return this._constructSource(config, source.apply(this, args));
	    }
	},
	
	_constructSource : function(result, data){
	
	  	if(data.length > 0){
	  		var isChildList = $.isFunction(result.child.isList) ? result.child.isList.apply(this,result.child.args) : result.child.isList;
	  		var childSource = isChildList ? result.child.source : undefined;
	  		
	  		result.size = data.length;
	    	result.deepSize = data.length;
	    	result.isListLoaded = true;
	    	
	  		result.items = $.map(data, function (item) {
	  				var res = { //TODO : use same object structure as config for children
	  					id: item[result.child.idProp],
	  					label: item[result.child.labelProp],
	  					
	  					isList : isChildList,
	  					doLoadList : childSource,
	  					isListLoaded : false,
	  					size : 0,
						deepSize : 0
	  				}
	  				res.parent = result;
	  				return res;
	  		});
	  	} else {
	      result.size = 0;
	      result.deepSize = 0;
	    }
	  	return result;
	},
	
	_addToSources : function (src,sources){
	    if(src.size > 0 || (src.size === 0 && src.isDisplayEmpty)){
	      if(src.showFirst){
	    	sources.unshift(src);
	      } else {
	    	sources.push(src);
	        
	      }
	    }
	},
	
	/**
	 *  override of super functions
	 */
	
	_create: function() {
			
		//Override handlers for keys ENTER and TAB
		this._on( this.element, {
			keydown: function( event ) {
	
				var keyCode = $.ui.keyCode;
				switch ( event.keyCode ) {
				case keyCode.ENTER:
					// when menu is open and has focus
					if ( this.menu.active ) {
						//prevent super event handler
						event.preventDefault();
						event.stopImmediatePropagation();
						
						var item = this.menu.active.data( "ui-autocomplete-item" );
						this._toggleListVisibilityHandler(event, item,this.menu.active, this);
					}
					break;
					
				case keyCode.TAB:
					if ( this.menu.active ) {
						//prevent super event handler
						event.preventDefault();
						event.stopImmediatePropagation();
						
						var item = this.menu.active.data( "ui-autocomplete-item" );
						this._toggleListVisibilityHandler(event, item, this.menu.active, this);
					}
					break;
				}
			}
		});
		
		this._super();
	    //this.widget().menu( "option", "items", "> :not(.ui-autocomplete-category)" );
	},
	
	_resizeMenu: function() {
		this.menu.element.outerWidth( 500 );
	},
	
	_renderItemData: function( ul, item ) {
		return this._renderItem( ul, item ).data( "ui-autocomplete-item", item );
	},
	
	_renderMenu: function( ul, items ) {
		var that = this;
		$.each( items, function( index, item ) {

			var li = that._renderItemData( ul, item );
			that._renderDirectChildren(item,ul,li,that);
		});
	},
	
	//TODO : separate style, rendering, and model
	_renderItem: function( ul, item ) {
		
		var that = this;
		var label = this._buildLiLabel(item);
		var itemPadding = this._buildLiPadding(item);
		
		var li = $( '<li>' )
			.css({ paddingLeft: itemPadding+'px'})
			.append( $('<div>') 							
				.addClass("detailsContainer")
				.css({ clear: 'both'})
				//Prevent selection events on outer div
				.click(function(event){ 
					event.stopPropagation(); 
				})
			);
			
		$(li).find("div.detailsContainer")
			.append( $( '<div>' ) 							
				.addClass("labelContainer")
				.text( label )
				//Handle selection events in inner div
				.click(function(event){ 
					that._toggleListVisibilityHandler(event, item, li, that);
				})
			);
			
		if(item.isList) {
			var divIcone = $( '<div>' ) 							
				.addClass("iconeContainer")
				.css({ float: 'left'})
				.click(function(event){ 
						that._toggleListVisibilityHandler(event, item, li, that);
				});
			
			if(item.isListLoaded)
				$(divIcone).addClass("ui-icon ui-icon-triangle-1-se");
			else
				$(divIcone).addClass("ui-icon ui-icon-triangle-1-e");
			
			$(li).find("div.detailsContainer").append( divIcone) ;							
				
			$(li).find("div.labelContainer")
				.css({ float: 'left'});
			
			$(li).find("div.detailsContainer")
				.append( $( '<div>' ) 							
				.addClass("showMoreContainer")
				.text( " Show more " )
				.css({ float: 'right',
					   fontStyle: 'italic'})
				//Handle selection events in inner div
				.click(function(event){
					that._showMoreItemsOfListHandler(event, item, li, that);
				})
			)
		}
		
		$(li).find("div.detailsContainer")
			.append( $( '<div>' ) 
				.css({ clear: 'both'})
			);
			
		//Style
		if(item.isList) {
			if(item.isMainList){
				console.log('render mainList : ' + item.label);
				$(li).css({ 
					fontWeight: "bold",
					margin: ".8em 0 0",
				});
			} 
			else {
				//console.log('render noraml list : ' + item.label);
				$(li).css({ 
					fontWeight: "bold",
	    			//padding: ".2em .4em",
	    			//margin: ".8em 0 .2em",
	    			//lineHeight: "1.2"
				});
			}
		} 
		return li.appendTo( ul );
	},
	
	/**
	 *  Helper functions for events handling and rendering
	 *
	 */
	
	_buildLiLabel : function (item){
		var res = item.isList && item.isListLoaded ? 
				item.label + "  (" + Math.min(item.initialSize,item.size) + "/" + item.size + ")" : 
				item.label;
		return res;
	
	},
	
	_buildLiPadding : function (item){
		var res = 0;
		var iter = item;
		while(iter.parent){
			res += 10;
			iter = iter.parent;
		}
		return res;
	},
	
	_showMoreItemsOfListHandler  : function (event,item,li,that) {
		if(!item.isListLoaded){
			$(that.element).addClass('ui-autocomplete-loading');
			var promise = item.doLoadList(item);
			promise.then(function (data){
				item.isListLoaded = true;
				$(that.element).removeClass('ui-autocomplete-loading');
				item.renderSize = 0;
				item.deepRenderSize = 0;
				that._insertMoreItems(event, item, li, that);
			})
		} else {
			that._insertMoreItems(event, item, li, that);
		}
	},
	
	_toggleListVisibilityHandler : function (event,item,ui,that) {
		
		if(item.isList){
			if (item.isListLoaded){
				
				item.isListHidden = !item.isListHidden;
				
				var skip = 0;
				if (item.isListHidden){
	    			$(ui).find("div.iconeContainer")
		    			.addClass("ui-icon-triangle-1-e")
		    			.removeClass("ui-icon-triangle-1-se")
		    			
					$(ui).nextAll()
						.slice(0,item.deepRenderSize)
						.removeClass("ui-menu-item") //remove class so li is not focused by key down and up
						.hide(); 
				} else {
					$(ui).find("div.iconeContainer")
	    				.addClass("ui-icon-triangle-1-se")
	    				.removeClass("ui-icon-triangle-1-e");
					$.each($(ui).nextAll().slice(0,item.deepRenderSize),function(index,li){
						// show only first level children
						if(skip>0){
							skip--;
							$(li).removeClass("ui-menu-item")
								.hide();
							$(li).find("div.iconeContainer")
			    				.addClass("ui-icon-triangle-1-e")
			    				.removeClass("ui-icon-triangle-1-se")
							return true; //continue
						}
						$(li).show();
						$(li).addClass("ui-menu-item");
							
						item = $(li).data("ui-autocomplete-item");
	
						if(item.isList){
							skip = item.deepRenderSize;
							item.isListHidden = true;
							$(li).find("div.iconeContainer")
							.addClass("ui-icon-triangle-1-e")
							.removeClass("ui-icon-triangle-1-se")
						}
							
					});
				}
			} else {
				
				console.log('nothing to hide cuz list in not loaded, start loading list');
				that._showMoreItemsOfListHandler(event,item,ui,that);
			}
			
		} else {
			console.log('item is not a list, allow select !');
			that._trigger('select', 'autocompleteselect', {item:item});
			$(that).trigger('close');
		}
	},
		
	_insertMoreItems : function (event,item,li,that) {
		console.log('insert more items to list : '+item.label);
		
		if(item.renderSize < item.size) {
			var ul = $(li).parent();
			var index = $(ul).children().index(li);
			var sliceStart = index + item.deepRenderSize +1;
			var cutLis = $(ul).children().slice(sliceStart).detach();
	
			that._renderMoreDirectChildren(event,item,ul,li,that);
			
			var label = item.isList ? item.label + "  (" + item.renderSize + "/" + item.size + ")" : item.label;
			$(li).find ("div.labelContainer").text(label);
			cutLis.appendTo (ul);
		} 
		
		if (item.renderSize === 0 && item.size === 0) {
			var label = item.isList ? item.label + "  (" + item.renderSize + "/" + item.size + ")" : item.label;
			$(li).find ("div.labelContainer").text(label);
		}
		if (item.renderSize >=  item.size && item.size > 0){
			$(li).find ("div.showMoreContainer").remove();
		} 
			
	},

	_renderDirectChildren: function(item,ul,li,that){
		
		var toRenderStart;
		var toRenderEnd;
		
		if(item.isList){
			if(! item.isListLoaded){
				item.renderSize = 0;
    			item.deepRenderSize = 0;
    			isListHidden = false;
			} else {
    			toRenderEnd = Math.min(item.size,item.initialSize);
    			toRenderStart = 0;
    			item.renderSize = toRenderEnd;
    			item.deepRenderSize = item.renderSize;
    			isListHidden = false;
    		
				$.each( item.items.slice(toRenderStart,toRenderEnd), function( index, item2 ) {
					item2.parent = item;
					that._renderItemData( ul, item2 );
				});
				
				if(item.renderSize === item.size && item.size > 0){
					$(li).find ("div.showMoreContainer").remove();
				}
					
			}
		} 
	},
	
	_renderMoreDirectChildren: function(event,item,ul,li,that){
		
		console.log('_renderMoreDirectChildren : ' + ul);
		var toRenderStart;
		var toRenderEnd;
		
		if(item.isList){
			if( ! item.renderSize){
				item.renderSize = 0;
				
				toRenderStart = 0;
				toRenderEnd = item.size > item.initialSize ? item.initialSize : item.size;
				
			} else {
				if(item.renderSize < item.size){
					toRenderStart = item.renderSize;
					toRenderEnd = item.size > item.renderSize + item.pageSize ? item.renderSize + item.pageSize : item.size;
				} else {
					console.log("no more children to fetch ! ");
					return;
				}
			}

			item.deepRenderSize = item.deepRenderSize - item.renderSize + toRenderEnd;
			item.renderSize = toRenderEnd;
			
			$.each( item.items.slice(toRenderStart,toRenderEnd), function( index, item2 ) {
				//update parent data in child, because it's not done automatically, weird !
				item2.parent = item; 
				var li2 = that._renderItemData( ul, item2 );
				
				//hack to avoid menu refresh after rendering new items, because refreshing menu mess with element classes
				that.menu._addClass( li2, "ui-menu-item" )
						 ._addClass( li2.children(), "ui-menu-item-wrapper" );
			});

			var iter = item;
			while(iter.parent){
				iter = iter.parent;
				iter.deepRenderSize += toRenderEnd - toRenderStart;
			}
			
			if(item.isListLoaded){
				$(li).find("div.iconeContainer").removeClass("ui-icon-triangle-1-e");
				$(li).find("div.iconeContainer").addClass("ui-icon-triangle-1-se");
			} else {
				$(li).find("div.iconeContainer").removeClass("ui-icon-triangle-1-se");
				$(li).find("div.iconeContainer").addClass("ui-icon-triangle-1-e");
			}

			if(item.isListHidden){
				that._toggleListVisibilityHandler(event,item,ul,that);
			}

		}
	}
});
