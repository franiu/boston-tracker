// app.js — orchestrates all modules for the Marathon Live Tracker

import { getCourseGeoJSON, getCourseBounds, getCourseLengthMiles } from './course-data.js';
import { getPacingPlan, buildCumulativeTimeTable } from './pacing-plan.js';
import { getDistanceAtTime, interpolatePosition } from './position-calculator.js';
import { getStartTime, setStartTime } from './cookie-store.js';
import { initMap, updateRunnerPosition, toggleMapStyle } from './map-controller.js';
import { initUI, isDebugMode, getSliderValue } from './ui-controller.js';

// 1. Build cumulative time table from pacing plan
const pacingPlan = getPacingPlan();
const cumulativeTable = buildCumulativeTimeTable(pacingPlan);
const totalRaceTime = cumulativeTable[cumulativeTable.length - 1].cumulativeMinutes;

// 2. Get course data
const courseGeoJSON = getCourseGeoJSON();
const courseBounds = getCourseBounds();
const courseLengthMiles = getCourseLengthMiles();
const coordinates = courseGeoJSON.geometry.coordinates;

// Application state
let startTime = null;
let simulationInterval = null;

// Info panel elements
const infoPanel = document.getElementById('info-panel');
const infoStartTime = document.getElementById('info-start-time');
const infoMilePace = document.getElementById('info-mile-pace');
const infoAvgPace = document.getElementById('info-avg-pace');
const infoRemaining = document.getElementById('info-remaining');
const infoElapsed = document.getElementById('info-elapsed');

/**
 * Formats decimal minutes to MM:SS string.
 */
function formatPace(decimalMinutes) {
  const mins = Math.floor(decimalMinutes);
  const secs = Math.round((decimalMinutes - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats decimal minutes to H:MM:SS string.
 */
function formatTime(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.floor(totalMinutes % 60);
  const s = Math.round((totalMinutes - Math.floor(totalMinutes)) * 60);
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Formats a Date to local HH:MM string.
 */
function formatClockTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Returns the pace for the mile segment the runner is currently in.
 */
function getCurrentMilePace(distanceMiles) {
  for (let i = pacingPlan.length - 1; i >= 0; i--) {
    if (distanceMiles >= (i === 0 ? 0 : pacingPlan[i - 1].mile)) {
      return pacingPlan[i].paceMinPerMile;
    }
  }
  return pacingPlan[0].paceMinPerMile;
}

/**
 * Updates the info panel with current stats.
 */
function updateInfoPanel(elapsedMinutes, distanceMiles) {
  if (!infoPanel) return;

  // Start time
  infoStartTime.textContent = startTime ? formatClockTime(startTime) : '--:--';

  // Current mile pace
  const milePace = getCurrentMilePace(distanceMiles);
  infoMilePace.textContent = formatPace(milePace);

  // Average pace so far
  if (distanceMiles > 0 && elapsedMinutes > 0) {
    const avgPace = elapsedMinutes / distanceMiles;
    infoAvgPace.textContent = formatPace(avgPace);
  } else {
    infoAvgPace.textContent = '--:--';
  }

  // Estimated remaining time
  if (elapsedMinutes >= totalRaceTime) {
    infoRemaining.textContent = 'Finished';
  } else if (elapsedMinutes <= 0) {
    infoRemaining.textContent = formatTime(totalRaceTime);
  } else {
    const remainingMinutes = totalRaceTime - elapsedMinutes;
    infoRemaining.textContent = formatTime(remainingMinutes);
  }

  // Elapsed time
  if (elapsedMinutes <= 0) {
    infoElapsed.textContent = '0:00:00';
  } else {
    infoElapsed.textContent = formatTime(Math.min(elapsedMinutes, totalRaceTime));
  }
}

/**
 * Computes the runner position and updates the marker.
 * Called every second by the simulation loop.
 */
function tick() {
  if (!startTime) return;

  let elapsedMinutes;

  if (isDebugMode()) {
    const sliderPercent = getSliderValue();
    elapsedMinutes = (sliderPercent / 100) * totalRaceTime;
  } else {
    elapsedMinutes = (Date.now() - startTime.getTime()) / 60000;
  }

  // Show info panel once simulation starts
  if (infoPanel) infoPanel.style.display = 'flex';

  // Handle pre-start: marker at start
  if (elapsedMinutes <= 0) {
    updateRunnerPosition(coordinates[0]);
    updateInfoPanel(elapsedMinutes, 0);
    return;
  }

  // Handle post-finish: marker at finish
  if (elapsedMinutes >= totalRaceTime) {
    updateRunnerPosition(coordinates[coordinates.length - 1]);
    updateInfoPanel(elapsedMinutes, 26.2);
    return;
  }

  // Normal: compute distance and interpolate position
  const distanceMiles = getDistanceAtTime(cumulativeTable, elapsedMinutes);
  const position = interpolatePosition(coordinates, distanceMiles, courseLengthMiles);
  updateRunnerPosition(position);
  updateInfoPanel(elapsedMinutes, distanceMiles);
}

/**
 * Starts (or restarts) the 1-second simulation loop.
 */
function startSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
  }
  tick(); // Immediate first update
  simulationInterval = setInterval(tick, 1000);
}

// 3. Initialize map with course data
initMap('map', courseGeoJSON, courseBounds);

// 4. Initialize UI with callbacks
initUI({
  onStartTimeSet(date) {
    startTime = date;
    startSimulation();
  },
  onToggleStyle() {
    toggleMapStyle();
  },
  onDebugModeChanged(enabled) {
    // When debug mode changes, trigger an immediate tick to update position
    tick();
  },
  onSliderChanged(value) {
    // When slider changes in debug mode, trigger an immediate tick
    if (isDebugMode()) {
      tick();
    }
  }
});

// Load start time from cookie if available (initUI handles showing/hiding overlay
// and calls onStartTimeSet if cookie exists, which starts the simulation)
