/* Following functions based on those provided at:
 * http://www.movable-type.co.uk/scripts/latlong.html
 * Copyright 2002-2008 Chris Veness
 */
 
_.mixin({
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