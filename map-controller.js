// map-controller.js
// Manages Mapbox GL JS map: course rendering, runner marker, and style toggling.

/* global mapboxgl */

import { MAPBOX_TOKEN } from './config.js';

const VECTOR_STYLE = 'mapbox://styles/mapbox/streets-v12';
const SATELLITE_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12';

let map = null;
let marker = null;
let courseGeoJSONData = null;
let activeStyle = 'vector';

/**
 * Initializes the Mapbox GL JS map, fits to course bounds, draws the
 * course polyline, and creates the runner marker.
 *
 * @param {string} containerId - DOM element ID for the map
 * @param {GeoJSON.Feature} courseGeoJSON - The course geometry
 * @param {[number,number,number,number]} bounds - Course bounding box [west, south, east, north]
 */
export function initMap(containerId, courseGeoJSON, bounds) {
  mapboxgl.accessToken = MAPBOX_TOKEN;

  courseGeoJSONData = courseGeoJSON;

  map = new mapboxgl.Map({
    container: containerId,
    style: VECTOR_STYLE,
    bounds: [[bounds[0], bounds[1]], [bounds[2], bounds[3]]],
    fitBoundsOptions: { padding: 40 }
  });

  map.on('load', () => {
    addCourseLayer();
    const firstCoord = courseGeoJSON.geometry.coordinates[0];
    marker = new mapboxgl.Marker({ color: '#e53935' })
      .setLngLat(firstCoord)
      .addTo(map);
  });
}

/**
 * Updates the runner marker position with smooth animation.
 * @param {[number, number]} lngLat - [lng, lat] coordinate
 */
export function updateRunnerPosition(lngLat) {
  if (marker) {
    marker.setLngLat(lngLat);
  }
}

/**
 * Toggles between vector and satellite map styles.
 * Preserves course polyline and runner marker after style change.
 */
export function toggleMapStyle() {
  const currentLngLat = marker ? marker.getLngLat() : null;

  if (activeStyle === 'vector') {
    activeStyle = 'satellite';
    map.setStyle(SATELLITE_STYLE);
  } else {
    activeStyle = 'vector';
    map.setStyle(VECTOR_STYLE);
  }

  map.once('style.load', () => {
    addCourseLayer();
    if (marker && currentLngLat) {
      marker.addTo(map);
      marker.setLngLat(currentLngLat);
    }
  });
}

/**
 * Returns the currently active style name ("vector" or "satellite").
 * @returns {string}
 */
export function getActiveStyle() {
  return activeStyle;
}

/**
 * Adds the course GeoJSON source and line layer to the map.
 * @private
 */
function addCourseLayer() {
  if (!map || !courseGeoJSONData) return;

  map.addSource('course', {
    type: 'geojson',
    data: courseGeoJSONData
  });

  map.addLayer({
    id: 'course-line',
    type: 'line',
    source: 'course',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#1a73e8',
      'line-width': 4
    }
  });
}
