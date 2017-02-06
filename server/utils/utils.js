// utility functions for reuse
var dslog = require('./dslog');
var _ = require('lodash');
var constraints = require('../configs/constraints')
var validate = require("validate.js");
module.exports = {
    jwtToken : function(token){
        if(token){
            return token.replace("Bearer", "").trim()
        } else{
            return token
        }
    },
    // generic db callback handler
    // processor is a function to manipulate the results before call back
    handleDBCallback: function(processor, cb) {
        return function(err, results) {
            if (err) {
                console.log(err);
                cb(err, null)
            } else {
                if (results) {
                    var response = processor ? processor(results) : results;
                    // console.log(response);
                    cb(null, response);
                } else {
                    // console.log('no data');
                    cb(null, null)
                }
            }
        }
    },
    handleResponse: function(req, res, processor) {
        return function(err, results) {
            if (err) {
                module.exports.sendResponseForAPI(err, req, res, null);
            } else {
                var response = processor(results)
                module.exports.sendResponseForAPI(null, req, res, response);
            }
        }
    },
    sendResponseForAPI: function(err, req, res, data) {
        var statusMessage;
        res.setHeader('Content-Type', 'application/json');
        if (err) {
            if (_.has(err, 'ndmStatusCode')) {
                res.statusCode = err.ndmStatusCode;
                if (_.isObject(err.ndmStatusMessage)) {
                    statusMessage = _.values(err.ndmStatusMessage)
                        // _.values returns an array
                    if (_.isArray(statusMessage)) {
                        statusMessage = _.flatten(statusMessage)
                    }
                } else {
                    statusMessage = err.ndmStatusMessage
                }
                res.setHeader('x-nuagedm-status', statusMessage);
                dslog.error({
                    url: req.route,
                    method: req.method
                }, {
                    statusCode: res.statusCode,
                    statusMessage: statusMessage
                });
            } else {
                res.statusCode = 500;
                res.setHeader('x-nuagedm-status', 'Critical Error')
                dslog.error({
                    url: req.route,
                    method: req.method
                }, {
                    error: err
                });
            }
            res.send('')
        } else {
            switch (req.method) {
                case 'GET':
                case 'PUT':
                    res.statusCode = 200;
                    break;
                case 'POST':
                    res.statusCode = 201;
                    break;
                case 'DELETE':
                    res.statusCode = 204;
                    break;
            }
            res.setHeader('x-nuagedm-status', 'Success');
            dslog.info({
                url: req.route,
                method: req.method
            }, {
                statusCode: res.statusCode,
                statusMessage: 'Success'
            });
            res.send(data ? data : '');
        }
    },
    // loop through the object and convert the date time to unix ts
    convertToUnixTS: function(obj, keyArray) {
        _.each(_.keys(obj), function(key) {
            if (keyArray.indexOf(key) > -1) {
                obj[key] = (obj[key].getTime()) / 1000
            }
        })
        return obj
    },
    // removes attributes that are not required.
    // supports an array of objects too !!
    removeAttributes: function(objToEdit, attrsArray) {
        if (_.isArray(objToEdit)) {
            //var newObject = JSON.parse(JSON.stringify(objToEdit));
            var newObject = objToEdit;
            _.each(newObject, function(obj) {
                if (_.isArray(attrsArray)) {
                    _.each(attrsArray, function(attr) {
                        delete obj[attr]
                    })
                }
            })
        } else {
            var newObject = JSON.parse(JSON.stringify(objToEdit));
            if (_.isArray(attrsArray)) {
                _.each(attrsArray, function(attr) {
                    delete newObject[attr]
                })
            }
        }
        return newObject
    },
    usTimeZones: [{
        "offset": "eastern:-05:00",
        "label": "EST"
    }, {
        "offset": "eastern:-04:00",
        "label": "EDT"
    }, {
        "offset": "central:-06:00",
        "label": "CST"
    }, {
        "offset": "central:-05:00",
        "label": "CDT"
    }, {
        "offset": "mountain:-07:00",
        "label": "MST"
    }, {
        "offset": "mountain:-06:00",
        "label": "MDT"
    }, {
        "offset": "pacific:-08:00",
        "label": "PST"
    }, {
        "offset": "pacific:-07:00",
        "label": "PDT"
    }, {
        "offset": "alaska:-09:00",
        "label": "AKST"
    }, {
        "offset": "alaska:-08:00",
        "label": "AKDT"
    }],
    getTimezoneLabel: function(offset) {
        var label = null
        _.each(module.exports.usTimeZones, function(timeZone) {
            if (timeZone["offset"] == offset) {
                label = timeZone.label
            }
        })
        return label
    },
    minutesOffsetDict: {
        "-0000": "0",
        "-0100": "60",
        "-0200": "120",
        "-0300": "180",
        "-0400": "240",
        "-0500": "300",
        "-0600": "360",
        "-0700": "420",
        "-0800": "480",
        "-0900": "540",
        "-1000": "600",
        "-1100": "660",
        "-1200": "720"
    },
    getRandom: function(length) {
        return Math.floor(Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1));
    },
    deleteFile: function(fileName) {
        var fs = require('fs');
        fs.unlinkSync(fileName);
    },
    // takes an object , matches it to the validation and runs it through the validator
    validate: function(obj) {
        var msg = [];
        var ObjKey = Object.keys(obj)[0]
            // find the obj and run it through the validation
        if (constraints[ObjKey]) {
            _.each(obj[ObjKey], function(value, key) {
                if (constraints[ObjKey][key]) {
                    var valueObj = {}
                    valueObj[key] = value
                    var validateObj = {}
                    validateObj[key] = constraints[ObjKey][key]
                    var validateMsg = validate(valueObj, validateObj)
                    if (validateMsg) msg.push(validateMsg);
                } else {
                    msg.push('constraint not found for ' + key)
                }
            })
        } else {
            msg.push('validation object not found in configs')
        }
        return msg;
    },
    formatUserRow: function(userResult) {
        return {
            "_id": userResult._id,
            "userName": userResult.userName,
            "firstName": userResult.firstName,
            "lastName": userResult.lastName,
            "gender": userResult.gender,
            "dateOfBirth": userResult.dateOfBirth,
            "mobileNumber": userResult.mobileNumber,
            "email": userResult.email,
            "role": userResult.role
        };
    },
    isInteger: function(x) {
        return Math.floor(x) === x;
    },
    isFloat: function(x) {
        return !!(x % 1);
    }
}