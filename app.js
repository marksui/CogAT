import { verbalQuestions } from './data/verbalQuestions.js';
import { quantitativeQuestions } from './data/quantitativeQuestions.js';
import { nonverbalQuestions } from './data/nonverbalQuestions.js';
import { verbalExtraQuestions } from './data/verbalExtraQuestions.js';
import { quantitativeExtraQuestions } from './data/quantitativeExtraQuestions.js';
import { nonverbalExtraQuestions } from './data/nonverbalExtraQuestions.js';

const QUESTION_LIMIT = 30;
const STORAGE_KEY = 'grade4-cogat-history-v1';

const questionSets = {
  verbal: [...verbalQuestions, ...verbalExtraQuestions],
  quantitative: [...quantitativeQuestions, ...quantitativeExtraQuestions],
  nonverbal: [...nonverbalQuestions, ...nonverbalExtraQuestions],
};

const batteries = [
  { key: 'all', label: 'Mixed', questions: [...questionSets.verbal, ...questionSets.quantitative, ...questionSets.nonverbal] },
  { key: 'verbal', label: 'Verbal', questions: questionSets.verbal },
  { key: 'quantitative', label: 'Quantitative', questions: questionSets.quantitative },
  { key: 'nonverbal', label: 'Nonverbal', questions: questionSets.nonverbal },
];

const batteryMap = new Map(batteries.map((battery) => [battery.key, battery]));
const allQuestions = batteries[0].questions;
const questionById = new Map(allQuestions.map((question) => [String(question.id), question]));

const state = {
  view: 'setup',
  battery: 'all',
  subtest: 'all',
  mode: 'all',
  questions: [],
  answers: [],
  currentIndex: 0,
  checked: false,
  history: loadHistory(),
  message: '',
};

const app = document.querySelector('#app');

function render() {
  if (state.view === 'practice') {
    renderPractice();
    return;
  }
  if (state.view === 'results') {
    renderResults();
    return;
  }
  renderSetup();
}

function renderShell(content) {
  app.innerHTML = `
    <main class="app-shell">
      <header class="topbar">
        <button class="wordmark" type="button" data-home>CogAT 4</button>
        <span>${allQuestions.length} questions</span>
      </header>
      ${content}
    </main>
  `;

  document.querySelector('[data-home]').addEventListener('click', () => {
    state.view = 'setup';
    state.message = '';
    render();
  });
}

function renderSetup() {
  const subtests = getSubtests();
  const pool = getPracticePool();
  const historySummary = getHistorySummary();

  renderShell(`
    <section class="setup-grid">
      <div>
        <h1>Practice CogAT, quietly.</h1>
        <p class="muted">Pick a section. Press start. Your correct and missed history stays in this browser, or moves by JSON.</p>
      </div>

      <form class="panel controls" id="setup-form">
        <label>
          <span>Battery</span>
          <select id="battery">
            ${batteries.map((battery) => `<option value="${battery.key}" ${battery.key === state.battery ? 'selected' : ''}>${battery.label}</option>`).join('')}
          </select>
        </label>

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

        <button class="primary" type="submit" ${pool.length === 0 ? 'disabled' : ''}>Start ${Math.min(pool.length, QUESTION_LIMIT)}</button>

        <div class="tiny-stats">
          <span>${historySummary.correct} correct</span>
          <span>${historySummary.missed} missed</span>
          <span>${pool.length} in pool</span>
        </div>

        <details class="data-box">
          <summary>JSON history</summary>
          <div class="data-actions">
            <button class="ghost" type="button" id="export-history">Export</button>
            <button class="ghost" type="button" id="import-history">Import</button>
            <button class="ghost" type="button" id="clear-history">Clear</button>
            <input id="history-file" type="file" accept="application/json,.json" hidden>
          </div>
          <p class="microcopy">Use this to move correct/missed history between browsers or devices.</p>
        </details>

        ${state.message ? `<p class="message">${escapeHtml(state.message)}</p>` : ''}
      </form>
    </section>
  `);

  document.querySelector('#battery').addEventListener('change', (event) => {
    state.battery = event.target.value;
    state.subtest = 'all';
    state.message = '';
    render();
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

function renderResults() {
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
