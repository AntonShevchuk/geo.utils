import { describe, it, expect } from 'vitest'
import { GeoUtils } from '../src/geo-utils'

// Known coordinates
const kyiv = [30.5234, 50.4501]
const london = [-0.1278, 51.5074]
const paris = [2.3522, 48.8566]
const newYork = [-74.0060, 40.7128]

// Points for small-distance tests
const kyivOffset = [30.5334, 50.4601] // ~1km offset from Kyiv

describe('_toRadians / _toDegrees', () => {
  it('converts 180 degrees to PI radians', () => {
    expect(GeoUtils._toRadians(180)).toBeCloseTo(Math.PI, 10)
  })

  it('converts 90 degrees to PI/2 radians', () => {
    expect(GeoUtils._toRadians(90)).toBeCloseTo(Math.PI / 2, 10)
  })

  it('converts PI radians to 180 degrees', () => {
    expect(GeoUtils._toDegrees(Math.PI)).toBeCloseTo(180, 10)
  })

  it('round-trips correctly', () => {
    const original = 42.7
    expect(GeoUtils._toDegrees(GeoUtils._toRadians(original))).toBeCloseTo(original, 10)
  })

  it('handles zero', () => {
    expect(GeoUtils._toRadians(0)).toBe(0)
    expect(GeoUtils._toDegrees(0)).toBe(0)
  })

  it('handles negative values', () => {
    expect(GeoUtils._toRadians(-90)).toBeCloseTo(-Math.PI / 2, 10)
    expect(GeoUtils._toDegrees(-Math.PI)).toBeCloseTo(-180, 10)
  })
})

describe('_normalizeAngle', () => {
  it('keeps angles within range unchanged', () => {
    expect(GeoUtils._normalizeAngle(0)).toBeCloseTo(0)
    expect(GeoUtils._normalizeAngle(90)).toBeCloseTo(90)
    expect(GeoUtils._normalizeAngle(-90)).toBeCloseTo(-90)
    expect(GeoUtils._normalizeAngle(179)).toBeCloseTo(179)
    expect(GeoUtils._normalizeAngle(-179)).toBeCloseTo(-179)
  })

  it('wraps 360 to 0', () => {
    expect(GeoUtils._normalizeAngle(360)).toBeCloseTo(0)
  })

  it('wraps 270 to -90', () => {
    expect(GeoUtils._normalizeAngle(270)).toBeCloseTo(-90)
  })

  it('wraps -270 to 90', () => {
    expect(GeoUtils._normalizeAngle(-270)).toBeCloseTo(90)
  })

  it('wraps 540 to -180 (edge)', () => {
    expect(GeoUtils._normalizeAngle(540)).toBeCloseTo(-180)
  })
})

describe('getBearing', () => {
  it('returns ~0 for due north', () => {
    const south = [0, 0]
    const north = [0, 10]
    expect(GeoUtils.getBearing(south, north)).toBeCloseTo(0, 1)
  })

  it('returns ~180 for due south', () => {
    const north = [0, 10]
    const south = [0, 0]
    expect(GeoUtils.getBearing(north, south)).toBeCloseTo(180, 1)
  })

  it('returns ~90 for due east on the equator', () => {
    const west = [0, 0]
    const east = [10, 0]
    expect(GeoUtils.getBearing(west, east)).toBeCloseTo(90, 1)
  })

  it('returns ~270 for due west on the equator', () => {
    const east = [10, 0]
    const west = [0, 0]
    expect(GeoUtils.getBearing(east, west)).toBeCloseTo(270, 1)
  })

  it('returns a reasonable bearing from Kyiv to London', () => {
    const bearing = GeoUtils.getBearing(kyiv, london)
    // Kyiv to London is roughly west-northwest
    expect(bearing).toBeGreaterThan(270)
    expect(bearing).toBeLessThan(320)
  })
})

describe('findAngle', () => {
  it('finds ~90 degrees for a right angle', () => {
    const p1 = [0, 1]   // north
    const p2 = [0, 0]   // vertex at origin
    const p3 = [1, 0]   // east
    const angle = GeoUtils.findAngle(p1, p2, p3)
    expect(angle).toBeCloseTo(90, 0)
  })

  it('finds ~180 degrees for a straight line', () => {
    const p1 = [-5, 0]
    const p2 = [0, 0]
    const p3 = [5, 0]
    const angle = GeoUtils.findAngle(p1, p2, p3)
    expect(angle).toBeCloseTo(180, 0)
  })

  it('finds an acute angle', () => {
    const p1 = [1, 1]
    const p2 = [0, 0]
    const p3 = [1, 0]
    const angle = GeoUtils.findAngle(p1, p2, p3)
    expect(angle).toBeGreaterThan(0)
    expect(angle).toBeLessThan(90)
  })

  it('returns 0 for identical points p1 and p3', () => {
    const p1 = [5, 5]
    const p2 = [0, 0]
    const angle = GeoUtils.findAngle(p1, p2, p1)
    expect(angle).toBeCloseTo(0, 1)
  })
})

describe('getDistance', () => {
  it('returns 0 for the same point', () => {
    expect(GeoUtils.getDistance(kyiv, kyiv)).toBeCloseTo(0, 1)
  })

  it('calculates Kyiv to London (~2130 km)', () => {
    const dist = GeoUtils.getDistance(kyiv, london)
    // Known distance is approximately 2130 km
    expect(dist).toBeGreaterThan(2_100_000)
    expect(dist).toBeLessThan(2_200_000)
  })

  it('calculates London to Paris (~340 km)', () => {
    const dist = GeoUtils.getDistance(london, paris)
    expect(dist).toBeGreaterThan(330_000)
    expect(dist).toBeLessThan(360_000)
  })

  it('is symmetric', () => {
    const d1 = GeoUtils.getDistance(kyiv, london)
    const d2 = GeoUtils.getDistance(london, kyiv)
    expect(d1).toBeCloseTo(d2, 1)
  })

  it('handles small distances', () => {
    const dist = GeoUtils.getDistance(kyiv, kyivOffset)
    expect(dist).toBeGreaterThan(500)
    expect(dist).toBeLessThan(2000)
  })
})

