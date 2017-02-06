'use strict';
var utils = require('../utils/utils');
var _ = require('lodash');
var dslog = require('../utils/dslog');
var nodeUtil = require('util');

module.exports = {
    makeLog: function(req, res) {
        var makeLogRow = req.body.makeLog;
        if (req.session && req.session.globals && req.session.globals.account) {
            makeLogRow.accountId = req.session.globals.account._id;
            makeLogRow.userName = req.session.globals.account.userName;
        }
        req.logFile = 'client';
        dslog.error(req, nodeUtil.inspect(makeLogRow, {
            showHidden: true,
            depth: 99
        }));
        utils.sendResponseForAPI(null, req, res, null);
    }
}