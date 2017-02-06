// This file will have all the routes configured for this app
var routesList = require('./routesList').routesList;
var _ = require('lodash');
var utils = require('../utils/utils');
var validate = require("validate.js");
var jwt = require('../models').jwt;
var serverConfigs = require('../configs/serverConfigs');
var userModel = require('../models/user');

module.exports = {
    configureRoutes: function(app) {
        var authenticateRoute = function(isSecured) {
            return function(req, res, next) {
                if (isSecured === false) {
                    next()
                } else if (isSecured === true && req.session.globals.loggedIn === true) {
                    next()
                } else {
                    var error = {
                        nuageDMStatusCode: 401,
                        nuageDMStatusMessage: 'Not authorized'
                    }
                    utils.sendResponseForAPI(error, req, res, null);
                }
            }
        }
        var verifyJwtToken = function(tokenRequired) {
            return function(req, res, next) {
                if (tokenRequired) {
                    var jwtToken = utils.jwtToken(req.headers.authorization);
                    jwt.verify(jwtToken, serverConfigs.jwtSecret, function(tokenErr, tokenDecoded) {
                        if (tokenErr) {
                            var error = {
                                ndmStatusCode: 401,
                                ndmStatusMessage: JSON.stringify(tokenErr)
                            };
                            utils.sendResponseForAPI(error, req, res, null);
                        } else {
                            // console.log(new Date(tokenDecoded.exp))
                            userModel.getUserById(tokenDecoded.accountId, function(err, result) {
                                if (err) {
                                    var error = {
                                        ndmStatusCode: 401,
                                        ndmStatusMessage: 'invalid token'
                                    };
                                    utils.sendResponseForAPI(error, req, res, null);
                                } else {
                                    if (result && result._id) {
                                        next()
                                    } else {
                                        var error = {
                                            ndmStatusCode: 401,
                                            ndmStatusMessage: 'invalid token'
                                        };
                                        utils.sendResponseForAPI(error, req, res, null);
                                    }
                                }
                            })
                        }
                    });
                } else {
                    next()
                }
            }
        }
        var checkPermissions = function(accessTo) {
                return function(req, res, next) {
                    var allowed = false
                    if (accessTo == '*') {
                        next()
                    } else {
                        _.each(accessTo, function(customerType) {
                            if (_.indexOf(req.session.globals.customer.customerType, customerType) != -1) {
                                allowed = true
                            }
                        })
                        if (allowed) {
                            next()
                        } else {
                            var error = {
                                nuageDMStatusCode: 401,
                                nuageDMStatusMessage: 'Not authorized'
                            }
                            utils.sendResponseForAPI(error, req, res, null);
                        }
                    }
                }
            }
            // use routeName as the object key for data posted in the body for POST and PUT
        var checkConstraints = function(route) {
                return function(req, res, next) {
                    var constraints = route.constraints
                    var routeName = route.routeName
                    var params;
                    switch (req.method) {
                        case 'GET':
                        case 'DELETE':
                            params = req.params
                            break;
                        case 'POST':
                        case 'PUT':
                            params = req.body[routeName];
                            break;
                    }

                    var msg = [];
                    if (params) {
                        if (constraints) {
                            var validateMsg = validate(params, constraints);
                            if (validateMsg) msg.push(validateMsg);
                        } else {
                            msg.push('constraints object not found in route configs')
                        }
                    } else {
                        msg.push('params not present in get / post')
                    }

                    if (msg.length == 0) {
                        next()
                    } else {
                        var error = {
                            ndmStatusCode: 400,
                            ndmStatusMessage: JSON.stringify(msg)
                        };
                        utils.sendResponseForAPI(error, req, res, null);
                    }

                }
            }
            // console.log('configuring routes')
        _.each(routesList, function(route) {
            var handler = require('../controllers/' + route.routeController)
            var routeHandler;
            route.routeHandler ? routeHandler = route.routeHandler : routeHandler = route.routeMethod
            switch (route.routeMethod) {
                case 'get':
                    app.get(route.routeUrl, authenticateRoute(route.isSecured), verifyJwtToken(route.tokenRequired), checkPermissions(route.accessTo), checkConstraints(route), handler[routeHandler])
                    break;
                case 'post':
                    app.post(route.routeUrl, authenticateRoute(route.isSecured), verifyJwtToken(route.tokenRequired), checkPermissions(route.accessTo), checkConstraints(route), handler[routeHandler])
                    break;
                case 'put':
                    app.put(route.routeUrl, authenticateRoute(route.isSecured), verifyJwtToken(route.tokenRequired), checkPermissions(route.accessTo), handler[routeHandler])
                    break;
                case 'delete':
                    app.delete(route.routeUrl, authenticateRoute(route.isSecured), verifyJwtToken(route.tokenRequired), checkPermissions(route.accessTo), handler[routeHandler])
                    break;
            }
        })
    }
}