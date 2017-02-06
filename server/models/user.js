'use strict';
var ObjectID = require('mongodb').ObjectID;
var db = require('./index');
//var bcrypt = require('bcrypt');
//var ip = require('ip');
var utils = require('../utils/utils');
var broadcaster = require('broadcaster');
var md5 = require('md5');
var COLLECTION = 'user';
global.env = process.env.NODE_ENV || 'dev';
var authenticate = function(userPassword, storedPassword) {
    /*if (global.env == 'dev') {
        return true
    } else {
        return bcrypt.compareSync(userPassword, storedPassword);
    }*/
    if (md5(userPassword) === storedPassword) {
        return true
    } else {
        return false
    }
}
var encryptPassword = function(userPassword) {
        /*if (!userPassword) return '';
        if (global.env == 'dev') {
            return userPassword
        } else {
            var salt = bcrypt.genSaltSync(10);
            return bcrypt.hashSync(userPassword, salt);
        }*/
        return md5(userPassword)
    }
    // creating index
function setUpIndexing() {
    db.setUpIndexing(COLLECTION);
}

function User(obj) {
    this._id = obj && obj._id || undefined;
    this.userName = obj && obj.userName || "";
    this.password = obj && obj.password || "";
    this.firstName = obj && obj.firstName || "";
    this.lastName = obj && obj.lastName || "";
    this.gender = obj && obj.gender || "";
    this.dateOfBirth = obj && obj.dateOfBirth || "";
    this.mobileNumber = obj && obj.mobileNumber || "";
    this.email = obj && obj.email || "";
    this.securityQuestions = obj && obj.securityQuestions || [];
    this.resetKey = obj && obj.resetKey || "";
    this.role = obj && obj.role || "standard_user";
}
// authenticates an existing User
User.prototype.authenticate = function(signIn, cb) {
        var selector = {
            userName: signIn.userName
        };
        db.collection(COLLECTION).findOne(selector, function(err, result) {
            if (err) {
                cb(err, null)
            } else {
                if (result) {
                    if (authenticate(signIn.password, result.password)) {
                        cb(null, result);
                    } else {
                        cb(null, null);
                    }
                } else {
                    cb(null, null);
                }
            }
        });
    }
    // get a an User by id
User.prototype.getUserById = function(userId, cb) {
        db.collection(COLLECTION).findOne({
            '_id': new ObjectID(userId)
        }, utils.handleDBCallback(null, cb));
    }
    // get a an User by email
User.prototype.getUserByEmail = function(email, cb) {
        db.collection(COLLECTION).findOne({
            'email': email,
            markedForDeletion: false
        }, utils.handleDBCallback(null, cb));
    }
    // checks if the email exists
User.prototype.validateEmail = function(email, cb) {
        var selector = {
            email: email
        };
        db.collection(COLLECTION).findOne(selector, utils.handleDBCallback(null, cb));
    }
    // checks if the email exists
    // if exists, create a key and save it
User.prototype.verifyEmail = function(email, cb) {
        var selector = {
            email: email
        };
        var resetKey = (utils.getRandom(7) / 10000000) + 1
        resetKey = resetKey.toString(36).substring(7).toUpperCase();
        var updater = {
            "$set": {
                resetKey: resetKey
            }
        }
        var processor = function(result) {
            return result ? result.value : null;
        }
        db.collection(COLLECTION).findOneAndUpdate(selector, updater, {
            returnOriginal: false
        }, utils.handleDBCallback(processor, cb));
    }
    // checks if reset key is valid for an email
User.prototype.verifyResetKey = function(email, resetKey, cb) {
    var selector = {
        email: email,
        resetKey: resetKey
    };
    db.collection(COLLECTION).findOne(selector, utils.handleDBCallback(null, cb));
}

// checks if the email exists
User.prototype.validateUserName = function(userName, cb) {
        var selector = {
            userName: userName
        };
        db.collection(COLLECTION).findOne(selector, utils.handleDBCallback(null, cb));
    }
    // makes a new User and returns the User row
User.prototype.make = function(signUp, cb) {
        var user = new User(signUp);
        user.password = encryptPassword(user.password)
        user.dateOfBirth = new Date(user.dateOfBirth)
        var processor = function(result) {
            delete result.ops[0].password;
            delete result.ops[0].securityQuestions;
            delete result.ops[0].role;
            delete result.ops[0].resetKey;
            return result.ops[0]
        }
        db.collection(COLLECTION).insertOne(user, utils.handleDBCallback(processor, cb));
    }
    // update the emailValidated flag
    // set the resetKey
User.prototype.updateEmailValidated = function(UserRow, cb) {
        var selector = {
            _id: new ObjectID(UserRow.UserId),
            markedForDeletion: false,
            resetKey: UserRow.resetKey
        };
        var updater = {
            "$set": {
                emailValidated: true,
                resetKey: ""
            }
        }
        var processor = function(result) {
            return result ? result.value : null;
        }
        db.collection(COLLECTION).findOneAndUpdate(selector, updater, {
            returnOriginal: false
        }, utils.handleDBCallback(processor, cb));
    }
    // update the password for the User
User.prototype.updatePassword = function(userRow, cb) {
        var selector = {
            _id: new ObjectID(userRow._id)
        };
        var password = encryptPassword(userRow.password);
        var updater = {
            "$set": {
                password: password
            }
        }
        var processor = function(result) {
            return result ? result.value : null;
        }
        db.collection(COLLECTION).findOneAndUpdate(selector, updater, {
            returnOriginal: false
        }, utils.handleDBCallback(processor, cb));
    }
    // create a new login history in loginLog collection (UserId, loginTime, ipAddress, logoutTime)
User.prototype.login = function(UserId, cb) {
        var updater = {
            "UserId": UserId,
            "loginTime": new Date,
            // "ipAddress": ip.address(),
            "ipAddress": "",
            "logoutTime": ""
        };
        var processor = function(result) {
            // console.log("Result after login....");
            return result ? result.insertedIds[0] : null;
        }
        db.collection('loginLog').insert(updater, {
            returnOriginal: false
        }, utils.handleDBCallback(processor, cb));
    }
    // update User deatils
User.prototype.updateUser = function(userRow, cb) {
    var selector = {
        _id: new ObjectID(userRow._id)
    };
    delete userRow._id;
    if (userRow.dateOfBirth) {
        userRow.dateOfBirth = new Date(userRow.dateOfBirth)
    }
    if (userRow.password) {
        delete userRow.password
    }
    if (userRow.adminId) {
        delete userRow.adminId;
    }
    var updater = {
        "$set": userRow
    }
    var processor = function(result) {
        return result ? result.value : null;
    }
    db.collection(COLLECTION).findOneAndUpdate(selector, updater, {
        returnOriginal: false
    }, utils.handleDBCallback(processor, cb));
}


User.prototype.getUserList = function(userRow, cb) {
    var selector = {
        _id: new ObjectID(userRow._id),
        role: 'admin'
    };
    db.collection(COLLECTION).findOne(selector, function(error, result) {
        if (error) {
            cb(error, null)
        } else {
            if (result) {
                db.collection(COLLECTION).find().toArray(utils.handleDBCallback(null, cb));
            } else {
                cb(null, null)
            }

        }
    })
}

module.exports = new User;
broadcaster.on('db::connectedToDB', setUpIndexing);