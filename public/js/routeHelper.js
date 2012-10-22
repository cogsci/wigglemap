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
     },

    /**
     * Called by the panorama's initialized event handler in
     * response to a link being followed. Updates the location
     * of the vehicle marker and the center of the map to match
     * the location of the panorama loaded by following the link.
     */ 

     moveCar: function moveCar() {
       currentLatLng = panoMetaData.latlng;
       carMarker.setLatLng(currentLatLng);
       diana.map.panTo(currentLatLng);

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
};