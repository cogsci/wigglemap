Diana = function() {

    this.appUrl = 'http://localhost:4567';
    this.routeSteps = [];

    var mapOptions = {
            center: new google.maps.LatLng(37.774599,-122.42456),
            zoom: 14,
            mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    this.map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);

    this.directionsDisplay = new google.maps.DirectionsRenderer({
        draggable: true
    });
    this.directionsDisplay.setMap(this.map);

    this.directionsService = new google.maps.DirectionsService();

    // DRIVING, BICYCLING, TRANSIT, WALKING
    this.TRAVEL_MODE = google.maps.DirectionsTravelMode.BICYCLING;

    this.setupListeners();

};

Diana.prototype = {

    /**
     * Setup listeners for events and stuff
     * @TODO: Make routing actually do work
     */

    setupListeners: function() {
        var self = this;
        // New route submit
        $('#locations').on('submit', function(e) {
            e.preventDefault();
            
            var start = $('#start-location').val(),
                end = $('#end-location').val();

            if (!start || !end) return;

            self.calcRoute(start, end);
            // $.ajax('/route', {
            //     data: {
            //         start: start,
            //         end: end
            //     },
            //     success: function(response){
            //         console.log(response);
            //     },
            //     error: function(){
            //         console.log("No worky");
            //     }
            // });
        });
    },

    /**
     * Calculate a route between two points and then display on map
     *
     * @param {LatLng} start
     * @param {LatLng} end
     * @returns DirectionsRenderer
     */

    calcRoute: function(start, end) {
        var request = {
            origin: start,
            destination: end,
            travelMode: this.TRAVEL_MODE
        };

        this.directionsService.route(request, _.bind(function(response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                this.directionsDisplay.setDirections(response);
                console.log(response);
                resp = response;
                this.setRouteSteps(response.routes[0].legs[0].steps);
            }
        }, this));
    },

    /**
     * Store the list of steps concisely; Google gives a push of information we don't want.
     */
    setRouteSteps: function(fullSteps) {
        var step;
        for (i in fullSteps) {
            step = fullSteps[i];
            this.routeSteps.push({
                start_location: {
                    lat: step.start_location.Xa,
                    lon: step.start_location.Ya
                },
                end_location: {
                    lat: step.end_location.Xa,
                    lon: step.end_location.Ya
                }
            });
        }
    },

    /**
     * Get a list of crime counts associated with each step in the route.
     */
    getCrimeCounts: function() {
        console.log(this.routeSteps);
        console.log(JSON.stringify(this.routeSteps));
        var routeStepsStr = JSON.stringify(this.routeSteps);
        $.ajax({
            type: 'POST',
            url: this.appUrl + '/get_crime_counts',
            data: {steps: routeStepsStr},
            dataType: 'json',
            beforeSend: function(x) {
                // So we can pass in JSON-object
                if (x && x.overrideMimeType) {
                    x.overrideMimeType("application/json;charset=UTF-8");
                }
            },
            success: function(data) {
                console.log(data);
            }
        });
    }


};