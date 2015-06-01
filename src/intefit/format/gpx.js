'use strict';
define(['q', 'xml2js', 'intefit/workout'], function (Q, xml2js, Workout) {

    var Converter = function () {
    };

    Converter.prototype.importWorkout = function (content) {
        var deferred = Q.defer();

        xml2js.parseString(content, function (err, result) {
            if (err) {
                return deferred.reject(new Error("TODO")) // TODO
            }

            var workout = new Workout();

            // TODO
            console.log(result.gpx.trk);

            deferred.resolve(workout);
        });

        return deferred.promise;
    };

    Converter.prototype.exportWorkout = function (workout) {
        var deferred = Q.defer();

        return deferred.promise;
    };

    return Converter;
});
