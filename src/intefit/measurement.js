define(function () {

    var Measurement = function () {
        this.ids = {};
        this.time = null;
        this.timezone = null; // if available
        this.params = {
        };

        /*
         this.params = { // in metric system
            'weight': 900,
            'height': 900,
            'fat': 111,
            'fat%': 10
         };
         */
    };

    return Measurement;
});
