import { verbalQuestions } from './data/verbalQuestions.js';
import { quantitativeQuestions } from './data/quantitativeQuestions.js';
import { nonverbalQuestions } from './data/nonverbalQuestions.js';
import { verbalExtraQuestions } from './data/verbalExtraQuestions.js';
import { quantitativeExtraQuestions } from './data/quantitativeExtraQuestions.js';
import { nonverbalExtraQuestions } from './data/nonverbalExtraQuestions.js';
import { mockExamQuestions } from './data/mockExamQuestions.js';

const QUESTION_LIMIT = 30;
const STORAGE_KEY = 'grade4-cogat-history-v1';

const questionSets = {
  verbal: [...verbalQuestions, ...verbalExtraQuestions],
  quantitative: [...quantitativeQuestions, ...quantitativeExtraQuestions],
  nonverbal: [...nonverbalQuestions, ...nonverbalExtraQuestions, ...mockExamQuestions],
};

const batteries = [
  { key: 'all', label: 'Mixed', kidLabel: 'Mixed', questions: [...questionSets.verbal, ...questionSets.quantitative, ...questionSets.nonverbal] },
  { key: 'verbal', label: 'Verbal', kidLabel: 'Verbal', questions: questionSets.verbal },
  { key: 'quantitative', label: 'Quantitative', kidLabel: 'Quantitative', questions: questionSets.quantitative },
  { key: 'nonverbal', label: 'Nonverbal', kidLabel: 'Nonverbal', questions: questionSets.nonverbal },
];

const mockParts = [
  { key: 'nonverbal', label: 'Shapes & patterns', minutes: 10 },
  { key: 'quantitative', label: 'Numbers & patterns', minutes: 10 },
  { key: 'verbal', label: 'Words & sentences', minutes: 10 },
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
  message: '',
  mockPartIndex: 0,
  mockResults: [],
  mockSecondsRemaining: 0,
};

const app = document.querySelector('#app');
let mockTimerHandle = null;

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
              <b>About</b>
              <span>Updated July 19, 2026.</span>
              <span>Designed for Grade 4 CogAT practice.</span>
              <a href="https://github.com/marksui/CogAT" target="_blank" rel="noopener noreferrer">marksui/CogAT</a>
            </div>
          </details>
        </div>
        <span>${allQuestions.length} questions</span>
      </header>
      ${content}
    </main>
  `;

  document.querySelector('[data-home]').addEventListener('click', () => {
    stopMockTimer();
    state.view = 'setup';
    state.examType = 'practice';
    state.message = '';
    render();
  });
}

function renderSetup() {
  const subtests = getSubtests();
  const pool = getPracticePool();

  renderShell(`
    <section class="setup-grid">
      <div class="hero-copy">
        <h1>${state.examType === 'mock' ? 'Mock exam' : 'Practice'}</h1>
      </div>

      <form class="panel controls" id="setup-form">
        <div class="exam-switch" aria-label="Choose exam type">
          <button class="${state.examType === 'practice' ? 'selected' : ''}" type="button" data-exam-type="practice">Practice set</button>
          <button class="${state.examType === 'mock' ? 'selected' : ''}" type="button" data-exam-type="mock">Mock exam</button>
        </div>

        ${state.examType === 'mock' ? `
          <div class="mock-preview">
            <div class="mock-parts">
              ${mockParts.map((part, index) => `
                <div class="mock-part">
                  <span>${index + 1}</span>
                  <div><b>${part.label}</b><small>${part.minutes} minutes · 10 questions</small></div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
        <div>
          <div class="step-label">Battery</div>
          <div class="battery-grid" aria-label="Battery">
            ${batteries.map((battery) => `
              <button class="battery-card ${battery.key === state.battery ? 'selected' : ''}" type="button" data-battery="${battery.key}">
                <b>${battery.kidLabel}</b>
              </button>
            `).join('')}
          </div>
        </div>

        <label>
          <span>Subtest</span>
          <select id="subtest">
            <option value="all">All subtests</option>
            ${subtests.map((subtest) => `<option value="${escapeHtml(subtest)}" ${subtest === state.subtest ? 'selected' : ''}>${subtest}</option>`).join('')}
          </select>
        </label>

        <label>
          <span>Mode</span>
          <select id="mode">
            <option value="all" ${state.mode === 'all' ? 'selected' : ''}>All questions</option>
            <option value="new" ${state.mode === 'new' ? 'selected' : ''}>New only</option>
            <option value="missed" ${state.mode === 'missed' ? 'selected' : ''}>Missed review</option>
            <option value="correct" ${state.mode === 'correct' ? 'selected' : ''}>Correct review</option>
          </select>
        </label>
        `}

        <button class="primary" type="submit" ${state.examType === 'practice' && pool.length === 0 ? 'disabled' : ''}>${state.examType === 'mock' ? 'Start mock exam' : `Start ${Math.min(pool.length, QUESTION_LIMIT)}`}</button>


        <details class="data-box">
          <summary>JSON history</summary>
          <div class="data-actions">
            <button class="ghost" type="button" id="export-history">Export</button>
            <button class="ghost" type="button" id="import-history">Import</button>
            <button class="ghost" type="button" id="clear-history">Clear</button>
            <input id="history-file" type="file" accept="application/json,.json" hidden>
          </div>
        </details>

        ${state.message ? `<p class="message">${escapeHtml(state.message)}</p>` : ''}
      </form>
    </section>
  `);

  document.querySelectorAll('[data-exam-type]').forEach((button) => {
    button.addEventListener('click', () => {
      state.examType = button.dataset.examType;
      state.message = '';
      render();
    });
  });

  if (state.examType === 'mock') {
    document.querySelector('#setup-form').addEventListener('submit', (event) => {
      event.preventDefault();
      startMockExam();
    });
    document.querySelector('#export-history').addEventListener('click', exportHistory);
    document.querySelector('#import-history').addEventListener('click', () => document.querySelector('#history-file').click());
    document.querySelector('#history-file').addEventListener('change', importHistory);
    document.querySelector('#clear-history').addEventListener('click', clearHistory);
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

  document.querySelector('#export-history').addEventListener('click', exportHistory);
  document.querySelector('#import-history').addEventListener('click', () => document.querySelector('#history-file').click());
  document.querySelector('#history-file').addEventListener('change', importHistory);
  document.querySelector('#clear-history').addEventListener('click', clearHistory);
}

