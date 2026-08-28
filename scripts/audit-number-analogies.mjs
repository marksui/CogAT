import { quantitativeQuestions } from '../data/quantitativeQuestions.js';
import { quantitativeExtraQuestions } from '../data/quantitativeExtraQuestions.js';
import { level10OriginalQuestions } from '../data/level10OriginalQuestions.js';
import { g4WorkbookQuestions } from '../data/g4WorkbookQuestions.js';
import { bonusQuestions } from '../data/bonusQuestions.js';
import { numberAnalogyQuestions } from '../data/numberAnalogyQuestions.js';
import { auditNumberAnalogies } from '../lib/numberAnalogyValidator.js';

const questions = [
  ...quantitativeQuestions,
  ...quantitativeExtraQuestions,
  ...level10OriginalQuestions,
  ...g4WorkbookQuestions,
  ...bonusQuestions,
  ...numberAnalogyQuestions,
].filter((question) => question.subtest === 'Number Analogies');

const audit = auditNumberAnalogies(questions);
const difficulty = Object.fromEntries(['easy', 'medium', 'hard', 'very-hard'].map((level) => [
  level,
  questions.filter((question) => (question.difficulty ?? 'easy') === level).length,
]));

console.log(JSON.stringify({
  total: questions.length,
  accepted: audit.accepted.length,
  rejected: audit.rejected.map(({ question, reason, predictions, rules, duplicateOf }) => ({
    id: question.id,
    reason,
    predictions,
    rules,
    duplicateOf,
  })),
  newQuestions: numberAnalogyQuestions.length,
  difficulty,
}, null, 2));

if (audit.rejected.length > 0) {
  process.exitCode = 1;
}
