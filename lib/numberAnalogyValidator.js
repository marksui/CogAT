const EPSILON = 1e-9;
const MAX_ABS_PREDICTION = 10000;

function nearlyEqual(first, second) {
  return Number.isFinite(first) && Number.isFinite(second) && Math.abs(first - second) < EPSILON;
}

function normalizeNumber(value) {
  if (!Number.isFinite(value)) {
    return null;
  }
  const rounded = Math.round(value);
  return nearlyEqual(value, rounded) ? rounded : Number(value.toFixed(8));
}

function parseNumericText(value) {
  const normalized = String(value ?? '')
    .replace(/&minus;|−/g, '-')
    .replace(/,/g, '')
    .trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    return null;
  }
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function getDigits(value) {
  if (!Number.isInteger(value) || value < 0) {
    return null;
  }
  return String(value).split('').map(Number);
}

function isSimpleSlope(value) {
  if (Number.isInteger(value) && Math.abs(value) <= 12) {
    return true;
  }
  for (let divisor = 2; divisor <= 12; divisor += 1) {
    if (nearlyEqual(Math.abs(value), 1 / divisor)) {
      return true;
    }
  }
  return false;
}

function addCandidate(candidates, name, family, apply, examples) {
  const outputs = examples.map(([input]) => normalizeNumber(apply(input)));
  if (outputs.some((output) => output === null)) {
    return;
  }
  if (!examples.every(([, expected], index) => nearlyEqual(outputs[index], expected))) {
    return;
  }
  candidates.push({ name, family, apply });
}

export function getSupportedNumberAnalogyRules(examples) {
  if (!Array.isArray(examples) || examples.length === 0) {
    return [];
  }

  const candidates = [];
  const [firstInput, firstOutput] = examples[0];
  const difference = firstOutput - firstInput;
  addCandidate(candidates, `x ${difference < 0 ? '-' : '+'} ${Math.abs(difference)}`, 'add-subtract', (value) => value + difference, examples);

  if (!nearlyEqual(firstInput, 0)) {
    const factor = firstOutput / firstInput;
    if (isSimpleSlope(factor)) {
      addCandidate(candidates, `x × ${normalizeNumber(factor)}`, 'multiply-divide', (value) => value * factor, examples);
    }
  }

  if (!nearlyEqual(firstOutput, 0)) {
    const divisor = firstInput / firstOutput;
    if (isSimpleSlope(1 / divisor)) {
      addCandidate(candidates, `x ÷ ${normalizeNumber(divisor)}`, 'multiply-divide', (value) => value / divisor, examples);
    }
  }

  const secondDistinct = examples.find(([input]) => !nearlyEqual(input, firstInput));
  if (secondDistinct) {
    const [secondInput, secondOutput] = secondDistinct;
    const slope = (secondOutput - firstOutput) / (secondInput - firstInput);
    const intercept = firstOutput - (slope * firstInput);
    if (isSimpleSlope(slope) && Number.isInteger(normalizeNumber(intercept)) && Math.abs(intercept) <= 50) {
      addCandidate(candidates, `${normalizeNumber(slope)}x ${intercept < 0 ? '-' : '+'} ${Math.abs(intercept)}`, 'affine', (value) => (slope * value) + intercept, examples);
    }
  }

  addCandidate(candidates, 'x²', 'power', (value) => value ** 2, examples);
  addCandidate(candidates, 'x³', 'power', (value) => value ** 3, examples);
  addCandidate(candidates, '√x', 'root', (value) => {
    const result = Math.sqrt(value);
    return Number.isInteger(result) ? result : Number.NaN;
  }, examples);
  addCandidate(candidates, 'digit sum', 'digits', (value) => {
    const digits = getDigits(value);
    return digits ? digits.reduce((sum, digit) => sum + digit, 0) : Number.NaN;
  }, examples);
  addCandidate(candidates, 'digit product', 'digits', (value) => {
    const digits = getDigits(value);
    return digits ? digits.reduce((product, digit) => product * digit, 1) : Number.NaN;
  }, examples);
  addCandidate(candidates, 'digit reversal', 'digits', (value) => {
    const digits = getDigits(value);
    return digits ? Number([...digits].reverse().join('')) : Number.NaN;
  }, examples);
  addCandidate(candidates, 'digit difference', 'digits', (value) => {
    const digits = getDigits(value);
    return digits?.length === 2 ? Math.abs(digits[0] - digits[1]) : Number.NaN;
  }, examples);

  const squareOffset = firstOutput - (firstInput ** 2);
  if (Number.isInteger(squareOffset) && Math.abs(squareOffset) <= 30) {
    addCandidate(candidates, `x² ${squareOffset < 0 ? '-' : '+'} ${Math.abs(squareOffset)}`, 'power-offset', (value) => (value ** 2) + squareOffset, examples);
  }

  const firstOutputRoot = Math.sqrt(firstOutput);
  const squareInputShift = firstOutputRoot - firstInput;
  if (Number.isInteger(firstOutputRoot) && Number.isInteger(squareInputShift) && Math.abs(squareInputShift) <= 10) {
    addCandidate(candidates, `(x ${squareInputShift < 0 ? '-' : '+'} ${Math.abs(squareInputShift)})²`, 'shifted-power', (value) => (value + squareInputShift) ** 2, examples);
  }

  return candidates;
}

