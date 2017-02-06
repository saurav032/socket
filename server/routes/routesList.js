var _ = require('lodash');
var constraints = require('../configs/constraints')
module.exports = {
    routesList: [{
        routeName: 'home',
        routeUrl: '/',
        routeMethod: 'get',
        routeController: 'index',
        routeHandler: null,
        accessTo: '*',
        isSecured: false,
        tokenRequired: false,
        isArray: false,
        cache: false,
        data: null,
        params: {},
        constraints: constraints['home']
    }, {
        routeName: 'getConfig',
        routeUrl: '/config/:versionNo',
        routeMethod: 'get',
        routeController: 'config',
        routeHandler: null,
        accessTo: '*',
        isSecured: false,
        tokenRequired: false,
        isArray: false,
        cache: false,
        data: null,
        params: {},
        constraints: constraints['getConfig']
    }, {
        routeName: 'signUp',
        routeUrl: '/signUp/:versionNo',
        routeMethod: 'post',
        routeController: 'user',
        routeHandler: 'signUp',
        accessTo: '*',
        isSecured: false,
        tokenRequired: false,
        isArray: false,
        cache: false,
        data: { signUp: '@signUp' },
        params: { versionNo: '1.0.0' },
        constraints: constraints['home']
    }, {
        routeName: 'signIn',
        routeUrl: '/signIn/:versionNo',
        routeMethod: 'post',
        routeController: 'user',
        routeHandler: 'signIn',
        accessTo: '*',
        isSecured: false,
        tokenRequired: false,
        isArray: false,
        cache: false,
        data: { signIn: '@signIn' },
        params: { versionNo: '1.0.0' },
        constraints: constraints['home']
    }, {
        routeName: 'updateUser',
        routeUrl: '/updateUser/:versionNo',
        routeMethod: 'post',
        routeController: 'user',
        routeHandler: 'updateUser',
        accessTo: '*',
        isSecured: false,
        tokenRequired: true,
        isArray: false,
        cache: false,
        data: { updateUser: '@updateUser' },
        params: { versionNo: '1.0.0' },
        constraints: constraints['home']
    }, {
        routeName: 'updatePassword',
        routeUrl: '/updatePassword/:versionNo',
        routeMethod: 'post',
        routeController: 'user',
        routeHandler: 'updatePassword',
        accessTo: '*',
        isSecured: false,
        tokenRequired: true,
        isArray: false,
        cache: false,
        data: { updatePassword: '@updatePassword' },
        params: { versionNo: '1.0.0' },
        constraints: constraints['home']
    }, {
        routeName: 'logout',
        routeUrl: '/logout/:versionNo',
        routeMethod: 'get',
        routeController: 'user',
        routeHandler: 'logout',
        accessTo: '*',
        isSecured: false,
        tokenRequired: true,
        isArray: false,
        cache: false,
        data: {},
        params: { versionNo: '1.0.0' },
        constraints: constraints['home']
    }, {
        routeName: 'getUserList',
        routeUrl: '/getUserList/:versionNo',
        routeMethod: 'post',
        routeController: 'user',
        routeHandler: 'getUserList',
        accessTo: '*',
        isSecured: false,
        tokenRequired: false,
        isArray: false,
        cache: false,
        data: { getUserList: '@getUserList' },
        params: { versionNo: '1.0.0' },
        constraints: constraints['home']
    }, {
        routeName: 'validateEmail',
        routeUrl: '/validateEmail/:versionNo/:email',
        routeMethod: 'get',
        routeController: 'user',
        routeHandler: 'validateEmail',
        accessTo: '*',
        isSecured: false,
        tokenRequired: false,
        isArray: false,
        cache: false,
        data: {},
        params: { versionNo: '1.0.0', email: '@email' },
        constraints: constraints['home']
    }, {
        routeName: 'validateUserName',
        routeUrl: '/validateUserName/:versionNo/:userName',
        routeMethod: 'get',
        routeController: 'user',
        routeHandler: 'validateUserName',
        accessTo: '*',
        isSecured: false,
        tokenRequired: false,
        isArray: false,
        cache: false,
        data: {},
        params: { versionNo: '1.0.0', userName: '@userName' },
        constraints: constraints['home']
    }],
    getResources: function() {
        var resourceDict = {}
        _.each(module.exports.routesList, function(route) {
            var constraints = {}
            constraints[route.routeName] = route.constraints
            resourceDict[route.routeName] = {
                url: route.routeUrl,
                method: route.routeMethod.toUpperCase(),
                isArray: route.isArray,
                cache: route.cache,
                data: route.data,
                params: route.params,
                constraints: constraints
            }
        })
        return resourceDict
    }
}
