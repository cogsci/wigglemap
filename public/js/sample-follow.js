 /**
  * Copyright (c) 2008 Google Inc.
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *
  *     http://www.apache.org/licenses/LICENSE-2.0
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License. 
  *
  *
  *  Author: Thor Mitchell
  *
  *  Street View API Example: Following driving directions in Street View,
  *
  *  We extract the polyline generated for the route and then attempt to
  *  follow links that match the direction of the line segment as we move
  *  along it. Sometimes we find a gap in coverage, or that a link does
  *  not exist in the direction we need. When this happens we jump to the
  *  start of the next step given in the text directions.
  */

 /**
  * GMap2 of the route map.
  */  
  var map;

 /**
  * GStreetviewPanorama of the Flash viewer.
  */
  var pano;

 /**
  * GStreetviewClient used to retrieve meta data for panoramas we reach
  * by following links.
  */
  var svClient;

 /**
  * GDirections object used to submit driving direction requests.
  */
  var directions;

 /**
  * The GRoute we are following extracted from the directions response.
  */
  var route;

 /**
  * It turns out that the polyline generated for a driving directions
  * route normally has a lot of repeated vertices. This causes problems
  * when trying to determine how close we are to the next vertex, so it's
  * better to collapse these duplicated vertices out.
  *
  * The array of route vertices with duplicates removed.
  */
  var vertices;

 /**
  * Array that maps the polyline vertex indices to the
  * index of the same point in the vertices array.
  *
  * For example, if the polyline vertices are
  * [a, a, b, c, d, d, e], the vertices array will be
  * [ a, b, c, d, e ] and the vertexMap array will be
  * [ 1, 1, 2, 3, 4, 4, 5 ].
  */
  var vertexMap;

 /**
  * Array that contains the index in the vertices array of
  * the point at the start of the n'th step in the route
  */
  var stepToVertex;

 /**
  * An array that gives the route step number that each
  * point in the vertices array is part of.
  */
  var stepMap;

 /**
  * The current position of the panorama and vehicle marker.
  */
  var currentLatLng;

 /**
  * Metadata for the current panorama including the list of
  * available links, loaded using GStreetviewClient.
  */
  var panoMetaData;

 /**
  * boolean flag set when we are so close to the next vertex that we should
  * check links in the panoramas we load for the next turning we need.
  */
  var close = false;

 /**
  * The direction in degrees from our current location to the next
  * vertex on the route. Used to select the most suitable link to follow.
  */
  var bearing;

 /**
  * The direction from the next vertex on the route to the vertex
  * after that. Used when we are close to a vertex and are looking
  * for links that represent the next turn we need to make.
  */
  var nextBearing;

 /**
  * The index of the vertex we are heading towards on the route in the
  * vertices array.
  */
  var nextVertexId;

 /**
  * GLatLng of the vertex we are heading towards on the route.
  */
  var nextVertex;

 /**
  * An array that at any time contains the GLatLng of each vertex
  * from the start of the current route step to the next vertex
  * ahead of our current position. This is used to work out how
  * far we are along the current step.
  */
  var progressArray;

 /**
  * The distance in meters covered by traversing the points in the
  * progressArray. By subtracting the distance from our current location
  * to the next vertex from this value we find how far along the step
  * we are, and use this to update the progress bar.
  */
  var progressDistance;

 /**
  * Index of the route step we are currently on.
  */
  var currentStep;

 /**
  * The marker on our map that shows the current location. For IE6 this
  * is a standard red maps pushpin. For all other browsers it is a
  * directional arrow.
  */
  var carMarker;

 /**
  * A copy of the current step index used to unhighlight the previously
  * highlighted step in the textual driving directions when the
  * current step changes.
  */
  var selectedStep = null;

 /**
  * boolean flag indicating whether we are currently driving (automatically
  * following) links, or are stationary.
  */
  var driving = false;

/**
 * Id of the timer that adds a delay between following each link to give the
 * panorama time to load. We need this to cancel the timer if the user clicks
 * Stop while we are waiting to follow the next link.
 */
  var advanceTimer = null;
  