export function validateNumberAnalogyScenario({ examples, target, answer }) {
  const normalizedExamples = Array.isArray(examples)
    ? examples.map((pair) => pair.map(Number))
    : [];
  const normalizedTarget = Number(target);
  const normalizedAnswer = Number(answer);

  if (normalizedExamples.length < 2) {
    return { valid: false, reason: 'under-specified', rules: [], predictions: [] };
  }
  if (normalizedExamples.some((pair) => pair.length !== 2 || pair.some((value) => !Number.isFinite(value))) || !Number.isFinite(normalizedTarget) || !Number.isFinite(normalizedAnswer)) {
    return { valid: false, reason: 'invalid-numbers', rules: [], predictions: [] };
  }
  if (new Set(normalizedExamples.map(([input]) => input)).size < 2) {
    return { valid: false, reason: 'non-independent-examples', rules: [], predictions: [] };
  }

  const rules = getSupportedNumberAnalogyRules(normalizedExamples);
  const predictions = [...new Set(rules
    .map((rule) => normalizeNumber(rule.apply(normalizedTarget)))
    .filter((prediction) => prediction !== null && Number.isInteger(prediction) && prediction >= 0 && Math.abs(prediction) <= MAX_ABS_PREDICTION))];

  if (predictions.length === 0) {
    return { valid: false, reason: 'unsupported-rule', rules: rules.map((rule) => rule.name), predictions };
  }
  if (predictions.length > 1) {
    return { valid: false, reason: 'ambiguous', rules: rules.map((rule) => rule.name), predictions };
  }
  if (!nearlyEqual(predictions[0], normalizedAnswer)) {
    return { valid: false, reason: 'answer-mismatch', rules: rules.map((rule) => rule.name), predictions };
  }

  return { valid: true, reason: 'valid', rules: rules.map((rule) => rule.name), predictions };
}

export function extractNumberAnalogyScenario(question) {
  if (!question || question.subtest !== 'Number Analogies' || typeof question.question !== 'string' || /<img\b/i.test(question.question)) {
    return null;
  }

  const pairPattern = /<span\s+class=["']number-pair["'][^>]*>([\s\S]*?)<\/span>/gi;
  const boldPattern = /<b[^>]*>([\s\S]*?)<\/b>/gi;
  const examples = [];
  let target = null;
  let pairMatch;

  while ((pairMatch = pairPattern.exec(question.question))) {
    const values = [];
    let boldMatch;
    boldPattern.lastIndex = 0;
    while ((boldMatch = boldPattern.exec(pairMatch[1]))) {
      values.push(boldMatch[1].replace(/<[^>]+>/g, '').trim());
    }
    if (values.length !== 2) {
      return null;
    }
    const input = parseNumericText(values[0]);
    if (input === null) {
      return null;
    }
    if (values[1] === '?') {
      target = input;
      continue;
    }
    const output = parseNumericText(values[1]);
    if (output === null) {
      return null;
    }
    examples.push([input, output]);
  }

  const correctOption = (question.options ?? []).find((option) => (
    String(option.label) === String(question.correctAnswer)
    || String(option.value ?? option.text) === String(question.correctAnswer)
  ));
  const answer = parseNumericText(correctOption?.value ?? correctOption?.text ?? question.correctAnswer);
  if (target === null || answer === null) {
    return null;
  }
  return { examples, target, answer };
}

export function validateNumberAnalogyQuestion(question) {
  const scenario = extractNumberAnalogyScenario(question);
  if (!scenario) {
    return { valid: false, reason: 'unparseable', rules: [], predictions: [] };
  }

  const optionValues = (question.options ?? []).map((option) => parseNumericText(option.value ?? option.text));
  if (optionValues.length !== 5 || optionValues.some((value) => value === null) || new Set(optionValues).size !== optionValues.length) {
    return { valid: false, reason: 'invalid-options', rules: [], predictions: [] };
  }
  if (!optionValues.includes(scenario.answer)) {
    return { valid: false, reason: 'missing-correct-option', rules: [], predictions: [] };
  }

  return { ...validateNumberAnalogyScenario(scenario), scenario };
}

export function createNumberAnalogySignature(question) {
  const scenario = extractNumberAnalogyScenario(question);
  if (!scenario) {
    return '';
  }
  const examples = [...scenario.examples]
    .sort(([firstInput, firstOutput], [secondInput, secondOutput]) => firstInput - secondInput || firstOutput - secondOutput)
    .map(([input, output]) => `${input}>${output}`)
    .join('|');
  return `${examples}|${scenario.target}>?`;
}

export function auditNumberAnalogies(questions) {
  const seen = new Map();
  const accepted = [];
  const rejected = [];

  for (const question of questions) {
    if (question?.subtest !== 'Number Analogies') {
      accepted.push(question);
      continue;
    }
    const validation = validateNumberAnalogyQuestion(question);
    if (!validation.valid) {
      rejected.push({ question, ...validation });
      continue;
    }
    const signature = createNumberAnalogySignature(question);
    if (signature && seen.has(signature)) {
      rejected.push({ question, valid: false, reason: 'duplicate', duplicateOf: seen.get(signature), rules: validation.rules, predictions: validation.predictions, scenario: validation.scenario });
      continue;
    }
    if (signature) {
      seen.set(signature, question.id);
    }
    accepted.push(question);
  }

  return { accepted, rejected };
}

export function filterValidNumberAnalogies(questions) {
  return auditNumberAnalogies(questions).accepted;
}
