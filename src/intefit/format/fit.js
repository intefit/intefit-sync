'use strict';
define(['q', 'intefit/format/fit_parser', 'intefit/format/fit_mapper', 'intefit/workout'], function (Q, FitParser, FitMapper, Workout) {

    // https://github.com/tjwallace/fit
    // https://github.com/dtcooper/python-fitparse
    // https://github.com/adriangibbons/php-FIT-File-Analysis

    var Converter = function () {
    };

    Converter.prototype.importWorkout = function (buffer) {
        var deferred = Q.defer();

        var parser = new FitParser();
        parser
            .read(buffer)
            .then(function (fit) {
                return (new FitMapper()).map(fit);
            })
            .then(function (fit) {
                var workout = new Workout();

                for (var recNo = 0; recNo < fit.data.length; recNo++) {
                    var record = fit.data[recNo];
                    console.log(record, record.map);

                    // TODO
                }

                deferred.resolve(workout);
            })
            .catch(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    Converter.prototype.exportWorkout = function () {
        var deferred = Q.defer();

        return deferred.promise;
    };

    return Converter;
});
