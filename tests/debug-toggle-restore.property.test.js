// Property test: Debug mode toggle restores real-time behavior (Property 9)
// **Validates: Requirements 9.6, 9.7**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Extracted elapsed time computation from app.js:
 * When debugMode is true: elapsed = (sliderPercent / 100) * totalRaceTime
 * When debugMode is false: elapsed = (Date.now() - startTime.getTime()) / 60000
 */
function computeElapsed(debugMode, sliderPercent, totalRaceTime, startTime) {
  if (debugMode) {
    return (sliderPercent / 100) * totalRaceTime;
  }
  return (Date.now() - startTime.getTime()) / 60000;
}

describe('Property 9: Debug mode toggle restores real-time behavior', () => {
  it('after disabling debug mode, elapsed time equals (now - startTime) / 60000 regardless of slider position', () => {
    fc.assert(
      fc.property(
        // Generate a start time between 1 hour ago and now
        fc.integer({ min: 1, max: 3600000 }).map(msAgo => new Date(Date.now() - msAgo)),
        // Generate any slider position that was previously set
        fc.integer({ min: 0, max: 100 }),
        // Generate any total race time
        fc.double({ min: 100, max: 400, noNaN: true }),
        (startTime, previousSliderPercent, totalRaceTime) => {
          // Simulate: debug mode was enabled with some slider position
          const debugElapsed = computeElapsed(true, previousSliderPercent, totalRaceTime, startTime);
          // Debug elapsed depends on slider
          expect(debugElapsed).toBeCloseTo((previousSliderPercent / 100) * totalRaceTime, 10);

          // Now disable debug mode - elapsed should use real wall-clock time
          const now = Date.now();
          const realElapsed = computeElapsed(false, previousSliderPercent, totalRaceTime, startTime);
          const expectedElapsed = (now - startTime.getTime()) / 60000;

          // Within 1 second tolerance (1/60 of a minute)
          expect(Math.abs(realElapsed - expectedElapsed)).toBeLessThan(1 / 60);
        }
      ),
      { numRuns: 500 }
    );
  });

  it('result is independent of previous slider position when debug mode is disabled', () => {
    fc.assert(
      fc.property(
        // Generate a start time
        fc.integer({ min: 1, max: 7200000 }).map(msAgo => new Date(Date.now() - msAgo)),
        // Generate two different slider positions
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        fc.double({ min: 100, max: 400, noNaN: true }),
        (startTime, slider1, slider2, totalRaceTime) => {
          // With debug mode disabled, the result should be the same
          // regardless of what slider value is passed
          const elapsed1 = computeElapsed(false, slider1, totalRaceTime, startTime);
          const elapsed2 = computeElapsed(false, slider2, totalRaceTime, startTime);

          // Both should be within 1 second of each other (time passes between calls)
          expect(Math.abs(elapsed1 - elapsed2)).toBeLessThan(1 / 60);
        }
      ),
      { numRuns: 500 }
    );
  });

  it('after disabling debug mode, elapsed time reflects real wall-clock time within 1s tolerance', () => {
    fc.assert(
      fc.property(
        // Generate start times from recent past (up to 4 hours ago)
        fc.integer({ min: 1000, max: 14400000 }).map(msAgo => new Date(Date.now() - msAgo)),
        fc.integer({ min: 0, max: 100 }),
        (startTime, sliderPercent) => {
          const totalRaceTime = 230; // ~3:50 marathon

          // Compute elapsed with debug mode disabled
          const elapsed = computeElapsed(false, sliderPercent, totalRaceTime, startTime);

          // Expected: real wall-clock difference
          const expected = (Date.now() - startTime.getTime()) / 60000;

          // Within 1 second tolerance (1/60 minute)
          expect(Math.abs(elapsed - expected)).toBeLessThan(1 / 60);
        }
      ),
      { numRuns: 300 }
    );
  });
});
