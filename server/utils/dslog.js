var serverConfigs = require('../configs/serverConfigs')
var log4js = require('log4js');
var logAppenders = serverConfigs.logAppenders;
var env = process.env.NODE_ENV || 'dev';
var logFilePath = serverConfigs.runTimeConfig[env].logFilePath;

logAppenders.appenders.forEach(function(k,i) {
    if (k.filename) {
        k.filename = logFilePath + k.filename;
    }
});

log4js.configure(
    logAppenders
);
function logger(req) {
    if (req && req.logFile == 'client') {
        return log4js.getLogger('client');
    } else {
        return log4js.getLogger('server');
    }
}


module.exports = {
    'getLogger' : function (req) {
        return logger(req);
    },
    'trace':function(req,message){
        if (arguments.length >1) {
            logger(req).trace(message);
        } else {
            logger().trace(req);
        }
    },
    'debug':function(req,message){
        if (arguments.length >1) {
            logger(req).debug(message);
        } else {
            logger().debug(req);
        }
    },
    'info':function(req,message){
        if (arguments.length >1) {
            logger(req).info(message);
        } else {
            logger().info(req);
        }
    },
    'warn':function(req,message){
        if (arguments.length >1) {
            logger(req).warn(message);
        } else {
            logger().warn(req);
        }
    },
    'error':function(req,message){
        if (arguments.length >1) {
            logger(req).error(message);
        } else {
            logger().error(req);
        }
    },
    'fatal':function(req,message){
        if (arguments.length >1) {
            logger(req).fatal(message);
        } else {
            logger().fatal(req);
        }
    }
};
