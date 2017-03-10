var validUrl = require("valid-url");
var https = require("https");


function isTheURLValid(newURL){
    return typeof validUrl.isWebUri(newURL) !== "undefined";
}

function buildRequestBody(newURL){
    return JSON.stringify({
    "client": {
      "clientId":      "learningAPP-zelite@github",
      "clientVersion": "1.0.0"
    },
    "threatInfo": {
      "threatTypes":      ["MALWARE", "SOCIAL_ENGINEERING"],
      "platformTypes":    ["WINDOWS"],
      "threatEntryTypes": ["URL"],
      "threatEntries": [
        {"url": newURL}
      ]
    }
  });
}
  
var options = {
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
  method: "POST",
  hostname: "safebrowsing.googleapis.com",
  path: "/v4/threatMatches:find?key="+process.env.safeAPI
};
  

function isTheURLSafe(newURL, callback){
    var post_request = https.request(options, callback);
    var body = buildRequestBody(newURL);
    post_request.write(body);
    post_request.end();
}

module.exports = {
    isTheURLSafe: isTheURLSafe,
    isTheURLValid: isTheURLValid
};
