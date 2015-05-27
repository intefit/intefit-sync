'use strict';
define([], function () {
    var Sync = function () {
        this.capabilities = [];
    };

    Sync.prototype.login = function (login, password) {
        throw new Error('Unimplemented');
    };

    Sync.prototype.getWorkouts = function () {
        throw new Error('Unimplemented');
    };

    Sync.prototype.getWorkout = function (id) {
        throw new Error('Unimplemented');
    };

    Sync.prototype.uploadWorkout = function (workout) {
        throw new Error('Unimplemented');
    };

    Sync.prototype.deleteWorkout = function (id) {
        throw new Error('Unimplemented');
    };

    Sync.prototype.deleteFriends = function (id) {
        throw new Error('Unimplemented');
    };

    Sync.prototype.getFeed = function () {
        throw new Error('Unimplemented');
    };

    Sync.prototype.getProfile = function (id) {
        throw new Error('Unimplemented');
    };

    Sync.prototype.updateProfile = function (profile) {
        throw new Error('Unimplemented');
    };

    return Sync;
});
