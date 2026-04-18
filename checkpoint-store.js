// checkpoint-store.js
// Stores and retrieves actual checkpoint times from localStorage.
// Checkpoints are keyed by km marker (5, 10, 15, 20, 25, 30, 35, 40).

const STORAGE_KEY = 'marathon_checkpoints';
const KM_TO_MILES = 0.621371;

/**
 * Standard checkpoint km markers for the Boston Marathon.
 */
export const CHECKPOINT_KMS = [5, 10, 15, 20, 25, 30, 35, 40];

/**
 * Converts a km checkpoint to miles.
 * @param {number} km
 * @returns {number}
 */
export function kmToMiles(km) {
  return km * KM_TO_MILES;
}

/**
 * @typedef {Object} Checkpoint
 * @property {number} km - Checkpoint distance in km
 * @property {number} miles - Checkpoint distance in miles
 * @property {number} elapsedMinutes - Actual elapsed minutes from start
 */

/**
 * Returns all stored checkpoints, sorted by km.
 * @returns {Checkpoint[]}
 */
export function getCheckpoints() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.sort((a, b) => a.km - b.km) : [];
  } catch {
    return [];
  }
}

/**
 * Saves a checkpoint. If one already exists for this km, it's replaced.
 * @param {number} km - Checkpoint km marker
 * @param {number} elapsedMinutes - Actual elapsed minutes from start
 */
export function setCheckpoint(km, elapsedMinutes) {
  const checkpoints = getCheckpoints().filter(c => c.km !== km);
  checkpoints.push({ km, miles: kmToMiles(km), elapsedMinutes });
  checkpoints.sort((a, b) => a.km - b.km);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checkpoints));
}

/**
 * Removes a checkpoint.
 * @param {number} km
 */
export function removeCheckpoint(km) {
  const checkpoints = getCheckpoints().filter(c => c.km !== km);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checkpoints));
}

/**
 * Clears all checkpoints.
 */
export function clearCheckpoints() {
  localStorage.removeItem(STORAGE_KEY);
}
