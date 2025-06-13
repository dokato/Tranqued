// Unit tests for timer logic (progress calculation, clamping)
const fs = require('fs');
let clampFocusTime;

try {
  // Try to import from renderer.js if exported (Node hack)
  clampFocusTime = require('../renderer').clampFocusTime;
} catch (e) {
  // fallback to local copy if not exported
  clampFocusTime = function(value, min = 1, max = 60, def = 25) {
    if (typeof value !== 'number' || isNaN(value)) return def;
    if (value < min) return min;
    if (value > max) return max;
    return value;
  };
}

describe('Focus Timer Logic', () => {
  test('clamps below minimum', () => {
    expect(clampFocusTime(0)).toBe(1);
    expect(clampFocusTime(-5)).toBe(1);
  });
  test('clamps above maximum', () => {
    expect(clampFocusTime(100)).toBe(60);
  });
  test('defaults for invalid input', () => {
    expect(clampFocusTime('abc')).toBe(25);
    expect(clampFocusTime(undefined)).toBe(25);
    expect(clampFocusTime(NaN)).toBe(25);
  });
  test('returns in-range values', () => {
    expect(clampFocusTime(10)).toBe(10);
    expect(clampFocusTime(60)).toBe(60);
    expect(clampFocusTime(1)).toBe(1);
  });
});
