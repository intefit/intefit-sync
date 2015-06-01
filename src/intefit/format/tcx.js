'use strict';
define(['q'], function (Q) {

    var Converter = function () {
    };

    Converter.prototype.importWorkout = function () {
        var deferred = Q.defer();

        return deferred.promise;
    };

    Converter.prototype.exportWorkout = function () {
        var deferred = Q.defer();

        return deferred.promise;
    };

    return Converter;
});
