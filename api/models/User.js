/**
 * User.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
    attributes: {
        firstName: {
            type: 'string',
            size: 50
        },
        lastName: {
            type: 'string',
            size: 50
        },
        password: {
            type: 'string'
        },
        totpKey: {
            type: 'string'
        },
        email: {
            type: 'email',
            required: true,
            unique: true
        },
        toJSON: function() {
            var obj = this.toObject();
            delete obj.password;
            delete obj.totpKey;
            return obj;
        }
    },
    beforeUpdate: function(values, next) {
        CipherService.hashPassword(values);
        next();
    },
    beforeCreate: function(values, next) {
        CipherService.hashPassword(values);
        next();
    }
};