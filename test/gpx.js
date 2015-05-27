'use strict';
var requirejs = require("requirejs");
requirejs.config({
    baseUrl: 'src',
    nodeRequire: require
});

describe('Gpx', function () {

    it('should import sample.gpx file', function (done) {
        this.timeout(5000);

        requirejs(['chai', 'intefit/gpx/converter'], function (chai, GpxConverter) {
            var converter = new GpxConverter();

            return done(); // TODO remove me

            return sync.import('TODO')
                .then(function (workout) {

                    // TODO

                    done();
                })
                .catch(function (err) {
                    done(err);
                })
        })
    });
});
