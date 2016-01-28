/**
 * Passport configuration file where you should configure all your strategies
 * @description :: Configuration file where you configure your passport authentication
 */
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var JwtStrategy = require('passport-jwt').Strategy;

var EXPIRES_IN_SECONDS = 60 * 5;
var SECRET = process.env.tokenSecret || "make this a better SECRET!";
var ALGORITHM = "HS256";
var ISSUER = "cam.com";
var AUDIENCE = "cam.com";


/**
 * Configuration object for local strategy
 * @type {Object}
 * @private
 */
var LOCAL_STRATEGY_CONFIG = {
    usernameField: 'login[email]',
    passwordField: 'login[password]',
    passReqToCallback: false,
    session: false
};

/**
 * Configuration object for JWT strategy
 * @type {Object}
 * @private
 */
var JWT_STRATEGY_CONFIG = {
    secretOrKey: SECRET,
    issuer: ISSUER,
    audience: AUDIENCE,
    passReqToCallback: false
};

/**
 * Configuration object for social strategies
 * @type {Object}
 * @private
 */
var SOCIAL_STRATEGY_CONFIG = {
    clientID: '-',
    clientSecret: '-',
    consumerKey: '-',
    consumerSecret: '-',
    passReqToCallback: true
};

/**
 * Triggers when user authenticates via local strategy
 * @param {String} email Email from body field in request
 * @param {String} password Password from body field in request
 * @param {Function} next Callback
 * @private
 */
function _onLocalStrategyAuth(email, password, next) {
    User.findOne({email: email})
        .exec(function (error, user) {
            if (error) return next(error, false, {});

            if (!user) return next(null, false, {
                code: 'E_USER_NOT_FOUND',
                message: email + ' is not found'
            });

            if (!CipherService.comparePassword(password, user))
                return next(null, false, {
                    code: 'E_WRONG_PASSWORD',
                    message: 'Password is wrong'
                });

            return next(null, user, {});
        });
}

/**
 * Triggers when user authenticates via JWT strategy
 * @param {Object} payload Decoded payload from JWT
 * @param {Function} next Callback
 * @private
 */
function _onJwtStrategyAuth(payload, next) {
    var user = payload.user;

    return next(null, user, {});
}

function init() {
    passport.use(new LocalStrategy(LOCAL_STRATEGY_CONFIG, _onLocalStrategyAuth));
    passport.use(new JwtStrategy(JWT_STRATEGY_CONFIG, _onJwtStrategyAuth));

    if(sails.config.features.possessionFactor) {
        passport.use(new TotpStrategy(
            function(user, done) {
                // setup function, supply key and period to done callback
                findKeyForUserId(user.id, function(err, obj) {
                    if (err) { return done(err); }
                    return done(null, obj.key, obj.period);
                });
            }
        ));
    }

    if(sails.config.features.inherentFactor) {
        console.log('requires inherentFactor');
    }
}

module.exports.jwtSettings = {
    expiresIn: EXPIRES_IN_SECONDS,
    secret: SECRET,
    algorithm: ALGORITHM,
    issuer: ISSUER,
    audience: AUDIENCE
};