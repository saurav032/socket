'use strict';
var ObjectID = require('mongodb').ObjectID;
var broadcaster = require('broadcaster');
var utils = require('../utils/utils');
var userModel = require('../models/user');
var dslog = require('../utils/dslog');
var jwt = require('../models').jwt;
var serverConfigs = require('../configs/serverConfigs');
var _ = require('lodash');

function updateSession(req, loggedIn, loginId, jwt, account) {
    console.log('update session')
    if (req.session && !req.session.globals) {
        req.session.globals = {};
    }
    if (req.session && req.session.globals) {
        if (loggedIn === true || loggedIn === false) {
            req.session.globals['loggedIn'] = loggedIn;
        }
        if (account != null) {
            req.session.globals['account'] = account;
        }
        if (loginId != null) {
            req.session.globals['loginId'] = loginId;
        }
        if (jwt != null) {
            req.session.globals['jwt'] = jwt;
        }
    }
}
module.exports = {
    signUp: function(req, res) {
        var signUp = req.body.signUp;
        var resetKey = (utils.getRandom(7) / 10000000) + 1;
        signUp.email = signUp.email.toLowerCase();
        signUp.resetKey = resetKey.toString(36).substring(7).toUpperCase();
        userModel.validateUserName(signUp.userName, function(err, result) {
            if (err) {
                utils.sendResponseForAPI(err, req, res, null);
            } else {
                if (result) {
                    utils.sendResponseForAPI(null, req, res, {
                        error: {
                            userName: signUp.userName + " already exist."
                        }
                    });
                } else {
                    userModel.validateEmail(signUp.email, function(err, result) {
                        if (err) {
                            utils.sendResponseForAPI(err, req, res, null);
                        } else {
                            if (result) {
                                utils.sendResponseForAPI(null, req, res, {
                                    error: {
                                        email: signUp.email + " already exist."
                                    }
                                });
                            } else {
                                makeAccount();
                            }
                        }
                    });
                }
            }
        });

        function makeAccount() {
            userModel.make(signUp, function(err, userResult) {
                if (err) {
                    utils.sendResponseForAPI(err, req, res, null);
                } else {
                    if (userResult) {
                        var emailData = {
                            to: userResult.email,
                            userName: userResult.userName,
                            firstName: userResult.firstName,
                            lastName: userResult.lastName,
                            userId: userResult._id,
                            password: signUp.password
                        }
                        broadcaster.emit('email::sendEmail', 'registrationConfirmation', emailData);
                        utils.sendResponseForAPI(null, req, res, {
                            data: utils.formatUserRow(userResult)
                        });
                    } else {
                        // create and send error
                        var error = {
                            ndmStatusCode: 500,
                            ndmStatusMessage: 'error creating user'
                        };
                        utils.sendResponseForAPI(error, req, res, null);
                    }
                }
            });
        }
    },
    signIn: function(req, res) {
        console.log('signIn')
        var signIn = req.body.signIn;
        userModel.authenticate(signIn, function(err, userResult) {
            if (err) {
                console.log(err);
                utils.sendResponseForAPI(err, req, res, null);
            } else {
                // var expires = moment().add('days', 7).valueOf();
                if (userResult) {
                    var jwtToken = jwt.sign({
                        accountId: userResult._id
                    }, serverConfigs.jwtSecret, {
                        expiresIn: serverConfigs.jwtTokenExpireTime
                    });
                    broadcaster.emit('session::updateSession', req, true, userResult._id, jwtToken, userResult);
                    utils.sendResponseForAPI(null, req, res, {
                        data: {
                            "account": utils.formatUserRow(userResult),
                            "jwt": jwtToken
                        }
                    });
                } else {
                    var error = {
                        ndmStatusCode: 404,
                        ndmStatusMessage: 'user not found'
                    };
                    console.log(error);
                    utils.sendResponseForAPI(error, req, res, null);
                }
            }
        });
    },
    // validate if the email exists. if exists return false.
    // used by email validator during sign up, not allow two users with same email
    validateEmail: function(req, res) {
        var email = req.params.email;
        if (email) email = email.toLowerCase();
        userModel.validateEmail(email, function(err, result) {
            if (err) {
                utils.sendResponseForAPI(err, req, res, null);
            } else {
                if (result) {
                    // email is present, so return false
                    utils.sendResponseForAPI(null, req, res, {
                        validEmail: false
                    });
                } else {
                    utils.sendResponseForAPI(null, req, res, {
                        validEmail: true
                    });
                }
            }
        });
    },
    validateUserName: function(req, res) {
        var userName = req.params.userName;
        userModel.validateUserName(userName, function(err, result) {
            if (err) {
                utils.sendResponseForAPI(err, req, res, null);
            } else {
                if (result) {
                    // usename is present, so return false
                    utils.sendResponseForAPI(null, req, res, {
                        validUserName: false
                    });
                } else {
                    utils.sendResponseForAPI(null, req, res, {
                        validUserName: true
                    });
                }
            }
        });
    },
    // logout
    logout: function(req, res) {
        req.session.globals = null;
        req.session.destroy();
        res.writeHead(302, {
            'Location': '/'
        });
        res.end();
    },
    // update password
    updatePassword: function(req, res) {
        var userRow = req.body.updatePassword;
        console.log("updatePassword");
        userModel.updatePassword(userRow, function(err, result) {
            if (err) {
                utils.sendResponseForAPI(err, req, res, null);
            } else {
                if (result) {
                    // update session data when password changed by user 
                    broadcaster.emit('session::updateSession', req, true, null, null, result);
                    utils.sendResponseForAPI(null, req, res, {
                        userRow: utils.formatUserRow(result)
                    });
                } else {
                    // create and send error
                    var error = {
                        ndmStatusCode: 500,
                        ndmStatusMessage: 'error updating password'
                    };
                    utils.sendResponseForAPI(error, req, res, null);
                }
            }
        });
    },
    // update user
    updateUser: function(req, res) {
        console.log('update user');
        var updateUser = req.body.updateUser;
        var adminId = _.clone(updateUser.adminId);
        userModel.updateUser(updateUser, function(err, result) {
            if (err) {
                utils.sendResponseForAPI(err, req, res, null);
            } else {
                if (result) {
                    // console.log(result)
                    // update the session data
                    if(!adminId){
                        broadcaster.emit('session::updateSession', req, true, null, null, result);
                    }
                    utils.sendResponseForAPI(null, req, res, {
                        data: utils.formatUserRow(result)
                    });
                } else {
                    var error = {
                        ndmStatusCode: 500,
                        ndmStatusMessage: 'error updating user'
                    };
                    utils.sendResponseForAPI(error, req, res, null);
                }
            }
        });
    },
    getUserList: function(req, res) {
        var getUserList = req.body.getUserList;
        userModel.getUserList(getUserList, function(err, result) {
            if (err) {
                utils.sendResponseForAPI(err, req, res, null);
            } else {
                var filteredResult = _.filter(result, function(item, index) {
                    if (getUserList._id != item._id && item.role != 'admin') {
                        delete result[index].password
                        delete result[index].resetKey
                        delete result[index].securityQuestions
                        return item
                    }
                })
                utils.sendResponseForAPI(null, req, res, {
                    data: filteredResult
                });
            }
        });
    }
}
broadcaster.on('session::updateSession', updateSession);