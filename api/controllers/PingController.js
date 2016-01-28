/**
 * PingController
 * @description :: Server-side logic for checking if different part of app is alive
 */

module.exports = {

    _config: {
        pluralize: false,
        rest: false
    },

    /**
     * Useful when need to check if it's server is down or it some logic is broken
     * @param {Object} req Request object
     * @param {Object} res Response object
     */
    index: function(req, res) {
        res.ok(null, null, 'HTTP server is working');
    },

    factors: function(req, res) {
        var enabledFactors = [
            sails.config.features.knowledgeFactor ? 'knowledge' : '',
            sails.config.features.possessionFactor ? ', possession' : '',
            sails.config.features.inherentFactor ? ', inherent' : ''
        ].join('');

        res.jsonx({factors: 'Current enabled factors are: [' + enabledFactors + ']'}, null);
    },

    protected: function(req, res) {
        res.ok('Protected HTTP server is working', null);
    }
};
