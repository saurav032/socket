'use strict';

var clientConfigs = require('../configs/clientConfigs');
var serverConfigs = require('../configs/serverConfigs');
var constraintsList = require('../configs/constraints')
var routesList = require('../routes/routesList');
var utils = require('../utils/utils');
var _ = require('lodash');

module.exports = {

    get: function(req, res) {
        var response = {};
        var globals = req.session.globals || {}
        response.currentVersion = clientConfigs.currentVersion;
        response.baseUrl = (process.env.NODE_ENV ? 'https://' + req.headers.host : 'http://' + req.headers.host);
        response.serverUrl = serverConfigs.runTimeConfig[global.env].uri + ':' + serverConfigs.runTimeConfig[global.env].port;
        response.clientDebug = (process.env.NODE_ENV ? true : false);
        if (typeof globals.loggedIn === 'undefined' || globals.loggedIn === false) {
            response.loggedIn = false;
            response.defaultState = clientConfigs.defaultStateForNonLoggedInUser;
        } else {
            response.loggedIn = true;
            response.loginId = globals.loginId;
            response.jwt = globals.jwt;
            response.account = utils.formatUserRow(globals.account)
            response.defaultState = clientConfigs.defaultStateForLoggedInUser;
            if(globals.account.role == "admin"){
                response.defaultState = clientConfigs.defaultStateForLoggedInAdmin;
            }
        }
        response.roleList = clientConfigs.roleList;
        response.states = clientConfigs.states;
        response.constraints = constraintsList.constraints;
        response.defaultStateForNonLoggedInUser = clientConfigs.defaultStateForNonLoggedInUser;
        response.defaultStateForLoggedInUser = clientConfigs.defaultStateForLoggedInUser;
        response.resourceList = routesList.getResources();
        res.setHeader('Content-Type', 'text/javascript');
        res.send("var myAppGlobals = " + JSON.stringify(response));
    }
}
