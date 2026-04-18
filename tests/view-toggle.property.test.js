// @vitest-environment jsdom
// Property test: View toggle round trip (Property 7)
// **Validates: Requirements 7.2**

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';

// Mock mapboxgl global before importing the module
const mockMap = {
  setStyle: vi.fn(),
  once: vi.fn((event, cb) => cb()),
  on: vi.fn((event, cb) => cb()),
  addSource: vi.fn(),
  addLayer: vi.fn(),
};

const mockMarker = {
  setLngLat: vi.fn().mockReturnThis(),
  addTo: vi.fn().mockReturnThis(),
  getLngLat: vi.fn(() => ({ lng: -71.1, lat: 42.3 })),
};

globalThis.mapboxgl = {
  accessToken: '',
  Map: vi.fn(() => mockMap),
  Marker: vi.fn(() => mockMarker),
};

describe('Property 7: View toggle round trip', () => {
  let mapController;

  beforeEach(async () => {
    vi.resetModules();
    mockMap.setStyle.mockClear();
    mockMap.once.mockClear().mockImplementation((event, cb) => cb());
    mockMap.on.mockClear().mockImplementation((event, cb) => cb());
    mockMap.addSource.mockClear();
    mockMap.addLayer.mockClear();
    mockMarker.setLngLat.mockClear().mockReturnThis();
    mockMarker.addTo.mockClear().mockReturnThis();
    mockMarker.getLngLat.mockClear().mockReturnValue({ lng: -71.1, lat: 42.3 });

    // Re-import to reset module-level state
    mapController = await import('../map-controller.js');

    // Initialize the map so internal state is set up
    const courseGeoJSON = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [[-71.5, 42.2], [-71.1, 42.3]],
      },
    };
    mapController.initMap('map', courseGeoJSON, [-71.5, 42.2, -71.1, 42.3]);
  });

  it('two consecutive toggleMapStyle() calls return getActiveStyle() to its original value', () => {
    fc.assert(
      fc.property(
        // Generate a random number of double-toggle rounds (1 to 20)
        fc.integer({ min: 1, max: 20 }),
        (rounds) => {
          for (let i = 0; i < rounds; i++) {
            const before = mapController.getActiveStyle();
            mapController.toggleMapStyle();
            mapController.toggleMapStyle();
            const after = mapController.getActiveStyle();

            expect(after).toBe(before);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('single toggle changes the style, double toggle restores it', () => {
    fc.assert(
      fc.property(
        // Generate random sequences of toggles (even count = round trip)
        fc.array(fc.constant('toggle'), { minLength: 2, maxLength: 40 }),
        (toggles) => {
          const initial = mapController.getActiveStyle();

          for (const _ of toggles) {
            mapController.toggleMapStyle();
          }

          // If even number of toggles, should be back to original
          if (toggles.length % 2 === 0) {
            expect(mapController.getActiveStyle()).toBe(initial);
          } else {
            expect(mapController.getActiveStyle()).not.toBe(initial);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
