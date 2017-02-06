module.exports = {
    templatePath: '../../client/dist/views/email',
    emailList: [{
        name: 'registrationConfirmation',
        title: 'Registration Confirmation',
        description: 'Email to confirm completion of registration',
        subject: 'Thanks for registering with NUAGEDM!',
        template: '/registrationConfirmation.html',
        controller: 'registrationConfirmationController'
    }]
}