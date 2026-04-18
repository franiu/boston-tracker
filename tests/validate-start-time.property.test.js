// Property test: Invalid start time rejection (Property 6)
// **Validates: Requirements 6.6**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateStartTime } from '../ui-controller.js';

/**
 * Helper: returns true if a string can be parsed as a valid date by `new Date()`.
 * We filter these out since they would legitimately pass validation.
 */
function isValidDateString(str) {
  const d = new Date(str.trim());
  return !isNaN(d.getTime());
}

describe('Property 6: Invalid start time rejection', () => {
  it('for any empty string, validateStartTime returns { valid: false } with non-null error', () => {
    const result = validateStartTime('');
    expect(result.valid).toBe(false);
    expect(result.error).not.toBeNull();
    expect(result.date).toBeNull();
  });

  it('for any whitespace-only string, validateStartTime returns { valid: false } with non-null error', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 50 }).map((arr) => arr.join('')),
        (value) => {
          const result = validateStartTime(value);
          expect(result.valid).toBe(false);
          expect(result.error).not.toBeNull();
          expect(result.date).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('for any random non-date string, validateStartTime returns { valid: false } with non-null error', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => s.trim().length > 0 && !isValidDateString(s)),
        (value) => {
          const result = validateStartTime(value);
          expect(result.valid).toBe(false);
          expect(result.error).not.toBeNull();
          expect(result.date).toBeNull();
        }
      ),
      { numRuns: 200 }
    );
  });
});
