import { verbalQuestions } from './data/verbalQuestions.js';
import { quantitativeQuestions } from './data/quantitativeQuestions.js';
import { nonverbalQuestions } from './data/nonverbalQuestions.js';
import { verbalExtraQuestions } from './data/verbalExtraQuestions.js';
import { verbalWorkbookQuestions } from './data/verbalWorkbookQuestions.js';
import { quantitativeExtraQuestions } from './data/quantitativeExtraQuestions.js';
import { nonverbalExtraQuestions } from './data/nonverbalExtraQuestions.js';
import { mockExamQuestions } from './data/mockExamQuestions.js';
import { level10OriginalQuestions } from './data/level10OriginalQuestions.js';
import { g4WorkbookQuestions } from './data/g4WorkbookQuestions.js';

const QUESTION_LIMIT = 30;
const DAILY_GOAL_OPTIONS = [5, 10, 15];
const DEFAULT_DAILY_GOAL = 10;
const STORAGE_KEY = 'grade4-cogat-history-v2';
const LEGACY_STORAGE_KEY = 'grade4-cogat-history-v1';

const questionSets = {
  verbal: [...verbalQuestions, ...verbalExtraQuestions, ...verbalWorkbookQuestions, ...level10OriginalQuestions.filter((question) => question.battery === 'Verbal Battery'), ...g4WorkbookQuestions.filter((question) => question.battery === 'Verbal Battery')],
  quantitative: [...quantitativeQuestions, ...quantitativeExtraQuestions, ...level10OriginalQuestions.filter((question) => question.battery === 'Quantitative Battery'), ...g4WorkbookQuestions.filter((question) => question.battery === 'Quantitative Battery')],
  nonverbal: [...nonverbalQuestions, ...nonverbalExtraQuestions, ...mockExamQuestions, ...level10OriginalQuestions.filter((question) => question.battery === 'Nonverbal Battery'), ...g4WorkbookQuestions.filter((question) => question.battery === 'Nonverbal Battery')],
};

const batteries = [
  { key: 'all', label: 'Mixed', kidLabel: 'Mixed', questions: [...questionSets.verbal, ...questionSets.quantitative, ...questionSets.nonverbal] },
  { key: 'verbal', label: 'Verbal', kidLabel: 'Verbal', questions: questionSets.verbal },
  { key: 'quantitative', label: 'Quantitative', kidLabel: 'Quantitative', questions: questionSets.quantitative },
  { key: 'nonverbal', label: 'Nonverbal', kidLabel: 'Nonverbal', questions: questionSets.nonverbal },
];

const mockParts = [
  { key: 'verbal', battery: 'Verbal Battery', subtest: 'Verbal Analogies', label: 'Verbal Analogies', minutes: 10, questionCount: 24 },
  { key: 'verbal', battery: 'Verbal Battery', subtest: 'Sentence Completion', label: 'Sentence Completion', minutes: 10, questionCount: 20 },
  { key: 'verbal', battery: 'Verbal Battery', subtest: 'Verbal Classification', label: 'Verbal Classification', minutes: 10, questionCount: 20 },
  { key: 'quantitative', battery: 'Quantitative Battery', subtest: 'Number Analogies', label: 'Number Analogies', minutes: 10, questionCount: 18 },
  { key: 'quantitative', battery: 'Quantitative Battery', subtest: 'Number Puzzles', label: 'Number Puzzles', minutes: 10, questionCount: 16 },
  { key: 'quantitative', battery: 'Quantitative Battery', subtest: 'Number Series', label: 'Number Series', minutes: 10, questionCount: 18 },
  { key: 'nonverbal', battery: 'Nonverbal Battery', subtest: 'Figure Matrices', label: 'Figure Matrices', minutes: 10, questionCount: 22 },
  { key: 'nonverbal', battery: 'Nonverbal Battery', subtest: 'Paper Folding', label: 'Paper Folding', minutes: 10, questionCount: 16 },
  { key: 'nonverbal', battery: 'Nonverbal Battery', subtest: 'Figure Classification', label: 'Figure Classification', minutes: 10, questionCount: 22 },
];

const batteryMap = new Map(batteries.map((battery) => [battery.key, battery]));
const allQuestions = batteries[0].questions;
const questionById = new Map(allQuestions.map((question) => [String(question.id), question]));

const state = {
  view: 'setup',
  examType: 'practice',
  battery: 'all',
  subtest: 'all',
  mode: 'all',
  questions: [],
  answers: [],
  currentIndex: 0,
  checked: false,
  history: loadHistory(),
  dailyGoal: 10,
  sessionKind: 'custom',
  message: '',
  mockPartIndex: 0,
  mockResults: [],
  mockSecondsRemaining: 0,
  bankBattery: 'all',
  bankSubtest: 'all',
};

const app = document.querySelector('#app');
let mockTimerHandle = null;
state.dailyGoal = state.history.dailyGoal ?? DEFAULT_DAILY_GOAL;

function render() {
  if (state.view === 'practice') {
    renderPractice();
    return;
  }
  if (state.view === 'results') {
    renderResults();
    return;
  }
  if (state.view === 'mock-practice') {
    renderMockPractice();
    return;
  }
  if (state.view === 'bank') {
    renderQuestionBank();
    return;
  }
  renderSetup();
}

function renderShell(content) {
  app.innerHTML = `
    <main class="app-shell">
      <header class="topbar">
        <div class="brand-row">
          <button class="wordmark" type="button" data-home>CogAT 4</button>
          <details class="about-menu">
            <summary aria-label="About this site">?</summary>
            <div class="about-card">
              <b>About CogAT 4</b>
              <span>Updated July 19, 2026.</span>
              <span>Built for Grade 4 CogAT-style practice.</span>
              <span>Includes verbal, quantitative, nonverbal, question bank, and timed mock exam.</span>
              <span>Progress stays in your browser and can be imported/exported as JSON.</span>
              <span>Independent practice site. Not an official CogAT product.</span>
              <a href="https://github.com/marksui/CogAT" target="_blank" rel="noopener noreferrer">marksui/CogAT</a>
            </div>
          </details>
          <button class="bank-link" type="button" data-bank>Question bank</button>
        </div>
        <span class="question-count">${allQuestions.length} questions</span>
      </header>
      ${content}
    </main>
  `;

  document.querySelector('[data-home]').addEventListener('click', () => {
    goHome();
  });

  document.querySelector('[data-bank]').addEventListener('click', () => {
    persistActiveSession();
    stopMockTimer();
    state.view = 'bank';
    state.examType = 'practice';
    state.message = '';
    render();
  });
}

