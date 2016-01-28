/**
 * AuthController
 * @description :: Server-side logic to manage user's authorization
 */
var passport = require('passport');

/**
 * Triggers when user authenticates via passport
 * @param {Object} req Request object
 * @param {Object} res Response object
 * @param {Object} error Error object
 * @param {Object} user User profile
 * @param {Object} info Info if some error occurs
 * @private
 */
function _onPassportAuth(req, res, error, user, info) {
    if (error) return res.serverError(error);
    if (!user) return res.unauthorized(null, info && info.code, info && info.message);

    return res.ok({
        // TODO: replace with new type of cipher service
        token: CipherService.createToken(user),
        user: user
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
    signup: function (req, res) {
        var reqParams = req.allParams();
        if (reqParams && reqParams.signup && reqParams.signup.email) {
            User
                .create(_.omit(reqParams.signup, 'id'))
                .then(function (user) {
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

    /**
     * Sign in by local strategy in passport
     * @param {Object} req Request object
     * @param {Object} res Response object
     */
    login: function (req, res) {
        passport.authenticate('local', _onPassportAuth.bind(this, req, res))(req, res);
    }

};
