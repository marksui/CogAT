import test from 'node:test';
import assert from 'node:assert/strict';

import { quantitativeQuestions } from '../data/quantitativeQuestions.js';
import { quantitativeExtraQuestions } from '../data/quantitativeExtraQuestions.js';
import { level10OriginalQuestions } from '../data/level10OriginalQuestions.js';
import { g4WorkbookQuestions } from '../data/g4WorkbookQuestions.js';
import { bonusQuestions } from '../data/bonusQuestions.js';
import { numberAnalogyQuestions } from '../data/numberAnalogyQuestions.js';
import {
  auditNumberAnalogies,
  validateNumberAnalogyQuestion,
  validateNumberAnalogyScenario,
} from '../lib/numberAnalogyValidator.js';

function analogyQuestion(id, examples, target, answer, distractors = [1, 2, 3, 4]) {
  const values = [String(answer), ...distractors.map(String)];
  return {
    id,
    subtest: 'Number Analogies',
    battery: 'Quantitative Battery',
    question: `<div class="number-analogy">${[...examples, [target, '?']].map(([input, output]) => `<span class="number-pair">[<b>${input}</b><i>&rarr;</i><b>${output}</b>]</span>`).join('')}</div>`,
    options: values.map((text, index) => ({ label: ['A', 'B', 'C', 'D', 'E'][index], text })),
    correctAnswer: 'A',
    explanation: 'Test fixture.',
  };
}

const repositoryNumberAnalogies = [
  ...quantitativeQuestions,
  ...quantitativeExtraQuestions,
  ...level10OriginalQuestions,
  ...g4WorkbookQuestions,
  ...bonusQuestions,
  ...numberAnalogyQuestions,
].filter((question) => question.subtest === 'Number Analogies');

test('rejects the under-specified 4 to 2 regression case', () => {
  const result = validateNumberAnalogyScenario({ examples: [[4, 2]], target: 14, answer: 7 });
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'under-specified');
});

test('accepts a supported divide-by-two analogy with two examples', () => {
  const result = validateNumberAnalogyScenario({ examples: [[4, 2], [10, 5]], target: 14, answer: 7 });
  assert.equal(result.valid, true);
  assert.deepEqual(result.predictions, [7]);
});

test('rejects repeated examples that do not provide independent evidence', () => {
  const result = validateNumberAnalogyScenario({ examples: [[4, 2], [4, 2]], target: 14, answer: 7 });
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'non-independent-examples');
});

test('rejects competing rules that predict different target answers', () => {
  const result = validateNumberAnalogyScenario({ examples: [[3, 9], [5, 25]], target: 4, answer: 16 });
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'ambiguous');
  assert.deepEqual(new Set(result.predictions), new Set([16, 17]));
});

test('detects duplicate Number Analogy structures', () => {
  const first = analogyQuestion('duplicate-a', [[2, 4], [5, 10]], 7, 14, [10, 12, 16, 21]);
  const second = { ...first, id: 'duplicate-b' };
  const audit = auditNumberAnalogies([first, second]);
  assert.equal(audit.accepted.length, 1);
  assert.equal(audit.rejected.length, 1);
  assert.equal(audit.rejected[0].reason, 'duplicate');
  assert.equal(audit.rejected[0].duplicateOf, 'duplicate-a');
});

test('rejects a question whose marked answer does not match the supported rule', () => {
  const question = analogyQuestion('wrong-answer', [[2, 6], [4, 12], [7, 21]], 9, 26, [24, 27, 30, 36]);
  const result = validateNumberAnalogyQuestion(question);
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'answer-mismatch');
  assert.deepEqual(result.predictions, [27]);
});

test('contains exactly 50 new validated and unique Number Analogies', () => {
  assert.equal(numberAnalogyQuestions.length, 50);
  const audit = auditNumberAnalogies(numberAnalogyQuestions);
  assert.equal(audit.rejected.length, 0);
  assert.equal(audit.accepted.length, 50);
});

test('new questions use the requested 15 easy, 25 medium, and 10 hard distribution', () => {
  const distribution = numberAnalogyQuestions.reduce((groups, question) => {
    groups[question.difficulty] ??= [];
    groups[question.difficulty].push(question);
    return groups;
  }, {});
  assert.equal(distribution.easy.length, 15);
  assert.equal(distribution.medium.length, 25);
  assert.equal(distribution.hard.length, 10);
});

test('the complete repository Number Analogy bank passes validation and duplicate checks', () => {
  const audit = auditNumberAnalogies(repositoryNumberAnalogies);
  assert.equal(repositoryNumberAnalogies.length, 85);
  assert.equal(audit.rejected.length, 0, JSON.stringify(audit.rejected.map(({ question, reason }) => ({ id: question.id, reason }))));
  assert.equal(audit.accepted.length, 85);
});
