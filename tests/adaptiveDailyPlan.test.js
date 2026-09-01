import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAdaptiveDailyPlan,
  getNextReviewAt,
  getReviewIntervalDays,
  isDueForReview,
} from '../lib/adaptiveDailyPlan.js';

function makeQuestions(count = 80) {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    subtest: index % 3 === 0 ? 'Number Series' : index % 3 === 1 ? 'Verbal Analogies' : 'Paper Folding',
    difficulty: index % 10 === 0 ? 'very-hard' : index % 2 === 0 ? 'medium' : 'easy',
  }));
}

test('review scheduling expands after correct streaks and resets after a miss', () => {
  assert.equal(getReviewIntervalDays({ attempts: 1, correct: 0, lastResult: 'wrong', correctStreak: 0 }), 1);
  assert.equal(getReviewIntervalDays({ attempts: 2, correct: 2, lastResult: 'correct', correctStreak: 2 }), 4);
  const answeredAt = '2026-08-01T12:00:00.000Z';
  const nextReviewAt = getNextReviewAt({ attempts: 2, correct: 2, lastResult: 'correct', correctStreak: 2 }, answeredAt);
  assert.equal(nextReviewAt, '2026-08-05T12:00:00.000Z');
  assert.equal(isDueForReview({ attempts: 2, correct: 2, lastResult: 'correct', correctStreak: 2, nextReviewAt }, Date.parse('2026-08-05T12:00:00.000Z')), true);
});

test('adaptive daily plan produces exact quotas when eligible pools are sufficient', () => {
  const questions = makeQuestions(100);
  const now = Date.parse('2026-08-31T12:00:00.000Z');
  const stats = {};
  questions.slice(0, 30).forEach((question, index) => {
    stats[String(question.id)] = {
      attempts: 2,
      correct: index < 10 ? 0 : 1,
      wrong: index < 10 ? 2 : 1,
      lastResult: index < 10 ? 'wrong' : 'correct',
      updatedAt: '2026-08-20T12:00:00.000Z',
      nextReviewAt: index < 10 ? '2026-08-21T12:00:00.000Z' : '2026-12-01T12:00:00.000Z',
    };
  });
  const plan = buildAdaptiveDailyPlan({
    questions,
    stats,
    weakSubtests: ['Verbal Analogies', 'Paper Folding'],
    goal: 30,
    dateKey: '2026-08-31',
    now,
  });
  assert.equal(plan.questions.length, 30);
  assert.equal(new Set(plan.questionIds).size, 30);
  assert.deepEqual(plan.composition, { review: 10, weak: 8, new: 8, challenge: 4 });
});

test('adaptive daily plan is stable for a date and rotates on a new date', () => {
  const questions = makeQuestions(80);
  const input = { questions, goal: 30, dateKey: '2026-08-31', now: Date.parse('2026-08-31T12:00:00.000Z') };
  const first = buildAdaptiveDailyPlan(input);
  const second = buildAdaptiveDailyPlan(input);
  const tomorrow = buildAdaptiveDailyPlan({ ...input, dateKey: '2026-09-01' });
  assert.deepEqual(first.questionIds, second.questionIds);
  assert.notDeepEqual(first.questionIds, tomorrow.questionIds);
  assert.deepEqual(first.composition, { review: 0, weak: 0, new: 26, challenge: 4 });
});

test('recent questions are avoided when fresh alternatives exist', () => {
  const questions = makeQuestions(80);
  const recentQuestionIds = questions.slice(0, 30).map((question) => String(question.id));
  const plan = buildAdaptiveDailyPlan({
    questions,
    recentQuestionIds,
    goal: 30,
    dateKey: '2026-08-31',
    now: Date.parse('2026-08-31T12:00:00.000Z'),
  });
  assert.equal(plan.questionIds.filter((id) => recentQuestionIds.includes(id)).length, 0);
});
