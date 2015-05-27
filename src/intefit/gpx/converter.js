define(['q'], function (Q) {

    var Converter = function () {
    };

    Converter.prototype.importWorkoutFromGpx = function () {
        var deferred = Q.defer();

        return deferred.promise;
    };

    Converter.prototype.exportWorkoutToGpx = function () {
        var deferred = Q.defer();

        return deferred.promise;
    };

    return Converter;
});
