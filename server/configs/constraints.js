var constraints = {
    _id: {
        presence: true
    },
    email: {
        presence: true,
        email: {
            message: 'is not valid'
        }
    },
    password: {
        presence: true,
        format: {
            pattern: /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[^\w\s]).{8,}$/,
            message: "must conatins uppercase, lowercase, number and special characters"
        },
        length: {
            minimum: 8,
            message: "must contain 8 characters"
        }
    },
    username: {
        presence: true,
    }
}
module.exports = {
    constraints: constraints,
    home: {},
    getConfig: {}
}