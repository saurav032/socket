var nodemailer = require("nodemailer");
var serverConfigs = require('../configs/serverConfigs');
var smtpTransport = nodemailer.createTransport("SMTP", serverConfigs.emailConfig[global.env]);
module.exports = {
    sendEmail: function(mailOptions, cb) {
        console.log('Sending Email');
        smtpTransport.sendMail(mailOptions, function(error, response) {
            if (error) {
                return cb(error, null);
            } else {
                return cb(null, response.message);
            }
        });
    }
}