var helmet = require("helmet");
var express = require("express");
var validateURL = require("./validateURL.js");
var shorten = require("./shortenURL.js");
var mongodb = require("mongodb");
var url = require("url");
var MONGODB_URI = process.env.MONGO_URI;
var db;
var coll;


var app = express();
app.use(helmet());

app.use(express.static('public'));


app.get(/^\/\w+$/, function(request, response, next){
    var shortURL = request.url.slice(1);
    shorten.getTargetForURL(shortURL, coll, function(err, result){
        if(err){
            response.status(404).redirect("/notfound.html");
        }else{
            response.redirect(result);
        }
    });
});

var NEW_SHORT_URL_PATH = "/new/*";

app.get(NEW_SHORT_URL_PATH, function(request, response, next){
    var urlToShorten = request.url.slice(NEW_SHORT_URL_PATH.length-1);
    //var urlSafetyStatus = validateURL.isURLSafeAndValid(urlToShorten);
    if(!validateURL.isTheURLValid(urlToShorten)){
        response.send({error:"invalid URL"});
    }else{
        validateURL.isTheURLSafe(urlToShorten, function(responseSafeAPI){
            var receivedData = "";
            responseSafeAPI.on("data", function(chunk){
                receivedData += chunk;
            });
            responseSafeAPI.on("end", function(chunk){
                if(receivedData === "{}\n"){
                    shorten.getShortUrl(urlToShorten, coll, function(err, result){
                        if(err){
                            next(err);
                        }
                        response.send({longurl: result.longurl,
                                       shorturl: url.format({
                                           protocol: request.protocol,
                                           host: request.hostname,
                                           pathname: result.shorturl})});
                    });
                }else if(responseSafeAPI.statusCode === 200){
                    response.send({error: "the URL is not safe to browse."});
                }else{
                    console.log(responseSafeAPI.statusCode);
                    console.log(receivedData);
                    response.send({error: "error contacting google safe browsing api"});
                }
            });

        });
    }
});

app.get("/*", function(request, response, next){
    if(request.url == "favicon.ico"){
      response.sendStatus(404);
    }else{
      response.status(404).redirect("/notfound.html");
    }
});


app.use(function(error, request, response, next){
    console.log("This was an error.");
    console.log(error);
});


// Initialize connection once

mongodb.MongoClient.connect(MONGODB_URI, function(err, database) {
  if(err) throw err;

  coll = database.db("zelite-sandbox").collection('urlshortener');

  app.listen(process.env.PORT);
  console.log('Listening on port'+process.env.PORT);
});
