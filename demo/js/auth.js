(function($, doc) {
    var serverHost = 'http://192.168.33.10:1337';
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
            })
            .fail(function() {
                $mode.html('API down!');
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
        $('#testProtected').on('click', function(e) {
            e.preventDefault();

            $.ajax({
                    url: serverHost + '/ping/protected',
                    method: 'GET',
                    headers: authHeader
                })
                .done(function(data) {
                    logMsg('\n\ttestProtected: authorized, found response:' + data);
                })
                .fail(function(data) {
                    logMsg('\n\ttestProtected: not authorized, found response:' + data.responseText);
                });
        });
    }

    function registerForms() {
        var $signup = $('#signup');
        var $login = $('#login');
        var $totp_setup = $('#totp_signup');
        var $totp_login = $('#totp_login');

        function onError(err) {
            logMsg(
                '\n\n--<strong style="color:red">ERROR</strong>--\n' + err.responseJSON.error + ': ' +
                prettyPrint(err.responseJSON) +
                '\n--<strong style="color:red">ERROR</strong>--\n'
            );
        }

        $signup.on('submit', function(e) {
            e.preventDefault();

            $.post(serverHost + '/auth/signup',
                {
                    email: $signup.find('input[name=email]').val(),
                    password: $signup.find('input[name=password]').val()
                })
                .done(function(data) {
                    updateAuthHeader(data.token);
                    logMsg(
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
                    email: $login.find('input[name=email]').val(),
                    password: $login.find('input[name=password]').val()
                })
                .done(function(data) {
                    var state = 'LOGGED IN USER';
                    updateAuthHeader(data.token);
                    if (data.possessionFactor !== undefined) {
                        state = 'LOGGED IN USER - NEEDS POSSESSION';
                        if (data.possessionFactor) {
                            $login.append('<span id="lert">Please enter your token below</span>')
                                .find('#lert').fadeOut(5000);
                        } else {
                            $login.append('<span id="lert">Please setup your token below</span>')
                                .find('#lert').fadeOut(5000);
                            $totp_setup.trigger('submit');
                        }
                    }
                    logMsg(
                        '\n<strong>' + state + '</strong>\n' +
                        'with JWT token:' + data.token.substring(0, 15) + '...' +
                        '\ndecrypted: ' + '\n' + prettyPrint(decodeJwt(data.token))
                    );
                })
                .fail(onError)
        });

        $totp_setup.on('submit', function(e) {
            e.preventDefault();

            $.ajax({
                    url: serverHost + '/auth/totp_signup',
                    method: 'GET',
                    headers: authHeader
                })
                .done(function(data) {
                    $totp_setup.find('img').attr('src', data.qrUrl)
                })
                .fail(onError);
        });

        $totp_login.on('submit', function(e) {
            e.preventDefault();

            $.ajax({
                    url: serverHost + '/auth/totp_login',
                    method: 'POST',
                    headers: authHeader,
                    data: {
                        code: $totp_login.find('input[name=code]').val()
                    }
                })
                .done(function(data) {
                    updateAuthHeader(data.token);
                    logMsg(
                        '\n<strong>LOGGED IN USER WITH POSSESSION</strong>\n' +
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
            logMsg('\n' + req.type + ' ' + req.url.replace(serverHost, '') + msg);
        }

        $(doc).ajaxSend(function() {
            logJqueryAjax(arguments[2]);
        });

        $(doc).ajaxComplete(function() {
            logJqueryAjax(arguments[2], ' DONE:' + arguments[1].statusText);
        });

    }

    function logMsg(msg) {
        $preLog.append(msg);
    }

})(jQuery, document);

