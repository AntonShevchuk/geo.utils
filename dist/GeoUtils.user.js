// ==UserScript==
// @name         GeoUtils
// @description  Spherical geometry utility class for WME scripts
// @author       Anton Shevchuk
// @license      MIT License
// @version      0.0.1
// @match        *://*/*
// @grant        none
// @namespace    https://greasyfork.org/users/227648
// ==/UserScript==

(function () {
    'use strict';

    /**
     * A utility class for spherical geometry (geodesy).
     * Assumes points are [longitude, latitude] in degrees.
     */
    class GeoUtils {
        static _toRadians(degrees) {
            return degrees * (Math.PI / 180);
        }
        static _toDegrees(radians) {
            return radians * (180 / Math.PI);
        }
        static _normalizeAngle(degrees) {
            return (degrees + 540) % 360 - 180;
        }
        static getBearing(pA, pB) {
            const latA = GeoUtils._toRadians(pA[1]);
            const lonA = GeoUtils._toRadians(pA[0]);
            const latB = GeoUtils._toRadians(pB[1]);
            const lonB = GeoUtils._toRadians(pB[0]);
            const deltaLon = lonB - lonA;
            const y = Math.sin(deltaLon) * Math.cos(latB);
            const x = Math.cos(latA) * Math.sin(latB) -
                Math.sin(latA) * Math.cos(latB) * Math.cos(deltaLon);
            const bearingRad = Math.atan2(y, x);
            return (GeoUtils._toDegrees(bearingRad) + 360) % 360;
        }
        static findAngle(p1, p2, p3) {
            const bearing21 = GeoUtils.getBearing(p2, p1);
            const bearing23 = GeoUtils.getBearing(p2, p3);
            let angle = Math.abs(bearing21 - bearing23);
            if (angle > 180) {
                angle = 360 - angle;
            }
            return angle;
        }
        static getDistance(pA, pB) {
            return GeoUtils.getAngularDistance(pA, pB) * 6371000;
        }
        static getAngularDistance(pA, pB) {
            const latA = GeoUtils._toRadians(pA[1]);
            const lonA = GeoUtils._toRadians(pA[0]);
            const latB = GeoUtils._toRadians(pB[1]);
            const lonB = GeoUtils._toRadians(pB[0]);
            const deltaLat = latB - latA;
            const deltaLon = lonB - lonA;
            const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                Math.cos(latA) * Math.cos(latB) *
                    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
            return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }
        static getDestination(startPoint, bearing, distanceRad) {
            const lat1 = GeoUtils._toRadians(startPoint[1]);
            const lon1 = GeoUtils._toRadians(startPoint[0]);
            const brng = GeoUtils._toRadians(bearing);
            const d = distanceRad;
            const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) +
                Math.cos(lat1) * Math.sin(d) * Math.cos(brng));
            const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
            const lon2Deg = GeoUtils._toDegrees(lon2);
            const lat2Deg = GeoUtils._toDegrees(lat2);
            return [(lon2Deg + 540) % 360 - 180, lat2Deg];
        }
        static findIntersection(pA, pB, pC, angle) {
            if (angle % 180 === 0) {
                return null;
            }
            const angleRad = GeoUtils._toRadians(angle);
            const bearingAB = GeoUtils.getBearing(pA, pB);
            const bearingAC = GeoUtils.getBearing(pA, pC);
            const angleA_rad = GeoUtils._toRadians(bearingAC - bearingAB);
            const distb_rad = GeoUtils.getAngularDistance(pA, pC);
            if (distb_rad < 1e-12) {
                return null;
            }
            const cot_b = 1.0 / Math.tan(distb_rad);
            const cot_D = 1.0 / Math.tan(angleRad);
            const X = cot_b;
            const Y = Math.cos(angleA_rad);
            const Z = Math.sin(angleA_rad) * cot_D;
            const R = Math.hypot(X, Y);
            const phi = Math.atan2(Y, X);
            const sin_c_minus_phi = Z / R;
            if (Math.abs(sin_c_minus_phi) > 1) {
                return null;
            }
            const distAD_rad = phi + Math.asin(sin_c_minus_phi);
            return GeoUtils.getDestination(pA, bearingAB, distAD_rad);
        }
        static findRightAngleIntersection(pA, pB, pC) {
            const angleA_deg = GeoUtils.findAngle(pB, pA, pC);
            const angleA_rad = GeoUtils._toRadians(angleA_deg);
            const distAC_rad = GeoUtils.getAngularDistance(pA, pC);
            const tan_c = Math.cos(angleA_rad) * Math.tan(distAC_rad);
            const distAD_rad = Math.abs(Math.atan(tan_c));
            const bearingAC_deg = GeoUtils.getBearing(pA, pC);
            const bearingAB_deg = GeoUtils.getBearing(pA, pB);
            const angleCAB_raw_diff = GeoUtils._normalizeAngle(bearingAC_deg - bearingAB_deg);
            let bearingAD_deg;
            if (angleCAB_raw_diff >= 0) {
                bearingAD_deg = GeoUtils._normalizeAngle(bearingAC_deg - angleA_deg);
            }
            else {
                bearingAD_deg = GeoUtils._normalizeAngle(bearingAC_deg + angleA_deg);
            }
            return GeoUtils.getDestination(pA, bearingAD_deg, distAD_rad);
        }
    }

    Object.assign(window, { GeoUtils });

})();
