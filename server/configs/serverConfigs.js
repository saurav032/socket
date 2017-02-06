'use strict';

var path = require('path');
// var devPort = Math.floor(1000 + Math.random() * 9000);
module.exports = {
    version: '0.0.1',
    sessionSecret: 'nuageDM',
    jwtSecret: 'My India',
    jwtTokenExpireTime: (1 * 24 * 60 * 60), // 1 day 
    logAppenders: {
        appenders: [{
            'category': 'server',
            'type': 'file',
            'filename': 'ds-server.log',
            'maxLogSize': 102400,
            'backups': 30,
            'pollInterval': 15
        }, {
            'category': 'client',
            'type': 'file',
            'filename': 'ds-client.log',
            'maxLogSize': 102400,
            'backups': 30,
            'pollInterval': 15
        }],
        'levels': {
            '[all]': 'TRACE'
        }
    },
    baseDir: '/',
    runTimeConfig: {
        'dev': {
            uri: 'http://localhost',
            port: 9999,
            destUrl: 'http://localhost:9999',
            baseDir: path.join(__dirname, '../../'),
            logFilePath: './logs/'
        }
    },
    sessionConfig: {
        dev: {
            ttl: 14 * 24 * 60 * 60, // = 14 days. Default
            touchAfter: 24 * 3600 // time period in seconds
        }
    },
    dbConfig: {
        dev: {
            host: "mongodb://localhost:27017/nuageDM",
            dbOptions: {
                native_parser: true
            },
            serverOptions: {
                'auto_reconnect': true,
                'poolSize': 5
            }
        }
    },
    emailConfig: {
        'dev': {
            service: "Gmail",
            auth: {
                user: "sauravwaste@gmail.com",
                pass: "bholu12345"
            }
        }
    },
}