define(function () {

    var Workout = function () {
        this.ids = {};
        this.time = null;
        this.type = Workout.OTHER;
        this.seconds = 0;
        this.energy = 0;
        this.meters = 0;
    };

    Workout.RUNNING = 'running';
    Workout.OTHER = 'other';

    return Workout;
});
