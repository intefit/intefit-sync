'use strict';
var requirejs = require("requirejs");
requirejs.config({
    baseUrl: 'src',
    nodeRequire: require
});

var prompt = require('prompt');
var Q = require('q');

describe('Strava', function () {

    it('should return workouts when login and password given', function (done) {
        this.timeout(50000);

        requirejs(['chai', 'intefit/sync/strava'], function (chai, StravaSync) {
            var sync = new StravaSync(process.env.npm_config_strava_client_id, process.env.npm_config_strava_client_secret);

            return sync
                .getOAuthUrl()
                .then(function (url) {
                    console.log('go to url: '+url);

                    var deferred = Q.defer();
                    prompt.start();
                    prompt.get(['redirectedUrl'], function (err, result) {
                        // http://localhost:9999/?state=&code=SECRET_CODE
                        deferred.resolve(result.redirectedUrl);
                    });

                    return deferred.promise;
                })
                .then(function (url) {
                    return sync.loginOAuthUrl(url);
                })
                .then(function () {
                    return sync.getWorkouts(5) // , new Date()
                })
                .then(function (data) {

                    chai.assert.isAbove(data.list.length > 0, 0);

                    var simpleWorkout = data.list[0];

                    //console.log(simpleWorkout);

                    return sync.getWorkout(simpleWorkout.ids[simpleWorkout.provider+'.workout']);
                })
                .then(function (workout) {

                    //console.log(workout);

                    done();
                })
                .catch(function (err) {
                    done(err);
                })
        })
    });


});
