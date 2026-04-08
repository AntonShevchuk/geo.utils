# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GeoUtils is a shared spherical geometry utility library for WME (Waze Map Editor) userscripts. It provides geodesic calculations: bearings, angles, distances (Haversine), destination points, and great-circle intersections.

Source is written in TypeScript under `src/`, built with Rollup into `dist/GeoUtils.user.js`. No external dependencies.

## Commands

- **Install:** `npm install`
- **Build:** `npm run build`
- **Watch:** `npm run watch`
- **Test:** `npm test`

## Architecture

```
src/
├── meta.ts          # userscript header
├── geo-utils.ts     # GeoUtils class (all static methods)
└── index.ts         # exposes GeoUtils to global scope
```

## Key Methods

- `getBearing(pA, pB)` — initial bearing between two points
- `findAngle(p1, p2, p3)` — interior angle at vertex p2
- `getDistance(pA, pB)` — distance in meters (Haversine)
- `getDestination(point, bearing, distance)` — destination from point
- `findIntersection(pA, pB, pC, angle)` — point on AB with angle to C
- `findRightAngleIntersection(pA, pB, pC)` — perpendicular foot from C to AB

All methods use [longitude, latitude] coordinate order.

## Coding Conventions

- TypeScript with `strict: false`
- Pure math — no external dependencies
- GitHub Actions auto-builds `dist/` on push
