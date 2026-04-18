# Implementation Plan: Marathon Live Tracker

## Overview

Build a single-page web app using vanilla HTML/CSS/JS and Mapbox GL JS that displays the 2026 Boston Marathon course on a full-screen map and simulates a runner's live position based on a pacing plan and start time. Implementation proceeds module-by-module, wiring everything together at the end.

## Tasks

- [ ] 1. Create project structure and HTML entry point
  - [ ] 1.1 Create `index.html` with full-screen map container, Mapbox GL JS/CSS CDN links, and ES module script imports
    - Include a `<div id="map">` that fills the viewport
    - Link `style.css` and load `app.js` as a module
    - _Requirements: 1.1_
  - [ ] 1.2 Create `style.css` with full-screen map styles and UI overlay styles
    - Set `html, body, #map` to 100% width/height with no margin/padding
    - Style the start time prompt overlay, "Set Piotr Start Time" button, view toggle button, and validation error message
    - _Requirements: 1.1, 1.2_

- [ ] 2. Implement course data module
  - [ ] 2.1 Create a Node.js conversion script (`scripts/convert-gpx.js`) that parses `course/gpx_20250421_id10253_race1_20250406001335.gpx`, extracts all `<trkpt>` lat/lon pairs, converts to `[lng, lat]` GeoJSON order, computes the bounding box, and writes the result into `course-data.js` as a static ES module
    - Parse GPX XML to extract trackpoint coordinates
    - Convert from GPX `lat,lon` to GeoJSON `[lng, lat]` order
    - Compute bounding box `[west, south, east, north]` from min/max coordinates
    - Output a self-contained `course-data.js` with embedded coordinate array
    - _Requirements: 8.1, 8.2_
  - [ ] 2.2 Run the conversion script and verify `course-data.js` exports `getCourseGeoJSON()`, `getCourseLengthMiles()`, and `getCourseBounds()` correctly
    - Verify the GeoJSON Feature has the expected structure and coordinate count (~1,381 points)
    - Verify bounding box covers Hopkinton to Boston
    - _Requirements: 2.1, 2.2, 8.1, 8.2_

- [ ] 3. Implement pacing plan and position calculator modules
  - [ ] 3.1 Create `pacing-plan.js` exporting `getPacingPlan()` and `buildCumulativeTimeTable()`
    - `getPacingPlan()` returns 27 entries (miles 1–26 plus 26.2) each with `mile` and `paceMinPerMile`
    - `buildCumulativeTimeTable()` computes cumulative elapsed minutes from mile 0 (0 min) through mile 26.2
    - _Requirements: 5.1, 5.2, 3.1_
  - [ ] 3.2 Write property test: Cumulative time table correctness (Property 1)
    - **Property 1: Cumulative time table correctness**
    - For any valid pacing plan, cumulative time at mile N equals the sum of pace × segment length for all prior segments; mile 0 entry is always 0
    - **Validates: Requirements 3.1**
  - [ ] 3.3 Write property test: Pacing plan structural validity (Property 4)
    - **Property 4: Pacing plan structural validity**
    - The pacing plan has exactly 27 entries with strictly increasing mile values (1–26, 26.2) and positive pace values
    - **Validates: Requirements 5.1, 5.2**
  - [ ] 3.4 Create `position-calculator.js` exporting `getDistanceAtTime()` and `interpolatePosition()`
    - `getDistanceAtTime()` uses linear interpolation on the cumulative time table, clamped to [0, 26.2]
    - `interpolatePosition()` maps fractional distance onto the GeoJSON LineString coordinates using cumulative segment lengths
    - _Requirements: 3.2, 3.3, 3.4, 3.5_
  - [ ] 3.5 Write property test: Distance-at-time monotonicity and clamping (Property 2)
    - **Property 2: Distance-at-time monotonicity and clamping**
    - For any t1 < t2, distance(t1) <= distance(t2); negative elapsed → 0; elapsed >= finish time → 26.2
    - **Validates: Requirements 3.2, 3.3, 3.4**
  - [ ] 3.6 Write property test: Geographic interpolation lies on polyline (Property 3)
    - **Property 3: Geographic interpolation lies on polyline**
    - For any polyline and fraction in [0,1], the interpolated point lies on a segment; fraction 0 → first coord, fraction 1 → last coord
    - **Validates: Requirements 3.5**

