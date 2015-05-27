'use strict';
var requirejs = require("requirejs");
requirejs.config({
    baseUrl: 'src',
    nodeRequire: require
});

describe('Endomondo', function () {
    it('should return friends when login and password given', function (done) {
        this.timeout(5000);

        requirejs(['chai', 'intefit/sync/endomondo'], function (chai, EndomondoSync) {
            var sync = new EndomondoSync();
            return sync.login(process.env.npm_config_endomondo_user, process.env.npm_config_endomondo_pass)
                .then(function () {
                    return sync.getFriends()
                })
                .then(function (data) {

                    chai.assert.isAbove(data.list.length > 0, 0);

                    var friend = data.list[0];

                    //console.log(friend);

                    done();
                })
                .catch(function (err) {
                    done(err);
                })
        })

    });

    it('should return workouts when login and password given', function (done) {
        this.timeout(5000);

        requirejs(['chai', 'intefit/sync/endomondo'], function (chai, EndomondoSync) {
            var sync = new EndomondoSync();
            return sync.login(process.env.npm_config_endomondo_user, process.env.npm_config_endomondo_pass)
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


    it('should return feed when login and password given', function (done) {
        this.timeout(5000);

        requirejs(['chai', 'intefit/sync/endomondo'], function (chai, EndomondoSync) {
            var sync = new EndomondoSync();
            return sync.login(process.env.npm_config_endomondo_user, process.env.npm_config_endomondo_pass)
                .then(function () {
                    return sync.getFeed()
                })
                .then(function (data) {

                    chai.assert.isAbove(data.list.length > 0, 0);

                    //console.log(data.list);

                    done();
                })
                .catch(function (err) {
                    done(err);
                })
        })
    });
});
