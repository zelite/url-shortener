//Trying to implement Optimistic Loop pattern from
// https://docs.mongodb.com/v3.0/tutorial/create-an-auto-incrementing-field/
// a bit tricky because of the async behaviour of the node mongdb driver


var Hashids = require("hashids");

var hashids = new Hashids(process.env.SALT);

function convertIdToshortURL(doc){
  return {longurl: doc.longurl, shorturl: hashids.encode(doc._id)};
}

function insertDocument(doc, targetCollection, callback) {
  function insertWithId(err, result, doc, id) {
    if (err && err.code !== 11000) {
      throw err;
    }
    else if (result && !err) {
      callback(null, result.ops);
      return;
    }
    doc._id = id;
    targetCollection.insert(doc, function(err, result) {
      insertWithId(err, result, doc, id + 1);
    });

  }
  targetCollection.find({}, {
    _id: 1
  }).sort({
    _id: -1
  }).limit(1).toArray(
    function(err, result) {
      if (err) {
        throw err;
      }
      var id = result[0]._id+1;

      insertWithId(null, null, doc, id);
    });
}


function getShortUrl(url, db_coll, callback){
    db_coll.find({longurl: url}).toArray(function(err, result){
      if(err){
        throw err;
      }
      if(result.length !== 0){
        callback(null, convertIdToshortURL(result[0]));
      }else{
        insertDocument({longurl: url}, db_coll, function(err, result){
          callback(err, convertIdToshortURL(result[0]))}
          );
      }
    });
}


function getTargetForURL(shortURL, db_coll, callback){
    var id = hashids.decode(shortURL)[0];
    db_coll.find({_id: id}).toArray(function(err, result){
      if(err){
        throw err;
      }
      if(result.length === 0){
        callback({error: "URL not in database"});
      }else{
        callback(null, result[0].longurl);
      }
    });
}

module.exports = {
    getShortUrl: getShortUrl,
    getTargetForURL: getTargetForURL
};





