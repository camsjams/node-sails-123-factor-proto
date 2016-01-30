/**
 * AuthController
 * @description :: Server-side logic to manage user's authorization
 */
var passport = require('passport');
var sprintf = require('sprintf');
var base32 = require('thirty-two');
var crypto = require('crypto');

/**
 * Triggers when user authenticates via passport
 * @param {Object} req Request object
 * @param {Object} res Response object
 * @param {Object} error Error object
 * @param {Object} user User profile
 * @param {Object} info Info if some error occurs
 * @private
 */
function onPassportKnowledgeAuth(req, res, error, user, info) {
    if (error) return res.serverError(error);
    if (!user) return res.unauthorized(null, info && info.code, info && info.message);

    var response = {
        token: CipherService.createToken(user),
        user: user
    };

    if (sails.config.features.possessionFactor) {
        response.possessionFactor = !!user.totpKey;
    }

    return res.ok(response);
}

function onPassportPossessionAuth(req, res, error, user, info) {
    if (error) return res.serverError(error);
    if (!user) return res.invalidTotp(null, info && info.code, info && info.message);

    User.findOne({id: user.id})
        .exec(function(err, finalUser) {
            var response = {
                token: CipherService.createToken(finalUser),
                user: finalUser
            };

            return res.ok(response);
        });
}

module.exports = {

    _config: {
        pluralize: false,
        rest: false
    },

    /**
     * Sign up in system
     * @param {Object} req Request object
     * @param {Object} res Response object
     */
    signup: function(req, res) {
        var reqParams = req.allParams();
        if (reqParams && reqParams.email) {
            User
                .create({
                    email: reqParams.email,
                    password: reqParams.password
                })
                .then(function(user) {
                    return {
                        // TODO: replace with new type of cipher service
                        token: CipherService.createToken(user),
                        user: user
                    };
                })
                .then(res.created)
                .catch(res.serverError);
        } else {
            res.serverError();
        }
    },

    totp_signup: function(req, res) {
        if (req.user && req.user.email) {
            User.findOne({id: req.user.id})
                .exec(function(err, user) {
                    if (err) {
                        return res.serverError();
                    }

                    var secret = base32.encode(crypto.randomBytes(16));
                    var qrData = sprintf('otpauth://totp/%s?secret=%s', req.user.email, secret);
                    var url = "https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl=" + qrData;
                    delete user.password;
                    user.totpKey = secret + '';
                    user.save(function(error) {
                        if (error) {
                            return res.serverError();
                        }
                        res.jsonx({
                            qrUrl: url
                        });
                    });
                });
        } else {
            res.serverError();
        }
    },

    totp_login: function(req, res) {
        passport.authenticate('totp', onPassportPossessionAuth.bind(this, req, res))(req, res);
    },

    /**
     * Sign in by local strategy in passport
     * @param {Object} req Request object
     * @param {Object} res Response object
     */
    login: function(req, res) {
        passport.authenticate('local', onPassportKnowledgeAuth.bind(this, req, res))(req, res);
    }

};
