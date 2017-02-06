var serverConfigs = require('../configs/serverConfigs');
var handlebars = require('handlebars');
var fs = require('fs');
var path=require('path');
global.env = process.env.NODE_ENV || 'dev';

module.exports = {
    get : function(req,res) {
        var indexHtml = fs.readFileSync(path.join(__dirname, '../../client/dist/views/index.html'), "utf8");
        var compiledTemplate = handlebars.compile(indexHtml);
        var version = serverConfigs.version;
        res.setHeader('Content-Type','text/html; charset=utf-8');
        res.setHeader("Expires", new Date(Date.now()).toUTCString());
        res.send(compiledTemplate({version:version}));
    }
}