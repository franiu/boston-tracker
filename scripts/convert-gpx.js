#!/usr/bin/env node
/**
 * GPX to GeoJSON conversion script.
 * Parses the Boston Marathon GPX file, extracts trackpoint coordinates,
 * converts to [lng, lat] GeoJSON order, computes bounding box,
 * and writes course-data.js as a static ES module.
 */

const fs = require('fs');
const path = require('path');

const gpxPath = path.resolve(__dirname, '..', 'course', 'gpx_20250421_id10253_race1_20250406001335.gpx');
const outputPath = path.resolve(__dirname, '..', 'course-data.js');

// Read GPX file
const gpxContent = fs.readFileSync(gpxPath, 'utf-8');

// Extract all <trkpt lat="..." lon="..."> coordinates using regex
const trkptRegex = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"/g;
const coordinates = [];
let match;

while ((match = trkptRegex.exec(gpxContent)) !== null) {
  const lat = parseFloat(match[1]);
  const lon = parseFloat(match[2]);
  // GeoJSON order: [longitude, latitude]
  coordinates.push([lon, lat]);
}

if (coordinates.length === 0) {
  console.error('No trackpoints found in GPX file.');
  process.exit(1);
}

console.log(`Extracted ${coordinates.length} trackpoints from GPX.`);

// Compute bounding box [west, south, east, north]
let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;

for (const [lng, lat] of coordinates) {
  if (lng < west) west = lng;
  if (lng > east) east = lng;
  if (lat < south) south = lat;
  if (lat > north) north = lat;
}

const bounds = [west, south, east, north];
console.log(`Bounding box: [${bounds.join(', ')}]`);

// Format coordinates as a string for embedding
const coordsStr = coordinates
  .map(([lng, lat]) => `    [${lng}, ${lat}]`)
  .join(',\n');

// Write course-data.js
const output = `// Auto-generated from: course/gpx_20250421_id10253_race1_20250406001335.gpx
// ${coordinates.length} trackpoints extracted, converted to [lng, lat] GeoJSON order.

const COURSE_COORDINATES = [
${coordsStr}
];

const COURSE_BOUNDS = [${bounds.join(', ')}];

/**
 * Returns the 2026 Boston Marathon course as a GeoJSON Feature with LineString geometry.
 * @returns {GeoJSON.Feature<GeoJSON.LineString>}
 */
export function getCourseGeoJSON() {
  return {
    type: 'Feature',
    properties: {
      name: '2026 Boston Marathon Course'
    },
    geometry: {
      type: 'LineString',
      coordinates: COURSE_COORDINATES
    }
  };
}

/**
 * Returns the total length of the course in miles.
 * @returns {number}
 */
export function getCourseLengthMiles() {
  return 26.2;
}

/**
 * Returns the bounding box [west, south, east, north] for the course.
 * @returns {[number, number, number, number]}
 */
export function getCourseBounds() {
  return COURSE_BOUNDS;
}
`;

fs.writeFileSync(outputPath, output, 'utf-8');
console.log(`Written course-data.js with ${coordinates.length} coordinates.`);
console.log(`Bounds: west=${bounds[0]}, south=${bounds[1]}, east=${bounds[2]}, north=${bounds[3]}`);
