const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const dotenv=require('dotenv').config().parsed;

let _db;

const mongoConnect = callback => {
  MongoClient.connect(
    `mongodb+srv://${dotenv.MONGO_USER}:${dotenv.DEFAULT_PASSWORD}@cluster0.z0rzwg9.mongodb.net/?retryWrites=true&w=majority`  //get from mongodb atlas
    //after creating an account.
    )
    .then(client => {
      console.log('Connected!');
      _db = client.db();
      callback();
    })
    .catch(err => {
      console.log(err);
      throw err;
    });
};

const getDb = () => {
  if (_db) {
    return _db;
  }
  throw 'No database found!';
};

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;
