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
 *  Modified: Kelly Miyashiro for reroute hackathon
 *
 *  Street View API Example: Following driving directions in Street View,
 *
 *  We extract the polyline generated for the route and then attempt to
 *  follow links that match the direction of the line segment as we move
 *  along it. Sometimes we find a gap in coverage, or that a link does
 *  not exist in the direction we need. When this happens we jump to the
 *  start of the next step given in the text directions.
 */

var routeHelper = {
    /**
     * Get the direction to head in from a particular vertex
     * @param {number} n Index of the vertex in the vertices array
     * @return {number} bearing in degrees
     */
     getBearingFromVertex: function(n) {
       var origin = diana.overviewPath[n];
       var destination = diana.overviewPath[n+1];
       if (destination != undefined) {
         return _.getBearing(origin, destination);
       } else {
         return null;
       }
     },

    /**
     * Jump to a particular point on the route. This is used to
     * queue up the start of the route, when a user selects a step
     * in the driving directions, and when there is a gap in coverage
     * that we need to jump over.
     * @param {number} idx The vertex number in the vertices array
     */ 

     jumpToVertex: function jumpToVertex(idx) {
       currentLatLng = diana.overviewPath[idx];
       nextVertex = diana.overviewPath[idx + 1];
       nextVertexId = idx + 1;

      console.log("overviewPath: ", idx);
      console.log("overviewPath: ", diana.overviewPath[idx]);

           bearing = this.getBearingFromVertex(idx);
       nextBearing = this.getBearingFromVertex(idx + 1);

       // setCarMarkerImage(bearing);
       // carMarker.setLatLng(currentLatLng);
       // carMarker.show();

       // currentStep = stepMap[idx];
       // constructProgressArray(idx);
       // setProgressDistance();
       // updateProgressBar(0);

       diana.map.panTo(currentLatLng, 16);
       // highlightStep(currentStep);
       // checkDistanceFromNextVertex();

       diana.streetview.setPosition(currentLatLng);
       diana.streetview.setPov({ heading: bearing, pitch: 0, zoom: 0 });
       // svClient.getNearestPanorama(currentLatLng, function(loc) {
       //   if (loc.code == 500) {
       //     setTimeout("jumpToVertex(" + idx + ")", 1000);
       //   } else if (loc.code == 600) {
       //     jumpToVertex(nextVertexId);
       //   } else {
       //     panoMetaData = loc.location;
       //     panoMetaData.pov.yaw = bearing;
       //     moveCar();
       //   }
       // });

        var steps = diana.currentRoute.routes[0].legs[0].steps;

        for (var i = 0, len = steps.length; i < len; i++) {
            var delta = 0.0005;
            var linePoly = [{x: steps[i].start_location.lat()+delta, y: steps[i].start_location.lng()+delta},
                            {x: steps[i].end_location.lat()+delta, y: steps[i].end_location.lng()+delta},
                            {x: steps[i].end_location.lat()-delta, y: steps[i].end_location.lng()-delta},
                            {x: steps[i].start_location.lat()-delta, y: steps[i].start_location.lng()-delta},
                            {x: steps[i].start_location.lat()+delta, y: steps[i].start_location.lng()+delta}]
              if (this.isPointInPoly(linePoly, {x:currentLatLng.lat(), y:currentLatLng.lng()})) {
                diana.currentStep = i;
              }
        }

        this.highlightStep(diana.currentStep);
        return nextVertexId;
     },

    isPointInPoly: function(poly, pt) {
      for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
          ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y))
          && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
          && (c = !c);
      return c;
    },

     jumpToNextVertex: function() {
        var len = diana.overviewPath.length;
        if (nextVertexId > len) return false;
        this.jumpToVertex(nextVertexId);
     },

     jumpToPrevVertex: function() {
        if (nextVertexId == 1) return false;
        this.jumpToVertex(nextVertexId - 2); 
     },

     highlightStep: function(i) {
      console.log("highlight: ", i);
      $(".highlighted").removeClass("highlighted");
      $("#progress-bar table td:eq("+i+")").addClass("highlighted");
     },

     findClosestVertexByPathNum: function(pathNum) {
        var closest = {Ya: 0, Za: 0};
        var closestIdx = -1;
        var steps = diana.currentRoute.routes[0].legs[0].steps;
        var starting_point = {Ya: steps[pathNum].start_location.lat(), Za: steps[pathNum].start_location.lng()};
        var i;
        for (i = 0; i < diana.overviewPath.length; i++) {
          if (this.latLngDistance(diana.overviewPath[i], starting_point) < this.latLngDistance(closest, starting_point)) {
            closest = diana.overviewPath[i];
            closestIdx = i;
          }
        }
        return closestIdx;
     },

     latLngDistance: function(p1, p2) {
        return Math.abs(p2["Ya"] - p1["Ya"]) + Math.abs(p2["Za"] - p1["Za"])
     },

     play: function() {
        diana.map.setZoom(17);
        this.playing = setInterval(function() {
            if (routeHelper.jumpToNextVertex() == false) {
                routeHelper.pause();
            }
        }, 1800);
     },

     pause: function() {
        clearInterval(routeHelper.playing);
        routeHelper.playing = null;
     },

     /**
      * Check if we have already passed the next vertex, or if we are
      * close enough to the next vertex to look out for the next turn.
      */ 
     checkDistanceFromNextVertex: function() {
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
    },

    /**
     * Build the vertices, vertexMap, stepToVertex, and stepMap
     * arrays from the vertices of the route polyline.
     * @param {GPolyline} path The route polyline to process
     */
    collapseVertices: function(route) {
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
    },

    /**
     * Update the in Flash viewer next step driving directions
     * @param {number} distanceFromStartOfStep Distance in meters from the start
     *     of the current route step
     */
    updateViewerDirections: function(distanceFromStartOfStep) {
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
};
