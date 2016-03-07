var count = 0;
self.onmessage = function(msg) {
	var msgArray = msg.data.split("~");
	// Get the lenght of the jsonArray1 from the worklist controller, to know where to start.
	count = msgArray[2];
	if (msgArray[0] === "initial") {
		sendWorkerArrBuff(msgArray[1]);
	}

};

function sendWorkerArrBuff(aBuf) {
	var jsonArray = [];
	var jsonArray1 = [];

	jsonArray = aBuf.split(',');
	var i = count;
	for (i; i <= jsonArray.length; i++) {
		jsonArray1.push(jsonArray[i]);
	}
	loadDetails(jsonArray1);
}

function loadItem(url) {
	return new Promise(function(resolve, reject) {
		// Do the usual XHR stuff
		var req = new XMLHttpRequest();
		req.open('GET', url);

		req.onload = function() {
			// This is called even on 404 etc
			// so check the status
			if (req.status == 200) {
				// Resolve the promise with the response text
				resolve(req.response);
			} else {
				// Otherwise reject with the status text
				// which will hopefully be a meaningful error
				reject(Error(req.statusText));
			}
		};

		// Handle network errors
		req.onerror = function() {
			reject(Error("Network Error"));
		};

		// Make the request
		req.send();
	});
}

function loadItemIE(url, callback) {
	// Do the usual XHR stuff
	var req = new XMLHttpRequest();

	req.onreadystatechange = function() {
		if (req.readyState == 4 && req.status == 200) {
			callback(req.response);
		}
	};

	req.open('GET', url, true);
	// Make the request
	req.send();

}
var resultArray = [];

function loadDetails(urls) {

	var targetUrls = urls.shift(); // process requests one at a time
	if (targetUrls) { // if not end of array

		var url = targetUrls.substring(15, targetUrls.length) + "?$format=json";

		// IE doesn't support promises in the web worker, so do it manually
		if (typeof(Promise) !== "undefined") {
			loadItem(url).then(function(resolve, reject) {

				var newEntry = JSON.parse(resolve);
				resultArray.push(newEntry.d);
				console.log(count + " entries cached");
				// Send request back to be put into the jsonModel
				postMessage(newEntry.d);
				count++;
				// Start over and get the next entry
				loadDetails(urls);
			}, function(err) {
				console.log(err);
				loadDetails(urls); // Error: "It broke"// recursion- call displayimages() again to process next image/doggy
			}).catch(function(url) { // handle an image not loading
				console.log('Error loading ' + url);
				loadDetails(urls); // recursion- call displayimages() again to process next image/doggy
			});
		} else {
			var responsefromIE;
			loadItemIE(url, function(response) {
				responsefromIE = response;
				if (typeof(responsefromIE) !== "undefined") {
					var newEntry = JSON.parse(responsefromIE);
					resultArray.push(newEntry.d);
					console.log(count + " entries cached");
					// Send request back to be put into the jsonModel
					postMessage(newEntry.d);
					count++;
					loadDetails(urls);
				}
			});
		}
	} else {
		postMessage("Done");

	}
}