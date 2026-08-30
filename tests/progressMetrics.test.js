import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateMasteryProgress,
  calculateSubtestPerformance,
  formatResponseSpeed,
} from '../lib/progressMetrics.js';

test('calculates accuracy and recent average response speed', () => {
  const records = [{ attempts: 8, correct: 6 }];
  const log = Array.from({ length: 8 }, (_, index) => ({
    correct: index < 6,
    responseSeconds: 10 + index,
    answeredAt: `2026-08-${String(index + 1).padStart(2, '0')}T12:00:00.000Z`,
  }));
  const result = calculateSubtestPerformance(records, log);
  assert.equal(result.accuracy, 75);
  assert.equal(result.averageSeconds, 13.5);
  assert.equal(result.speedLabel, '14s');
});

test('detects an improving recent trend', () => {
  const previous = Array.from({ length: 8 }, (_, index) => ({
    correct: index < 3,
    responseSeconds: 30,
    answeredAt: `2026-08-${String(index + 1).padStart(2, '0')}T12:00:00.000Z`,
  }));
  const recent = Array.from({ length: 8 }, (_, index) => ({
    correct: index < 7,
    responseSeconds: 20,
    answeredAt: `2026-08-${String(index + 11).padStart(2, '0')}T12:00:00.000Z`,
  }));
  const result = calculateSubtestPerformance([{ attempts: 16, correct: 10 }], [...previous, ...recent]);
  assert.equal(result.trend.key, 'up');
  assert.equal(result.trend.label, 'Improving');
});

test('uses a baseline state until enough attempts are logged', () => {
  const result = calculateSubtestPerformance([{ attempts: 3, correct: 2 }], [
    { correct: true, responseSeconds: 12, answeredAt: '2026-08-01T12:00:00.000Z' },
  ]);
  assert.equal(result.trend.key, 'building');
  assert.equal(result.speedLabel, '12s');
});

test('calculates mastery levels consistently', () => {
  assert.deepEqual(calculateMasteryProgress(0, null), { mastered: false, good: false, progress: 0, status: 'Developing' });
  assert.equal(calculateMasteryProgress(8, 75).status, 'Good');
  assert.deepEqual(calculateMasteryProgress(15, 90), { mastered: true, good: false, progress: 100, status: 'Mastered' });
  assert.equal(formatResponseSpeed(72), '1m 12s');
});
