import test from 'node:test';
import assert from 'node:assert/strict';

import {
  auditQuestionBank,
  validateNumberPuzzleQuestion,
  validateNumberSeriesQuestion,
  validateQuestion,
} from '../lib/questionBankValidator.js';
import { questionBankEntries } from '../lib/questionBankSources.js';

function options(answer, distractors = ['2', '3', '4', '5']) {
  return [answer, ...distractors].map((text, index) => ({ label: ['A', 'B', 'C', 'D', 'E'][index], text }));
}

function question(overrides = {}) {
  return {
    id: 'fixture',
    subtest: 'Sentence Completion',
    battery: 'Verbal Battery',
    question: 'The puppy was ___ after its nap.',
    options: options('energetic', ['sleepy', 'wooden', 'square', 'slowly']),
    correctAnswer: 'A',
    explanation: 'Energetic best completes the sentence because the puppy has rested.',
    ...overrides,
  };
}

test('rejects missing correct options and duplicate choices', () => {
  const result = validateQuestion(question({
    options: options('energetic', ['sleepy', 'sleepy', 'square', 'slowly']),
    correctAnswer: 'Z',
  }));
  assert.ok(result.some((issue) => issue.code === 'duplicate-options'));
  assert.ok(result.some((issue) => issue.code === 'missing-correct-option'));
});

test('rejects explanations that state a different answer', () => {
  const result = validateQuestion(question({ explanation: 'The correct answer is B.' }));
  assert.ok(result.some((issue) => issue.code === 'explanation-answer-mismatch'));
});

test('detects duplicate questions and duplicate IDs', () => {
  const first = question({ id: 'same-id' });
  const second = { ...first };
  const report = auditQuestionBank([first, second]);
  assert.ok(report.issues.some((issue) => issue.code === 'duplicate-id'));
  assert.ok(report.issues.some((issue) => issue.code === 'duplicate-question'));
});

test('detects missing or unreadable question images', () => {
  const result = validateQuestion(question({
    id: 'image-fixture',
    subtest: 'Figure Matrices',
    battery: 'Nonverbal Battery',
    question: '<img src="./assets/missing.png" alt="Missing matrix">',
    options: options('Choice A'),
    explanation: 'The answer key marks this answer as A.',
  }), { assetExists: () => false });
  assert.ok(result.some((issue) => issue.code === 'broken-image'));
});

test('requires complete Verbal Analogy and Sentence Completion structures', () => {
  const malformedAnalogy = validateQuestion(question({
    id: 'analogy-structure',
    subtest: 'Verbal Analogies',
    question: 'Choose the word that fits best.',
  }));
  assert.ok(malformedAnalogy.some((issue) => issue.code === 'analogy-structure'));

  const missingBlank = validateQuestion(question({
    id: 'sentence-structure',
    question: 'The puppy was energetic after its nap.',
  }));
  assert.ok(missingBlank.some((issue) => issue.code === 'sentence-missing-blank'));
});

test('requires a visual prompt for non-image Figure Matrices', () => {
  const result = validateQuestion(question({
    id: 'matrix-structure',
    subtest: 'Figure Matrices',
    battery: 'Nonverbal Battery',
    question: 'Which panel completes the pattern?',
    explanation: 'The pattern adds one shape, so option A completes it.',
  }));
  assert.ok(result.some((issue) => issue.code === 'matrix-missing-visual'));
});

test('validates and checks the answer for Number Series', () => {
  const valid = question({
    id: 'series-valid',
    subtest: 'Number Series',
    battery: 'Quantitative Battery',
    question: '2, 5, 8, 11, ___',
    options: options('14', ['12', '13', '15', '16']),
    explanation: 'Add 3 each time, so the next number is 14.',
  });
  assert.deepEqual(validateNumberSeriesQuestion(valid), []);
  const invalid = { ...valid, correctAnswer: 'B' };
  assert.ok(validateNumberSeriesQuestion(invalid).some((issue) => issue.code === 'answer-mismatch'));
});

test('validates standard and multi-step Number Puzzles', () => {
  const standard = question({
    id: 'puzzle-standard',
    subtest: 'Number Puzzles',
    battery: 'Quantitative Battery',
    question: '7 + ___ = 15',
    options: options('8', ['6', '7', '9', '10']),
    explanation: 'Subtract 7 from 15 to get 8.',
  });
  assert.deepEqual(validateNumberPuzzleQuestion(standard), []);

  const symbols = question({
    id: 'puzzle-symbols',
    subtest: 'Number Puzzles',
    battery: 'Quantitative Battery',
    question: '&Delta; + &Delta; = 12<br>&Delta; + &#9633; = 10<br>&#9633; = ?',
    options: options('4', ['2', '3', '5', '6']),
    explanation: 'The triangle is 6, so the box must be 4.',
  });
  assert.deepEqual(validateNumberPuzzleQuestion(symbols), []);
});

test('the complete repository question bank passes every quality gate', () => {
  const report = auditQuestionBank(questionBankEntries, { assetExists: () => true });
  assert.equal(report.issues.length, 0, JSON.stringify(report.issues.slice(0, 20), null, 2));
});
