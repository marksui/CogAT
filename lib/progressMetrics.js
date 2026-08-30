function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function getAccuracy(attempts) {
  return attempts.length
    ? Math.round((attempts.filter((attempt) => attempt.correct).length / attempts.length) * 100)
    : null;
}

function makeTrendPoints(attempts) {
  const recent = attempts.slice(-18);
  const points = [];
  for (let index = 0; index < recent.length; index += 3) {
    points.push(getAccuracy(recent.slice(index, index + 3)) ?? 0);
  }
  return points;
}

export function formatResponseSpeed(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—';
  const rounded = Math.round(seconds);
  if (rounded < 60) return `${rounded}s`;
  const minutes = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

export function calculateSubtestPerformance(records = [], performanceLog = []) {
  const attempted = records.reduce((sum, record) => sum + Number(record?.attempts ?? 0), 0);
  const correct = records.reduce((sum, record) => sum + Number(record?.correct ?? 0), 0);
  const accuracy = attempted ? Math.round((correct / attempted) * 100) : null;
  const attempts = [...performanceLog]
    .filter((attempt) => attempt && typeof attempt.correct === 'boolean')
    .sort((first, second) => String(first.answeredAt ?? '').localeCompare(String(second.answeredAt ?? '')));
  const timedAttempts = attempts
    .filter((attempt) => Number.isFinite(Number(attempt.responseSeconds)) && Number(attempt.responseSeconds) > 0)
    .slice(-20);
  const averageSeconds = average(timedAttempts.map((attempt) => Number(attempt.responseSeconds)));

  const recent = attempts.slice(-8);
  const previous = attempts.slice(-16, -8);
  let trend = { key: 'building', label: 'Building baseline', detail: 'Answer 8+ questions' };

  if (recent.length >= 4 && previous.length >= 4) {
    const recentAccuracy = getAccuracy(recent);
    const previousAccuracy = getAccuracy(previous);
    const accuracyDelta = recentAccuracy - previousAccuracy;
    const recentSpeed = average(recent.map((attempt) => Number(attempt.responseSeconds)).filter((value) => Number.isFinite(value) && value > 0));
    const previousSpeed = average(previous.map((attempt) => Number(attempt.responseSeconds)).filter((value) => Number.isFinite(value) && value > 0));
    const speedDelta = recentSpeed && previousSpeed ? ((previousSpeed - recentSpeed) / previousSpeed) * 100 : 0;
    const improving = accuracyDelta >= 5 || (accuracyDelta >= -2 && speedDelta >= 10);
    const declining = accuracyDelta <= -5 || (accuracyDelta <= 2 && speedDelta <= -10);
    const key = improving ? 'up' : declining ? 'down' : 'steady';
    const label = improving ? 'Improving' : declining ? 'Needs review' : 'Steady';
    const details = [];
    if (accuracyDelta) details.push(`${accuracyDelta > 0 ? '+' : ''}${accuracyDelta} pts`);
    if (Math.abs(speedDelta) >= 5) details.push(speedDelta > 0 ? `${Math.round(speedDelta)}% faster` : `${Math.abs(Math.round(speedDelta))}% slower`);
    trend = { key, label, detail: details.join(' · ') || 'Holding steady' };
  }

  return {
    attempted,
    correct,
    accuracy,
    averageSeconds: averageSeconds === null ? null : Number(averageSeconds.toFixed(1)),
    speedLabel: formatResponseSpeed(averageSeconds),
    trend,
    trendPoints: makeTrendPoints(attempts),
    loggedAttempts: attempts.length,
    timedAttempts: timedAttempts.length,
  };
}

export function calculateMasteryProgress(attempted, accuracy) {
  const safeAccuracy = Number.isFinite(accuracy) ? accuracy : 0;
  const confidence = Math.min(1, attempted / 12);
  const mastered = attempted >= 12 && safeAccuracy >= 85;
  const good = !mastered && attempted >= 6 && safeAccuracy >= 70;
  const progress = mastered
    ? 100
    : good
      ? Math.min(94, 62 + Math.round(((safeAccuracy - 70) / 15) * 28))
      : Math.min(58, Math.round((confidence * 44) + (safeAccuracy * 0.14)));
  return {
    mastered,
    good,
    progress: clamp(progress, 0, 100),
    status: mastered ? 'Mastered' : good ? 'Good' : 'Developing',
  };
}
