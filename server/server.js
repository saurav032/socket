'use strict';
global.env = process.env.NODE_ENV || 'dev';
var connect = require('connect');
var express = require('express');
var _ = require('lodash');
var log4js = require('log4js');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var dslog = require('./utils/dslog');
var utils = require('./utils/utils');
var serverConfigs = require('./configs/serverConfigs');
var favicon = require('serve-favicon');
var session = require('express-session');
var mongoStore = require('connect-mongo')(session);
var db = require('./models');
var app = module.exports = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var path = require('path');
require('./controllers/emailSender')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(session({
    secret: 'nuage@@device@@management',
    saveUninitialized: false, // don't create session until something stored
    resave: false, //don't save session if unmodified
    store: new mongoStore({
        url: serverConfigs.dbConfig[global.env].host,
        mongoOptions: serverConfigs.sessionConfig[global.env]
    })
}));

app.set('view engine', 'html');
// dist folder has all the public files
/*app.set('views', __dirname + '../../client');*/

app.set('views', (path.join(__dirname, '../client/')));

app.set('view options', {
    layout: false
});

app.engine('html', require('ejs').renderFile);
/*app.use(express['static'](__dirname + '../../client', {
    maxAge: 86400000
}));*/

app.use(express.static(path.join(__dirname, '../client/')));

app.use(function(req,res,next) {
    if (req.url.indexOf('/views') > -1) {
        var urlPath = req.url.substr(1,req.url.length);
        res.render(urlPath)
    } else {
        next();
    }
});

app.use(function(req, res, next) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
});
// configure logging
app.use(log4js.connectLogger(dslog.getLogger(), {
    level: 'auto',
    format: ':remote-addr - :method :url :status - :user-agent - :content-length :response-time ms'
}));
function NotFound(msg) {
    console.dir(msg)
    this.name = 'NotFound';
    Error.call(this, msg);
}
// error handling
app.use(function(err, req, res, next) {
    // if an error occurs Connect will pass it down
    // through these "error-handling" middleware
    // allowing you to respond however you like
    dslog.error(err);
    console.dir(err);
    var error;
    if (err instanceof NotFound) {
        error = {
            ndmStatusCode: 404,
            ndmStatusMessage: 'Resource not found'
        };
        utils.sendResponseForAPI(error, req, res, null);
    } else {
        error = {
            ndmStatusCode: 500,
            ndmStatusMessage: 'An unexpected server error occurred'
        }
        utils.sendResponseForAPI(error, req, res, null);
    }
})
process.on('uncaughtException', function(err) {
    console.log((new Date()) + "UNCAUGHT EXCEPTION **********************************************");
    console.log(err);
    console.log(err.stack);
    dslog.error('Uncaught Exception')
    dslog.error(err)
    dslog.error(err.stack)
    throw err;
});
process.on('exit', function(code) {
    console.log('About to exit with code:', code);
    dslog.error('About to exit with code');
    dslog.error(code)
});
var clients = []
io.on('connection', function(socket) {
    socket.on('storeClientInfo', function(data) {
        var clientInfo = new Object();
        clientInfo.userId = data.userId;
        clientInfo.clientId = socket.id;
        clients.push(clientInfo);
        socket.emit('userInfo', clients);
        socket.broadcast.emit('userInfo', clients);
    });
    socket.on('disconnect', function(data) {
        for (var i = 0, len = clients.length; i < len; ++i) {
            var c = clients[i];
            if (c.clientId == socket.id) {
                clients.splice(i, 1);
                socket.emit('userInfo', clients);
                socket.broadcast.emit('userInfo', clients);
                break;
            }
        }
    });
});
// load routes
require('./routes/routesConfigs').configureRoutes(app)
    //start app
server.listen(process.env.PORT || serverConfigs.runTimeConfig[global.env].port, null);
dslog.info('Running in ' + global.env + ' mode @ ' + serverConfigs.runTimeConfig[global.env].uri + ':' + serverConfigs.runTimeConfig[global.env].port);
console.log('Running in ' + global.env + ' mode @ ' + serverConfigs.runTimeConfig[global.env].uri + ':' + serverConfigs.runTimeConfig[global.env].port);