# GeoUtils

Spherical geometry utility class for WME (Waze Map Editor) userscripts.

Provides geodesic calculations on a spherical Earth model: bearings, angles, Haversine distances, destination points, and great-circle intersections. All coordinates use **[longitude, latitude]** order in degrees.

## Usage

Load via `@require` in a userscript header:

```
// @require  https://greasyfork.org/scripts/.../GeoUtils.user.js
```

Then use the global `GeoUtils` class:

```js
const bearing = GeoUtils.getBearing([30.52, 50.45], [-0.13, 51.51]);
const distance = GeoUtils.getDistance([30.52, 50.45], [-0.13, 51.51]);
```

## API

| Method | Description |
|--------|-------------|
| `getBearing(pA, pB)` | Initial bearing from pA to pB (0-360) |
| `findAngle(p1, p2, p3)` | Interior angle at vertex p2 (0-180) |
| `getDistance(pA, pB)` | Distance in meters (Haversine) |
| `getAngularDistance(pA, pB)` | Distance in radians |
| `getDestination(point, bearing, distRad)` | Point at given bearing and angular distance |
| `findIntersection(pA, pB, pC, angle)` | Point on line AB making given angle with C |
| `findRightAngleIntersection(pA, pB, pC)` | Perpendicular foot from C onto line AB |

## Development

```bash
npm install
npm run build
npm test
```

## Links

Author homepage: https://anton.shevchuk.name/  
Author pet projects: https://hohli.com/  
Support author: https://donate.hohli.com/  
