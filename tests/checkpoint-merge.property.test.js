// Property test: Checkpoint merge correctness
// Validates that merging checkpoints into the cumulative table produces
// correct results: actual times for past segments, projected times for future.

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getPacingPlan, buildCumulativeTimeTable, mergeCheckpointsIntoTable } from '../pacing-plan.js';

const basePlan = getPacingPlan();
const baseTable = buildCumulativeTimeTable(basePlan);

describe('mergeCheckpointsIntoTable', () => {
  it('returns the base table when no checkpoints are provided', () => {
    const merged = mergeCheckpointsIntoTable(baseTable, []);
    expect(merged).toEqual(baseTable);
  });

  it('returns the base table when checkpoints is null', () => {
    const merged = mergeCheckpointsIntoTable(baseTable, null);
    expect(merged).toEqual(baseTable);
  });

  it('merged table has the same number of entries as the base table', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            km: fc.constantFrom(5, 10, 15, 20, 25, 30, 35, 40),
            elapsedMinutes: fc.double({ min: 10, max: 250, noNaN: true }),
          }),
          { minLength: 1, maxLength: 8 }
        ).map(cps => {
          // Deduplicate by km, sort, ensure increasing elapsed times
          const seen = new Set();
          const unique = cps.filter(c => {
            if (seen.has(c.km)) return false;
            seen.add(c.km);
            return true;
          });
          unique.sort((a, b) => a.km - b.km);
          // Ensure elapsed times are strictly increasing
          for (let i = 1; i < unique.length; i++) {
            if (unique[i].elapsedMinutes <= unique[i - 1].elapsedMinutes) {
              unique[i].elapsedMinutes = unique[i - 1].elapsedMinutes + 1;
            }
          }
          return unique.map(c => ({
            km: c.km,
            miles: c.km * 0.621371,
            elapsedMinutes: c.elapsedMinutes,
          }));
        }),
        (checkpoints) => {
          const merged = mergeCheckpointsIntoTable(baseTable, checkpoints);
          expect(merged.length).toBe(baseTable.length);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('merged table mile values match the base table', () => {
    const checkpoints = [
      { km: 10, miles: 10 * 0.621371, elapsedMinutes: 45 },
      { km: 20, miles: 20 * 0.621371, elapsedMinutes: 92 },
    ];
    const merged = mergeCheckpointsIntoTable(baseTable, checkpoints);
    for (let i = 0; i < merged.length; i++) {
      expect(merged[i].mile).toBe(baseTable[i].mile);
    }
  });

  it('merged table starts at mile 0 with 0 cumulative minutes', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            km: fc.constantFrom(5, 10, 15, 20),
            elapsedMinutes: fc.double({ min: 10, max: 150, noNaN: true }),
          }),
          { minLength: 1, maxLength: 4 }
        ).map(cps => {
          const seen = new Set();
          return cps.filter(c => {
            if (seen.has(c.km)) return false;
            seen.add(c.km);
            return true;
          }).sort((a, b) => a.km - b.km).map(c => ({
            km: c.km,
            miles: c.km * 0.621371,
            elapsedMinutes: c.elapsedMinutes,
          }));
        }),
        (checkpoints) => {
          const merged = mergeCheckpointsIntoTable(baseTable, checkpoints);
          expect(merged[0].mile).toBe(0);
          expect(merged[0].cumulativeMinutes).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('cumulative minutes are monotonically non-decreasing when checkpoints are consistent', () => {
    // Use checkpoints with realistic, increasing elapsed times
    const checkpoints = [
      { km: 5, miles: 5 * 0.621371, elapsedMinutes: 23 },
      { km: 10, miles: 10 * 0.621371, elapsedMinutes: 46 },
      { km: 15, miles: 15 * 0.621371, elapsedMinutes: 69 },
    ];
    const merged = mergeCheckpointsIntoTable(baseTable, checkpoints);
    for (let i = 1; i < merged.length; i++) {
      expect(merged[i].cumulativeMinutes).toBeGreaterThanOrEqual(merged[i - 1].cumulativeMinutes);
    }
  });
});
