/**
 * A utility class for spherical geometry (geodesy).
 *
 * All coordinates use [longitude, latitude] order in degrees.
 * Distances are in meters unless noted otherwise.
 * Bearings are in degrees (0-360, clockwise from north).
 * Angular distances are in radians.
 *
 * @example
 * // Distance between Kyiv and London
 * GeoUtils.getDistance([30.52, 50.45], [-0.13, 51.51]) // ~2131 km
 *
 * // Bearing from Kyiv to London
 * GeoUtils.getBearing([30.52, 50.45], [-0.13, 51.51]) // ~289°
 */
export class GeoUtils {
  /**
   * Convert degrees to radians.
   * @param degrees - Angle in degrees
   * @returns Angle in radians
   */
  static _toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Convert radians to degrees.
   * @param radians - Angle in radians
   * @returns Angle in degrees
   */
  static _toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

  /**
   * Normalize an angle to the range [-180, 180] degrees.
   * @param degrees - Angle in degrees (any range)
   * @returns Normalized angle in degrees
   */
  static _normalizeAngle(degrees: number): number {
    return (degrees + 540) % 360 - 180;
  }

  /**
   * Calculate the initial bearing (forward azimuth) from point A to point B.
   *
   * @param pA - Start point [lon, lat]
   * @param pB - End point [lon, lat]
   * @returns Bearing in degrees (0-360, clockwise from north)
   *
   * @example
   * GeoUtils.getBearing([0, 0], [0, 1]) // 0 (due north)
   * GeoUtils.getBearing([0, 0], [1, 0]) // 90 (due east)
   */
  static getBearing(pA: number[], pB: number[]): number {
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

  /**
   * Calculate the interior angle at vertex p2 formed by points p1-p2-p3.
   *
   * @param p1 - First point [lon, lat]
   * @param p2 - Vertex point [lon, lat]
   * @param p3 - Third point [lon, lat]
   * @returns Angle in degrees (0-180)
   *
   * @example
   * // Right angle
   * GeoUtils.findAngle([0, 0], [0, 1], [1, 1]) // ~90°
   *
   * // Straight line
   * GeoUtils.findAngle([0, 0], [0, 1], [0, 2]) // ~180°
   */
  static findAngle(p1: number[], p2: number[], p3: number[]): number {
    const bearing21 = GeoUtils.getBearing(p2, p1);
    const bearing23 = GeoUtils.getBearing(p2, p3);
    let angle = Math.abs(bearing21 - bearing23);

    if (angle > 180) {
      angle = 360 - angle;
    }
    return angle;
  }

  /**
   * Calculate the distance between two points using the Haversine formula.
   *
   * @param pA - First point [lon, lat]
   * @param pB - Second point [lon, lat]
   * @returns Distance in meters
   *
   * @example
   * GeoUtils.getDistance([30.52, 50.45], [-0.13, 51.51]) // ~2131000 m
   */
  static getDistance(pA: number[], pB: number[]): number {
    return GeoUtils.getAngularDistance(pA, pB) * 6371000
  }

  /**
   * Calculate the angular distance between two points using the Haversine formula.
   *
   * @param pA - First point [lon, lat]
   * @param pB - Second point [lon, lat]
   * @returns Angular distance in radians
   */
  static getAngularDistance(pA: number[], pB: number[]): number {
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

  /**
   * Calculate the destination point given a start point, bearing, and angular distance.
   *
   * @param startPoint - Start point [lon, lat]
   * @param bearing - Bearing in degrees (0-360)
   * @param distanceRad - Angular distance in radians
   * @returns Destination point [lon, lat]
   *
   * @example
   * // Move 100km north from the equator
   * const dist = 100000 / 6371000; // convert meters to radians
   * GeoUtils.getDestination([0, 0], 0, dist) // [0, ~0.9]
   */
  static getDestination(startPoint: number[], bearing: number, distanceRad: number): number[] {
    const lat1 = GeoUtils._toRadians(startPoint[1]);
    const lon1 = GeoUtils._toRadians(startPoint[0]);
    const brng = GeoUtils._toRadians(bearing);
    const d = distanceRad;

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(d) +
      Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
    );

    const lon2 = lon1 + Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );

    const lon2Deg = GeoUtils._toDegrees(lon2);
    const lat2Deg = GeoUtils._toDegrees(lat2);

    return [(lon2Deg + 540) % 360 - 180, lat2Deg];
  }

  /**
   * Find a point D on the great circle path A→B such that
   * the angle ADC equals the specified angle.
   *
   * Uses the Four-Part (Cotangent) Formula for spherical triangles.
   *
   * @param pA - Start of line [lon, lat]
   * @param pB - End of line [lon, lat]
   * @param pC - Third point [lon, lat]
   * @param angle - Desired angle at D in degrees (e.g., 90 for perpendicular)
   * @returns Coordinates of D [lon, lat], or null if no solution exists
   *
   * @example
   * // Find where line AB makes a 90° angle with point C
   * GeoUtils.findIntersection(A, B, C, 90)
   */
  static findIntersection(pA: number[], pB: number[], pC: number[], angle: number): number[] | null {
    // Guard: degenerate angle (0° or 180°) makes cot(D) undefined
    if (angle % 180 === 0) {
      return null;
    }

    const angleRad = GeoUtils._toRadians(angle);

    const bearingAB = GeoUtils.getBearing(pA, pB);
    const bearingAC = GeoUtils.getBearing(pA, pC);
    const angleA_rad = GeoUtils._toRadians(bearingAC - bearingAB);

    const distb_rad = GeoUtils.getAngularDistance(pA, pC);

    // Guard: pA and pC are the same point — cot(b) is undefined
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

  /**
   * Find the perpendicular foot from point C onto the great circle
   * defined by points A and B. The resulting point D forms a right
   * angle (90°) at vertex D in triangle ADC.
   *
   * Uses Napier's Rules for right spherical triangles.
   *
   * @param pA - First point of the line [lon, lat]
   * @param pB - Second point of the line [lon, lat] (defines the angle at A)
   * @param pC - Point to project [lon, lat]
   * @returns Coordinates of D [lon, lat] — the perpendicular foot
   *
   * @example
   * // Project point C onto line AB
   * const foot = GeoUtils.findRightAngleIntersection(A, B, C)
   * GeoUtils.findAngle(A, foot, C) // ~90°
   */
  static findRightAngleIntersection(pA: number[], pB: number[], pC: number[]): number[] {
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
    } else {
      bearingAD_deg = GeoUtils._normalizeAngle(bearingAC_deg + angleA_deg);
    }

    return GeoUtils.getDestination(pA, bearingAD_deg, distAD_rad);
  }
}
