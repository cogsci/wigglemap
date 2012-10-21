/* Following functions based on those provided at:
 * http://www.movable-type.co.uk/scripts/latlong.html
 * Copyright 2002-2008 Chris Veness
 */

_.mixin({
    /**
     * Calculate the bearing in degrees between two points
     * @param {number} origin      GLatLng of current location
     * @param {number} destination GLatLng of destination
     * @return {number}
     */
     getBearing: function(origin, destination) {
        if (origin.equals(destination)) {
            return null;
        }
        var lat1 = _.toRad(origin.lat());
        var lat2 = _.toRad(destination.lat());
        var dLon = _.toRad((destination.lng()-origin.lng()));

        var y = Math.sin(dLon) * Math.cos(lat2);
        var x = Math.cos(lat1)*Math.sin(lat2) -
                Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
        return _.toBrng(Math.atan2(y, x));
     }
    /**
     * Convert an angle in degrees to radians
     */

    toRad: function(num) {
        return num * Math.PI / 180;
    },

    /**
     * Convert an angle in radians to degrees (signed)
     */

    toDeg: function(num) {
        return num * 180 / Math.PI;
    },

    /**
     * Convert radians to degrees (as bearing: 0...360)
     */

    toBrng: function(num) {
        return (_.toDeg(num) + 360) % 360;
    }
});