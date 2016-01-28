(function($, doc) {
    var serverHost = 'http://192.168.33.11:1337';
    var $mode = $('h2 .mode');
    var $preLog = $('pre').html('initialized!\n');
    var authHeader;

    $(doc).ready(function() {
        registerLogEvents();
        registerForms();
        registerDoodads();

        $.getJSON(serverHost + '/ping/factors')
            .done(function(data) {
                $mode.html(data.factors);
            });
    });

    function updateAuthHeader(token) {
        authHeader = {'Authorization': 'JWT ' + token};
    }

    function decodeJwt(token) {
        return JSON.parse(base64_decode(token.split('.')[1]));
    }

    function prettyPrint(obj) {
        return JSON.stringify(obj, null, '\t');
    }

    function registerDoodads() {
        
    }

    function registerForms() {
        var $signup = $('#signup');
        var $login = $('#login');

        function onError(err) {
            logOut(
                '\n\n--<strong style="color:red">ERROR</strong>--\n' + err.responseJSON.error + ': ' +
                prettyPrint(err.responseJSON) +
                '\n--<strong style="color:red">ERROR</strong>--\n'
            );
        }

        $signup.on('submit', function(e) {
            e.preventDefault();

            $.post(serverHost + '/auth/signup',
                {
                    signup: {
                        email: $signup.find('input[name=email]').val(),
                        password: $signup.find('input[name=password]').val()
                    }
                })
                .done(function(data) {
                    logOut(
                        '\n<strong>SIGNED UP USER</strong>\n' +
                        'with JWT token:' + data.token.substring(0, 15) + '...' +
                        '\ndecrypted: ' + '\n' + prettyPrint(decodeJwt(data.token))
                    );
                })
                .fail(onError)
        });

        $login.on('submit', function(e) {
            e.preventDefault();

            $.post(serverHost + '/auth/login',
                {
                    login: {
                        email: $login.find('input[name=email]').val(),
                        password: $login.find('input[name=password]').val()
                    }
                })
                .done(function(data) {
                    logOut(
                        '\n<strong>LOGGED IN USER</strong>\n' +
                        'with JWT token:' + data.token.substring(0, 15) + '...' +
                        '\ndecrypted: ' + '\n' + prettyPrint(decodeJwt(data.token))
                    );
                })
                .fail(onError)
        });
    }

    function registerLogEvents() {

        function logJqueryAjax(req, msg) {
            msg = msg || '';
            logOut('\n' + req.type + ' ' + req.url.replace(serverHost, '') + msg);
        }

        $(doc).ajaxSend(function() {
            logJqueryAjax(arguments[2]);
        });

        $(doc).ajaxComplete(function() {
            logJqueryAjax(arguments[2], ' DONE');
        });
    }

    function logOut(msg) {
        $preLog.append(msg);
    }

})(jQuery, document);

