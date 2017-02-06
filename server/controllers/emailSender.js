// listener functions for asynchronous actions like email
var broadcaster = require('broadcaster');
var emailSend = require('../utils/emailSend');
var dslog = require('../utils/dslog');
var serverConfigs = require('../configs/serverConfigs');
var emailConfigs = require('../configs/emailConfigs');
var _ = require('lodash');
var handlebars = require('handlebars');
var utils = require('../utils/utils');

var fs = require('fs');
var path = require('path');
var emailList = {};
// returns the html for the body
function getBodyTemplate(bodyTemplate) {
    return (fs.readFileSync(path.join(__dirname, emailConfigs.templatePath + bodyTemplate), "utf8"));
}
// load the email configs, precompile the templates in handlebars and have it ready for generating html
function init() {
    var headerTemplate = fs.readFileSync(path.join(__dirname, emailConfigs.templatePath + '/header.html'), "utf8");
    var footerTemplate = fs.readFileSync(path.join(__dirname, emailConfigs.templatePath + '/footer.html'), "utf8");
    // register the partials
    handlebars.registerPartial('emailHeader', headerTemplate);
    handlebars.registerPartial('emailFooter', footerTemplate);
    _.map(emailConfigs.emailList, function(item) {
        if (item.template) {
            // note each of the email partials have to be registered
            handlebars.registerPartial(item.name, getBodyTemplate(item.template));
            // compile the template after combinding header+body+footer
            item.compiledTemplate = handlebars.compile(headerTemplate + getBodyTemplate(item.template) + footerTemplate);
            emailList[item.name] = item;
        } else {
            dslog.error('email::emailSender - template not defined for ' + item.title);
        }
    });
}

function prepareSubjectLine(subjectLine, emailData) {
    // compile the subject line
    var compiledLine = handlebars.compile(subjectLine);
    return compiledLine(emailData);
}
// common function to send email
// emailName should match the 'name' attribute in emailConfigs
// emailData contains all the optional data required by the controller
function sendEmail(emailName, emailData) {
    var emailObj = emailList[emailName];
    if (emailObj) {
        var emailInformation = {}
        emailInformation.domain = serverConfigs.runTimeConfig[global.env].destUrl;
        emailInformation.subject = emailObj.subject;
        emailInformation.title = emailObj.title;
        var emailInfoFromController = emailControllers(emailObj.controller)(emailObj, emailData);
        _.each(emailInfoFromController, function(value, key) {
            emailInformation[key] = value
        });
        emailInformation.body = emailObj.compiledTemplate(emailInformation);
        if (emailInformation.to.indexOf('tfbnw.net') == -1) {
            emailSend.sendEmail(emailInformation, function(err, result) {
                dslog.info('Sending Email ' + emailObj.title);
                if (err) {
                    console.log('error');
                    console.log(err);
                    dslog.error(err);
                } else {
                    console.log(result);
                    dslog.info(result);
                }
            });
        } else {
            console.log('not sending email to tfbnw.net');
        }
    } else {
        dslog.error('email::emailSender - email configs not found');
    }
}
// ***** controllers for each of the email*****
// controller should return the complete data required for the template
function emailControllers(controllerName) {
    var controllers = {
        registrationConfirmationController: function(emailObj, emailData) {
            // required to apply the appropriate template
            emailData.registrationConfirmation = true;
            return emailData;
        },
        resetPasswordController: function(emailObj, emailData) {
            // required to apply the appropriate template
            emailData.resetPassword = true;
            emailData.resetPasswordUrl = serverConfigs.runTimeConfig[global.env].destUrl + '/#/rspp/' + emailData.to + '/' + emailData.resetKey;
            return emailData;
        }
    }
    return controllers[controllerName];
}
// initialize the email functions
init();
broadcaster.on('email::sendEmail', sendEmail);
