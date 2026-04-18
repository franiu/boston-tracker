#!/usr/bin/env node
/**
 * Verification script for course-data.js exports.
 * Validates: Requirements 2.1, 2.2, 8.1, 8.2
 */

import { getCourseGeoJSON, getCourseLengthMiles, getCourseBounds } from '../course-data.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

// --- Verify getCourseGeoJSON() ---
console.log('\n=== getCourseGeoJSON() ===');
const geojson = getCourseGeoJSON();

assert(geojson.type === 'Feature', 'GeoJSON type is "Feature"');
assert(geojson.properties && geojson.properties.name === '2026 Boston Marathon Course', 'Feature has correct name property');
assert(geojson.geometry && geojson.geometry.type === 'LineString', 'Geometry type is "LineString"');

const coords = geojson.geometry.coordinates;
assert(Array.isArray(coords), 'Coordinates is an array');
assert(coords.length === 1381, `Coordinate count is 1381 (got ${coords.length})`);

// Verify coordinate format [lng, lat]
const firstCoord = coords[0];
const lastCoord = coords[coords.length - 1];
assert(firstCoord.length === 2, 'First coordinate has 2 elements [lng, lat]');
assert(firstCoord[0] < -71 && firstCoord[0] > -72, `First coord lng is in Boston area (got ${firstCoord[0]})`);
assert(firstCoord[1] > 42 && firstCoord[1] < 43, `First coord lat is in Boston area (got ${firstCoord[1]})`);

// Verify start is near Hopkinton (west) and end is near Boston (east)
assert(firstCoord[0] < -71.5, `Start point is near Hopkinton (lng ${firstCoord[0]} < -71.5)`);
assert(lastCoord[0] > -71.1, `End point is near Boston (lng ${lastCoord[0]} > -71.1)`);

// --- Verify getCourseLengthMiles() ---
console.log('\n=== getCourseLengthMiles() ===');
const length = getCourseLengthMiles();
assert(length === 26.2, `Course length is 26.2 miles (got ${length})`);

// --- Verify getCourseBounds() ---
console.log('\n=== getCourseBounds() ===');
const bounds = getCourseBounds();
assert(Array.isArray(bounds), 'Bounds is an array');
assert(bounds.length === 4, `Bounds has 4 elements [west, south, east, north] (got ${bounds.length})`);

const [west, south, east, north] = bounds;

// Hopkinton is west (~-71.52), Boston is east (~-71.08)
assert(west < -71.5, `West bound covers Hopkinton (${west} < -71.5)`);
assert(east > -71.1, `East bound covers Boston (${east} > -71.1)`);
assert(south > 42.2 && south < 42.3, `South bound is reasonable (${south})`);
assert(north > 42.3 && north < 42.4, `North bound is reasonable (${north})`);

// Verify bounds are consistent
assert(west < east, 'West < East');
assert(south < north, 'South < North');

// --- Summary ---
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
