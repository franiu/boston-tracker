// ui-controller.js
// Manages the start time input UI, validation, view toggle, and event listeners.

import { getStartTime, setStartTime } from './cookie-store.js';

let overlayEl = null;
let errorEl = null;
let debugMode = false;
let sliderValue = 0;

/**
 * Initializes the UI: start time input, validation, and event listeners.
 * If no cookie exists, shows the start time prompt.
 * If a cookie exists, starts the simulation immediately.
 *
 * @param {Object} callbacks
 * @param {function(Date): void} callbacks.onStartTimeSet
 * @param {function(): void} callbacks.onToggleStyle
 * @param {function(boolean): void} callbacks.onDebugModeChanged
 * @param {function(number): void} callbacks.onSliderChanged
 */
export function initUI(callbacks) {
  createOverlay(callbacks);
  createViewToggleButton(callbacks);
  createSetStartTimeButton(callbacks);
  wireHamburgerMenu(callbacks);

  const storedTime = getStartTime();
  if (storedTime) {
    hideOverlay();
    callbacks.onStartTimeSet(storedTime);
  } else {
    showOverlay();
  }
}

/**
 * Validates a start time string input.
 * @param {string} value - The raw input value
 * @returns {{ valid: boolean, date: Date|null, error: string|null }}
 */
export function validateStartTime(value) {
  if (!value || !value.trim()) {
    return { valid: false, date: null, error: 'Please enter a start time.' };
  }

  const date = new Date(value.trim());
  if (isNaN(date.getTime())) {
    return { valid: false, date: null, error: 'Invalid date/time format.' };
  }

  return { valid: true, date, error: null };
}

/**
 * Shows a validation error message on the start time input.
 * @param {string} message
 */
export function showError(message) {
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

/**
 * Hides any visible validation error message.
 */
export function clearError() {
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.style.display = 'none';
  }
}

/**
 * Returns whether debug mode is currently enabled.
 * @returns {boolean}
 */
export function isDebugMode() {
  return debugMode;
}

/**
 * Returns the current time slider value (0–100).
 * @returns {number}
 */
export function getSliderValue() {
  return sliderValue;
}

// --- Internal helpers ---

function createOverlay(callbacks) {
  overlayEl = document.createElement('div');
  overlayEl.className = 'start-time-overlay';

  const modal = document.createElement('div');
  modal.className = 'start-time-modal';

  const heading = document.createElement('h2');
  heading.textContent = 'Set Piotr Start Time';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'e.g. 2026-04-20T10:30:00';
  input.id = 'start-time-input';

  const submitBtn = document.createElement('button');
  submitBtn.className = 'set-start-time-btn';
  submitBtn.textContent = 'Start Tracking';

  errorEl = document.createElement('div');
  errorEl.className = 'validation-error';
  errorEl.style.display = 'none';

  submitBtn.addEventListener('click', () => {
    handleSubmit(input, callbacks);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleSubmit(input, callbacks);
    }
  });

  modal.appendChild(heading);
  modal.appendChild(input);
  modal.appendChild(submitBtn);
  modal.appendChild(errorEl);
  overlayEl.appendChild(modal);
  document.body.appendChild(overlayEl);
}

function handleSubmit(input, callbacks) {
  const result = validateStartTime(input.value);
  if (!result.valid) {
    showError(result.error);
    return;
  }
  clearError();
  setStartTime(result.date);
  hideOverlay();
  callbacks.onStartTimeSet(result.date);
}

function showOverlay() {
  if (overlayEl) {
    overlayEl.style.display = 'flex';
  }
}

function hideOverlay() {
  if (overlayEl) {
    overlayEl.style.display = 'none';
  }
}

function createViewToggleButton(callbacks) {
  const btn = document.createElement('button');
  btn.className = 'view-toggle-btn';
  btn.textContent = 'Satellite';
  btn.addEventListener('click', () => {
    callbacks.onToggleStyle();
    btn.textContent = btn.textContent === 'Satellite' ? 'Map' : 'Satellite';
  });
  document.body.appendChild(btn);
}

function createSetStartTimeButton(callbacks) {
  const btn = document.createElement('button');
  btn.className = 'set-start-time-btn';
  btn.style.position = 'absolute';
  btn.style.bottom = '90px';
  btn.style.left = '50%';
  btn.style.transform = 'translateX(-50%)';
  btn.style.zIndex = '500';
  btn.style.width = 'auto';
  btn.textContent = 'Set Piotr Start Time';
  btn.addEventListener('click', () => {
    showOverlay();
  });
  document.body.appendChild(btn);
}

function wireHamburgerMenu(callbacks) {
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const hamburgerMenu = document.getElementById('hamburger-menu');
  const debugToggle = document.getElementById('debug-toggle');
  const timeSlider = document.getElementById('time-slider');
  const timeSliderContainer = document.getElementById('time-slider-container');
  const timeSliderValueEl = document.getElementById('time-slider-value');

  if (hamburgerBtn && hamburgerMenu) {
    hamburgerBtn.addEventListener('click', () => {
      if (hamburgerMenu.classList.contains('open')) {
        hamburgerMenu.classList.remove('open');
        hamburgerMenu.setAttribute('hidden', '');
      } else {
        hamburgerMenu.classList.add('open');
        hamburgerMenu.removeAttribute('hidden');
      }
    });
  }

  if (debugToggle) {
    debugToggle.addEventListener('change', () => {
      debugMode = debugToggle.checked;
      if (timeSliderContainer) {
        timeSliderContainer.style.display = debugMode ? 'block' : 'none';
      }
      if (callbacks.onDebugModeChanged) {
        callbacks.onDebugModeChanged(debugMode);
      }
    });
  }

  if (timeSlider) {
    timeSlider.addEventListener('input', () => {
      sliderValue = Number(timeSlider.value);
      if (timeSliderValueEl) {
        timeSliderValueEl.textContent = sliderValue;
      }
      if (callbacks.onSliderChanged) {
        callbacks.onSliderChanged(sliderValue);
      }
    });
  }
}
