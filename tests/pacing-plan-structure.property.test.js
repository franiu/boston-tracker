// Property test: Pacing plan structural validity (Property 4)
// **Validates: Requirements 5.1, 5.2**

import { describe, it, expect } from 'vitest';
import { getPacingPlan } from '../pacing-plan.js';

describe('Property 4: Pacing plan structural validity', () => {
  const plan = getPacingPlan();

  it('contains exactly 27 entries', () => {
    expect(plan).toHaveLength(27);
  });

  it('each entry has both mile and paceMinPerMile properties', () => {
    for (const entry of plan) {
      expect(entry).toHaveProperty('mile');
      expect(entry).toHaveProperty('paceMinPerMile');
    }
  });

  it('mile values are strictly increasing', () => {
    for (let i = 1; i < plan.length; i++) {
      expect(plan[i].mile).toBeGreaterThan(plan[i - 1].mile);
    }
  });

  it('mile values are 1 through 26 plus 26.2', () => {
    const expectedMiles = [];
    for (let m = 1; m <= 26; m++) {
      expectedMiles.push(m);
    }
    expectedMiles.push(26.2);

    const actualMiles = plan.map((e) => e.mile);
    expect(actualMiles).toEqual(expectedMiles);
  });

  it('all paceMinPerMile values are positive numbers', () => {
    for (const entry of plan) {
      expect(typeof entry.paceMinPerMile).toBe('number');
      expect(entry.paceMinPerMile).toBeGreaterThan(0);
    }
  });
});
