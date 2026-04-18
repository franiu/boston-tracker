import { describe, it, expect } from 'vitest';
import { getDistanceAtTime, interpolatePosition } from '../position-calculator.js';
import { getPacingPlan, buildCumulativeTimeTable } from '../pacing-plan.js';

describe('getDistanceAtTime', () => {
  const table = buildCumulativeTimeTable(getPacingPlan());

  it('returns 0 for elapsed <= 0', () => {
    expect(getDistanceAtTime(table, 0)).toBe(0);
    expect(getDistanceAtTime(table, -10)).toBe(0);
  });

  it('returns 26.2 for elapsed >= finish time', () => {
    const finishTime = table[table.length - 1].cumulativeMinutes;
    expect(getDistanceAtTime(table, finishTime)).toBe(26.2);
    expect(getDistanceAtTime(table, finishTime + 100)).toBe(26.2);
  });

  it('returns a value between 0 and 26.2 for mid-race time', () => {
    const midTime = table[table.length - 1].cumulativeMinutes / 2;
    const distance = getDistanceAtTime(table, midTime);
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(26.2);
  });

  it('is monotonically non-decreasing', () => {
    for (let t = 0; t <= 250; t += 5) {
      const d1 = getDistanceAtTime(table, t);
      const d2 = getDistanceAtTime(table, t + 5);
      expect(d2).toBeGreaterThanOrEqual(d1);
    }
  });

  it('interpolates correctly at mile 1 boundary', () => {
    // At the cumulative time for mile 1, distance should be 1
    const mile1Time = table[1].cumulativeMinutes;
    expect(getDistanceAtTime(table, mile1Time)).toBeCloseTo(1, 5);
  });
});

describe('interpolatePosition', () => {
  const simpleCoords = [
    [-71.5, 42.2],
    [-71.4, 42.3],
    [-71.3, 42.4],
  ];

  it('returns first coordinate at distance 0', () => {
    const pos = interpolatePosition(simpleCoords, 0, 26.2);
    expect(pos[0]).toBeCloseTo(-71.5, 5);
    expect(pos[1]).toBeCloseTo(42.2, 5);
  });

  it('returns last coordinate at full distance', () => {
    const pos = interpolatePosition(simpleCoords, 26.2, 26.2);
    expect(pos[0]).toBeCloseTo(-71.3, 5);
    expect(pos[1]).toBeCloseTo(42.4, 5);
  });

  it('returns midpoint at half distance for equal-length segments', () => {
    // Two equal-length segments, midpoint should be near the middle coordinate
    const pos = interpolatePosition(simpleCoords, 13.1, 26.2);
    expect(pos[0]).toBeCloseTo(-71.4, 1);
    expect(pos[1]).toBeCloseTo(42.3, 1);
  });

  it('clamps negative distance to first coordinate', () => {
    const pos = interpolatePosition(simpleCoords, -5, 26.2);
    expect(pos[0]).toBeCloseTo(-71.5, 5);
    expect(pos[1]).toBeCloseTo(42.2, 5);
  });

  it('clamps distance beyond total to last coordinate', () => {
    const pos = interpolatePosition(simpleCoords, 30, 26.2);
    expect(pos[0]).toBeCloseTo(-71.3, 5);
    expect(pos[1]).toBeCloseTo(42.4, 5);
  });
});
