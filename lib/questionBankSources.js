import { bonusQuestions } from '../data/bonusQuestions.js';
import { coreExpansionQuestions } from '../data/coreExpansionQuestions.js';
import { coreExpansionRound2Questions } from '../data/coreExpansionRound2Questions.js';
import { expansion500Questions } from '../data/expansion500Questions.js';
import { g4WorkbookQuestions } from '../data/g4WorkbookQuestions.js';
import { level10OriginalQuestions } from '../data/level10OriginalQuestions.js';
import { mockExamQuestions } from '../data/mockExamQuestions.js';
import { nonverbalExtraQuestions } from '../data/nonverbalExtraQuestions.js';
import { nonverbalQuestions } from '../data/nonverbalQuestions.js';
import { numberAnalogyQuestions } from '../data/numberAnalogyQuestions.js';
import { quantitativeExtraQuestions } from '../data/quantitativeExtraQuestions.js';
import { quantitativeQuestions } from '../data/quantitativeQuestions.js';
import { verbalExtraQuestions } from '../data/verbalExtraQuestions.js';
import { verbalExpansion200Questions } from '../data/verbalExpansion200Questions.js';
import { verbalQuestions } from '../data/verbalQuestions.js';
import { verbalVocabularyQuestions } from '../data/verbalVocabularyQuestions.js';
import { verbalWorkbookQuestions } from '../data/verbalWorkbookQuestions.js';

const sources = [
  ['data/bonusQuestions.js', bonusQuestions],
  ['data/coreExpansionQuestions.js', coreExpansionQuestions],
  ['data/coreExpansionRound2Questions.js', coreExpansionRound2Questions],
  ['data/expansion500Questions.js', expansion500Questions],
  ['data/g4WorkbookQuestions.js', g4WorkbookQuestions],
  ['data/level10OriginalQuestions.js', level10OriginalQuestions],
  ['data/mockExamQuestions.js', mockExamQuestions],
  ['data/nonverbalExtraQuestions.js', nonverbalExtraQuestions],
  ['data/nonverbalQuestions.js', nonverbalQuestions],
  ['data/numberAnalogyQuestions.js', numberAnalogyQuestions],
  ['data/quantitativeExtraQuestions.js', quantitativeExtraQuestions],
  ['data/quantitativeQuestions.js', quantitativeQuestions],
  ['data/verbalExtraQuestions.js', verbalExtraQuestions],
  ['data/verbalExpansion200Questions.js', verbalExpansion200Questions],
  ['data/verbalQuestions.js', verbalQuestions],
  ['data/verbalVocabularyQuestions.js', verbalVocabularyQuestions],
  ['data/verbalWorkbookQuestions.js', verbalWorkbookQuestions],
];

export const questionBankEntries = sources.flatMap(([sourceFile, questions]) => (
  questions.map((question) => ({ question, sourceFile }))
));

export const repositoryQuestions = questionBankEntries.map((entry) => entry.question);
