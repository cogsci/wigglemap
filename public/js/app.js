Diana = function() {

    this.appUrl = 'http://localhost:4567';
    this.routeSteps = [];
    this.crimes = [];
    this.elevations = [];

    // google maps likes to trigger an event several times when the route
    // is changed, and we don't want to make that many calls to the server,
    // which would make several google api calls, therein.
    this.mutei = {};

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

    toggleStreetView: function() {
        var toggle = this.streetview.getVisible();
        if (toggle == false) {
            streetview.setVisible(true);
        } else {
            streetview.setVisible(false);
        }
    },

    initStreetView: function() {
        var firstStep = this.overviewPath[0];
        
        this.streetview = new google.maps.StreetViewPanorama(document.getElementById("streetview"));
        this.map.setStreetView(this.streetview);
        routeHelper.jumpToVertex(0);
    },

    /**
     * Setup listeners for events and stuff
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

        $('#next').on('click', function(e) {
            // Go to next vertex
            routeHelper.jumpToNextVertex();
        });

        $('#prev').on('click', function(e) {
            // Go to prev vertex
            routeHelper.jumpToPrevVertex();
        });        
    },

    setupGoogleMapsListeners: function() {
        // Update some metrics when route changes.
        google.maps.event.addListener(this.directionsDisplay, 'routeindex_changed', _.bind(this.updateData, this));
    },

    /**
     * Update route data, throttled to once every 120ms
     */

    updateData: _.throttle(function() {
        var currentRoute = this.directionsDisplay.getDirections();

        this.overviewPath = currentRoute.routes[0].overview_path;
        this.overviewPoly = google.maps.geometry.encoding.decodePath(currentRoute.routes[0].overview_polyline.points);

        // routeHelper.collapseVertices(this.overviewPoly);
        // Simplified route steps for getting crime data, etc.
        this.updateRouteSteps();
        this.calcCrimeCounts();
        // Init the street view and set to first point
        this.initStreetView();
    }, 120),

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
            }
        }, this));
    },

    /**
     * Store the list of steps concisely; Google gives a push of information we don't want.
     */
    updateRouteSteps: function() {
        this.rawSteps = this.directionsDisplay.getDirections().routes[0].legs[0].steps;

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
     * Calculate a list of crime counts associated with each step in the route.
     */
    calcCrimeCounts: function() {
        var self = this;
        this.serviceCall('get_crime_counts', {steps: JSON.stringify(self.routeSteps)}, function(data) {
            self.loadingCrimesMutex = false;
            self.crimes = data;
        }, {mimeType: 'application/json;charset=UTF-8'});
    },

    /* Calculate the number of feet needed to climb from point A to point B */
    calcElevations: function() {
        var self = this;
        this.serviceCall('get_elevations_list', {steps: JSON.stringify(self.routeSteps)}, function(data) {
            console.log('elevations: ', data);
            self.elevations = data;
        }, {mimeType: 'application/json;charset=UTF-8'});
    },

    calcAccidentCounts: function() {
        var self = this;
        this.serviceCall('get_accident_counts', {steps: JSON.stringify(self.routeSteps)}, function(data) {
            console.log('accidents: ', data);
            self.elevations = data;
        }, {mimeType: 'application/json;charset=UTF-8'});
    },

    serviceCall: function(call, data, successCallback, ajaxOptions) {
        if (this.mutei[call] == 1) return;
        console.log('Making service call: ', call);
        this.mutei[call] = 1;
        var options = {
            type: 'POST',
            url: this.appUrl + '/' + call,
            context: this,
            dataType: 'json',
            data: data,
            success: function(resp) {
                console.log('Done service call: ', call);
                this.mutei[call] = 0;
                successCallback(resp);
            }
        };
        if (ajaxOptions) {
            ajaxOptions = $.extend({}, options, ajaxOptions);
        } else {
            ajaxOptions = options;
        }
        $.ajax(ajaxOptions).fail(function() {
            this.mutei[call] = 0;
        });
    }


};