- [ ] 4. Checkpoint - Verify core computation modules
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement cookie store and UI controller
  - [ ] 5.1 Create `cookie-store.js` exporting `getStartTime()`, `setStartTime()`, and `clearStartTime()`
    - Store start time as ISO 8601 string in `marathon_start_time` cookie with 7-day expiration, `path=/`, `SameSite=Lax`
    - `getStartTime()` parses and returns a `Date` or `null`
    - _Requirements: 6.2, 6.3_
  - [ ] 5.2 Write property test: Cookie store round trip (Property 5)
    - **Property 5: Cookie store round trip**
    - For any valid Date, `setStartTime(date)` then `getStartTime()` returns a Date with equal millisecond value
    - **Validates: Requirements 6.2**
  - [ ] 5.3 Create `ui-controller.js` exporting `initUI()`, `validateStartTime()`, `showError()`, `clearError()`
    - Show start time prompt overlay when no cookie exists; hide it and start simulation when cookie exists
    - Wire "Set Piotr Start Time" button to show time input for changing start time
    - Validate input and show/clear error messages
    - Call `onStartTimeSet` callback with valid Date, call `onToggleStyle` callback on view toggle click
    - _Requirements: 6.1, 6.4, 6.5, 6.6_
  - [ ] 5.4 Write property test: Invalid start time rejection (Property 6)
    - **Property 6: Invalid start time rejection**
    - For any non-date string (empty, random text, whitespace), `validateStartTime()` returns `{ valid: false }` with non-null error
    - **Validates: Requirements 6.6**

- [ ] 6. Implement map controller
  - [ ] 6.1 Create `map-controller.js` exporting `initMap()`, `updateRunnerPosition()`, `toggleMapStyle()`, `getActiveStyle()`
    - `initMap()` creates a Mapbox GL JS map in the given container, fits to course bounds, draws the course polyline with distinct color/width, and creates the runner marker
    - `updateRunnerPosition()` animates the marker smoothly to the new `[lng, lat]`
    - `toggleMapStyle()` switches between vector and satellite styles, re-adding course layer and marker after style load
    - `getActiveStyle()` returns `"vector"` or `"satellite"`
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 4.1, 4.3, 4.4, 7.1, 7.2, 7.3, 7.4_
  - [ ] 6.2 Write property test: View toggle round trip (Property 7)
    - **Property 7: View toggle round trip**
    - Two consecutive `toggleMapStyle()` calls return `getActiveStyle()` to its original value
    - **Validates: Requirements 7.2**

- [ ] 7. Wire everything together in app.js
  - [ ] 7.1 Create `app.js` as the main entry point that orchestrates all modules
    - Import all modules
    - Build cumulative time table from pacing plan on load
    - Initialize map with course GeoJSON and bounds
    - Initialize UI with `onStartTimeSet`, `onToggleStyle`, `onDebugModeChanged`, and `onSliderChanged` callbacks
    - Start a 1-second `setInterval` loop that checks debug mode state: if enabled, compute elapsed time from slider percent × total race time; otherwise compute elapsed time from wall-clock time minus start time
    - Handle pre-start (marker at start) and post-finish (marker at finish) states
    - _Requirements: 3.2, 3.3, 3.4, 4.1, 4.2, 5.3, 6.3, 6.5, 9.4, 9.5, 9.6, 9.7_

- [ ] 8. Implement debug mode UI and integration
  - [ ] 8.1 Add hamburger menu icon to `index.html` and style it in `style.css`
    - Position the hamburger icon unobtrusively on the Map_View (e.g., top-left corner)
    - Style the collapsible menu panel that appears when the icon is clicked
    - _Requirements: 9.1, 9.2_
  - [ ] 8.2 Add debug mode toggle and time slider to the hamburger menu
    - Add a toggle switch inside the hamburger menu to enable/disable Debug_Mode
    - Add a range input (0–100%) that appears only when Debug_Mode is enabled
    - Wire the toggle to call `onDebugModeChanged` callback and the slider to call `onSliderChanged` callback
    - _Requirements: 9.2, 9.3, 9.5, 9.6_
  - [ ] 8.3 Update `ui-controller.js` to export `isDebugMode()` and `getSliderValue()`
    - `isDebugMode()` returns the current debug mode state
    - `getSliderValue()` returns the current slider value (0–100)
    - _Requirements: 9.4, 9.7_
  - [ ] 8.4 Write property test: Debug mode slider-to-elapsed-time mapping (Property 8)
    - **Property 8: Debug mode slider-to-elapsed-time mapping**
    - For any slider value p in [0, 100] and total race time T, simulated elapsed = p / 100 × T; slider 0 → elapsed 0, slider 100 → elapsed T
    - **Validates: Requirements 9.4, 9.5**
  - [ ] 8.5 Write property test: Debug mode toggle restores real-time behavior (Property 9)
    - **Property 9: Debug mode toggle restores real-time behavior**
    - After disabling debug mode, elapsed time equals now - startTime (within 1s tolerance), regardless of previous slider position
    - **Validates: Requirements 9.6, 9.7**

- [ ] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- No build step required — all files are vanilla ES modules loaded directly in the browser
- Debug mode tasks (task 8) can be implemented independently after the core simulation loop is wired up