/**
 * Delay in seconds between following each link.
 */
  var advanceDelay = 1;
  
 /**
  * Set up the initial view and register the various event listeners.
  */
  function load() {
    if (GBrowserIsCompatible()) {
      var start = new GLatLng(37.090240,-95.712891);
      map = new GMap2(document.getElementById("map"));
      map.setCenter(start, 3);
      map.addControl(new GSmallMapControl());

      carMarker = getCarMarker(start);
      map.addOverlay(carMarker);
      carMarker.hide();

      svClient = new GStreetviewClient();
      pano = new GStreetviewPanorama(document.getElementById("streetview"));

      GEvent.addListener(pano, "initialized", function(loc) {
        panoMetaData = loc;
        moveCar();
      });

      GEvent.addListener(pano, "error", function(errorCode) {
        showStatus("The requested panorama could not be displayed");
      });

      directions = new GDirections(map);
      GEvent.addListener(directions, "load", function() {
        jumpInMyCar();
      });

      GEvent.addListener(directions, "error", function() {
        showStatus("Could not generate a route for the current start and end addresses");
      });
    }
  }

 /**
  * Create a vehicle marker suited to the user's browser
  * Avoids a wierd IE6 bug that causes black backgrounds
  * if we use the driving direction arrows as marker icons
  * @param {GLatLng} start Initial location of the vehicle marker
  * @return {GMarker}
  */ 
  function getCarMarker(start) {
    /*@cc_on @*/
    /*@if (@_jscript_version < 5.7)
    return new GMarker(start);
    /*@end @*/ 
    return new GMarker(start, getArrowIcon(0.0));
  }

 /**
  * Set the vehicle marker icon based on the user's browser
  * Avoids a wierd IE6 bug that causes black backgrounds
  * if we use the driving direction arrows as marker icons
  * @param {number} bearing The heading in degrees of the arrow we need
  */ 
  function setCarMarkerImage(bearing) {
    /*@cc_on @*/
    /*@if (@_jscript_version < 5.7)
    return;
    /*@end @*/
    carMarker.setImage(getArrowUrl(bearing));
  }

 /**
  * Submit the driving directions request
  * The load event handler calls jumpInMyCar() when this returns
  */ 
  function generateRoute() {
    var from = document.getElementById("from").value;
    var to = document.getElementById("to").value;
    directions.load("from: " + from + " to: " + to, { preserveViewport: true, getSteps: true });
  }

 /**
  * It's too far to walk on your own
  */ 
  function jumpInMyCar() {
    /* Extract the one and only route from this response */
    route = directions.getRoute(0);

    /* Simplify the list of polyline vertices by removing duplicates */
    collapseVertices(directions.getPolyline());

    /* Center the map on the start of the route at street level */
    map.setCenter(vertices[0], 16);

    /* Display the textual driving directions */
    renderTextDirections();

    /* Begin checking the Street View coverage along this route */
    checkCoverage(0);
  }

 /**
  * Check that a Street View panorama exists at the start
  * of this route step. This is a recursive function that
  * checks every step along the route until it reaches the
  * end of the route or no panorama is found for a step.
  * @param {number} step The route step to check
  */ 
  function checkCoverage(step) {
    if (step > route.getNumSteps()) {
      /* Coverage check across whole route passed */
      hideStatus();
      stopDriving();
      jumpToVertex(0);
    } else {
      if (step == route.getNumSteps()) {
        ll = route.getEndLatLng();
      } else {
        ll = route.getStep(step).getLatLng();
      }

      svClient.getNearestPanorama(ll, function(svData) {
        if (svData.code == 500) {
          /* Server error, retry once per second */
          setTimeout("checkCoverage(" + step + ")", 1000);
        } else if (svData.code == 600) {
          /* Coverage check failed */
          showStatus("Street View coverage is not available for this route");
        } else {
         /* Confirmed coverage for this step.
          * Now check coverage for next step.
          */
          checkCoverage(step + 1);
        }
      });
    }
  }

 /**
  * Jump to a particular point on the route. This is used to
  * queue up the start of the route, when a user selects a step
  * in the driving directions, and when there is a gap in coverage
  * that we need to jump over.
  * @param {number} idx The vertex number in the vertices array
  */ 
  function jumpToVertex(idx) {
    currentLatLng = vertices[idx];
    nextVertex = vertices[idx + 1];
    nextVertexId = idx + 1;

        bearing = getBearingFromVertex(idx);
    nextBearing = getBearingFromVertex(idx + 1);

    setCarMarkerImage(bearing);
    carMarker.setLatLng(currentLatLng);
    carMarker.show();

    currentStep = stepMap[idx];
    constructProgressArray(idx);
    setProgressDistance();
    updateProgressBar(0);

    map.panTo(currentLatLng, 16);
    highlightStep(currentStep);
    checkDistanceFromNextVertex();

    pano.setLocationAndPOV(currentLatLng, { yaw:bearing, pitch:0 });
    svClient.getNearestPanorama(currentLatLng, function(loc) {
      if (loc.code == 500) {
        setTimeout("jumpToVertex(" + idx + ")", 1000);
      } else if (loc.code == 600) {
        jumpToVertex(nextVertexId);
      } else {
        panoMetaData = loc.location;
        panoMetaData.pov.yaw = bearing;
        moveCar();
      }
    });
  }

 /**
  * Called by the panorama's initialized event handler in
  * response to a link being followed. Updates the location
  * of the vehicle marker and the center of the map to match
  * the location of the panorama loaded by following the link.
  */ 
  function moveCar() {
    currentLatLng = panoMetaData.latlng;
    carMarker.setLatLng(currentLatLng);
    map.panTo(currentLatLng);

   /* Now retrieve the links for this panorama so we can
    * work out where to go next.
    */
    svClient.getNearestPanorama(panoMetaData.latlng, function(svData) {
      if (svData.code == 500) {
       /* Server error. Retry once a second */
        setTimeout("moveCar()", 1000);
      } else if (svData.code == 600) {
       /* No panorama. Should never happen as we have
        * already loaded this panorama in the Flash viewer.
        */
        jumpToVertex(nextVertexId);
      } else {
        panoMetaData.links = svData.links;
        checkDistanceFromNextVertex();
        if (driving) {
          advanceTimer = setTimeout("advance()", advanceDelay * 1000);
        }
      }
    });
  }

 /**
  * Check if we have already passed the next vertex, or if we are
  * close enough to the next vertex to look out for the next turn.
  */ 
  function checkDistanceFromNextVertex() {
    close = false;
    var d = currentLatLng.distanceFrom(nextVertex);
    var b = getBearing(currentLatLng, nextVertex);

   /* If the bearing of the next vertex is more than 90 degrees away from
    * the bearing we have been travelling in, we must have passed it already.
    */
    if (getYawDelta(bearing, b) > 90) {
      incrementVertex();

      /* If the vertices are closely spaced we may
       * already be close to the next vertex
       */
      if (driving) {
        checkDistanceFromNextVertex();
      }

    } else {
     /* Recalculate how far we have travelled within the current step
      * and update the progress bar accordingly.
      */
      updateProgressBar(progressDistance - d);
      if (driving) {
        updateViewerDirections(progressDistance - d);
      }

     /* If we are less than 10m from a vertex we consider ourself to be
      * close enough to preferentially follow links that take us in the
      * direction we should be going when the vertex has been passed.
      */
      if (d < 10) {
        close = true;
      }
    }
  }

 /**
  * Move forward one link
  */ 
  function advance() {
    /* chose the best link for our current heading */
    var selected = selectLink(bearing);

   /* If we're very close to a vertex, also check for a
    * link in the direction we should be turning next.
    * If there is a link in that direction (to a
    * tolerance of 15 degrees), chose that turning
    */
    if (close && nextBearing) {
      var selectedTurn = selectLink(nextBearing);
      if (selectedTurn.delta < 15) {
        selected = selectedTurn;
        incrementVertex();
      }
    }

    if (selected.delta > 40) {
     /* If the chosen link is in a direction more than 40
      * degrees different from the heading we want it
      * will not take us in the right direction. As no
      * better link has been found this implies that the
      * route has no coverage in the direction we need so
      * jump to the start of the next step. 
      */
      jumpToVertex(nextVertexId);
    } else {
     /* Pan the viewer round to face the direction of the
      * link we want to follow and then follow the link. We
      * need to give the pan time to complete before we follow
      * the link for it to look smooth. The amount of time
      * depends on the extent of the pan.
      */
      var panAngle = getYawDelta(panoMetaData.pov.yaw, panoMetaData.links[selected.idx].yaw);
      pano.panTo({ yaw:panoMetaData.links[selected.idx].yaw, pitch:0 });
      setTimeout(function() {
        pano.followLink(panoMetaData.links[selected.idx].yaw);
      }, panAngle * 10);
    }
  }

 /**
  * Select which link in the current panorama most closely
  * matches the directions we should be going in.
  * @param {number} yaw The direction we are looking to move in
  * @return {Object} The number of the closest link and the
  *      difference between it's yaw and the desired direction
  */ 
  function selectLink(yaw) {
    var Selected = new Object();

    for (var i = 0; i < panoMetaData.links.length; i++) {
      var d = getYawDelta(yaw, panoMetaData.links[i].yaw);
      if (Selected.delta == null || d < Selected.delta) {
        Selected.idx = i;
        Selected.delta = d;
      }
    }
    return Selected;
  }

 /**
  * Called when we have reached a vertex
  * and now need to head towards the next
  */
  function incrementVertex() {
    if (! vertices[nextVertexId + 1]) {
      /* we are at the end of the route */
      endReached();
    } else {
      nextVertexId++;
      nextVertex = vertices[nextVertexId];

      /* Rotate the vehicle marler to face the new bearing */
          bearing = getBearingFromVertex(nextVertexId - 1);
      nextBearing = getBearingFromVertex(nextVertexId);
      setCarMarkerImage(bearing);

      /* Check if we have reached the next step */
      if (stepMap[nextVertexId - 1] == currentStep) {
       /* Still on the same step so just extend the
        * progressArray with the next vertex we are
        * heading towards.
        */
        progressArray.push(nextVertex);
      } else {
       /* We've moved on to the next step so start a new
        * progressArray and update the text highlight and
        * progress bar.
        */
        currentStep = stepMap[nextVertexId - 1];
        highlightStep(currentStep);
        progressArray = [ currentLatLng, nextVertex ];
        updateProgressBar(0);
      }

      setProgressDistance();
    }
  }

 /**
  * Called when the last vertex on the route is reached.
  */
  function endReached() {
    stopDriving();
    updateProgressBar(0);
    showInstruction("You have reached your destination");
    document.getElementById("step" + selectedStep).style.backgroundColor = "white";
    selectedStep = null;
  }

 /**
  * Get the direction to head in from a particular vertex
  * @param {number} n Index of the vertex in the vertices array
  * @return {number} bearing in degrees
  */
  function getBearingFromVertex(n) {
    var origin = vertices[n];
    var destination = vertices[n+1];
    if (destination != undefined) {
      return getBearing(origin, destination);
    } else {
      return null;
    }
  }

 /**
  * Update the in Flash viewer next step driving directions
  * @param {number} distanceFromStartOfStep Distance in meters from the start
  *     of the current route step
  */
  function updateViewerDirections(distanceFromStartOfStep) {
    var lengthOfStep = route.getStep(currentStep).getDistance().meters;
    var distanceFromEndOfStep = (lengthOfStep - distanceFromStartOfStep);

    /* Convert from meters to feet */
    distanceFromEndOfStep *= 3.2808399;

    var uiDistance, unit;

    /* Convert to human friendly representation */
    if (distanceFromEndOfStep > 7920) {
      distanceFromEndOfStep /= 5280;
      uiDistance = distanceFromEndOfStep.toFixed(0);
      unit = 'miles';
    } else if (distanceFromEndOfStep > 4620) {
      uiDistance = '1';
      unit = 'mile';
    } else if (distanceFromEndOfStep > 3300) {
      /* Display "3/4 mile" between 5/8 and 7/8 of a mile */
      uiDistance = '&frac34;';
      unit = 'mile';
    } else if (distanceFromEndOfStep > 1980) {
      /* Display "1/2 mile" between 3/8 and 5/8 of a mile */
      uiDistance = '&frac12;';
      unit = 'mile';
    } else if (distanceFromEndOfStep >  660) {
      /* Display "1/4 mile" between 1/8 and 3/8 of a mile */
      uiDistance = '&frac14;';
      unit = 'mile';
    } else {
      uiDistance = (Math.round(distanceFromEndOfStep / 10)) * 10;
      unit = "ft";
    }

    if (route.getStep(currentStep + 1) != undefined) {
      showInstruction('In ' + uiDistance + ' ' + unit + ': ' + route.getStep(currentStep + 1).getDescriptionHtml());
    } else {
      showInstruction('In ' + uiDistance + ' ' + unit + ': You will reach your destination');
    }
  }

 /**
  * Rebuild the progressArray after jumping to a particular vertex
  * @param {number} vertexId The vertex number in the vertices array
  */ 
  function constructProgressArray(vertexId) {
    progressArray = new Array();
    var stepStart = stepToVertex[currentStep];
    for (var i = stepToVertex[currentStep]; i <= vertexId + 1; i++) {
      progressArray.push(vertices[i]);
    }
  }

 /**
  * Calculate the distance in meters from the start of this
  * step to the next vertex by building a polyline from the
  * intermediate points.
  */
  function setProgressDistance() {
    var polyline = new GPolyline(progressArray);
    progressDistance = polyline.getLength();
  }

 /**
  * Update the progress bar to reflect our position within this step
  * @param {number} progress Distance in meters travelled
  *     since the start of this step
  */
  function updateProgressBar(progress) {
    progress = (progress < 0 ? 0 : progress);
    var stepLength = route.getStep(currentStep).getDistance().meters;
    setProgressBarLength(1 - (progress / stepLength));
  }

 /**
  * Size the progress bar
  * @param {number} progress Progress expressed as a fraction (0 to 1)
  */
  function setProgressBarLength(progress) {
    var width = (636 * progress);
    if (width < 0) {
      width = 0;
    }
    document.getElementById("progressBar").style.width = width + "px";
  }

 /**
  * Calculate the difference in degrees between two bearings.
  * @param {number} a bearing in degrees
  * @param {number} b bearing in degrees
  * @return {number} The angle between a and b
  */
  function getYawDelta(a, b) {
    var d = Math.abs(sanitiseYaw(a) - sanitiseYaw(b));
    if (d > 180) {
      d = 360 - d;
    }
    return d;
  }

 /**
  * Sometimes after following a link the yaw is > 360
  * @param {number} yaw bearing in degrees
  * @return {number} yaw as a value between -360 and +360
  */
  function sanitiseYaw(yaw) {
    if (yaw > 360 || yaw < 360) {
      yaw = yaw % 360;
    }
    return yaw;
  }

 /**
  * Generate a GMarker icon of an direction arrow
  * @param {number} bearing Direction arrow should point
  * @return {GIcon}
  */
  function getArrowIcon(bearing) {
    var icon = new GIcon();
    icon.image = getArrowUrl(bearing);
    icon.iconSize = new GSize(24, 24);
    icon.iconAnchor = new GPoint(12, 12);
    return icon;
  }

 /**
  * Determine URL of correct direction arrow image to use
  * @param {number} bearing Direction arrow should point
  * @return {String}
  */
 function getArrowUrl(bearing) {
    var id = (3 * Math.round(bearing / 3)) % 120;
    return "http://maps.google.com/mapfiles/dir_" + id + ".png";
  }

 /**
  * Build the vertices, vertexMap, stepToVertex, and stepMap
  * arrays from the vertices of the route polyline.
  * @param {GPolyline} path The route polyline to process
  */
 function collapseVertices(path) {
   vertices = new Array();
   vertexMap = new Array(path.getVertexCount());

   vertices.push(path.getVertex(0));
   vertexMap[0] = 0;

   /* Copy vertices from the polyline to the vertices array
    * skipping any duplicates. Build the vertexMap as we go along */
   for (var i = 1; i < path.getVertexCount(); i++) {
     if (! path.getVertex(i).equals(vertices[vertices.length - 1])) {
       vertices.push(path.getVertex(i));
     }
     vertexMap[i] = vertices.length - 1;
   }

   stepToVertex = new Array(route.getNumSteps());
   stepMap      = new Array(vertices.length);

   for (var i = 0; i < route.getNumSteps(); i++) {
     stepToVertex[i] = vertexMap[route.getStep(i).getPolylineIndex()];
   }

   var step = 0;
   for (var i = 0; i < vertices.length; i++) {
     if (stepToVertex[step + 1] == i) {
       step++;
     }
     stepMap[i] = step;
   }
 }

 /**
  * Because we want to be highlight text directions steps and make them clickable
  * we must render them ourselves rather than let GDirections do so as normal.
  */
  function renderTextDirections() {

    /* Get the addresses to display at the start and end of the directions */
    var startAddress = route.getStartGeocode().address;
    var   endAddress = route.getEndGeocode().address;

    /* Write the start address title, marker, and summary */
    var html  =  getDirectionsWaypointHtml(startAddress, "A");
        html +=  getDivHtml("summary", "", route.getSummaryHtml());

    /* Build up the textual directions step by step */
    for (var n = 0; n < route.getNumSteps(); n++) {
      html += '<a onclick="selectStep(' + n + ')">';
      html += getDivHtml("step" + n, "dstep", route.getStep(n).getDescriptionHtml());
      html += '</a>';
    }

    /* Write the end address title and marker */
    html += getDirectionsWaypointHtml(endAddress, "B");

    /* Fill in the div on the page with the generated HTML */
    document.getElementById("directions").innerHTML = html;

    /* Set the icons used in the address blocks using the appropriate
     * technique for the browser to preserve PNG transparency */
    setWaypointIcon('A');
    setWaypointIcon('B');
  }

 /**
  * Generate the HTML of the header and footer of each set of textual directions
  * @param {String} address The address of this endpoint
  * @param {String} letter The letter to display in the marker
  *     (A at the start, B at the end)
  * @return {String} the generated HTML 
  */
  function getDirectionsWaypointHtml(address, letter) {
   var content = getDivHtml('letter' + letter, 'letterIcon', "");
       content += '<span class="waypointAddress">' + address + '</span>';
    return getDivHtml("wayPoint" + letter, "waypoint", content);
  }

 /**
  * Set the icons used in the textual directions address blocks
  * using the appropriate technique for the browser to preserve
  * PNG transparency
  */
  function setWaypointIcon(letter) {
    var png = 'http://maps.google.com/intl/en_us/mapfiles/icon_green' + letter + '.png';
    /*@cc_on @*/
    /*@if (@_jscript_version < 5.7)
    document.getElementById('letter' + letter).style.filter = 'progid:DXImageTransform.Microsoft.AlphaImageLoader(src="' + png + '", sizingMethod="scale");';
    return;
    /*@end @*/ 
    document.getElementById('letter' + letter).style.backgroundImage = 'url(' + png + ')';
  }

 /**
  * Utility function to wrap content in a div tags
  * @param {String} id The id attribute value for this div element
  * @param {String} cssClass The class attribute value for this div element
  * @param {String} content The HTML content to wrap in this div element
  * @return {String} the HTML of the generated div element 
  */
  function getDivHtml(id, cssClass, content) {
    var div = "<div";
    if (id != "") {
      div += ' id="' + id + '"';
    }

    if (cssClass != "") {
      div += ' class="' + cssClass + '"';
    }

    div += '>' + content + '</div>';
    return div;
  }

 /**
  * Handle a click on one of the text directions steps.
  * @param {number} i The index of the step that was clicked on
  */
  function selectStep(i) {
    var vertex = vertexMap[route.getStep(i).getPolylineIndex()];
    stopDriving();
    jumpToVertex(vertex);
  }

 /**
  * Highlight with a blue background one of the text directions steps.
  * @param {number} i The index of the step to highlight
  */
  function highlightStep(i) {
    /* Remove highlighting from the currently highlighted step */
    if (selectedStep != null) {
      document.getElementById("step" + selectedStep).style.backgroundColor = "white";
    }

    /* Highlight the indicated step as requested */
    document.getElementById("step" + i).style.backgroundColor = "#eeeeff";
    selectedStep = i;
  }

 /**
  * Update the UI for driving and start following links
  */
  function startDriving() {
    hideInstruction();
    document.getElementById("route").disabled = true;
    document.getElementById("stopgo").value = "Stop";
    document.getElementById("stopgo").setAttribute('onclick', 'stopDriving()'); 
    document.getElementById("stopgo").onclick = function() { stopDriving(); }
    driving = true;
    advance();
  }

 /**
  * Stop following links and update the UI
  */
  function stopDriving() {
    driving = false;
    
    if (advanceTimer != null) {
      clearTimeout(advanceTimer);
      advanceTimer = null;
    }
    
    document.getElementById("route").disabled = false;
    document.getElementById("stopgo").disabled = false;
    document.getElementById("stopgo").value = "Drive";
    document.getElementById("stopgo").setAttribute('onclick', 'startDriving()'); 
    document.getElementById("stopgo").onclick = function() { startDriving(); }
    showInstruction('Press <b>Drive</b> to follow your route');
  }

 /**
  * Change the speed at which driving progresses by adjusting the delay
  * between following links from one panorama to the next
  */
  function setSpeed() {
    advanceDelay = document.getElementById('speed').selectedIndex;
  }
  
 /**
  * Display a status message that fills the Flash viewer
  * @param {String} message The message to display
  */
  function showStatus(message) {
    hideInstruction();
    document.getElementById("status").innerHTML = message;
    document.getElementById("status").style.display = "block";
    document.getElementById("streetview").style.display = "none";
  }

 /**
  * Hide the currently displayed status message
  */
  function hideStatus() {
    document.getElementById("status").style.display = "none";
    document.getElementById("streetview").style.display = "block";
  }

 /**
  * Display an instructional message at the bottom of the Flash viewer
  * @param {String} message The message to display
  */
  function showInstruction(message) {
    document.getElementById("instruction").innerHTML = message;
    document.getElementById("instruction").style.display = "block";
  }

 /**
  * Hide the currently displayed instructional message
  */
  function hideInstruction() {
    document.getElementById("instruction").style.display = "none";
  }

 /* Following functions based on those provided at:
  * http://www.movable-type.co.uk/scripts/latlong.html
  * Copyright 2002-2008 Chris Veness
  */

 /**
  * Calculate the bearing in degrees between two points
  * @param {number} origin      GLatLng of current location
  * @param {number} destination GLatLng of destination
  * @return {number}
  */
  function getBearing(origin, destination) {
    if (origin.equals(destination)) {
      return null;
    }
    var lat1 = origin.lat().toRad();
    var lat2 = destination.lat().toRad();
    var dLon = (destination.lng()-origin.lng()).toRad();

    var y = Math.sin(dLon) * Math.cos(lat2);
    var x = Math.cos(lat1)*Math.sin(lat2) -
            Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
    return Math.atan2(y, x).toBrng();
  }
  
 /**
  * Convert an angle in degrees to radians
  */
  Number.prototype.toRad = function() {
    return this * Math.PI / 180;
  }

 /**
  * Convert an angle in radians to degrees (signed)
  */
  Number.prototype.toDeg = function() {
    return this * 180 / Math.PI;
  }

 /**
  * Convert radians to degrees (as bearing: 0...360)
  */
  Number.prototype.toBrng = function() {
    return (this.toDeg()+360) % 360;
  }
