// pacing-plan.js
// Exports the marathon pacing plan and cumulative time table builder

/**
 * @typedef {Object} PaceEntry
 * @property {number} mile - Mile marker (1 through 26, plus 26.2)
 * @property {number} paceMinPerMile - Pace in minutes per mile for this segment
 */

/**
 * Returns the pacing plan as an array of 27 PaceEntry objects.
 * Miles 1–26 each represent a 1-mile segment; mile 26.2 covers the final 0.2 miles.
 * Paces sourced from Piotr's Boston Marathon pacing strategy.
 * Estimated finish: ~3:12
 * @returns {PaceEntry[]}
 */
export function getPacingPlan() {
  return [
    { mile: 1,    paceMinPerMile: 7 + 17/60 },  // 7:17
    { mile: 2,    paceMinPerMile: 7 + 17/60 },  // 7:17
    { mile: 3,    paceMinPerMile: 7 + 17/60 },  // 7:17
    { mile: 4,    paceMinPerMile: 7 + 17/60 },  // 7:17
    { mile: 5,    paceMinPerMile: 7 + 25/60 },  // 7:25
    { mile: 6,    paceMinPerMile: 7 + 17/60 },  // 7:17
    { mile: 7,    paceMinPerMile: 7 + 25/60 },  // 7:25
    { mile: 8,    paceMinPerMile: 7 + 25/60 },  // 7:25
    { mile: 9,    paceMinPerMile: 7 + 25/60 },  // 7:25
    { mile: 10,   paceMinPerMile: 7 + 25/60 },  // 7:25
    { mile: 11,   paceMinPerMile: 7 + 25/60 },  // 7:25
    { mile: 12,   paceMinPerMile: 7 + 20/60 },  // 7:20
    { mile: 13,   paceMinPerMile: 7 + 25/60 },  // 7:25
    { mile: 14,   paceMinPerMile: 7 + 25/60 },  // 7:25
    { mile: 15,   paceMinPerMile: 7 + 25/60 },  // 7:25
    { mile: 16,   paceMinPerMile: 7 + 15/60 },  // 7:15
    { mile: 17,   paceMinPerMile: 7 + 35/60 },  // 7:35
    { mile: 18,   paceMinPerMile: 7 + 35/60 },  // 7:35
    { mile: 19,   paceMinPerMile: 7 + 25/60 },  // 7:25
    { mile: 20,   paceMinPerMile: 7 + 40/60 },  // 7:40
    { mile: 21,   paceMinPerMile: 7 + 50/60 },  // 7:50
    { mile: 22,   paceMinPerMile: 7 + 20/60 },  // 7:20
    { mile: 23,   paceMinPerMile: 7 + 20/60 },  // 7:20
    { mile: 24,   paceMinPerMile: 7 + 15/60 },  // 7:15
    { mile: 25,   paceMinPerMile: 7 + 25/60 },  // 7:25
    { mile: 26,   paceMinPerMile: 7 + 20/60 },  // 7:20
    { mile: 26.2, paceMinPerMile: 7 + 20/60 },  // 1:28 for 0.2mi → ~7:20/mi pace
  ];
}


/**
 * @typedef {Object} CumulativeEntry
 * @property {number} mile - Mile marker
 * @property {number} cumulativeMinutes - Total elapsed minutes from start to this mile
 */

/**
 * Computes the cumulative time table from the pacing plan.
 * Returns an array starting with { mile: 0, cumulativeMinutes: 0 },
 * followed by one entry per pace entry with the running total of elapsed time.
 *
 * Segment length is 1.0 mile for miles 1–26, and 0.2 miles for the final 26.2 entry.
 *
 * @param {PaceEntry[]} pacingPlan
 * @returns {CumulativeEntry[]}
 */
export function buildCumulativeTimeTable(pacingPlan) {
  const table = [{ mile: 0, cumulativeMinutes: 0 }];
  let cumulative = 0;

  for (const entry of pacingPlan) {
    const segmentLength = entry.mile <= 26 ? 1.0 : 0.2;
    cumulative += entry.paceMinPerMile * segmentLength;
    table.push({ mile: entry.mile, cumulativeMinutes: cumulative });
  }

  return table;
}