function renderSetup() {
  const subtests = getSubtests();
  const pool = getPracticePool();
  const daily = getDailyProgress();
  const dailyGoal = state.dailyGoal;
  const dailyPercent = Math.min(100, Math.round((daily.answered / dailyGoal) * 100));
  const summary = getProgressSummary();
  const hasActiveDaily = hasResumableDailySession();
  const dailyComplete = daily.completed;

  renderShell(`
    <section class="dashboard-intro">
      <div class="hero-copy">
        <span class="eyebrow">Grade 4 · CogAT practice</span>
        <h1>Small steps.<br><span>Big progress.</span></h1>
        <p class="muted">A calm place to build confidence, one question at a time.</p>
      </div>
      <div class="progress-stats" aria-label="Your progress">
        <div><b>${summary.streak}</b><span>day streak</span></div>
        <div><b>${summary.totalAnswered}</b><span>answered</span></div>
        <div><b>${summary.lastAccuracy === null ? '—' : `${summary.lastAccuracy}%`}</b><span>last score</span></div>
      </div>
    </section>

    <section class="panel daily-card ${dailyComplete ? 'is-complete' : ''}">
      <div class="daily-copy">
        <span class="eyebrow">Today’s practice</span>
        <h2>${dailyComplete ? 'Goal complete!' : hasActiveDaily ? 'You’re on your way.' : 'Keep your streak going.'}</h2>
        <p>${dailyComplete ? 'Nice work. A little practice every day adds up.' : `Answer ${dailyGoal} questions today to build your CogAT skills.`}</p>
        <button class="primary daily-cta" type="button" data-start-daily>${dailyComplete ? 'Practice more' : hasActiveDaily ? 'Continue today’s practice' : 'Start today’s practice'}</button>
      </div>
      <div class="daily-progress-wrap">
        <div class="daily-progress" style="--progress:${dailyPercent}%" aria-label="${daily.answered} of ${dailyGoal} questions complete">
          <div><strong>${daily.answered}</strong><span>of ${dailyGoal}</span></div>
        </div>
        <div class="goal-options" aria-label="Daily goal">
          ${DAILY_GOAL_OPTIONS.map((goal) => `<button class="goal-option ${goal === dailyGoal ? 'selected' : ''}" type="button" data-daily-goal="${goal}">${goal}<span>q</span></button>`).join('')}
        </div>
      </div>
    </section>

    <section class="dashboard-grid">
      <div class="panel progress-panel">
        <div class="section-heading"><div><span class="eyebrow">Your progress</span><h2>Keep learning</h2></div><span class="section-icon" aria-hidden="true">↗</span></div>
        <div class="progress-list">
          ${batteries.filter((battery) => battery.key !== 'all').map((battery) => {
            const item = getBatteryProgress(battery.key);
            return `<div class="progress-row"><div><b>${battery.label}</b><span>${item.attempted ? `${formatQuestionCount(item.attempted)} practiced` : 'Ready when you are'}</span></div><strong>${item.accuracy === null ? '—' : `${item.accuracy}%`}</strong></div>`;
          }).join('')}
        </div>
      </div>

      <div class="panel quick-panel">
        <div class="section-heading"><div><span class="eyebrow">Quick start</span><h2>Choose a focus</h2></div><span class="section-icon" aria-hidden="true">✦</span></div>
        <div class="quick-actions">
          <button class="quick-action" type="button" data-quick-mode="missed"><span class="quick-action-icon" aria-hidden="true">↺</span><span><b>Review missed</b><small>${formatQuestionCount(summary.missed)} to revisit</small></span><span class="arrow" aria-hidden="true">→</span></button>
          <button class="quick-action" type="button" data-quick-mode="new"><span class="quick-action-icon" aria-hidden="true">＋</span><span><b>Try new questions</b><small>Explore the full question bank</small></span><span class="arrow" aria-hidden="true">→</span></button>
          <button class="quick-action" type="button" data-quick-mock><span class="quick-action-icon" aria-hidden="true">◷</span><span><b>Take a mock exam</b><small>Practice with a timer</small></span><span class="arrow" aria-hidden="true">→</span></button>
        </div>
      </div>
    </section>

    <section class="panel custom-practice">
      <div class="section-heading"><div><span class="eyebrow">More ways to practice</span><h2>Make your own set</h2></div></div>
      <form class="controls" id="setup-form">
        <div class="exam-switch" aria-label="Choose exam type">
          <button class="${state.examType === 'practice' ? 'selected' : ''}" type="button" data-exam-type="practice">Practice set</button>
          <button class="${state.examType === 'mock' ? 'selected' : ''}" type="button" data-exam-type="mock">Mock exam</button>
        </div>

        ${state.examType === 'mock' ? `
          <div class="mock-preview">
            <div class="mock-parts">
              ${mockParts.map((part, index) => `<div class="mock-part"><span>${index + 1}</span><div><b>${part.label}</b><small>${part.minutes} minutes · ${part.questionCount} questions</small></div></div>`).join('')}
            </div>
          </div>
        ` : `
          <div><div class="step-label">Battery</div><div class="battery-grid" aria-label="Battery">
            ${batteries.map((battery) => `<button class="battery-card ${battery.key === state.battery ? 'selected' : ''}" type="button" data-battery="${battery.key}"><b>${battery.kidLabel}</b><span>${battery.questions.length} questions</span></button>`).join('')}
          </div></div>
          <label><span>Subtest</span><select id="subtest"><option value="all">All subtests</option>${subtests.map((subtest) => `<option value="${escapeHtml(subtest)}" ${subtest === state.subtest ? 'selected' : ''}>${subtest}</option>`).join('')}</select></label>
          <label><span>Mode</span><select id="mode"><option value="all" ${state.mode === 'all' ? 'selected' : ''}>All questions</option><option value="new" ${state.mode === 'new' ? 'selected' : ''}>New only</option><option value="missed" ${state.mode === 'missed' ? 'selected' : ''}>Missed review</option><option value="weak" ${state.mode === 'weak' ? 'selected' : ''}>Weak areas</option><option value="very-hard" ${state.mode === 'very-hard' ? 'selected' : ''}>Very hard only</option><option value="pdf" ${state.mode === 'pdf' ? 'selected' : ''}>PDF workbook only</option><option value="correct" ${state.mode === 'correct' ? 'selected' : ''}>Correct review</option></select></label>
        `}
        <button class="primary" type="submit" ${state.examType === 'practice' && pool.length === 0 ? 'disabled' : ''}>${state.examType === 'mock' ? 'Start mock exam' : `Start ${Math.min(pool.length, QUESTION_LIMIT)}`}</button>
        ${state.message ? `<p class="message">${escapeHtml(state.message)}</p>` : ''}
      </form>
    </section>

    <details class="data-box dashboard-data"><summary>Progress backup</summary><div class="data-actions"><button class="ghost" type="button" id="export-history">Export JSON</button><button class="ghost" type="button" id="import-history">Import JSON</button><button class="ghost" type="button" id="clear-history">Clear progress</button><input id="history-file" type="file" accept="application/json,.json" hidden></div></details>
  `);

  document.querySelectorAll('[data-exam-type]').forEach((button) => {
    button.addEventListener('click', () => {
      state.examType = button.dataset.examType;
      state.message = '';
      render();
    });
  });

  document.querySelectorAll('[data-daily-goal]').forEach((button) => {
    button.addEventListener('click', () => {
      state.dailyGoal = Number(button.dataset.dailyGoal);
      state.history.dailyGoal = state.dailyGoal;
      saveHistory();
      render();
    });
  });

  document.querySelector('[data-start-daily]').addEventListener('click', startDailyPractice);
  document.querySelectorAll('[data-quick-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      state.battery = 'all';
      state.subtest = 'all';
      state.mode = button.dataset.quickMode;
      startPractice({ kind: button.dataset.quickMode === 'missed' ? 'review' : 'custom' });
    });
  });
  document.querySelector('[data-quick-mock]').addEventListener('click', () => {
    state.examType = 'mock';
    startMockExam();
  });

  document.querySelector('#export-history').addEventListener('click', exportHistory);
  document.querySelector('#import-history').addEventListener('click', () => document.querySelector('#history-file').click());
  document.querySelector('#history-file').addEventListener('change', importHistory);
  document.querySelector('#clear-history').addEventListener('click', clearHistory);

  if (state.examType === 'mock') {
    document.querySelector('#setup-form').addEventListener('submit', (event) => {
      event.preventDefault();
      startMockExam();
    });
    return;
  }

  document.querySelectorAll('[data-battery]').forEach((button) => {
    button.addEventListener('click', () => {
      const selectedBattery = batteryMap.get(button.dataset.battery);
      state.battery = selectedBattery.key;
      state.subtest = 'all';
      state.message = '';
      render();
    });
  });

  document.querySelector('#subtest').addEventListener('change', (event) => {
    state.subtest = event.target.value;
    state.message = '';
    render();
  });

  document.querySelector('#mode').addEventListener('change', (event) => {
    state.mode = event.target.value;
    state.message = '';
    render();
  });

  document.querySelector('#setup-form').addEventListener('submit', (event) => {
    event.preventDefault();
    startPractice();
  });
}

