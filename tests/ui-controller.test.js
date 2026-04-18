import { describe, it, expect } from 'vitest';
import { validateStartTime } from '../ui-controller.js';

describe('validateStartTime', () => {
  it('returns invalid for empty string', () => {
    const result = validateStartTime('');
    expect(result.valid).toBe(false);
    expect(result.date).toBeNull();
    expect(result.error).not.toBeNull();
  });

  it('returns invalid for whitespace-only string', () => {
    const result = validateStartTime('   ');
    expect(result.valid).toBe(false);
    expect(result.date).toBeNull();
    expect(result.error).not.toBeNull();
  });

  it('returns invalid for non-date string', () => {
    const result = validateStartTime('not a date');
    expect(result.valid).toBe(false);
    expect(result.date).toBeNull();
    expect(result.error).not.toBeNull();
  });

  it('returns valid for ISO date string', () => {
    const result = validateStartTime('2026-04-20T10:30:00');
    expect(result.valid).toBe(true);
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.getTime()).not.toBeNaN();
    expect(result.error).toBeNull();
  });

  it('returns valid for date-only string', () => {
    const result = validateStartTime('2026-04-20');
    expect(result.valid).toBe(true);
    expect(result.date).toBeInstanceOf(Date);
    expect(result.error).toBeNull();
  });

  it('returns invalid for null input', () => {
    const result = validateStartTime(null);
    expect(result.valid).toBe(false);
    expect(result.error).not.toBeNull();
  });

  it('returns invalid for undefined input', () => {
    const result = validateStartTime(undefined);
    expect(result.valid).toBe(false);
    expect(result.error).not.toBeNull();
  });
});
