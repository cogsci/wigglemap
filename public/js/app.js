var Diana = function() {

  this.appUrl = '';
  this.routeSteps = [];
  this.crimes = [];
  this.elevations = [];

  // google maps likes to trigger an event several times when the route
  // is changed, and we don't want to make that many calls to the server,
  // which would make several google api calls, therein.
  this.mutei = {};

  this.geocoder = new google.maps.Geocoder();

  this.setStartLocation();

  var mapOptions = {
    center: new google.maps.LatLng(37.774599,-122.42456),
    zoom: 14,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    streetViewControl: true,
    mapTypeControl: false
  };

  this._resizeCanvas();

  // Normal map
  this.map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
  
  // Hacks, trigger resize since we have a transition on the height of the
  // container.
  // @TODO: Add transition via class after map instantiation
  setTimeout(_.bind(function() {
    google.maps.event.trigger(diana.map, 'resize');
  }, this), 700)
  // Directions renderer, goes on the map
  this.directionsDisplay = new google.maps.DirectionsRenderer({
    draggable: true
  });

  this.directionsDisplay.setMap(this.map);
  this.directionsDisplay.setPanel(document.getElementById('directions-proxy'));

  // Directions service, gets directions and stuff
  this.directionsService = new google.maps.DirectionsService();

  // BICYCLING, of course
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

  /* Gets the client's location from geolocation API, then gets address from google */
  setStartLocation: function() {
    var self = this;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        self.geocoder.geocode({'latLng': latlng}, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            var currentLocation = results[0];
            $('#start-location').val(currentLocation.formatted_address);
          }
        });
      });
    }
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
    
    this.streetview = new google.maps.StreetViewPanorama(document.getElementById('streetview'));
    this.map.setStreetView(this.streetview);
    routeHelper.jumpToVertex(0);
  },

  _resizeCanvas: function() {
    var height = $(window).height();
    var $canvas = $('#canvas');

    height = height - $canvas.offset().top - 83;

    $canvas.css('height', height);
  },

  /**
   * Setup listeners for events and stuff
   */

  setupListeners: function() {
    var self = this;

    $(window).on('resize', this._resizeCanvas);

    // New route submit
    $('#locations').on('submit', function(e) {
      e.preventDefault();
      
      var start = self.getStartLocation(),
        end = self.getEndLocation();

      if (!start || !end) return;

      // Show controls and map
      // So hacky @TODO: Make not bad and only occur once
      $('.controls, .secondary').addClass('in');

      $('.halp')
        .fadeOut(300)
        .slideUp(300);

      $('.route-controls')
        .css('top', '42px')
        .find('form')
          .css('background-color', 'rgba(0,0,0,0)');

      $('.masthead').css('padding-bottom', '54px');

      // @TODO: Only occur once, convert to function with above calls to some
      // kind of state swapper between intro and normal
      // After 1.2s because that's how long the transitions are in CSS
      setTimeout(function() {
        $('.route-controls').removeClass('overlay');
        $('.masthead')
          .removeClass('transition')
          .css('padding-bottom', '0');
        self._resizeCanvas();
        google.maps.event.trigger(diana.map, 'resize');
        $('.canvas').removeClass('faded');
      }, 1200);

      self._resizeCanvas();

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

    $('#play').on('click', function(e) {
      routeHelper.play();
      $(e.currentTarget).hide();
      $('#pause').show();
      $('#route-info').appendTo('#map_canvas');
    });

    $('#pause').on('click', function(e) {
      routeHelper.pause();
      $(e.currentTarget).hide();
      $('#play').show();
    });
  },

  setupGoogleMapsListeners: function() {
    // Update some metrics when route changes.
    // @TODO: Do more targeted data updates so map doesn't recenter when it
    // doesn't have to.
    google.maps.event.addListener(this.directionsDisplay, 'routeindex_changed', _.bind(this.updateData, this));
  },

  /**
   * Update route data, throttled to once every 120ms
   */

  updateData: _.throttle(function() {
    var currentRoute = this.currentRoute = this.directionsDisplay.getDirections();

    this.overviewPath = currentRoute.routes[0].overview_path;
    this.overviewPoly = google.maps.geometry.encoding.decodePath(currentRoute.routes[0].overview_polyline.points);

    // routeHelper.collapseVertices(this.overviewPoly);
    // Simplified route steps for getting crime data, etc.
    this.updateRouteSteps();
    // this.calcCrimeCounts(); (commented out since not being used anyways)
    this.calcElevations();
    this.calcAccidentCounts();
    this.insertProgressBar();
    // Init the street view and set to first point

    // @TODO: Don't do this every time, just update instead of init
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
        self.updateRouteInfo();
      }
    }, this));
  },

  updateRouteInfo: function() {

    var routeInfo = {
      time: this.directionsDisplay.getDirections().routes[0].legs[0].duration.text,
      distance: this.directionsDisplay.getDirections().routes[0].legs[0].distance.text,
      climb: this.getTotalClimb() + ' ft climb'
    };

    var routeInfoHtml = [];
    for (i in routeInfo) {
      routeInfoHtml.push('<span class="' + i + '">' + routeInfo[i] + '</span>');
    }

    $('#route-info .metrics').html(routeInfoHtml.join(', '));
    $('#route-info').show();

    // Remove old listeners if any
    $('#route-info .link').off();
    $('#route-info .link').on('click', function(e) {
      var newWin = window.open('');
      newWin.document.write($('#directions-proxy').html());
      newWin.focus();
    });

  },

  /**
   * Store the list of steps concisely; Google gives a push of information we 
   * don't want.
   */

  updateRouteSteps: function() {
      this.rawSteps = this.directionsDisplay.getDirections().routes[0].legs[0].steps;

    try {
      var fullSteps = this.rawSteps;
      var step;
      var routeSteps = [];
      for (i in fullSteps) {
        step = fullSteps[i];
        routeSteps.push({
          start_location: {
            lat: step.start_location.Ya,
            lon: step.start_location.Za
          },
          end_location: {
            lat: step.end_location.Ya,
            lon: step.end_location.Za
          },
          estimate_distance: (Math.abs(step.end_location.Ya - step.start_location.Ya) + Math.abs(step.end_location.Za - step.start_location.Za))
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
      self.crimes = data;
    }, {mimeType: 'application/json;charset=UTF-8'});
  },

  /* Returns the total climb of the trip by summing the changes in elevations */
  getTotalClimb: function() {
    var climb = 0;
    for (i in this.elevations) climb += this.elevations[i];
    return climb; // TODO: should we allow negatives?
  },

  /* This function is a stupid hack because it's the only metric that requires a
  service call, so we need to update it separately. TODO: find a better way to do it. */
  updateTotalClimb: function() {
    $('#streetview .climb').html(this.getTotalClimb() + ' ft climb');
  },

  /* Calculate the number of feet needed to climb from point A to point B */
  calcElevations: function() {
    var self = this;
    this.serviceCall('get_elevations_list', {steps: JSON.stringify(self.routeSteps)}, function(data) {
      self.elevations = data;
      self.updateTotalClimb();
    }, {mimeType: 'application/json;charset=UTF-8'});
  },


  calcAccidentCounts: function() {
    var self = this;
    this.serviceCall('get_accident_counts', {steps: JSON.stringify(self.routeSteps)}, function(data) {
      self.accidents = data;
      self.insertProgressBar();
    }, {mimeType: 'application/json;charset=UTF-8'});
  },

  insertProgressBar: function() {
    var self = this;
    var tds = "";

    if (!self.accidents) return;

    var totalDistance = 0;
    for (i = 0; i < self.routeSteps.length; i++) {
      totalDistance += self.routeSteps[i]["estimate_distance"];
    }

    for (var i = 0, len = self.accidents.length; i < len; i++) {
      $("#progress-bar").html("");
      var color;
      var weightedAccidents = (self.accidents[i] == 0) ? 0 : self.accidents[i] / ((self.routeSteps[i]["estimate_distance"]/totalDistance) * 100)

      if (weightedAccidents == 0) {
        color = "green";
      } else if (weightedAccidents < 1) {
        color = "yellow";
      } else {
        color = "red";
      }

      tds += "<td onclick='routeHelper.jumpToVertex(routeHelper.findClosestVertexByPathNum("+i+")); routeHelper.highlightStep("+i+")' class='"+color+"' style='width:" + (self.routeSteps[i]["estimate_distance"]/totalDistance) * 100 + "%'></td>";
    }
    var table = "<table><tr>"+tds+"</tr></table>"

    $("#progress-bar").append(table);
  },

  /**
   * Make calls to our API
   */

  serviceCall: function(call, data, successCallback, ajaxOptions) {
    ajaxOptions = ajaxOptions || {};

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

    ajaxOptions = $.extend({}, options, ajaxOptions);

    $.ajax(ajaxOptions).fail(function() {
      this.mutei[call] = 0;
    });
  },

  _getSafetyRating: function() {
    var numSegments           = 0;
    var numWithIncidents      = 0;
    var numWithManyIncidents  = 0;

    for (var i in this.crimes) {
      var num = this.crimes[i];
      if (num > 5) {
        numWithManyIncidents++;
      } else if (num > 0) {
        numWithIncidents++;
      }
      numSegments++;
    }
    return Math.round(100 - 100*(0.7*numWithManyIncidents+0.3*numWithIncidents) / numSegments);
  },

  updateSafetyRating: function() {
    var rating          = this._getSafetyRating();
    var ratingCssClass  = 'success';

    if (rating < 75) ratingCssClass = 'warning';
    if (rating < 50) ratingCssClass = 'important';

    $('#safety').html('<div class="label label-' + ratingCssClass + '">' +rating + '% Safety Rating</div>');
  }

};


$(function() {
    diana = new Diana();
});