function renderPractice() {
  const question = state.questions[state.currentIndex];
  const answer = state.answers[state.currentIndex];
  const total = state.questions.length;
  const isLast = state.currentIndex === total - 1;
  const difficulty = getDifficulty(question);

  renderShell(`
    <section class="panel practice">
      <div class="practice-head">
        <div class="question-kicker">
          <span>${state.sessionKind === 'daily' ? 'Today · ' : ''}${state.currentIndex + 1}/${total}</span>
          <span class="difficulty-badge difficulty-${difficulty}">${formatDifficulty(difficulty)}</span>
        </div>
        <span>${escapeHtml(question.battery.replace(' Battery', ''))} - ${escapeHtml(question.subtest)}</span>
      </div>

      <div class="meter" aria-hidden="true"><span style="width:${((state.currentIndex + 1) / total) * 100}%"></span></div>

      <div class="question-card">
        <div>${question.question}</div>
        ${question.questionNote ? `<p>${question.questionNote}</p>` : ''}
      </div>

      <div class="options">
        ${question.options.map((option) => {
          const optionValue = getOptionValue(option);
          const selected = answer === optionValue;
          const correct = state.checked && optionValue === getCorrectAnswer(question);
          const wrong = state.checked && selected && optionValue !== getCorrectAnswer(question);
          return `
            <button class="option ${selected ? 'selected' : ''} ${correct ? 'correct' : ''} ${wrong ? 'wrong' : ''}" type="button" data-option="${escapeHtml(optionValue)}" aria-pressed="${selected}">
              <b>${option.label}</b>
              <span>${option.text}</span>
            </button>
          `;
        }).join('')}
      </div>

      ${state.checked ? `
        <div class="feedback">
          <b>${answer === getCorrectAnswer(question) ? 'Correct' : `Correct answer: ${getCorrectAnswer(question)}`}</b>
          <span>${question.explanation}</span>
        </div>
      ` : ''}

      <div class="footer-actions">
        <button class="ghost" type="button" id="back">${state.sessionKind === 'daily' ? 'Pause' : 'Back'}</button>
        <button class="primary" type="button" id="check">${state.checked ? (isLast ? 'Results' : 'Next') : 'Check'}</button>
      </div>
    </section>
  `);

  document.querySelectorAll('[data-option]').forEach((button) => {
    button.addEventListener('click', () => {
      if (state.checked) {
        return;
      }
      state.answers[state.currentIndex] = button.dataset.option;
      persistActiveSession();
      render();
    });
  });

  document.querySelector('#check').addEventListener('click', () => {
    if (!state.checked) {
      if (!answer) {
        return;
      }
      state.checked = true;
      recordAnswer(question, answer);
      persistActiveSession();
      render();
      return;
    }

    if (isLast) {
      finishPracticeSession();
      state.view = 'results';
    } else {
      state.currentIndex += 1;
      state.checked = false;
      persistActiveSession();
    }
    render();
  });

  document.querySelector('#back').addEventListener('click', () => {
    goHome();
  });
}

