define(function () {

    var Meal = function () {
        this.ids = {};
        this.time = null;
        this.timezone = null; // if available
        this.params = {
        };

        /*
         this.params = { // in grams or ml
            'calories': 900,
            'fat': 99
         };
         */
    };

    return Meal;
});
