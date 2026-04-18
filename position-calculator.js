// position-calculator.js
// Computes runner distance from elapsed time and interpolates position on the course geometry

/**
 * Given elapsed minutes since start, returns the fractional distance
 * along the course in miles (0 to 26.2).
 * Clamps to [0, 26.2].
 * Uses linear interpolation between cumulative time table entries.
 *
 * @param {{ mile: number, cumulativeMinutes: number }[]} cumulativeTable
 * @param {number} elapsedMinutes
 * @returns {number} Distance in miles along the course
 */
export function getDistanceAtTime(cumulativeTable, elapsedMinutes) {
  if (cumulativeTable.length === 0) return 0;

  // Clamp: before start → 0
  if (elapsedMinutes <= 0) return 0;

  // Clamp: after finish → 26.2
  const lastEntry = cumulativeTable[cumulativeTable.length - 1];
  if (elapsedMinutes >= lastEntry.cumulativeMinutes) return 26.2;

  // Find the two entries that bracket the elapsed time
  for (let i = 1; i < cumulativeTable.length; i++) {
    if (elapsedMinutes <= cumulativeTable[i].cumulativeMinutes) {
      const prev = cumulativeTable[i - 1];
      const curr = cumulativeTable[i];
      const timeFraction =
        (elapsedMinutes - prev.cumulativeMinutes) /
        (curr.cumulativeMinutes - prev.cumulativeMinutes);
      return prev.mile + timeFraction * (curr.mile - prev.mile);
    }
  }

  // Fallback (should not reach here)
  return 26.2;
}

/**
 * Given a fractional distance in miles along the course, returns the
 * interpolated [lng, lat] coordinate on the GeoJSON LineString.
 *
 * Uses linear interpolation along the polyline segments, measuring
 * cumulative segment distances (Haversine) to find the correct position.
 *
 * @param {number[][]} coordinates - Array of [lng, lat] from the GeoJSON
 * @param {number} distanceMiles - Distance along the course in miles
 * @param {number} totalLengthMiles - Total course length (26.2)
 * @returns {[number, number]} [lng, lat]
 */
export function interpolatePosition(coordinates, distanceMiles, totalLengthMiles) {
  if (coordinates.length === 0) return [0, 0];
  if (coordinates.length === 1) return coordinates[0];

  const fraction = Math.max(0, Math.min(1, distanceMiles / totalLengthMiles));

  // Fraction 0 → first coordinate
  if (fraction <= 0) return coordinates[0];
  // Fraction 1 → last coordinate
  if (fraction >= 1) return coordinates[coordinates.length - 1];

  // Compute cumulative segment lengths using Haversine
  const segmentLengths = [];
  let totalLength = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const d = haversineDistance(coordinates[i - 1], coordinates[i]);
    segmentLengths.push(d);
    totalLength += d;
  }

  // Target distance along the polyline
  const targetDistance = fraction * totalLength;

  // Walk along segments to find the one containing the target
  let cumulative = 0;
  for (let i = 0; i < segmentLengths.length; i++) {
    const segLen = segmentLengths[i];
    if (cumulative + segLen >= targetDistance) {
      // Interpolate within this segment
      const segFraction = (targetDistance - cumulative) / segLen;
      const [lng1, lat1] = coordinates[i];
      const [lng2, lat2] = coordinates[i + 1];
      return [
        lng1 + segFraction * (lng2 - lng1),
        lat1 + segFraction * (lat2 - lat1),
      ];
    }
    cumulative += segLen;
  }

  // Fallback: return last coordinate
  return coordinates[coordinates.length - 1];
}

/**
 * Computes the Haversine distance between two [lng, lat] points in arbitrary units.
 * Returns distance in consistent units (used only for proportional interpolation,
 * so the actual unit doesn't matter as long as it's consistent).
 *
 * @param {[number, number]} coord1 - [lng, lat]
 * @param {[number, number]} coord2 - [lng, lat]
 * @returns {number} Distance (proportional, consistent units)
 */
function haversineDistance(coord1, coord2) {
  const toRad = (deg) => (deg * Math.PI) / 180;

  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
