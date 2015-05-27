'use strict';
define(['intefit/sync/base', 'intefit/workout', 'intefit/person', 'intefit/message', 'q', 'request', 'pure-uuid'],
    function (Sync, Workout, Person, Message, Q, request, UUID) {

    var NAMESPACE_DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
    var USER_AGENT = "Nutscrape/1.0 (Commodore Vic20; 8-bit)";

    var EndomondoSync = function () {
        Sync.apply(this, arguments);

        this.provider = 'endomondo';
        this.capabilities = [
            'getFiends',
            'getWorkouts',
            'getWorkout',
            'uploadWorkout'
            // TODO
        ];

        var uuid = new UUID(5, NAMESPACE_DNS, "http://example.com/");

        this.country = 'GB';
        this.device_id = uuid.format();
        this.os = "Android";
        this.app_version = "7.1";
        this.app_variant = "M-Pro";
        this.os_version = "2.3.7";
        this.model = "HTC Vision";
        this.jar = request.jar();
    };

    EndomondoSync.prototype = Object.create(Sync.prototype);
    EndomondoSync.prototype.constructor = EndomondoSync;

    EndomondoSync.prototype.login = function (login, password) {
        var that = this;
        var deferred = Q.defer();

        var data = {
            'v': "2.4",
            'action': 'PAIR',
            'email': login,
            'password': password,
            'country': that.country,
            'deviceId': that.device_id,
            'os': that.os,
            'appVersion': that.app_version,
            'appVariant': that.app_variant,
            'osVersion': that.os_version,
            'model': that.model
        };

        request.get({
            url: 'https://api.mobile.endomondo.com/mobile/auth',
            qs: data,
            headers: {
                'User-Agent': USER_AGENT
            },
            jar: that.jar,
            followAllRedirects: true
        }, function (error, response, html) {
            if (error) {
                return deferred.reject(error);
            }
            if (response.statusCode != 200) {
                return deferred.reject(response);
            }

            html = html.split("\n");

            if (html[0] == 'OK') {
                var authData = {};
                for (var i = 1; i < html.length; i++) {
                    var idx = html[i].indexOf("=");
                    if (idx > 0) {
                        authData[html[i].substring(0, idx)] = html[i].substring(idx + 1);
                    }
                }
                that.authData = authData;
                return deferred.resolve(that.authData);
            }

            if (html == 'USER_UNKNOWN') {
                return deferred.reject(new Error('User unknown'));
            }
            if (html == 'USER_EXISTS_PASSWORD_WRONG') {
                return deferred.reject(new Error('Wrong password'));
            }

            return deferred.reject(new Error(html));
        });

        return deferred.promise;
    };

    EndomondoSync.prototype.parseTime = function (strDate) {
        var date = new Date(strDate);
        return Math.floor(date.getTime()/1000);
    };

    EndomondoSync.prototype.createWorkoutFromApiResponse = function (json) {
        var workout = new Workout();

        workout.provider = this.provider;
        workout.ids[this.provider + '.workout'] = this.provider + '.workout:' + json.id;
        workout.type = Workout.OTHER; // TODO
        workout.time = this.parseTime(json.start_time);
        workout.meters = json.distance * 1000;
        workout.energy = json.calories;
        workout.seconds = json.duration;
        workout.title = 'TODO';
        workout.notes = 'TODO';
        if (json.owner) {
            workout.owner = this.provider+'.person:' + json.owner;
        }
        // TODO hydration

        workout.points = [];

        if (json.points) {
            for (var i = 0; i < json.points.length; i++) {
                var point = {
                    time: this.parseTime(json.points[i].time),
                    lat: json.points[i].lat,
                    lng: json.points[i].lng,
                    speed: json.points[i].speed,
                    dist: json.points[i].dist,
                    alt: json.points[i].alt
                };

                // TODO hrm, cad

                workout.points.push(point);
            }
        }

        return workout;
    };

    EndomondoSync.prototype.createFriendFromApiResponse = function (json) {
        var friend = new Person();

        friend.provider = this.provider;
        friend.ids[this.provider + '.person'] = this.provider + '.person:' + json.id;
        friend.name = json.name;
        if (json.picture) {
            friend.avatar = 'https://www.endomondo.com/resources/gfx/picture/'+json.picture+'/full.jpg';
        }

        return friend;
    };

    EndomondoSync.prototype.createMessageFromApiResponse = function (json) {
        var message = new Message();

        message.provider = this.provider;
        message.ids[this.provider + '.message'] = this.provider + '.message:' + json.id;
        message.text = json.message.text;
        message.person = this.createFriendFromApiResponse({
            id: json.from.id,
            name: json.from.name,
            picture: json.from.picture
        });
        message.time = this.parseTime(json.order_time);

        message._links = {
        };

        if (json.message.actions) {
            for (var i = 0; i < json.message.actions.length; i++) {
                var link = 'https://www.endomondo.com/users/'+json.from.id+'/workouts/'+json.message.actions[i].id;
                message._links[link] = 'Some text generated from workout'; // TODO smarter text
            }
        }

        // TODO...
        //console.log(json);

        return message;
    };

    EndomondoSync.prototype.getWorkouts = function (lastSync) {
        var that = this;
        var deferred = Q.defer();

        var limit = 100; // TODO probably loop to fetch all

        var data = {
            'authToken': that.authData.authToken,
            'language': 'EN',
            'fields': 'device,simple,basic,lcp_count',
            'maxResults': limit
        };

        if (lastSync) { // partial sync
            // TODO
        }

        if (before !== undefined) {
            data.before = before;
        }

        request.get({
            url: 'https://api.mobile.endomondo.com/mobile/api/workouts',
            qs: data,
            headers: {
                'User-Agent': USER_AGENT
            },
            jar: that.jar,
            followAllRedirects: true
        }, function (error, response, html) {
            if (error) {
                return deferred.reject(error);
            }
            if (response.statusCode != 200) {
                return deferred.reject(response);
            }

            var json = JSON.parse(html);
            var result = {
                list: []
            };

            for (var i = 0; i < json.data.length; i++) {
                result.list.push(that.createWorkoutFromApiResponse(json.data[i]));
            }

            result.lastSync = ''; // TODO some magic variable for next sync

            deferred.resolve(result);
        });

        return deferred.promise;
    };

    Sync.prototype.getWorkout = function (id) {
        id = (''+id).split(':');
        if (id.length != 2 || id[0] != this.provider+'.workout') {
            return Q.reject(new Error('incorrect id: '+id));
        }
        id = id[1];

        var that = this;
        var deferred = Q.defer();

        var data = {
            'authToken': that.authData.authToken,
            'language': 'EN',
            'fields': 'device,simple,basic,motivation,interval,hr_zones,weather,polyline_encoded_small,points,lcp_count,tagged_users,pictures,feed',
            'workoutId': id
        };

        request.get({
            url: 'https://api.mobile.endomondo.com/mobile/api/workout/get',
            qs: data,
            headers: {
                'User-Agent': USER_AGENT
            },
            jar: that.jar,
            followAllRedirects: true
        }, function (error, response, html) {
            if (error) {
                return deferred.reject(error);
            }
            if (response.statusCode != 200) {
                return deferred.reject(response);
            }

            var json = JSON.parse(html);
            var result = that.createWorkoutFromApiResponse(json);

            deferred.resolve(result);
        });

        return deferred.promise;
    };

    Sync.prototype.uploadWorkout = function (workout) {
        var id = null;
        if (workout.ids[this.provider+'.workout']) {
            id = workout.ids[this.provider+'.workout']
            id = (''+id).split(':');
            if (id.length != 2 || id[0] != this.provider+'.workout') {
                return Q.reject(new Error('incorrect id: '+id));
            }
            id = id[1];
        }

        if (id) { // UPDATE OR DELETE AND CREATE NEW

        } else { // CREATE NEW

        }

        throw new Error('Unimplemented');
    };

    Sync.prototype.deleteWorkout = function (id) { // TODO
        var that = this;
        var deferred = Q.defer();

        var data = {
            'authToken': that.authData.authToken,
            'workoutId': id
        };

        request.get({
            url: 'https://api.mobile.endomondo.com/mobile/api/workout/delete',
            qs: data,
            headers: {
                'User-Agent': USER_AGENT
            },
            jar: that.jar,
            followAllRedirects: true
        }, function (error, response, html) {
            if (error) {
                return deferred.reject(error);
            }
            if (response.statusCode != 200) {
                return deferred.reject(response);
            }

            var json = JSON.parse(html);
            // TODO - check error

            deferred.resolve();
        });


        return deferred.promise;
    };

    Sync.prototype.getFriends = function () {
        var that = this;
        var deferred = Q.defer();

        var data = {
            'authToken': that.authData.authToken,
            'fields': 'basic,recently_tagged'
        };

        if (before !== undefined) {
            data.before = before;
        }

        request.get({
            url: 'https://api.mobile.endomondo.com/mobile/api/profile/friends',
            qs: data,
            headers: {
                'User-Agent': USER_AGENT
            },
            jar: that.jar,
            followAllRedirects: true
        }, function (error, response, html) {
            if (error) {
                return deferred.reject(error);
            }
            if (response.statusCode != 200) {
                return deferred.reject(response);
            }

            var json = JSON.parse(html);
            var result = {
                list: []
            };

            for (var i = 0; i < json.data.length; i++) {
                result.list.push(that.createFriendFromApiResponse(json.data[i]));
            }

            deferred.resolve(result);
        });

        return deferred.promise;
    };

    Sync.prototype.getFeed = function (limit) {
        var that = this;
        var deferred = Q.defer();

        if (!limit) limit = 20;

        var data = {
            'authToken': that.authData.authToken,
            'language': 'EN',
            'show': 'tagged_users,pictures',
            'maxResults': limit
        };

        if (before !== undefined) {
            data.before = before;
        }

        request.get({
            url: 'https://api.mobile.endomondo.com/mobile/api/feed',
            qs: data,
            headers: {
                'User-Agent': USER_AGENT
            },
            jar: that.jar,
            followAllRedirects: true
        }, function (error, response, html) {
            if (error) {
                return deferred.reject(error);
            }
            if (response.statusCode != 200) {
                return deferred.reject(response);
            }

            var json = JSON.parse(html);
            var result = {
                list: []
            };

            for (var i = 0; i < json.data.length; i++) {
                result.list.push(that.createMessageFromApiResponse(json.data[i]));
            }

            deferred.resolve(result);
        });

        return deferred.promise;
    };


    return EndomondoSync;
});
