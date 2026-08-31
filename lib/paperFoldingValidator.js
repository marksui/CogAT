const DEFAULT_PAPER_SIZE = 60;
const POINT_TOLERANCE = 0.01;

function roundPoint(value) {
  return Number(Number(value).toFixed(3));
}

export function normalizePaperPoints(points = []) {
  const unique = new Map();
  for (const point of points) {
    if (!Array.isArray(point) || point.length !== 2 || point.some((value) => !Number.isFinite(Number(value)))) continue;
    const normalized = point.map((value) => roundPoint(value));
    unique.set(`${normalized[0]},${normalized[1]}`, normalized);
  }
  return [...unique.values()].sort(([ax, ay], [bx, by]) => (ax - bx) || (ay - by));
}

export function serializePaperPoints(points = []) {
  return normalizePaperPoints(points).map(([x, y]) => `${x},${y}`).join(';');
}

export function reflectPaperPoint([x, y], fold, paperSize = DEFAULT_PAPER_SIZE) {
  switch (fold?.axis) {
    case 'vertical':
      return [(2 * Number(fold.value ?? paperSize / 2)) - x, y];
    case 'horizontal':
      return [x, (2 * Number(fold.value ?? paperSize / 2)) - y];
    case 'diagonal-main':
      return [y, x];
    case 'diagonal-anti':
      return [paperSize - y, paperSize - x];
    default:
      throw new Error(`Unsupported paper-fold axis: ${fold?.axis ?? 'missing'}`);
  }
}

export function unfoldPaperPoints(punch, folds = [], paperSize = DEFAULT_PAPER_SIZE) {
  let points = normalizePaperPoints([punch]);
  for (const fold of [...folds].reverse()) {
    points = normalizePaperPoints([
      ...points,
      ...points.map((point) => reflectPaperPoint(point, fold, paperSize)),
    ]);
  }
  return points;
}

export function extractPaperPatternPoints(markup = '') {
  const match = String(markup).match(/data-hole-points=["']([^"']*)["']/i);
  if (!match) return null;
  if (!match[1].trim()) return [];
  return normalizePaperPoints(match[1].split(';').map((pair) => pair.split(',').map(Number)));
}

function samePoints(first, second) {
  const a = normalizePaperPoints(first);
  const b = normalizePaperPoints(second);
  return a.length === b.length && a.every(([x, y], index) => (
    Math.abs(x - b[index][0]) <= POINT_TOLERANCE && Math.abs(y - b[index][1]) <= POINT_TOLERANCE
  ));
}

function issue(question, code, message, details = {}) {
  return { id: question?.id ?? null, subtest: question?.subtest ?? 'Unknown', code, message, ...details };
}

export function validatePaperFoldingQuestion(question) {
  const issues = [];
  const prompt = String(question?.question ?? '');
  const options = Array.isArray(question?.options) ? question.options : [];
  const hasPromptVisual = /<(?:svg|img)\b/i.test(prompt);
  if (!hasPromptVisual) {
    issues.push(issue(question, 'paper-folding-missing-visual', 'Paper Folding question needs an SVG or image prompt.'));
  }

  const metadata = question?.paperFolding;
  if (!metadata) return issues;

  const paperSize = Number(metadata.paperSize ?? DEFAULT_PAPER_SIZE);
  const folds = Array.isArray(metadata.folds) ? metadata.folds : [];
  const punch = metadata.punch;
  if (!Number.isFinite(paperSize) || paperSize <= 0 || !Array.isArray(punch) || punch.length !== 2 || folds.length === 0) {
    issues.push(issue(question, 'paper-folding-invalid-model', 'Paper Folding metadata needs a paper size, punch point, and at least one fold.'));
    return issues;
  }

  let expected;
  try {
    expected = unfoldPaperPoints(punch, folds, paperSize);
  } catch (error) {
    issues.push(issue(question, 'paper-folding-invalid-model', error.message));
    return issues;
  }

  if (metadata.expectedPoints && !samePoints(expected, metadata.expectedPoints)) {
    issues.push(issue(question, 'paper-folding-model-mismatch', 'Stored unfolded points do not match the fold sequence.', { expected }));
  }

  const optionPatterns = options.map((option) => extractPaperPatternPoints(option?.text));
  if (optionPatterns.some((points) => points === null)) {
    issues.push(issue(question, 'paper-folding-unreadable-option', 'Every generated Paper Folding option must expose its hole positions.'));
    return issues;
  }

  const correctIndex = options.findIndex((option) => String(option?.value ?? option?.label ?? '') === String(question?.correctAnswer ?? ''));
  if (correctIndex < 0 || !samePoints(optionPatterns[correctIndex], expected)) {
    issues.push(issue(question, 'paper-folding-answer-mismatch', 'The marked answer does not match the holes produced by unfolding the paper.', { expected }));
  }
  const matchingOptions = optionPatterns.reduce((count, points) => count + (samePoints(points, expected) ? 1 : 0), 0);
  if (matchingOptions !== 1) {
    issues.push(issue(question, 'paper-folding-ambiguous-options', `Exactly one option must match the unfolded paper; found ${matchingOptions}.`, { expected }));
  }
  return issues;
}
