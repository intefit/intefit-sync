'use strict';
var requirejs = require("requirejs");
requirejs.config({
    baseUrl: 'src',
    nodeRequire: require
});

describe('Fit', function () {

    it('should import sample2.fit file', function (done) {
        this.timeout(5000);

        requirejs(['chai', 'intefit/format/fit', 'fs'], function (chai, FitConverter, fs) {
            var fitConverter = new FitConverter();

            var content = fs.readFileSync(__dirname + '/sample2.fit');

            return fitConverter.importWorkout(content)
                .then(function (workout) {

                    console.log(workout);
                    // TODO

                    done();
                })
                .catch(function (err) {
                    done(err);
                })
        })
    });
});
