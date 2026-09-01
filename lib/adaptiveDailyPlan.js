export const DAILY_MIX_TARGETS = Object.freeze({
  review: 10,
  weak: 8,
  new: 8,
  challenge: 4,
});

const DAY_MS = 86400000;

function timestamp(value) {
  const parsed = Date.parse(value ?? '');
  return Number.isFinite(parsed) ? parsed : 0;
}

function addDays(value, days) {
  return new Date(timestamp(value) + (days * DAY_MS)).toISOString();
}

function stableHash(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function stableOrder(items, seed) {
  return [...items].sort((first, second) => {
    const firstHash = stableHash(`${seed}|${first.id}`);
    const secondHash = stableHash(`${seed}|${second.id}`);
    return firstHash - secondHash || String(first.id).localeCompare(String(second.id), undefined, { numeric: true });
  });
}

function accuracy(stats = {}) {
  const attempts = Math.max(0, Number(stats.attempts ?? 0));
  return attempts ? Number(stats.correct ?? 0) / attempts : 0;
}

export function getReviewIntervalDays(stats = {}) {
  if (stats.lastResult === 'wrong') return 1;
  const streak = Math.max(0, Number(stats.correctStreak ?? 0));
  const attempts = Math.max(1, Number(stats.attempts ?? 1));
  const rate = accuracy(stats);
  if (rate < 0.6) return 1;
  if (rate < 0.8) return Math.min(4, Math.max(2, streak * 2));
  if (streak >= 5 || attempts >= 8) return 30;
  if (streak === 4 || attempts >= 6) return 14;
  if (streak === 3 || attempts >= 4) return 7;
  if (streak === 2 || attempts >= 3) return 4;
  return 2;
}

export function getNextReviewAt(stats, answeredAt = new Date().toISOString()) {
  return addDays(answeredAt, getReviewIntervalDays(stats));
}

export function isDueForReview(stats, now = Date.now()) {
  if (!stats || !Number(stats.attempts ?? 0)) return false;
  const dueAt = timestamp(stats.nextReviewAt)
    || (timestamp(stats.updatedAt) + (getReviewIntervalDays(stats) * DAY_MS));
  return dueAt <= Number(now);
}

function questionWeakness(question, stats, weakSubtests) {
  if (!stats) return weakSubtests.has(question.subtest) ? 1 : 0;
  const missed = stats.lastResult === 'wrong' ? 4 : 0;
  const lowAccuracy = Number(stats.attempts ?? 0) >= 2 && accuracy(stats) < 0.7 ? 3 : 0;
  return missed + lowAccuracy + (weakSubtests.has(question.subtest) ? 2 : 0);
}

function reviewPriority(question, stats, now) {
  const dueAt = timestamp(stats.nextReviewAt)
    || (timestamp(stats.updatedAt) + (getReviewIntervalDays(stats) * DAY_MS));
  const overdueDays = Math.max(0, (Number(now) - dueAt) / DAY_MS);
  return (stats.lastResult === 'wrong' ? 1000 : 0)
    + Math.min(365, overdueDays)
    + ((1 - accuracy(stats)) * 100)
    + Math.min(30, Number(stats.attempts ?? 0));
}

export function buildAdaptiveDailyPlan({
  questions,
  stats = {},
  weakSubtests = [],
  recentQuestionIds = [],
  goal = 30,
  dateKey = new Date().toISOString().slice(0, 10),
  now = Date.now(),
  getDifficulty = (question) => question.difficulty ?? 'medium',
} = {}) {
  const uniqueQuestions = [...new Map((questions ?? []).map((question) => [String(question.id), question])).values()];
  const targetTotal = Math.min(Math.max(0, Number(goal) || 0), uniqueQuestions.length);
  const weakSet = new Set(weakSubtests);
  const recentSet = new Set(recentQuestionIds.map(String));
  const selected = [];
  const selectedIds = new Set();
  const composition = { review: 0, weak: 0, new: 0, challenge: 0 };

  const add = (pool, count, category) => {
    let added = 0;
    for (const question of pool) {
      const id = String(question.id);
      if (selected.length >= targetTotal || added >= count || selectedIds.has(id)) continue;
      selectedIds.add(id);
      selected.push(question);
      composition[category] += 1;
      added += 1;
    }
    return added;
  };

  const deterministic = (pool, category) => stableOrder(pool, `${dateKey}|${category}`);
  const seen = uniqueQuestions.filter((question) => stats[String(question.id)]);
  const due = deterministic(seen.filter((question) => isDueForReview(stats[String(question.id)], now)), 'review')
    .sort((first, second) => reviewPriority(second, stats[String(second.id)], now) - reviewPriority(first, stats[String(first.id)], now));
  add(due, DAILY_MIX_TARGETS.review, 'review');

  const weak = deterministic(uniqueQuestions.filter((question) => questionWeakness(question, stats[String(question.id)], weakSet) > 0), 'weak')
    .sort((first, second) => questionWeakness(second, stats[String(second.id)], weakSet) - questionWeakness(first, stats[String(first.id)], weakSet));
  add(weak, DAILY_MIX_TARGETS.weak, 'weak');

  const fresh = deterministic(uniqueQuestions.filter((question) => !stats[String(question.id)] && !recentSet.has(String(question.id))), 'new');
  add(fresh, DAILY_MIX_TARGETS.new, 'new');

  const challenge = deterministic(uniqueQuestions.filter((question) => ['very-hard', 'hard', 'medium'].includes(getDifficulty(question))), 'challenge')
    .sort((first, second) => {
      const rank = { 'very-hard': 3, hard: 2, medium: 1 };
      const difficultyDelta = rank[getDifficulty(second)] - rank[getDifficulty(first)];
      const recentDelta = Number(recentSet.has(String(first.id))) - Number(recentSet.has(String(second.id)));
      return difficultyDelta || recentDelta;
    });
  add(challenge, DAILY_MIX_TARGETS.challenge, 'challenge');

  const fallbackPools = [
    { pool: fresh, category: 'new' },
    { pool: due, category: 'review' },
    { pool: weak, category: 'weak' },
    { pool: challenge, category: 'challenge' },
    { pool: deterministic(uniqueQuestions.filter((question) => !recentSet.has(String(question.id))), 'fallback'), category: 'new' },
    { pool: deterministic(uniqueQuestions, 'fallback-all'), category: 'new' },
  ];
  for (const fallback of fallbackPools) {
    add(fallback.pool, targetTotal - selected.length, fallback.category);
  }

  return {
    questions: selected,
    questionIds: selected.map((question) => String(question.id)),
    composition,
    targets: { ...DAILY_MIX_TARGETS },
    dateKey,
  };
}
