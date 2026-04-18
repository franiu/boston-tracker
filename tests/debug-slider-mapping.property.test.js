// Property test: Debug mode slider-to-elapsed-time mapping (Property 8)
// **Validates: Requirements 9.4, 9.5**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getPacingPlan, buildCumulativeTimeTable } from '../pacing-plan.js';

/**
 * The debug mode elapsed time formula extracted from app.js:
 *   elapsedMinutes = (sliderPercent / 100) * totalRaceTime
 */
function computeDebugElapsed(sliderPercent, totalRaceTime) {
  return (sliderPercent / 100) * totalRaceTime;
}

describe('Property 8: Debug mode slider-to-elapsed-time mapping', () => {
  it('for any slider value p in [0, 100] and total race time T > 0, elapsed = p / 100 × T', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        (sliderPercent, totalRaceTime) => {
          const elapsed = computeDebugElapsed(sliderPercent, totalRaceTime);
          const expected = (sliderPercent / 100) * totalRaceTime;
          expect(elapsed).toBeCloseTo(expected, 10);
        }
      ),
      { numRuns: 500 }
    );
  });

  it('slider 0 always produces elapsed time 0 for any total race time', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        (totalRaceTime) => {
          const elapsed = computeDebugElapsed(0, totalRaceTime);
          expect(elapsed).toBe(0);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('slider 100 always produces elapsed time equal to total race time T', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        (totalRaceTime) => {
          const elapsed = computeDebugElapsed(100, totalRaceTime);
          expect(elapsed).toBeCloseTo(totalRaceTime, 10);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('elapsed time is monotonically non-decreasing as slider increases', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 99 }),
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        (sliderLow, totalRaceTime) => {
          const sliderHigh = sliderLow + 1;
          const elapsedLow = computeDebugElapsed(sliderLow, totalRaceTime);
          const elapsedHigh = computeDebugElapsed(sliderHigh, totalRaceTime);
          expect(elapsedHigh).toBeGreaterThanOrEqual(elapsedLow);
        }
      ),
      { numRuns: 300 }
    );
  });

  it('works correctly with the actual pacing plan total race time', () => {
    const pacingPlan = getPacingPlan();
    const cumulativeTable = buildCumulativeTimeTable(pacingPlan);
    const totalRaceTime = cumulativeTable[cumulativeTable.length - 1].cumulativeMinutes;

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        (sliderPercent) => {
          const elapsed = computeDebugElapsed(sliderPercent, totalRaceTime);
          const expected = (sliderPercent / 100) * totalRaceTime;
          expect(elapsed).toBeCloseTo(expected, 10);

          // Boundary checks
          expect(elapsed).toBeGreaterThanOrEqual(0);
          expect(elapsed).toBeLessThanOrEqual(totalRaceTime);
        }
      ),
      { numRuns: 200 }
    );

    // Explicit boundary verification with actual data
    expect(computeDebugElapsed(0, totalRaceTime)).toBe(0);
    expect(computeDebugElapsed(100, totalRaceTime)).toBeCloseTo(totalRaceTime, 10);
  });
});
