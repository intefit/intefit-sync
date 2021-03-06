'use strict';
var requirejs = require("requirejs");
requirejs.config({
    baseUrl: 'src',
    nodeRequire: require
});

describe('Gpx', function () {

    it('should import sample2.gpx file', function (done) {
        this.timeout(5000);

        requirejs(['chai', 'intefit/format/gpx', 'fs'], function (chai, GpxConverter, fs) {
            var gpxConverter = new GpxConverter();

            var content = fs.readFileSync(__dirname + '/sample2.gpx').toString();

            return gpxConverter.importWorkout(content)
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
