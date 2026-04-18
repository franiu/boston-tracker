// @vitest-environment jsdom
// Property test: Cookie store round trip (Property 5)
// **Validates: Requirements 6.2**

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { getStartTime, setStartTime, clearStartTime } from '../cookie-store.js';

describe('Property 5: Cookie store round trip', () => {
  beforeEach(() => {
    // Clear all cookies before each test
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  });

  it('for any valid Date, setStartTime(date) then getStartTime() returns a Date with equal millisecond value', () => {
    fc.assert(
      fc.property(
        fc.date({
          min: new Date('2000-01-01T00:00:00.000Z'),
          max: new Date('2100-12-31T23:59:59.999Z'),
          noInvalidDate: true,
        }),
        (date) => {
          setStartTime(date);
          const retrieved = getStartTime();

          expect(retrieved).not.toBeNull();
          expect(retrieved.getTime()).toBe(date.getTime());
        }
      ),
      { numRuns: 200 }
    );
  });

  it('clearStartTime() removes the cookie so getStartTime() returns null', () => {
    fc.assert(
      fc.property(
        fc.date({
          min: new Date('2000-01-01T00:00:00.000Z'),
          max: new Date('2100-12-31T23:59:59.999Z'),
          noInvalidDate: true,
        }),
        (date) => {
          setStartTime(date);
          clearStartTime();
          const retrieved = getStartTime();

          expect(retrieved).toBeNull();
        }
      ),
      { numRuns: 200 }
    );
  });
});
