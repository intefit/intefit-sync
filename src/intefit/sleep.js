define(function () {

    var Sleep = function () {
        this.ids = {};
        this.time = null;
        this.wakeUpTime = null;
        this.phases = [];

        /*
        this.phases = [
            {
                type: 'awake',
                seconds: 600
            },
            {
                type: 'light',
                seconds: 600
            },
            {
                type: 'deep',
                seconds: 600
            },
            {
                type: 'sleep',
                seconds: 600
            }
        ];
        */
    };

    return Sleep;
});