function renderMockPractice() {
  const part = mockParts[state.mockPartIndex];
  const question = state.questions[state.currentIndex];
  const answer = state.answers[state.currentIndex];
  const total = state.questions.length;
  const isLast = state.currentIndex === total - 1;
  const answeredCount = state.answers.filter(Boolean).length;
  const difficulty = getDifficulty(question);

  renderShell(`
    <section class="panel practice mock-practice">
      <div class="mock-topline">
        <div>
          <span class="eyebrow">Mock exam - Part ${state.mockPartIndex + 1} of ${mockParts.length}</span>
          <h2>${part.label}</h2>
        </div>
        <div class="timer" id="timer" aria-live="polite">${formatTime(state.mockSecondsRemaining)}</div>
      </div>

      <div class="practice-head">
        <div class="question-kicker">
          <span>Question ${state.currentIndex + 1} of ${total}</span>
          <span class="difficulty-badge difficulty-${difficulty}">${formatDifficulty(difficulty)}</span>
        </div>
        <span>${answeredCount}/${total} answered</span>
      </div>
      <div class="meter" aria-hidden="true"><span style="width:${((state.currentIndex + 1) / total) * 100}%"></span></div>

      <div class="question-card">
        <div>${question.question}</div>
        ${question.questionNote ? `<p>${question.questionNote}</p>` : ''}
      </div>

      <div class="options">
        ${question.options.map((option) => `
          <button class="option ${answer === getOptionValue(option) ? 'selected' : ''}" type="button" data-option="${escapeHtml(getOptionValue(option))}">
            <b>${option.label}</b>
            <span>${option.text}</span>
          </button>
        `).join('')}
      </div>

      <div class="footer-actions">
        <button class="ghost" type="button" id="exit-mock">Leave exam</button>
        <button class="ghost" type="button" id="mock-back" ${state.currentIndex === 0 ? 'disabled' : ''}>Back</button>
        <button class="primary" type="button" id="mock-next">${isLast ? 'Finish part' : 'Next'}</button>
      </div>
    </section>
  `);

  startMockTimer();

  document.querySelectorAll('[data-option]').forEach((button) => {
    button.addEventListener('click', () => {
      state.answers[state.currentIndex] = button.dataset.option;
      renderMockPractice();
    });
  });

  document.querySelector('#mock-next').addEventListener('click', () => {
    if (isLast) {
      finishMockPart();
      return;
    }
    state.currentIndex += 1;
    renderMockPractice();
  });

  document.querySelector('#mock-back').addEventListener('click', () => {
    if (state.currentIndex === 0) {
      return;
    }
    state.currentIndex -= 1;
    renderMockPractice();
  });

  document.querySelector('#exit-mock').addEventListener('click', () => {
    stopMockTimer();
    state.view = 'setup';
    state.examType = 'mock';
    render();
  });
}

function startMockExam() {
  stopMockTimer();
  state.mockPartIndex = 0;
  state.mockResults = [];
  state.examType = 'mock';
  state.message = '';
  startMockPart();
}

function startMockPart() {
  const part = mockParts[state.mockPartIndex];
  state.questions = getMockPartQuestions(part);
  state.answers = new Array(state.questions.length).fill(null);
  state.currentIndex = 0;
  state.checked = false;
  state.mockSecondsRemaining = part.minutes * 60;
  state.view = 'mock-practice';
  render();
}

function getMockPartQuestions(part) {
  const source = questionSets[part.key].filter((question) => question.subtest === part.subtest);
  return selectBalancedMockQuestions(source, part.questionCount);
}

function selectBalancedMockQuestions(source, count) {
  const targetCounts = {
    easy: Math.floor(count * 0.2),
    medium: Math.ceil(count * 0.45),
  };
  targetCounts.hard = count - targetCounts.easy - targetCounts.medium;

  const selectedQuestions = [];
  ['easy', 'medium', 'hard'].forEach((difficulty) => {
    const bucket = source.filter((question) => getDifficultyBucket(question) === difficulty);
    selectedQuestions.push(...shuffle(bucket).slice(0, targetCounts[difficulty]));
  });

  if (selectedQuestions.length < count) {
    const selectedIds = new Set(selectedQuestions.map((question) => question.id));
    const remainingQuestions = source.filter((question) => !selectedIds.has(question.id));
    selectedQuestions.push(...shuffle(remainingQuestions).slice(0, count - selectedQuestions.length));
  }

  return shuffle(selectedQuestions).slice(0, count);
}

function startMockTimer() {
  if (mockTimerHandle) {
    return;
  }
  mockTimerHandle = window.setInterval(() => {
    state.mockSecondsRemaining -= 1;
    const timer = document.querySelector('#timer');
    if (timer) {
      timer.textContent = formatTime(state.mockSecondsRemaining);
      timer.classList.toggle('warning', state.mockSecondsRemaining <= 60);
    }
    if (state.mockSecondsRemaining <= 0) {
      finishMockPart();
    }
  }, 1000);
}

function stopMockTimer() {
  if (mockTimerHandle) {
    window.clearInterval(mockTimerHandle);
    mockTimerHandle = null;
  }
}

function finishMockPart() {
  stopMockTimer();
  const part = mockParts[state.mockPartIndex];
  let correct = 0;

  state.questions.forEach((question, index) => {
    const answer = state.answers[index];
    if (!answer) {
      return;
    }
    if (answer === getCorrectAnswer(question)) {
      correct += 1;
    }
    recordAnswer(question, answer);
  });

  state.mockResults.push({
    key: part.key,
    battery: part.battery,
    subtest: part.subtest,
    label: part.label,
    correct,
    total: state.questions.length,
    unanswered: state.answers.filter((answer) => !answer).length,
    secondsUsed: (part.minutes * 60) - state.mockSecondsRemaining,
  });

  if (state.mockPartIndex < mockParts.length - 1) {
    state.mockPartIndex += 1;
    startMockPart();
    return;
  }

  state.view = 'results';
  render();
}

