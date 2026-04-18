// Property test: Geographic interpolation lies on polyline (Property 3)
// **Validates: Requirements 3.5**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { interpolatePosition } from '../position-calculator.js';

/**
 * Generator for valid polylines: arrays of [lng, lat] with at least 2 points
 * where segments have meaningful length for floating-point arithmetic.
 * Uses integer-based coordinates scaled to reasonable geographic ranges
 * to avoid subnormal/denormalized floating-point edge cases.
 */
const polylineArb = fc.array(
  fc.tuple(
    fc.double({ min: -179, max: 179, noNaN: true, noDefaultInfinity: true }),
    fc.double({ min: -89, max: 89, noNaN: true, noDefaultInfinity: true })
  ),
  { minLength: 2, maxLength: 50 }
).filter((coords) => {
  // Ensure polyline has at least one segment with meaningful length
  // (points differ by at least 1e-6 degrees in at least one dimension)
  for (let i = 1; i < coords.length; i++) {
    const dlng = Math.abs(coords[i][0] - coords[i - 1][0]);
    const dlat = Math.abs(coords[i][1] - coords[i - 1][1]);
    if (dlng > 1e-6 || dlat > 1e-6) {
      return true;
    }
  }
  return false;
});

/**
 * Generator for fractions in (0, 1) exclusive — boundary cases tested separately.
 */
const fractionArb = fc.double({ min: 1e-10, max: 1 - 1e-10, noNaN: true, noDefaultInfinity: true });

/**
 * Checks if point P is on the segment from A to B within a tolerance.
 * Uses the approach: P is on segment AB if:
 *   1. P is collinear with A and B (cross product ≈ 0)
 *   2. P is between A and B (dot product check)
 */
function isPointOnSegment(p, a, b, tolerance = 1e-9) {
  const [px, py] = p;
  const [ax, ay] = a;
  const [bx, by] = b;

  // Vector AB and AP
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;

  // Cross product (collinearity check)
  const cross = abx * apy - aby * apx;

  // Segment length squared
  const segLenSq = abx * abx + aby * aby;

  // For zero-length segments, check if point equals the endpoint
  if (segLenSq < 1e-20) {
    const dist = Math.sqrt(apx * apx + apy * apy);
    return dist < tolerance;
  }

  // Collinearity: |cross| / segLen < tolerance
  if (Math.abs(cross) / Math.sqrt(segLenSq) > tolerance) {
    return false;
  }

  // Projection of P onto AB: t = dot(AP, AB) / |AB|^2
  const dot = apx * abx + apy * aby;
  const t = dot / segLenSq;

  // P must be between A and B (with tolerance)
  return t >= -tolerance && t <= 1 + tolerance;
}

/**
 * Checks if a point lies on any segment of the polyline.
 */
function isPointOnPolyline(point, coordinates, tolerance = 1e-9) {
  for (let i = 0; i < coordinates.length - 1; i++) {
    if (isPointOnSegment(point, coordinates[i], coordinates[i + 1], tolerance)) {
      return true;
    }
  }
  return false;
}

describe('Property 3: Geographic interpolation lies on polyline', () => {
  const totalLength = 26.2; // arbitrary positive total length

  it('fraction 0 returns the first coordinate', () => {
    fc.assert(
      fc.property(polylineArb, (coordinates) => {
        const result = interpolatePosition(coordinates, 0, totalLength);
        expect(result[0]).toBe(coordinates[0][0]);
        expect(result[1]).toBe(coordinates[0][1]);
      }),
      { numRuns: 200 }
    );
  });

  it('fraction 1 returns the last coordinate', () => {
    fc.assert(
      fc.property(polylineArb, (coordinates) => {
        const result = interpolatePosition(coordinates, totalLength, totalLength);
        expect(result[0]).toBe(coordinates[coordinates.length - 1][0]);
        expect(result[1]).toBe(coordinates[coordinates.length - 1][1]);
      }),
      { numRuns: 200 }
    );
  });

  it('for any fraction in [0,1], the interpolated point lies on a segment of the polyline', () => {
    fc.assert(
      fc.property(polylineArb, fractionArb, (coordinates, fraction) => {
        const distanceMiles = fraction * totalLength;
        const result = interpolatePosition(coordinates, distanceMiles, totalLength);

        // Use a tolerance appropriate for floating-point linear interpolation
        const onPolyline = isPointOnPolyline(result, coordinates, 1e-7);
        expect(onPolyline).toBe(true);
      }),
      { numRuns: 500 }
    );
  });
});
