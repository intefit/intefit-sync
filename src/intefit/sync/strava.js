'use strict';
define(['intefit/sync/base', 'intefit/workout', 'intefit/person', 'intefit/message', 'q', 'request', 'pure-uuid', 'url'],
    function (Sync, Workout, Person, Message, Q, request, UUID, urlParser) {

        var StravaSync = function (clientId, clientSecret) {
            Sync.apply(this, arguments);

            this.provider = 'strava';
            this.capabilities = [
                'loginOauth',
                'getWorkouts',
                'getWorkout',
                'uploadWorkout'
                // TODO
            ];

            this.clientId = clientId;
            this.clientSecret = clientSecret;
            this.redirectUri = 'http://localhost:9999';

            this.jar = request.jar();
        };

        StravaSync.prototype = Object.create(Sync.prototype);
        StravaSync.prototype.constructor = StravaSync;

        StravaSync.prototype.getOAuthUrl = function () {
            return Q.when('https://www.strava.com/oauth/authorize?client_id='+this.clientId+
                '&response_type=code&redirect_uri='+this.redirectUri+
                '&approval_prompt=force&scope=view_private,write');
        };

        StravaSync.prototype.loginOAuthUrl = function (redirectedUrl) {
            var deferred = Q.defer();

            var parsedUrl = urlParser.parse(redirectedUrl, true);
            console.log(parsedUrl.query.code, this.clientSecret);
            // TODO
        };

        return StravaSync;
    });