function formatTime(seconds) {
  const minutes = Math.floor(Math.max(seconds, 0) / 60);
  const remainder = Math.max(seconds, 0) % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function renderResults() {
  if (state.examType === 'mock') {
    renderMockResults();
    return;
  }

  const total = state.questions.length;
  const correct = state.answers.reduce((count, answer, index) => (
    answer === getCorrectAnswer(state.questions[index]) ? count + 1 : count
  ), 0);
  const percent = Math.round((correct / total) * 100);
  const missedQuestions = state.questions.filter((question, index) => state.answers[index] !== getCorrectAnswer(question));
  const bySubtest = summarizeSession();
  const daily = getDailyProgress();
  const isDaily = state.sessionKind === 'daily';

  renderShell(`
    <section class="results">
      <div class="panel score">
        <span class="eyebrow">${isDaily ? 'Today’s practice complete' : 'Practice complete'}</span>
        <h1>${percent}%</h1>
        <p>${correct}/${total} correct</p>
        ${isDaily ? `<div class="result-goal"><b>${daily.answered}/${state.dailyGoal}</b><span>daily goal complete</span></div>` : ''}
        <div class="result-actions">
          <button class="primary" type="button" id="again">${isDaily ? 'Back to progress' : 'Practice again'}</button>
          ${missedQuestions.length ? '<button class="ghost" type="button" id="review-missed">Review missed</button>' : ''}
          <button class="ghost" type="button" id="export-history">Export JSON</button>
        </div>
      </div>

      <div class="panel summary">
        <h2>Summary</h2>
        ${Object.entries(bySubtest).map(([subtest, item]) => `
          <div class="row">
            <span>${escapeHtml(subtest)}</span>
            <b>${item.correct}/${item.total}</b>
          </div>
        `).join('')}

        <details class="missed-list">
          <summary>${missedQuestions.length ? `${missedQuestions.length} missed` : 'No missed questions'}</summary>
          ${missedQuestions.map((question) => {
            const index = state.questions.indexOf(question);
            return `
              <article>
                <b>${escapeHtml(question.subtest)} - ${state.answers[index]} -> ${getCorrectAnswer(question)}</b>
                <p>${question.explanation}</p>
              </article>
            `;
          }).join('')}
        </details>
      </div>
    </section>
  `);

  document.querySelector('#again').addEventListener('click', () => {
    state.view = 'setup';
    render();
  });
  document.querySelector('#review-missed')?.addEventListener('click', () => {
    state.battery = 'all';
    state.subtest = 'all';
    state.mode = 'missed';
    startPractice({ kind: 'review' });
  });
  document.querySelector('#export-history').addEventListener('click', exportHistory);
}

function renderMockResults() {
  const total = state.mockResults.reduce((sum, part) => sum + part.total, 0);
  const correct = state.mockResults.reduce((sum, part) => sum + part.correct, 0);
  const percent = Math.round((correct / total) * 100);
  const batteryScores = summarizeMockScores();

  renderShell(`
    <section class="results mock-results">
      <div class="panel score">
        <span class="eyebrow">Mock exam complete</span>
        <h1>${percent}%</h1>
        <p>${correct}/${total} correct</p>
        <div class="result-actions">
          <button class="primary" type="button" id="again">Try again</button>
          <button class="ghost" type="button" id="export-history">Export JSON</button>
        </div>
      </div>

      <div class="panel summary">
        <h2>Battery scores</h2>
        ${Object.entries(batteryScores).map(([battery, score]) => `
          <div class="row">
            <span>${escapeHtml(battery.replace(' Battery', ''))}</span>
            <b>${score.correct}/${score.total} - ${Math.round((score.correct / score.total) * 100)}%</b>
          </div>
        `).join('')}

        <h2>Subtest scores</h2>
        ${state.mockResults.map((part) => `
          <div class="row">
            <span>${escapeHtml(part.label)}</span>
            <b>${part.correct}/${part.total}${part.unanswered ? ` - ${part.unanswered} blank` : ''}</b>
          </div>
        `).join('')}
        <p class="microcopy mock-result-note">Raw score only. Official CogAT SAS, percentile, and stanine need age norms that are not included here.</p>
      </div>
    </section>
  `);

  document.querySelector('#again').addEventListener('click', startMockExam);
  document.querySelector('#export-history').addEventListener('click', exportHistory);
}

function renderQuestionBank() {
  const selectedBattery = batteryMap.get(state.bankBattery) ?? batteryMap.get('all');
  const bankSubtests = getBankSubtests(selectedBattery);
  if (state.bankSubtest !== 'all' && !bankSubtests.includes(state.bankSubtest)) {
    state.bankSubtest = 'all';
  }
  const filteredQuestions = getBankQuestions();

  renderShell(`
    <section class="panel question-bank">
      <div class="bank-head">
        <h1>Question bank</h1>
        <span>${filteredQuestions.length}/${allQuestions.length}</span>
      </div>

      <div class="bank-toolbar">
        <div class="bank-chips" aria-label="Battery filter">
          ${batteries.map((battery) => `
            <button class="bank-chip ${battery.key === state.bankBattery ? 'selected' : ''}" type="button" data-bank-filter="${battery.key}">
              <span>${escapeHtml(battery.label)}</span>
              <b>${battery.questions.length}</b>
            </button>
          `).join('')}
        </div>

        <label class="bank-select">
          <span>Subtest</span>
          <select id="bank-subtest">
            <option value="all">All</option>
            ${bankSubtests.map((subtest) => `
              <option value="${escapeHtml(subtest)}" ${subtest === state.bankSubtest ? 'selected' : ''}>${escapeHtml(subtest)}</option>
            `).join('')}
          </select>
        </label>

        <button class="ghost bank-practice" type="button" id="bank-start" ${filteredQuestions.length ? '' : 'disabled'}>Practice</button>
      </div>

      <div class="bank-list">
        ${filteredQuestions.map((question, index) => renderBankQuestion(question, index)).join('')}
      </div>
    </section>
  `);

  document.querySelectorAll('[data-bank-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      state.bankBattery = button.dataset.bankFilter;
      state.bankSubtest = 'all';
      render();
    });
  });

  document.querySelector('#bank-subtest').addEventListener('change', (event) => {
    state.bankSubtest = event.target.value;
    render();
  });

  document.querySelector('#bank-start').addEventListener('click', () => {
    state.examType = 'practice';
    state.battery = state.bankBattery;
    state.subtest = state.bankSubtest;
    state.mode = 'all';
    startPractice({ kind: 'custom' });
  });
}

