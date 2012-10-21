function initialize() {
    app.initialize();
};

var app = {
    initialize: function () {
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
    },

    /**
     * Setup listeners for events and stuff
     * @TODO: Make routing actually do work
     */

    setupListeners: function() {
        // New route submit
        $('#locations').on('submit', function(e){
            e.preventDefault();
            
            var start = $('#start-location').val(),
                end = $('#end-location').val();

            if (!start || !end) return;

            return app.calcRoute(start, end);
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
            }
        }, this));
    }
};