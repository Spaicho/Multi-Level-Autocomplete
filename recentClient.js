/**
 * Manage recent clients list.
 * 
 * dependencies : jquery.cookie.js, lru.js
 */

function isDifferentFromLastObsClient (currentObs, currentClient, clientNotFound){
	
	//control input
	if($.type(currentObs) !== 'string' || !currentObs.trim())
		return false;
	if($.type(currentClient) !== 'string' || !currentClient.trim())
		return false;
	
	//proceed only if client exist
	if($.type(clientNotFound) === 'string' && clientNotFound.trim())
		return false;
	
	//check if different from last client per OBS from cookies
	var lastClientPerObsCookie = 'lastClientPerObsCookie'+currentObs;
	if($.cookie(lastClientPerObsCookie)===currentClient)
		return false;
	
	//else update last client per obs in cookies
	$.cookie(lastClientPerObsCookie,currentClient);
	return true;		
}

function addCurrentClientObsToRecents (currentObs, currentClient, currentClientName){
	
	var recentClientsPerObsCookie = 'recentClientsPerObsCookie'+currentObs;
	var LRU_SIZE = 16;
	var lru = new LRUCache(LRU_SIZE);
	
	var arr = getRecentClientsPerObs(currentObs);
	
	$.each(arr.reverse(), function(index, row){
		  lru.put(row.key,row.value);
		});
	
	lru.put(currentClient, currentClientName);		
	$.cookie(recentClientsPerObsCookie,JSON.stringify(lru.toJSON()),{ expires: 365 });
}

function getRecentClientsPerObs(currentObs){
	
	var recentClientsPerObsCookie = 'recentClientsPerObsCookie'+currentObs;
	
	if(!!$.cookie(recentClientsPerObsCookie)){	
		//reverse to get the right order
		var arr = JSON.parse($.cookie(recentClientsPerObsCookie)).reverse();
		var res = [];
		//TODO : this is temporary patch to remove bad recent entries, need to fix root issue
		var lastItem = { key : undefined, value : undefined};
		$.each(arr,function(index,item){
			if( $.trim(item.key).length===0 || $.trim(item.value).length===0 || item.key === '0000000000' || item.key ===lastItem.key || item.value ===lastItem.value){
				return true; //continue
			} else {
				lastItem = item;
				res.push(item)
			}				
		});
		return res;
	} else
		return [];
}