function renderBankQuestion(question, index) {
  const difficulty = getDifficulty(question);
  return `
    <article class="bank-question" id="question-${question.id}">
      <div class="bank-question-meta">
        <b>${index + 1}</b>
        <span>#${escapeHtml(question.id)}</span>
        <span class="difficulty-badge difficulty-${difficulty}">${formatDifficulty(difficulty)}</span>
        <span>${escapeHtml(question.battery.replace(' Battery', ''))} · ${escapeHtml(question.subtest)}</span>
        <span class="bank-answer">Answer ${escapeHtml(getCorrectAnswer(question))}</span>
      </div>
      <div class="bank-question-body">
        <div class="bank-preview">
          <div>${question.question}</div>
          ${question.questionNote ? `<p>${question.questionNote}</p>` : ''}
        </div>
        <div class="bank-options-mini">
          ${question.options.map((option) => `
            <div class="bank-option-mini ${getOptionValue(option) === getCorrectAnswer(question) ? 'is-answer' : ''}">
              <b>${escapeHtml(option.label)}</b>
              <span>${option.text}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </article>
  `;
}

function getBankSubtests(battery) {
  return [...new Set(battery.questions.map((question) => question.subtest))].sort();
}

function getBankQuestions() {
  const battery = batteryMap.get(state.bankBattery) ?? batteryMap.get('all');
  const questions = state.bankSubtest === 'all'
    ? battery.questions
    : battery.questions.filter((question) => question.subtest === state.bankSubtest);

  return [...questions].sort((first, second) => Number(first.id) - Number(second.id));
}

function summarizeMockScores() {
  return state.mockResults.reduce((summary, part) => {
    summary[part.battery] ??= { correct: 0, total: 0 };
    summary[part.battery].correct += part.correct;
    summary[part.battery].total += part.total;
    return summary;
  }, {});
}

function startDailyPractice() {
  if (getDailyProgress().completed) {
    state.battery = 'all';
    state.subtest = 'all';
    state.mode = 'all';
    startPractice({ kind: 'extra', limit: state.dailyGoal });
    return;
  }

  const active = state.history.activeSession;
  if (hasResumableDailySession() && active?.questionIds?.length) {
    const questions = active.questionIds.map((id) => questionById.get(String(id))).filter(Boolean);
    if (questions.length) {
      state.sessionKind = 'daily';
      state.questions = questions;
      state.answers = questions.map((question, index) => active.answers?.[index] ?? null);
      state.currentIndex = Math.min(Number(active.currentIndex ?? 0), questions.length - 1);
      state.checked = Boolean(active.checked);
      state.view = 'practice';
      state.message = '';
      render();
      return;
    }
  }

  startPractice({ kind: 'daily', pool: selectDailyQuestions(state.dailyGoal), limit: state.dailyGoal });
}

function startPractice({ kind = 'custom', pool = null, limit = QUESTION_LIMIT } = {}) {
  const practicePool = pool ?? getPracticePool();
  if (!practicePool.length) {
    state.message = 'No questions match this filter yet.';
    render();
    return;
  }

  state.sessionKind = kind;
  state.questions = shuffle(practicePool).slice(0, Math.min(limit, practicePool.length));
  state.answers = new Array(state.questions.length).fill(null);
  state.currentIndex = 0;
  state.checked = false;
  state.view = 'practice';
  state.message = '';
  if (kind === 'daily') {
    persistActiveSession();
  }
  render();
}

function selectDailyQuestions(goal) {
  const seen = new Set();
  const selected = [];
  const pools = [
    allQuestions.filter((question) => isWeakQuestion(question)),
    allQuestions.filter((question) => !state.history.stats[String(question.id)]),
    allQuestions,
  ];

  pools.forEach((pool) => {
    shuffle(pool).forEach((question) => {
      if (selected.length >= goal || seen.has(String(question.id))) {
        return;
      }
      seen.add(String(question.id));
      selected.push(question);
    });
  });

  return selected;
}

function hasResumableDailySession() {
  const active = state.history.activeSession;
  return Boolean(active && active.kind === 'daily' && active.date === getDateKey() && !getDailyProgress().completed);
}

function persistActiveSession() {
  if (state.sessionKind !== 'daily' || state.view !== 'practice' || !state.questions.length) {
    return;
  }
  state.history.activeSession = {
    date: getDateKey(),
    kind: 'daily',
    goal: state.dailyGoal,
    questionIds: state.questions.map((question) => String(question.id)),
    answers: [...state.answers],
    currentIndex: state.currentIndex,
    checked: state.checked,
    answeredCount: getActiveSessionCounts().answered,
    correctCount: getActiveSessionCounts().correct,
    updatedAt: new Date().toISOString(),
  };
  saveHistory();
}

function getActiveSessionCounts() {
  if (state.sessionKind !== 'daily' || !state.questions.length) {
    return { answered: 0, correct: 0 };
  }
  const answered = state.answers.reduce((count, answer, index) => {
    const isCheckedAnswer = index < state.currentIndex || (index === state.currentIndex && state.checked);
    return count + (isCheckedAnswer && answer ? 1 : 0);
  }, 0);
  const correct = state.answers.reduce((count, answer, index) => {
    const isCheckedAnswer = index < state.currentIndex || (index === state.currentIndex && state.checked);
    return count + (isCheckedAnswer && answer === getCorrectAnswer(state.questions[index]) ? 1 : 0);
  }, 0);
  return { answered, correct };
}

function finishPracticeSession() {
  const correct = state.answers.reduce((count, answer, index) => (
    answer === getCorrectAnswer(state.questions[index]) ? count + 1 : count
  ), 0);
  const total = state.questions.length;
  const completedAt = new Date().toISOString();

  state.history.lastSession = {
    kind: state.sessionKind,
    correct,
    total,
    accuracy: total ? Math.round((correct / total) * 100) : 0,
    completedAt,
  };

  if (state.sessionKind === 'daily') {
    const date = getDateKey();
    state.history.daily[date] = {
      answered: total,
      correct,
      total,
      completed: true,
      completedAt,
    };
    state.history.activeSession = null;
  }

  state.history.updatedAt = completedAt;
  saveHistory();
}

function goHome() {
  persistActiveSession();
  stopMockTimer();
  state.view = 'setup';
  state.examType = 'practice';
  state.message = '';
  render();
}

function getBasePool() {
  const battery = batteryMap.get(state.battery) ?? batteryMap.get('all');
  const batteryQuestions = battery.questions;
  if (state.subtest === 'all') {
    return batteryQuestions;
  }
  return batteryQuestions.filter((question) => question.subtest === state.subtest);
}

function getPracticePool() {
  const pool = getBasePool();
  if (state.mode === 'new') {
    return pool.filter((question) => !state.history.stats[String(question.id)]);
  }
  if (state.mode === 'missed') {
    return pool.filter((question) => state.history.stats[String(question.id)]?.lastResult === 'wrong');
  }
  if (state.mode === 'weak') {
    return pool.filter((question) => isWeakQuestion(question));
  }
  if (state.mode === 'very-hard') {
    return pool.filter((question) => getDifficulty(question) === 'very-hard');
  }
  if (state.mode === 'pdf') {
    return pool.filter((question) => question.source === 'G4 PDF workbook');
  }
  if (state.mode === 'correct') {
    return pool.filter((question) => state.history.stats[String(question.id)]?.lastResult === 'correct');
  }
  return pool;
}

function isWeakQuestion(question) {
  const stats = state.history.stats[String(question.id)];
  if (!stats) {
    return false;
  }
  return stats.lastResult === 'wrong' || (stats.attempts >= 2 && stats.correct / stats.attempts < 0.7);
}

function getDifficulty(question) {
  const explicitDifficulty = String(question.difficulty ?? '').toLowerCase();
  if (explicitDifficulty === 'very-hard') {
    return 'very-hard';
  }
  if (explicitDifficulty === 'hard') {
    return 'medium';
  }
  if (['easy', 'medium'].includes(explicitDifficulty)) {
    return explicitDifficulty;
  }

  const id = Number(question.id);
  if (id >= 401) {
    return 'medium';
  }

  if (id < 100) {
    const positionInSubtest = id % 10 || 10;
    return positionInSubtest <= 5 ? 'easy' : 'medium';
  }

  if (id >= 300) {
    return 'medium';
  }

  return 'medium';
}

function getDifficultyBucket(question) {
  return getDifficulty(question) === 'very-hard' ? 'hard' : getDifficulty(question);
}

function formatDifficulty(difficulty) {
  return difficulty.replace('-', ' ');
}

function formatQuestionCount(count) {
  return `${count} ${count === 1 ? 'question' : 'questions'}`;
}

function getOptionValue(option) {
  return String(option.value ?? option.label);
}

function getCorrectAnswer(question) {
  return String(question.correctAnswer);
}

function handleKeyboard(event) {
  if (!['practice', 'mock-practice'].includes(state.view)) {
    return;
  }
  const target = event.target;
  if (target?.matches?.('input, select, textarea, button')) {
    return;
  }

  const key = event.key.toLowerCase();
  const optionIndex = ['a', 'b', 'c', 'd', 'e'].indexOf(key);
  const question = state.questions[state.currentIndex];
  if (optionIndex >= 0 && question?.options?.[optionIndex]) {
    state.answers[state.currentIndex] = getOptionValue(question.options[optionIndex]);
    persistActiveSession();
    if (state.view === 'practice') {
      renderPractice();
    } else {
      renderMockPractice();
    }
    return;
  }

  if (event.key === 'Enter') {
    event.preventDefault();
    document.querySelector(state.view === 'practice' ? '#check' : '#mock-next')?.click();
  }
}

function getSubtests() {
  const battery = batteryMap.get(state.battery) ?? batteryMap.get('all');
  return [...new Set(battery.questions.map((question) => question.subtest))].sort();
}

function recordAnswer(question, answer) {
  const id = String(question.id);
  const previous = state.history.stats[id] ?? {
    id,
    battery: question.battery,
    subtest: question.subtest,
    attempts: 0,
    correct: 0,
    wrong: 0,
  };
  const isCorrect = answer === getCorrectAnswer(question);

  state.history.stats[id] = {
    ...previous,
    attempts: previous.attempts + 1,
    correct: previous.correct + (isCorrect ? 1 : 0),
    wrong: previous.wrong + (isCorrect ? 0 : 1),
    lastAnswer: answer,
    correctAnswer: getCorrectAnswer(question),
    lastResult: isCorrect ? 'correct' : 'wrong',
    updatedAt: new Date().toISOString(),
  };
  state.history.updatedAt = new Date().toISOString();
  saveHistory();
}

function summarizeSession() {
  return state.questions.reduce((summary, question, index) => {
    summary[question.subtest] ??= { correct: 0, total: 0 };
    summary[question.subtest].total += 1;
    if (state.answers[index] === getCorrectAnswer(question)) {
      summary[question.subtest].correct += 1;
    }
    return summary;
  }, {});
}

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shiftDateKey(dateKey, amount) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);
  return getDateKey(date);
}

function getDailyProgress() {
  const record = state.history.daily[getDateKey()] ?? {};
  const active = hasStoredActiveDailySession() ? state.history.activeSession : null;
  const answered = active ? Number(active.answeredCount ?? 0) : Number(record.answered ?? 0);
  return {
    answered,
    correct: active ? Number(active.correctCount ?? 0) : Number(record.correct ?? 0),
    total: Number(record.total ?? 0),
    completed: Boolean(record.completed) && answered >= state.dailyGoal,
  };
}

function hasStoredActiveDailySession() {
  const active = state.history.activeSession;
  return Boolean(active && active.kind === 'daily' && active.date === getDateKey());
}

function getCurrentStreak() {
  let streak = 0;
  let dateKey = getDateKey();
  while (state.history.daily[dateKey]?.completed) {
    streak += 1;
    dateKey = shiftDateKey(dateKey, -1);
  }
  return streak;
}

function getProgressSummary() {
  const records = Object.values(state.history.stats);
  const totalAnswered = records.reduce((sum, record) => sum + Number(record.attempts ?? 0), 0);
  const lastAccuracy = state.history.lastSession?.total ? Number(state.history.lastSession.accuracy) : null;
  return {
    totalAnswered,
    streak: getCurrentStreak(),
    lastAccuracy,
    missed: records.filter((record) => record.lastResult === 'wrong').length,
  };
}

function getBatteryProgress(batteryKey) {
  const battery = batteryMap.get(batteryKey);
  const records = battery.questions.map((question) => state.history.stats[String(question.id)]).filter(Boolean);
  const attempted = records.reduce((sum, record) => sum + Number(record.attempts ?? 0), 0);
  const correct = records.reduce((sum, record) => sum + Number(record.correct ?? 0), 0);
  return {
    attempted,
    accuracy: attempted ? Math.round((correct / attempted) * 100) : null,
  };
}

function getHistorySummary() {
  const records = Object.values(state.history.stats);
  return {
    correct: records.filter((record) => record.lastResult === 'correct').length,
    missed: records.filter((record) => record.lastResult === 'wrong').length,
  };
}

function createEmptyHistory() {
  return {
    version: 2,
    updatedAt: new Date().toISOString(),
    dailyGoal: DEFAULT_DAILY_GOAL,
    daily: {},
    activeSession: null,
    lastSession: null,
    stats: {},
  };
}

function loadHistory() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    return stored ? normalizeHistory(JSON.parse(stored)) : createEmptyHistory();
  } catch {
    return createEmptyHistory();
  }
}

function normalizeHistory(input) {
  const next = createEmptyHistory();
  const stats = input?.stats ?? input?.questions ?? {};

  Object.entries(stats).forEach(([id, record]) => {
    if (!questionById.has(String(id)) && !questionById.has(String(record?.id))) {
      return;
    }
    const normalizedId = String(record?.id ?? id);
    next.stats[normalizedId] = {
      id: normalizedId,
      battery: record.battery ?? questionById.get(normalizedId)?.battery ?? '',
      subtest: record.subtest ?? questionById.get(normalizedId)?.subtest ?? '',
      attempts: Number(record.attempts ?? 0),
      correct: Number(record.correct ?? 0),
      wrong: Number(record.wrong ?? 0),
      lastAnswer: record.lastAnswer ?? '',
      correctAnswer: record.correctAnswer ?? questionById.get(normalizedId)?.correctAnswer ?? '',
      lastResult: record.lastResult === 'wrong' ? 'wrong' : 'correct',
      updatedAt: record.updatedAt ?? new Date().toISOString(),
    };
  });

  next.dailyGoal = DAILY_GOAL_OPTIONS.includes(Number(input?.dailyGoal)) ? Number(input.dailyGoal) : DEFAULT_DAILY_GOAL;
  next.daily = Object.entries(input?.daily ?? {}).reduce((daily, [date, record]) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return daily;
    }
    daily[date] = {
      answered: Number(record?.answered ?? 0),
      correct: Number(record?.correct ?? 0),
      total: Number(record?.total ?? record?.answered ?? 0),
      completed: Boolean(record?.completed),
      completedAt: record?.completedAt ?? '',
    };
    return daily;
  }, {});
  if (input?.activeSession && input.activeSession.kind === 'daily') {
    const questionIds = Array.isArray(input.activeSession.questionIds) ? input.activeSession.questionIds.map(String) : [];
    const answers = Array.isArray(input.activeSession.answers) ? input.activeSession.answers : [];
    const currentIndex = Number(input.activeSession.currentIndex ?? 0);
    const checked = Boolean(input.activeSession.checked);
    const getWasChecked = (index) => index < currentIndex || (index === currentIndex && checked);
    const inferredAnswered = answers.reduce((count, answer, index) => count + (getWasChecked(index) && answer ? 1 : 0), 0);
    const inferredCorrect = answers.reduce((count, answer, index) => count + (getWasChecked(index) && answer === questionById.get(questionIds[index])?.correctAnswer ? 1 : 0), 0);
    next.activeSession = {
      date: input.activeSession.date,
      kind: 'daily',
      goal: Number(input.activeSession.goal ?? next.dailyGoal),
      questionIds,
      answers,
      currentIndex,
      checked,
      answeredCount: Number(input.activeSession.answeredCount ?? inferredAnswered),
      correctCount: Number(input.activeSession.correctCount ?? inferredCorrect),
      updatedAt: input.activeSession.updatedAt ?? '',
    };
  }
  if (input?.lastSession) {
    next.lastSession = {
      kind: input.lastSession.kind ?? 'custom',
      correct: Number(input.lastSession.correct ?? 0),
      total: Number(input.lastSession.total ?? 0),
      accuracy: Number(input.lastSession.accuracy ?? 0),
      completedAt: input.lastSession.completedAt ?? '',
    };
  }
  next.updatedAt = input?.updatedAt ?? new Date().toISOString();
  return next;
}

function saveHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.history));
}

function exportHistory() {
  const payload = {
    ...state.history,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'cogat-history.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

async function importHistory(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    state.history = normalizeHistory(JSON.parse(text));
    state.dailyGoal = state.history.dailyGoal;
    saveHistory();
    state.message = 'History imported.';
  } catch {
    state.message = 'Could not read that JSON file.';
  }
  event.target.value = '';
  render();
}

function clearHistory() {
  state.history = createEmptyHistory();
  state.dailyGoal = DEFAULT_DAILY_GOAL;
  saveHistory();
  state.message = 'History cleared.';
  render();
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

document.addEventListener('keydown', handleKeyboard);
render();
