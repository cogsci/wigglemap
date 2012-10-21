Diana = function() {

    this.appUrl = 'http://localhost:4567';
    this.routeSteps = [];

    // google maps likes to trigger an event several times when the route
    // is changed, and we don't want to make that many calls to the server,
    // which would make several google api calls, therein.
    this.loadingCrimesMutex = false;

    var mapOptions = {
            center: new google.maps.LatLng(37.774599,-122.42456),
            zoom: 14,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            streetViewControl: true
        };

        this.map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

    this.directionsDisplay = new google.maps.DirectionsRenderer({
        draggable: true
    });
    this.directionsDisplay.setMap(this.map);

    this.directionsService = new google.maps.DirectionsService();

    // DRIVING, BICYCLING, TRANSIT, WALKING
    this.TRAVEL_MODE = google.maps.DirectionsTravelMode.BICYCLING;

    this.setupListeners();
    this.setupGoogleMapsListeners();

};

Diana.prototype = {

    getStartLocation: function() {
        return $('#start-location').val();
    },

    getEndLocation: function() {
        return $('#end-location').val();
    },

    /**
     * Setup listeners for events and stuff
     * @TODO: Make routing actually do work
     */

    setupListeners: function() {
        var self = this;
        // New route submit
        $('#locations').on('submit', function(e) {
            e.preventDefault();
            
            var start = self.getStartLocation(),
                end = self.getEndLocation();

            if (!start || !end) return;

            self.calcRoute(start, end);
        });
    },

    setupGoogleMapsListeners: function() {
        var self = this;

        // Update some metrics when route changes.
        google.maps.event.addListener(this.directionsDisplay, 'routeindex_changed', function() {
            self.updateRouteSteps();
            self.calcCrimeCounts();
        });

    },

    /**
     * Calculate a route between two points and then display on map
     *
     * @param {LatLng} start
     * @param {LatLng} end
     */

    calcRoute: function(start, end) {
        var self = this;

        var request = {
            origin: start,
            destination: end,
            travelMode: this.TRAVEL_MODE
        };

        this.directionsService.route(request, _.bind(function(response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                self.directionsDisplay.setDirections(response);
                self.updateRouteSteps();
                self.calcCrimeCounts();
            }
        }, this));
    },

    /**
     * Store the list of steps concisely; Google gives a push of information we don't want.
     */
    updateRouteSteps: function() {
        try {
            var fullSteps = this.directionsDisplay.getDirections().routes[0].legs[0].steps;
            var step;
            var routeSteps = [];
            for (i in fullSteps) {
                step = fullSteps[i];
                routeSteps.push({
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
            this.routeSteps = routeSteps;
        } catch (err) {
            // likely an NPE
            console.log(err);
        }
    },

    /**
     * Get a list of crime counts associated with each step in the route.
     */
    calcCrimeCounts: function() {
        var self = this;
        if (this.loadingCrimesMutex) return;
        console.log('Recalculating crime rate...');
        this.loadingCrimesMutex = true;
        var routeStepsStr = JSON.stringify(this.routeSteps);
        $.ajax({
            type: 'POST',
            url: this.appUrl + '/get_crime_counts',
            data: {steps: routeStepsStr},
            dataType: 'json',
            mimeType: "application/json;charset=UTF-8",
            context: this,
            success: function(data) {
                self.loadingCrimesMutex = false;
                self.crimes = data;
            },
            fail: function() {
                self.loadingCrimesMutex = false;
            }
        });
    }


};