describe('getAngularDistance', () => {
  it('returns 0 for the same point', () => {
    expect(GeoUtils.getAngularDistance(kyiv, kyiv)).toBeCloseTo(0, 10)
  })

  it('returns a positive value for different points', () => {
    expect(GeoUtils.getAngularDistance(kyiv, london)).toBeGreaterThan(0)
  })

  it('is symmetric', () => {
    const d1 = GeoUtils.getAngularDistance(kyiv, london)
    const d2 = GeoUtils.getAngularDistance(london, kyiv)
    expect(d1).toBeCloseTo(d2, 10)
  })
})

describe('getDestination', () => {
  it('moving north increases latitude', () => {
    const start = [0, 0]
    const distRad = 100 / 6371000 // 100m in radians
    const dest = GeoUtils.getDestination(start, 0, distRad)
    expect(dest[1]).toBeGreaterThan(0)
    expect(dest[0]).toBeCloseTo(0, 5)
  })

  it('moving east increases longitude', () => {
    const start = [0, 0]
    const distRad = 100 / 6371000
    const dest = GeoUtils.getDestination(start, 90, distRad)
    expect(dest[0]).toBeGreaterThan(0)
    expect(dest[1]).toBeCloseTo(0, 5)
  })

  it('moving south decreases latitude', () => {
    const start = [0, 10]
    const distRad = 1000 / 6371000
    const dest = GeoUtils.getDestination(start, 180, distRad)
    expect(dest[1]).toBeLessThan(10)
  })

  it('round-trip: destination then distance matches', () => {
    const start = kyiv
    const bearingDeg = 45
    const distMeters = 50000
    const distRad = distMeters / 6371000

    const dest = GeoUtils.getDestination(start, bearingDeg, distRad)
    const computedDist = GeoUtils.getDistance(start, dest)

    expect(computedDist).toBeCloseTo(distMeters, -1) // within ~10m
  })

  it('zero distance returns the same point', () => {
    const dest = GeoUtils.getDestination(kyiv, 90, 0)
    expect(dest[0]).toBeCloseTo(kyiv[0], 5)
    expect(dest[1]).toBeCloseTo(kyiv[1], 5)
  })
})

describe('findIntersection', () => {
  it('returns null for angle 0 (degenerate)', () => {
    expect(GeoUtils.findIntersection(kyiv, london, paris, 0)).toBeNull()
  })

  it('returns null for angle 180 (degenerate)', () => {
    expect(GeoUtils.findIntersection(kyiv, london, paris, 180)).toBeNull()
  })

  it('returns null for angle 360 (degenerate)', () => {
    expect(GeoUtils.findIntersection(kyiv, london, paris, 360)).toBeNull()
  })

  it('returns null when pA and pC coincide', () => {
    expect(GeoUtils.findIntersection(kyiv, london, kyiv, 90)).toBeNull()
  })

  it('returns a point for valid inputs with 90 degrees', () => {
    const result = GeoUtils.findIntersection(kyiv, london, paris, 90)
    expect(result).not.toBeNull()
    expect(result).toHaveLength(2)
    // Result should be a valid coordinate
    expect(result[0]).toBeGreaterThanOrEqual(-180)
    expect(result[0]).toBeLessThanOrEqual(180)
    expect(result[1]).toBeGreaterThanOrEqual(-90)
    expect(result[1]).toBeLessThanOrEqual(90)
  })

  it('returns a point for 45-degree angle', () => {
    const result = GeoUtils.findIntersection(kyiv, london, paris, 45)
    expect(result).not.toBeNull()
  })
})

describe('findRightAngleIntersection', () => {
  it('returns a point on the line AB closest to C', () => {
    // Line from west to east along equator, point C is north
    const pA = [-1, 0]
    const pB = [1, 0]
    const pC = [0, 1]

    const result = GeoUtils.findRightAngleIntersection(pA, pB, pC)
    expect(result).not.toBeNull()
    expect(result).toHaveLength(2)

    // The foot should be near longitude 0
    expect(result[0]).toBeCloseTo(0, 0)
    // The foot should be on or near the equator
    expect(result[1]).toBeCloseTo(0, 0)
  })

  it('forms approximately 90 degrees at the foot', () => {
    const pA = [30.0, 50.0]
    const pB = [31.0, 50.0]
    const pC = [30.5, 50.5]

    const foot = GeoUtils.findRightAngleIntersection(pA, pB, pC)
    expect(foot).not.toBeNull()

    // The angle at the foot between C and B should be close to 90
    const angle = GeoUtils.findAngle(pC, foot, pB)
    expect(angle).toBeCloseTo(90, 0)
  })

  it('works with real-world coordinates', () => {
    // Line from Kyiv to London, perpendicular foot from Paris
    const result = GeoUtils.findRightAngleIntersection(kyiv, london, paris)
    expect(result).not.toBeNull()
    expect(result).toHaveLength(2)
    // Result should be a valid coordinate between Kyiv and London roughly
    expect(result[0]).toBeGreaterThanOrEqual(-10)
    expect(result[0]).toBeLessThanOrEqual(35)
    expect(result[1]).toBeGreaterThanOrEqual(45)
    expect(result[1]).toBeLessThanOrEqual(55)
  })
})