function renderPractice() {
  const question = state.questions[state.currentIndex];
  const answer = state.answers[state.currentIndex];
  const total = state.questions.length;
  const isLast = state.currentIndex === total - 1;

  renderShell(`
    <section class="panel practice">
      <div class="practice-head">
        <span>${state.currentIndex + 1}/${total}</span>
        <span>${escapeHtml(question.battery.replace(' Battery', ''))} · ${escapeHtml(question.subtest)}</span>
      </div>

      <div class="meter" aria-hidden="true"><span style="width:${((state.currentIndex + 1) / total) * 100}%"></span></div>

      <div class="question-card">
        <div>${question.question}</div>
        ${question.questionNote ? `<p>${question.questionNote}</p>` : ''}
      </div>

      <div class="options">
        ${question.options.map((option) => {
          const selected = answer === option.label;
          const correct = state.checked && option.label === question.correctAnswer;
          const wrong = state.checked && selected && option.label !== question.correctAnswer;
          return `
            <button class="option ${selected ? 'selected' : ''} ${correct ? 'correct' : ''} ${wrong ? 'wrong' : ''}" type="button" data-option="${option.label}">
              <b>${option.label}</b>
              <span>${option.text}</span>
            </button>
          `;
        }).join('')}
      </div>

      ${state.checked ? `
        <div class="feedback">
          <b>${answer === question.correctAnswer ? 'Correct' : `Correct answer: ${question.correctAnswer}`}</b>
          <span>${question.explanation}</span>
        </div>
      ` : ''}

      <div class="footer-actions">
        <button class="ghost" type="button" id="back">Back</button>
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
      render();
      return;
    }

    if (isLast) {
      state.view = 'results';
    } else {
      state.currentIndex += 1;
      state.checked = false;
    }
    render();
  });

  document.querySelector('#back').addEventListener('click', () => {
    state.view = 'setup';
    state.message = '';
    render();
  });
}

function renderMockPractice() {
  const part = mockParts[state.mockPartIndex];
  const question = state.questions[state.currentIndex];
  const answer = state.answers[state.currentIndex];
  const total = state.questions.length;
  const isLast = state.currentIndex === total - 1;

  renderShell(`
    <section class="panel practice mock-practice">
      <div class="mock-topline">
        <div>
          <span class="eyebrow">Mock exam · Part ${state.mockPartIndex + 1} of ${mockParts.length}</span>
          <h2>${part.label}</h2>
        </div>
        <div class="timer" id="timer" aria-live="polite">${formatTime(state.mockSecondsRemaining)}</div>
      </div>

      <div class="practice-head">
        <span>Question ${state.currentIndex + 1} of ${total}</span>
        <span>Choose one answer</span>
      </div>
      <div class="meter" aria-hidden="true"><span style="width:${((state.currentIndex + 1) / total) * 100}%"></span></div>

      <div class="question-card">
        <div>${question.question}</div>
        ${question.questionNote ? `<p>${question.questionNote}</p>` : ''}
      </div>

      <div class="options">
        ${question.options.map((option) => `
          <button class="option ${answer === option.label ? 'selected' : ''}" type="button" data-option="${option.label}">
            <b>${option.label}</b>
            <span>${option.text}</span>
          </button>
        `).join('')}
      </div>

      <div class="footer-actions">
        <button class="ghost" type="button" id="exit-mock">Leave exam</button>
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
  const source = questionSets[part.key];
  if (part.key === 'nonverbal') {
    const sampleQuestions = shuffle(mockExamQuestions).slice(0, 3);
    const regularQuestions = shuffle(source.filter((question) => !mockExamQuestions.some((sample) => sample.id === question.id))).slice(0, 7);
    return [...sampleQuestions, ...regularQuestions];
  }
  return shuffle(source).slice(0, 10);
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
    if (answer === question.correctAnswer) {
      correct += 1;
    }
    recordAnswer(question, answer);
  });

  state.mockResults.push({
    label: part.label,
    correct,
    total: state.questions.length,
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
    answer === state.questions[index].correctAnswer ? count + 1 : count
  ), 0);
  const percent = Math.round((correct / total) * 100);
  const missedQuestions = state.questions.filter((question, index) => state.answers[index] !== question.correctAnswer);
  const bySubtest = summarizeSession();

  renderShell(`
    <section class="results">
      <div class="panel score">
        <h1>${percent}%</h1>
        <p>${correct}/${total} correct</p>
        <div class="result-actions">
          <button class="primary" type="button" id="again">Practice again</button>
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
                <b>${escapeHtml(question.subtest)} · ${state.answers[index]} → ${question.correctAnswer}</b>
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
  document.querySelector('#export-history').addEventListener('click', exportHistory);
}

function renderMockResults() {
  const total = state.mockResults.reduce((sum, part) => sum + part.total, 0);
  const correct = state.mockResults.reduce((sum, part) => sum + part.correct, 0);
  const percent = Math.round((correct / total) * 100);

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
        <h2>Part scores</h2>
        ${state.mockResults.map((part) => `
          <div class="row">
            <span>${escapeHtml(part.label)}</span>
            <b>${part.correct}/${part.total}</b>
          </div>
        `).join('')}
        <p class="microcopy mock-result-note">Your correct and missed answers were saved to history.</p>
      </div>
    </section>
  `);

  document.querySelector('#again').addEventListener('click', startMockExam);
  document.querySelector('#export-history').addEventListener('click', exportHistory);
}

function startPractice() {
  const pool = getPracticePool();
  if (!pool.length) {
    state.message = 'No questions match this filter yet.';
    render();
    return;
  }

  state.questions = shuffle(pool).slice(0, QUESTION_LIMIT);
  state.answers = new Array(state.questions.length).fill(null);
  state.currentIndex = 0;
  state.checked = false;
  state.view = 'practice';
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
  if (state.mode === 'correct') {
    return pool.filter((question) => state.history.stats[String(question.id)]?.lastResult === 'correct');
  }
  return pool;
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
  const isCorrect = answer === question.correctAnswer;

  state.history.stats[id] = {
    ...previous,
    attempts: previous.attempts + 1,
    correct: previous.correct + (isCorrect ? 1 : 0),
    wrong: previous.wrong + (isCorrect ? 0 : 1),
    lastAnswer: answer,
    correctAnswer: question.correctAnswer,
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
    if (state.answers[index] === question.correctAnswer) {
      summary[question.subtest].correct += 1;
    }
    return summary;
  }, {});
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
    version: 1,
    updatedAt: new Date().toISOString(),
    stats: {},
  };
}

function loadHistory() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
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

render();
