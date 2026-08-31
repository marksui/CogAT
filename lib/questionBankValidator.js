import { validateNumberAnalogyQuestion } from './numberAnalogyValidator.js';
import { validatePaperFoldingQuestion } from './paperFoldingValidator.js';

export const SPECIALIZED_SUBTESTS = new Set([
  'Number Analogies',
  'Number Series',
  'Number Puzzles',
  'Verbal Analogies',
  'Sentence Completion',
  'Figure Matrices',
  'Paper Folding',
]);

const EPSILON = 1e-9;
const MAX_PUZZLE_VALUE = 200;

function nearlyEqual(first, second) {
  return Number.isFinite(first) && Number.isFinite(second) && Math.abs(first - second) < EPSILON;
}

export function decodeQuestionText(value = '') {
  return String(value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&minus;|−/g, '-')
    .replace(/&times;|×/g, '*')
    .replace(/&divide;|÷/g, '/')
    .replace(/&rarr;|→/g, '->')
    .replace(/&Delta;|△|Δ/g, '△')
    .replace(/&#9633;|□/g, '□')
    .replace(/&#9671;|◇/g, '◇')
    .replace(/&#9675;|○/g, '○')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&(?:amp|quot|apos);/gi, (entity) => ({
      '&amp;': '&',
      '&quot;': '"',
      '&apos;': "'",
    })[entity.toLowerCase()] ?? entity)
    .replace(/<[^>]*>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim();
}

function normalizeMarkup(value = '') {
  return String(value).replace(/\s+/g, ' ').trim().toLowerCase();
}

function normalizePlainText(value = '') {
  return decodeQuestionText(value)
    .toLowerCase()
    .replace(/[“”‘’]/g, "'")
    .replace(/[^a-z0-9?+*/=._<>-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseNumber(value) {
  const normalized = decodeQuestionText(value).replace(/,/g, '').trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getQuestionOptionValue(option) {
  return String(option?.value ?? option?.label ?? '');
}

export function getQuestionCorrectOption(question) {
  const answer = String(question?.correctAnswer ?? '');
  return (question?.options ?? []).filter((option) => getQuestionOptionValue(option) === answer);
}

export function extractQuestionImageSources(question) {
  const sources = [];
  const pattern = /<img\b[^>]*\bsrc=["']([^"']+)["']/gi;
  const fields = [question?.question, question?.questionNote, ...(question?.options ?? []).map((option) => option.text)];
  for (const field of fields) {
    let match;
    while ((match = pattern.exec(String(field ?? '')))) {
      sources.push(match[1]);
    }
  }
  return sources;
}

export function createQuestionSignature(question) {
  const options = (question?.options ?? [])
    .map((option) => `${normalizeMarkup(option.label)}:${normalizeMarkup(option.value)}:${normalizeMarkup(option.text)}`)
    .join('|');
  return [
    normalizeMarkup(question?.subtest),
    normalizeMarkup(question?.question),
    normalizeMarkup(question?.questionNote),
    options,
  ].join('::');
}

function createIssue(question, code, message, details = {}) {
  return {
    id: question?.id ?? null,
    subtest: question?.subtest ?? 'Unknown',
    code,
    message,
    ...details,
  };
}

function validateExplanation(question, correctOption) {
  const explanation = decodeQuestionText(question.explanation);
  if (!explanation || explanation.length < 12 || explanation.split(/\s+/).length < 3) {
    return createIssue(question, 'incomplete-explanation', 'Explanation is missing or too short to teach the rule.');
  }

  const answerKeyMatch = explanation.match(/answer key marks this answer as\s+(.+?)\.?$/i);
  const explicitAnswer = answerKeyMatch ?? explanation.match(/(?:answer is|correct answer(?:\s+is)?)[\s:]+([^.!\n]+)/i);
  if (explicitAnswer) {
    const stated = normalizePlainText(explicitAnswer[1]);
    const accepted = new Set([
      normalizePlainText(question.correctAnswer),
      normalizePlainText(correctOption?.label),
      normalizePlainText(correctOption?.value),
      normalizePlainText(correctOption?.text),
    ].filter(Boolean));
    if (![...accepted].some((value) => stated === value || stated.startsWith(`${value} `))) {
      return createIssue(question, 'explanation-answer-mismatch', `Explanation states “${explicitAnswer[1].trim()}”, which does not match the marked answer.`);
    }
  }
  return null;
}

function getNumericCorrectAnswer(question, correctOption) {
  return parseNumber(correctOption?.value ?? correctOption?.text ?? question.correctAnswer);
}

function getSeriesCandidates(terms) {
  const candidates = [];
  const add = (family, prediction, valid) => {
    if (valid && Number.isFinite(prediction)) {
      candidates.push({ family, prediction: Number(prediction.toFixed(8)) });
    }
  };
  const differences = terms.slice(1).map((term, index) => term - terms[index]);

  if (differences.length >= 2) {
    add('constant difference', terms.at(-1) + differences[0], differences.every((difference) => nearlyEqual(difference, differences[0])));
  }

  if (terms.length >= 3 && terms.slice(0, -1).every((term) => !nearlyEqual(term, 0))) {
    const ratios = terms.slice(1).map((term, index) => term / terms[index]);
    add('constant ratio', terms.at(-1) * ratios[0], ratios.every((ratio) => nearlyEqual(ratio, ratios[0])));
  }

  if (differences.length >= 3) {
    const secondDifferences = differences.slice(1).map((difference, index) => difference - differences[index]);
    add('changing difference', terms.at(-1) + differences.at(-1) + secondDifferences[0], secondDifferences.every((difference) => nearlyEqual(difference, secondDifferences[0])) && !nearlyEqual(secondDifferences[0], 0));
  }

  if (terms.length >= 4 && !nearlyEqual(terms[1], terms[0])) {
    const factor = (terms[2] - terms[1]) / (terms[1] - terms[0]);
    const offset = terms[1] - (factor * terms[0]);
    const valid = Number.isFinite(factor) && Math.abs(factor) <= 12
      && terms.slice(1).every((term, index) => nearlyEqual(term, (factor * terms[index]) + offset));
    add('multiply then add', (factor * terms.at(-1)) + offset, valid && !(nearlyEqual(factor, 1) || nearlyEqual(offset, 0)));
  }

  if (differences.length >= 4) {
    const valid = differences.every((difference, index) => nearlyEqual(difference, differences[index % 2]));
    add('alternating differences', terms.at(-1) + differences[differences.length % 2], valid && !nearlyEqual(differences[0], differences[1]));
  }

  if (terms.length >= 6) {
    const parityRules = [0, 1].map((parity) => {
      const transitions = [];
      for (let index = parity; index < terms.length - 1; index += 2) {
        transitions.push([terms[index], terms[index + 1]]);
      }
      if (transitions.length < 2 || nearlyEqual(transitions[1][0], transitions[0][0])) {
        return null;
      }
      const factor = (transitions[1][1] - transitions[0][1]) / (transitions[1][0] - transitions[0][0]);
      const offset = transitions[0][1] - (factor * transitions[0][0]);
      return transitions.every(([input, output]) => nearlyEqual(output, (factor * input) + offset)) ? { factor, offset } : null;
    });
    const nextParity = (terms.length - 1) % 2;
    const rule = parityRules[nextParity];
    add('alternating operations', rule ? (rule.factor * terms.at(-1)) + rule.offset : Number.NaN, parityRules.every(Boolean));
  }

  if (terms.length >= 6) {
    const groups = [terms.filter((_, index) => index % 2 === 0), terms.filter((_, index) => index % 2 === 1)];
    const arithmetic = groups.map((group) => group.slice(1).map((term, index) => term - group[index]));
    const valid = arithmetic.every((steps) => steps.length >= 2 && steps.every((step) => nearlyEqual(step, steps[0])));
    const targetGroup = terms.length % 2;
    add('interleaved sequences', terms.at(-2) + arithmetic[targetGroup][0], valid);
  }

  const unique = new Map();
  for (const candidate of candidates) {
    const key = String(candidate.prediction);
    if (!unique.has(key)) {
      unique.set(key, candidate);
    }
  }
  return [...unique.values()];
}

export function validateNumberSeriesQuestion(question) {
  if (/<img\b/i.test(String(question.question))) {
    return [];
  }
  const text = decodeQuestionText(question.question).replace(/^what comes next\?\s*/i, '');
  const blankIndex = text.search(/___|\?/);
  if (blankIndex < 0) {
    return [createIssue(question, 'series-missing-target', 'Number Series question has no target blank.')];
  }
  const terms = (text.slice(0, blankIndex).match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  if (terms.length < 4) {
    return [createIssue(question, 'series-under-specified', 'Number Series needs at least four visible terms.')];
  }
  const candidates = getSeriesCandidates(terms);
  if (candidates.length === 0) {
    return [createIssue(question, 'series-unsupported-rule', 'No supported Number Series rule matches every visible term.')];
  }
  if (candidates.length > 1) {
    return [createIssue(question, 'series-ambiguous', 'Competing supported Number Series rules predict different answers.', { predictions: candidates })];
  }
  const correctOption = getQuestionCorrectOption(question)[0];
  const answer = getNumericCorrectAnswer(question, correctOption);
  if (answer === null || !nearlyEqual(answer, candidates[0].prediction)) {
    return [createIssue(question, 'answer-mismatch', `Series rule predicts ${candidates[0].prediction}, not ${answer ?? 'a nonnumeric answer'}.`, { predictions: candidates })];
  }
  return [];
}

function tokenizeExpression(expression, variableMap) {
  const normalized = expression
    .replace(/\b[xX]\b/g, '*')
    .replace(/___|\?/g, 'U')
    .replace(/[△□◇○]/g, (symbol) => variableMap.get(symbol));
  return normalized.match(/\d+(?:\.\d+)?|[A-Z]\d*|[()+*/-]/g) ?? [];
}

function evaluateExpression(expression, assignments, variableMap) {
  const tokens = tokenizeExpression(expression, variableMap);
  let index = 0;
  const parsePrimary = () => {
    const token = tokens[index++];
    if (token === '(') {
      const value = parseAddSubtract();
      if (tokens[index++] !== ')') throw new Error('missing parenthesis');
      return value;
    }
    if (token === '-') return -parsePrimary();
    if (/^\d/.test(token ?? '')) return Number(token);
    if (/^[A-Z]/.test(token ?? '')) return assignments[token];
    throw new Error('invalid expression');
  };
  const parseMultiplyDivide = () => {
    let value = parsePrimary();
    while (tokens[index] === '*' || tokens[index] === '/') {
      const operator = tokens[index++];
      const right = parsePrimary();
      value = operator === '*' ? value * right : value / right;
    }
    return value;
  };
  function parseAddSubtract() {
    let value = parseMultiplyDivide();
    while (tokens[index] === '+' || tokens[index] === '-') {
      const operator = tokens[index++];
      const right = parseMultiplyDivide();
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  }
  const result = parseAddSubtract();
  if (index !== tokens.length || !Number.isFinite(result)) throw new Error('invalid expression');
  return result;
}

function solveNumberPuzzle(question) {
  let text = decodeQuestionText(question.question)
    .replace(/^what number (?:makes this true|goes in the box)\?\s*/i, '')
    .replace(/^what number makes this true\?\s*/i, '');
  const symbols = [...new Set(text.match(/[△□◇○]/g) ?? [])];
  const variableMap = new Map(symbols.map((symbol, index) => [symbol, `V${index}`]));
  let targetVariable = text.includes('___') || /\?(?![^\n]*=)/.test(text) ? 'U' : null;
  const equations = [];

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line.includes('=')) continue;
    const [left, right] = line.split('=').map((part) => part.trim());
    if (right === '?' && /^[△□◇○]$/.test(left)) {
      targetVariable = variableMap.get(left);
      continue;
    }
    equations.push([left, right]);
  }
  if (!targetVariable && text.includes('?')) targetVariable = 'U';
  const variables = [...new Set([
    ...symbols.map((symbol) => variableMap.get(symbol)),
    ...(text.includes('___') || (text.includes('?') && targetVariable === 'U') ? ['U'] : []),
  ])];
  if (!targetVariable || equations.length === 0 || variables.length === 0 || variables.length > 2) {
    return null;
  }

  const predictions = new Set();
  const assignments = {};
  const search = (variableIndex) => {
    if (variableIndex === variables.length) {
      try {
        const valid = equations.every(([left, right]) => nearlyEqual(
          evaluateExpression(left, assignments, variableMap),
          evaluateExpression(right, assignments, variableMap),
        ));
        if (valid) predictions.add(assignments[targetVariable]);
      } catch {
        return;
      }
      return;
    }
    for (let value = 0; value <= MAX_PUZZLE_VALUE; value += 1) {
      assignments[variables[variableIndex]] = value;
      search(variableIndex + 1);
      if (predictions.size > 2) return;
    }
  };
  search(0);
  return [...predictions];
}

export function validateNumberPuzzleQuestion(question) {
  if (/<img\b/i.test(String(question.question))) {
    return [];
  }
  const predictions = solveNumberPuzzle(question);
  if (!predictions) {
    return [createIssue(question, 'puzzle-unparseable', 'Number Puzzle could not be converted into a supported equation.')];
  }
  if (predictions.length !== 1) {
    return [createIssue(question, predictions.length ? 'puzzle-ambiguous' : 'puzzle-no-solution', 'Number Puzzle does not have exactly one supported solution.', { predictions })];
  }
  const correctOption = getQuestionCorrectOption(question)[0];
  const answer = getNumericCorrectAnswer(question, correctOption);
  if (answer === null || !nearlyEqual(answer, predictions[0])) {
    return [createIssue(question, 'answer-mismatch', `Puzzle equations solve to ${predictions[0]}, not ${answer ?? 'a nonnumeric answer'}.`, { predictions })];
  }
  return [];
}

function validateSpecializedStructure(question) {
  if (/<img\b/i.test(String(question.question))) return [];
  const text = decodeQuestionText(question.question);
  if (question.subtest === 'Verbal Analogies' && !/\bis to\b[\s\S]+\bas\b[\s\S]+(?:___|\?)/i.test(text)) {
    return [createIssue(question, 'analogy-structure', 'Verbal Analogy does not contain a complete A is to B as C is to blank structure.')];
  }
  if (question.subtest === 'Sentence Completion' && !/(?:___+|\bblank\b)/i.test(text)) {
    return [createIssue(question, 'sentence-missing-blank', 'Sentence Completion question has no visible blank.')];
  }
  if (question.subtest === 'Figure Matrices' && !/(?:<svg\b|<img\b)/i.test(String(question.question))) {
    return [createIssue(question, 'matrix-missing-visual', 'Figure Matrices question has no SVG or image prompt.')];
  }
  return [];
}

export function validateQuestion(question, { assetExists } = {}) {
  const issues = [];
  if (!question || typeof question !== 'object') {
    return [createIssue(question, 'invalid-question', 'Question must be an object.')];
  }
  if (question.id === undefined || question.id === null || String(question.id).trim() === '') {
    issues.push(createIssue(question, 'missing-id', 'Question ID is required.'));
  }
  if (!String(question.subtest ?? '').trim() || !String(question.battery ?? '').trim()) {
    issues.push(createIssue(question, 'missing-classification', 'Battery and subtest are required.'));
  }
  if (!String(question.question ?? '').trim()) {
    issues.push(createIssue(question, 'missing-question', 'Question prompt is empty.'));
  }

  const options = Array.isArray(question.options) ? question.options : [];
  if (options.length < 2) {
    issues.push(createIssue(question, 'missing-options', 'Question needs answer choices.'));
  }
  const labels = options.map((option) => String(option?.label ?? '').trim());
  const values = options.map((option) => getQuestionOptionValue(option));
  const optionContent = options.map((option) => normalizeMarkup(option?.text));
  if (labels.some((label) => !label) || new Set(labels).size !== labels.length) {
    issues.push(createIssue(question, 'invalid-option-labels', 'Answer-choice labels must be present and unique.'));
  }
  if (values.some((value) => !value) || new Set(values).size !== values.length) {
    issues.push(createIssue(question, 'invalid-option-values', 'Answer-choice values must be present and unique.'));
  }
  if (optionContent.some((value) => !value) || new Set(optionContent).size !== optionContent.length) {
    issues.push(createIssue(question, 'duplicate-options', 'Answer choices must contain unique, nonempty content.'));
  }

  const correctOptions = getQuestionCorrectOption(question);
  if (correctOptions.length !== 1) {
    issues.push(createIssue(question, 'missing-correct-option', 'correctAnswer must match exactly one option value.'));
  } else {
    const explanationIssue = validateExplanation(question, correctOptions[0]);
    if (explanationIssue) issues.push(explanationIssue);
  }

  for (const source of extractQuestionImageSources(question)) {
    if (typeof assetExists === 'function' && !assetExists(source)) {
      issues.push(createIssue(question, 'broken-image', `Image does not exist or is unreadable: ${source}`, { source }));
    }
  }

  if (issues.some((issue) => ['missing-options', 'missing-correct-option', 'invalid-option-values'].includes(issue.code))) {
    return issues;
  }

  if (question.subtest === 'Number Analogies') {
    const validation = validateNumberAnalogyQuestion(question);
    if (!validation.valid) {
      issues.push(createIssue(question, `number-analogy-${validation.reason}`, `Number Analogy validation failed: ${validation.reason}.`, { predictions: validation.predictions, rules: validation.rules }));
    }
  } else if (question.subtest === 'Number Series') {
    issues.push(...validateNumberSeriesQuestion(question));
  } else if (question.subtest === 'Number Puzzles') {
    issues.push(...validateNumberPuzzleQuestion(question));
  } else if (question.subtest === 'Paper Folding') {
    issues.push(...validatePaperFoldingQuestion(question));
  } else if (SPECIALIZED_SUBTESTS.has(question.subtest)) {
    issues.push(...validateSpecializedStructure(question));
  }
  return issues;
}

export function auditQuestionBank(entries, options = {}) {
  const issues = [];
  const seenIds = new Map();
  const seenSignatures = new Map();
  const subtestCounts = {};

  for (const entry of entries) {
    const wrappedEntry = entry && typeof entry.question === 'object' && entry.question !== null;
    const question = wrappedEntry ? entry.question : entry;
    const sourceFile = wrappedEntry ? (entry.sourceFile ?? null) : null;
    subtestCounts[question?.subtest ?? 'Unknown'] = (subtestCounts[question?.subtest ?? 'Unknown'] ?? 0) + 1;
    const id = String(question?.id ?? '');
    if (id && seenIds.has(id)) {
      issues.push(createIssue(question, 'duplicate-id', `Question ID duplicates ${seenIds.get(id).id}.`, { duplicateOf: seenIds.get(id), sourceFile }));
    } else if (id) {
      seenIds.set(id, { id: question.id, sourceFile });
    }

    const signature = createQuestionSignature(question);
    if (signature && seenSignatures.has(signature)) {
      issues.push(createIssue(question, 'duplicate-question', `Question duplicates ${seenSignatures.get(signature).id}.`, { duplicateOf: seenSignatures.get(signature), sourceFile }));
    } else if (signature) {
      seenSignatures.set(signature, { id: question.id, sourceFile });
    }

    issues.push(...validateQuestion(question, options).map((issue) => ({ ...issue, sourceFile })));
  }

  return {
    total: entries.length,
    valid: entries.length - new Set(issues.map((issue) => `${issue.sourceFile ?? ''}:${issue.id}`)).size,
    issues,
    subtestCounts,
  };
}
