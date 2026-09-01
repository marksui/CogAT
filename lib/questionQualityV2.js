import { decodeQuestionText, getQuestionCorrectOption } from './questionBankValidator.js';

function normalizeText(value = '') {
  return decodeQuestionText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasVisual(value = '') {
  return /<(?:svg|img)\b/i.test(String(value));
}

function createFinding(question, sourceFile, code, message, severity = 'error') {
  return {
    id: question?.id ?? null,
    subtest: question?.subtest ?? 'Unknown',
    sourceFile: sourceFile ?? null,
    code,
    message,
    severity,
  };
}

export function getQuestionReviewLevel(question) {
  if (question?.paperFolding || ['Number Analogies', 'Number Series', 'Number Puzzles'].includes(question?.subtest)) {
    return 'semantic';
  }
  if (hasVisual(question?.question) && /<img\b/i.test(String(question?.question))) {
    return 'answer-key-image';
  }
  return 'structural';
}

export function auditQuestionQualityV2(entries) {
  const errors = [];
  const warnings = [];
  const reviewCoverage = { semantic: 0, structural: 0, 'answer-key-image': 0 };
  const promptGroups = new Map();

  for (const entry of entries) {
    const wrapped = entry && typeof entry.question === 'object' && entry.question !== null;
    const question = wrapped ? entry.question : entry;
    const sourceFile = wrapped ? entry.sourceFile : null;
    const level = getQuestionReviewLevel(question);
    reviewCoverage[level] += 1;

    const promptVisual = hasVisual(question?.question);
    const optionVisuals = (question?.options ?? []).map((option) => hasVisual(option?.text));
    const isImageAnswerKey = level === 'answer-key-image';

    if (question?.battery === 'Nonverbal Battery' && !promptVisual) {
      errors.push(createFinding(question, sourceFile, 'nonverbal-missing-visual', 'Nonverbal questions must include a visible diagram or image.'));
    }
    if (question?.battery === 'Nonverbal Battery' && !isImageAnswerKey && optionVisuals.some(Boolean) && optionVisuals.some((value) => !value)) {
      errors.push(createFinding(question, sourceFile, 'mixed-visual-options', 'Nonverbal answer choices cannot mix diagrams with plain-text placeholders.'));
    }
    if (!isImageAnswerKey && (question?.options ?? []).some((option) => /^choice\s+[a-e]$/i.test(normalizeText(option?.text)))) {
      errors.push(createFinding(question, sourceFile, 'placeholder-option', 'A non-image question contains placeholder answer text.'));
    }

    const correctOption = getQuestionCorrectOption(question)[0];
    if (correctOption && optionVisuals.some(Boolean) && !hasVisual(correctOption.text)) {
      errors.push(createFinding(question, sourceFile, 'correct-option-format-outlier', 'The correct answer is the only nonvisual choice in a visual option set.'));
    }

    if (question?.subtest === 'Paper Folding' && !question.paperFolding && !isImageAnswerKey) {
      warnings.push(createFinding(question, sourceFile, 'paper-folding-manual-review', 'Legacy Paper Folding geometry is not machine-verifiable yet.', 'warning'));
    }
    if (!String(question?.whyOtherChoices ?? '').trim()) {
      warnings.push(createFinding(question, sourceFile, 'missing-choice-rationale', 'No dedicated explanation of why the other choices are wrong.', 'warning'));
    }

    if (!promptVisual) {
      const promptKey = [question?.battery, question?.subtest, normalizeText(question?.question), normalizeText(question?.questionNote)].join('|');
      if (promptKey.replace(/\|/g, '').length > 20) {
        const group = promptGroups.get(promptKey) ?? [];
        group.push({ id: question?.id, sourceFile });
        promptGroups.set(promptKey, group);
      }
    }
  }

  const nearDuplicateGroups = [...promptGroups.values()].filter((group) => group.length > 1);
  for (const group of nearDuplicateGroups) {
    warnings.push({
      id: group[0].id,
      subtest: 'Multiple',
      sourceFile: group[0].sourceFile,
      code: 'repeated-prompt',
      message: `The same plain-text prompt and note appear in ${group.length} questions.`,
      severity: 'warning',
      matches: group,
    });
  }

  return {
    total: entries.length,
    errors,
    warnings,
    reviewCoverage,
    nearDuplicateGroups,
    choiceRationaleCoverage: entries.length
      ? Math.round(((entries.length - warnings.filter((item) => item.code === 'missing-choice-rationale').length) / entries.length) * 100)
      : 100,
  };
}
