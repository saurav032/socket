var serverConfigs = require('../configs/serverConfigs');
var dslog = require('../utils/dslog');
var MongoClient = require('mongodb').MongoClient
var broadcaster = require('broadcaster');
var jwt = require('jsonwebtoken');
var md5 = require('md5');

var db;

function init() {
    var env = global.env || 'dev';
    MongoClient.connect(serverConfigs.dbConfig[env].host, {
        server: serverConfigs.dbConfig[env].serverOptions
    }, function(err, dbConnection) {
        if (err) {
            dslog.error('error connecting to mongo db at ' + serverConfigs.dbConfig[env].host);
            console.log('error connecting to DB at ' + serverConfigs.dbConfig[env].host)
            console.log('aborting....')
            throw err;
        } else {
            dslog.info('connected to mongo db at ' + serverConfigs.dbConfig[env].host);
            console.log('connected to mongo db at ' + serverConfigs.dbConfig[env].host);
            db = dbConnection;
            console.log('emitting db connection')
            broadcaster.emit('db::connectedToDB')
            dbConnection.collection('user').find({
                "userName": "admin",
                "password": md5("admin")
            }).toArray(function(error, result) {
                if (error) {
                    console.log(error);
                } else {
                    if (result.length > 0) {} else {
                        dbConnection.collection('user').insertOne({
                            "userName": "admin",
                            "password": md5("admin"),
                            "role": "admin"
                        });
                    }
                }
            });
        }
    });
}

module.exports = {
    collection: function(model) {
        return db.collection(model);
    },
    setUpIndexing: function(dbCollection) {
        switch (dbCollection) {
            case 'account':
                break;
        }
    },
    jwt: jwt
}

init();