/**
 * Merges actual checkpoint data into the cumulative time table.
 *
 * For segments up to and including the last checkpoint, uses actual elapsed times
 * (linearly interpolated between checkpoints for intermediate mile markers).
 * For segments beyond the last checkpoint, projects forward using the pacing plan
 * paces anchored to the last checkpoint's actual time.
 *
 * @param {CumulativeEntry[]} baseTable - The original pacing-plan-based cumulative table
 * @param {{ km: number, miles: number, elapsedMinutes: number }[]} checkpoints - Sorted by km
 * @returns {CumulativeEntry[]}
 */
export function mergeCheckpointsIntoTable(baseTable, checkpoints) {
  if (!checkpoints || checkpoints.length === 0) return baseTable;

  // Build anchor points: mile 0 = 0 min, plus each checkpoint
  const anchors = [{ mile: 0, cumulativeMinutes: 0 }];
  for (const cp of checkpoints) {
    anchors.push({ mile: cp.miles, cumulativeMinutes: cp.elapsedMinutes });
  }

  const lastCheckpointMile = anchors[anchors.length - 1].mile;
  const lastCheckpointTime = anchors[anchors.length - 1].cumulativeMinutes;

  const merged = [{ mile: 0, cumulativeMinutes: 0 }];

  for (let i = 1; i < baseTable.length; i++) {
    const entry = baseTable[i];

    if (entry.mile <= lastCheckpointMile) {
      // This mile is before or at the last checkpoint — interpolate from anchors
      const time = interpolateFromAnchors(anchors, entry.mile);
      merged.push({ mile: entry.mile, cumulativeMinutes: time });
    } else {
      // This mile is beyond the last checkpoint — use pacing plan offset
      // Find the base table's time at the last checkpoint mile (interpolated)
      const baseTimeAtLastCp = interpolateFromTable(baseTable, lastCheckpointMile);
      const baseTimeAtThisMile = entry.cumulativeMinutes;
      const delta = baseTimeAtThisMile - baseTimeAtLastCp;
      merged.push({ mile: entry.mile, cumulativeMinutes: lastCheckpointTime + delta });
    }
  }

  return merged;
}

/**
 * Linearly interpolates a cumulative time from anchor points for a given mile.
 * @param {{ mile: number, cumulativeMinutes: number }[]} anchors - Sorted by mile
 * @param {number} mile
 * @returns {number}
 */
function interpolateFromAnchors(anchors, mile) {
  if (mile <= anchors[0].mile) return anchors[0].cumulativeMinutes;
  if (mile >= anchors[anchors.length - 1].mile) return anchors[anchors.length - 1].cumulativeMinutes;

  for (let i = 1; i < anchors.length; i++) {
    if (mile <= anchors[i].mile) {
      const prev = anchors[i - 1];
      const curr = anchors[i];
      const frac = (mile - prev.mile) / (curr.mile - prev.mile);
      return prev.cumulativeMinutes + frac * (curr.cumulativeMinutes - prev.cumulativeMinutes);
    }
  }
  return anchors[anchors.length - 1].cumulativeMinutes;
}

/**
 * Linearly interpolates a cumulative time from a table for a given mile.
 * @param {CumulativeEntry[]} table
 * @param {number} mile
 * @returns {number}
 */
function interpolateFromTable(table, mile) {
  if (mile <= table[0].mile) return table[0].cumulativeMinutes;
  if (mile >= table[table.length - 1].mile) return table[table.length - 1].cumulativeMinutes;

  for (let i = 1; i < table.length; i++) {
    if (mile <= table[i].mile) {
      const prev = table[i - 1];
      const curr = table[i];
      const frac = (mile - prev.mile) / (curr.mile - prev.mile);
      return prev.cumulativeMinutes + frac * (curr.cumulativeMinutes - prev.cumulativeMinutes);
    }
  }
  return table[table.length - 1].cumulativeMinutes;
}
