// Property test: Cumulative time table correctness (Property 1)
// **Validates: Requirements 3.1**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getPacingPlan, buildCumulativeTimeTable } from '../pacing-plan.js';

/**
 * Generator for valid pacing plans:
 * - Array of { mile, paceMinPerMile } with strictly increasing miles and positive paces
 * - Between 1 and 30 entries
 * - Last entry may have a fractional mile segment
 */
const validPacingPlanArb = fc
  .array(
    fc.record({
      mile: fc.double({ min: 0.1, max: 100, noNaN: true }),
      paceMinPerMile: fc.double({ min: 0.1, max: 30, noNaN: true }),
    }),
    { minLength: 1, maxLength: 30 }
  )
  .map((entries) => {
    // Sort by mile and ensure strictly increasing
    entries.sort((a, b) => a.mile - b.mile);
    const unique = [entries[0]];
    for (let i = 1; i < entries.length; i++) {
      if (entries[i].mile > unique[unique.length - 1].mile) {
        unique.push(entries[i]);
      }
    }
    return unique;
  })
  .filter((entries) => entries.length >= 1);

describe('Property 1: Cumulative time table correctness', () => {
  it('mile 0 entry always has cumulativeMinutes = 0 for any valid pacing plan', () => {
    fc.assert(
      fc.property(validPacingPlanArb, (pacingPlan) => {
        const table = buildCumulativeTimeTable(pacingPlan);
        expect(table[0]).toEqual({ mile: 0, cumulativeMinutes: 0 });
      }),
      { numRuns: 200 }
    );
  });

  it('cumulative time at mile N equals sum of pace × segment length for all prior segments', () => {
    fc.assert(
      fc.property(validPacingPlanArb, (pacingPlan) => {
        const table = buildCumulativeTimeTable(pacingPlan);

        // Table should have pacingPlan.length + 1 entries (mile 0 + each pace entry)
        expect(table.length).toBe(pacingPlan.length + 1);

        // Verify each cumulative entry using the same segment length logic as the implementation
        let expectedCumulative = 0;

        for (let i = 0; i < pacingPlan.length; i++) {
          const entry = pacingPlan[i];
          // Implementation uses: mile <= 26 → 1.0, else 0.2
          const segmentLength = entry.mile <= 26 ? 1.0 : 0.2;
          expectedCumulative += entry.paceMinPerMile * segmentLength;

          expect(table[i + 1].mile).toBeCloseTo(entry.mile, 10);
          expect(table[i + 1].cumulativeMinutes).toBeCloseTo(expectedCumulative, 10);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('works correctly with the actual getPacingPlan() data', () => {
    const pacingPlan = getPacingPlan();
    const table = buildCumulativeTimeTable(pacingPlan);

    // Mile 0 entry is always 0
    expect(table[0]).toEqual({ mile: 0, cumulativeMinutes: 0 });

    // Verify cumulative sums using the segment length rule
    let expectedCumulative = 0;

    for (let i = 0; i < pacingPlan.length; i++) {
      const entry = pacingPlan[i];
      const segmentLength = entry.mile <= 26 ? 1.0 : 0.2;
      expectedCumulative += entry.paceMinPerMile * segmentLength;

      expect(table[i + 1].mile).toBe(entry.mile);
      expect(table[i + 1].cumulativeMinutes).toBeCloseTo(expectedCumulative, 10);
    }
  });
});
