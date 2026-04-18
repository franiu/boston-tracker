// Property test: Distance-at-time monotonicity and clamping (Property 2)
// **Validates: Requirements 3.2, 3.3, 3.4**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getDistanceAtTime } from '../position-calculator.js';
import { getPacingPlan, buildCumulativeTimeTable } from '../pacing-plan.js';

// Build the actual cumulative table from the real pacing plan
const actualTable = buildCumulativeTimeTable(getPacingPlan());
const finishTime = actualTable[actualTable.length - 1].cumulativeMinutes;

/**
 * Generator for valid cumulative time tables:
 * - Starts with { mile: 0, cumulativeMinutes: 0 }
 * - Strictly increasing mile and cumulativeMinutes values
 * - Last mile is 26.2
 */
const validCumulativeTableArb = fc
  .array(
    fc.record({
      pace: fc.double({ min: 5, max: 15, noNaN: true }),
    }),
    { minLength: 2, maxLength: 27 }
  )
  .map((entries) => {
    const table = [{ mile: 0, cumulativeMinutes: 0 }];
    let cumMinutes = 0;
    const numSegments = entries.length;
    const mileStep = 26.2 / numSegments;

    for (let i = 0; i < numSegments; i++) {
      const mile = i < numSegments - 1 ? (i + 1) * mileStep : 26.2;
      cumMinutes += entries[i].pace * mileStep;
      table.push({ mile, cumulativeMinutes: cumMinutes });
    }
    return table;
  });

describe('Property 2: Distance-at-time monotonicity and clamping', () => {
  describe('with actual pacing plan data', () => {
    it('for any t1 < t2, distance(t1) <= distance(t2) (monotonicity)', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -10, max: finishTime + 10, noNaN: true }),
          fc.double({ min: -10, max: finishTime + 10, noNaN: true }),
          (a, b) => {
            const t1 = Math.min(a, b);
            const t2 = Math.max(a, b);
            const d1 = getDistanceAtTime(actualTable, t1);
            const d2 = getDistanceAtTime(actualTable, t2);
            expect(d1).toBeLessThanOrEqual(d2);
          }
        ),
        { numRuns: 500 }
      );
    });

    it('negative elapsed time returns 0', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -10000, max: -0.001, noNaN: true }),
          (t) => {
            const distance = getDistanceAtTime(actualTable, t);
            expect(distance).toBe(0);
          }
        ),
        { numRuns: 200 }
      );
    });

    it('elapsed time >= finish time returns 26.2', () => {
      fc.assert(
        fc.property(
          fc.double({ min: finishTime, max: finishTime + 10000, noNaN: true }),
          (t) => {
            const distance = getDistanceAtTime(actualTable, t);
            expect(distance).toBe(26.2);
          }
        ),
        { numRuns: 200 }
      );
    });
  });

  describe('with generated cumulative tables', () => {
    it('for any t1 < t2, distance(t1) <= distance(t2) (monotonicity)', () => {
      fc.assert(
        fc.property(
          validCumulativeTableArb,
          fc.double({ min: -50, max: 500, noNaN: true }),
          fc.double({ min: -50, max: 500, noNaN: true }),
          (table, a, b) => {
            const t1 = Math.min(a, b);
            const t2 = Math.max(a, b);
            const d1 = getDistanceAtTime(table, t1);
            const d2 = getDistanceAtTime(table, t2);
            expect(d1).toBeLessThanOrEqual(d2);
          }
        ),
        { numRuns: 500 }
      );
    });

    it('negative elapsed time returns 0', () => {
      fc.assert(
        fc.property(
          validCumulativeTableArb,
          fc.double({ min: -10000, max: -0.001, noNaN: true }),
          (table, t) => {
            const distance = getDistanceAtTime(table, t);
            expect(distance).toBe(0);
          }
        ),
        { numRuns: 200 }
      );
    });

    it('elapsed time >= finish time returns 26.2', () => {
      fc.assert(
        fc.property(
          validCumulativeTableArb,
          fc.double({ min: 0, max: 10000, noNaN: true }),
          (table, extra) => {
            const tableFinishTime = table[table.length - 1].cumulativeMinutes;
            const t = tableFinishTime + extra;
            const distance = getDistanceAtTime(table, t);
            expect(distance).toBe(26.2);
          }
        ),
        { numRuns: 200 }
      );
    });
  });
});
