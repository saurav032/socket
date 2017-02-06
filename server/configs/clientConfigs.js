module.exports = {
    currentVersion: '1.0.0',
    roleList: {
        "admin": [
            "view",
            "edit",
            "delete"
        ],
        "standard_user": [
            "view",
            "edit"
        ]
    },
    defaultStateForLoggedInUser: '/uurp',
    defaultStateForLoggedInAdmin: '/pprp',
    defaultStateForNonLoggedInUser: '/',
    states: [{
        name: 'landing',
        url: '/',
        templateUrl: 'dist/views/landing',
        controller: 'landingController'
    }, {
        name: 'profile',
        url: '/pprp',
        templateUrl: 'dist/views/profile',
        controller: 'profileController'
    }, {
        name: 'user',
        url: '/uurp',
        templateUrl: 'dist/views/user',
        controller: 'userController'
    }, {
        name: 'signUp',
        url: '/sgnp',
        templateUrl: 'dist/views/signUp',
        controller: 'signUpController'
    }]
}