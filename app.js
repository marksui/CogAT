import { verbalQuestions } from './data/verbalQuestions.js';
import { quantitativeQuestions } from './data/quantitativeQuestions.js';
import { nonverbalQuestions } from './data/nonverbalQuestions.js';

const QUESTION_LIMIT = 30;

const batteries = [
  {
    key: 'all',
    name: 'Mixed practice',
    shortName: 'Mixed',
    description: 'A balanced set from every CogAT battery.',
    questions: [...verbalQuestions, ...quantitativeQuestions, ...nonverbalQuestions],
  },
  {
    key: 'verbal',
    name: 'Verbal Battery',
    shortName: 'Verbal',
    description: 'Words, sentences, and verbal relationships.',
    questions: verbalQuestions,
  },
  {
    key: 'quantitative',
    name: 'Quantitative Battery',
    shortName: 'Quantitative',
    description: 'Number patterns and simple reasoning.',
    questions: quantitativeQuestions,
  },
  {
    key: 'nonverbal',
    name: 'Nonverbal Battery',
    shortName: 'Nonverbal',
    description: 'Figures, folding, matrices, and visual logic.',
    questions: nonverbalQuestions,
  },
];

const batteryMap = new Map(batteries.map((battery) => [battery.key, battery]));

const state = {
  view: 'setup',
  studentName: '',
  selectedBattery: 'all',
  selectedSubtest: 'all',
  questions: [],
  currentIndex: 0,
  answers: [],
  checked: false,
};

const app = document.querySelector('#app');

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function getSelectedPool() {
  const battery = batteryMap.get(state.selectedBattery) ?? batteryMap.get('all');
  if (state.selectedSubtest === 'all') {
    return battery.questions;
  }
  return battery.questions.filter((question) => question.subtest === state.selectedSubtest);
}

function getAvailableSubtests() {
  const battery = batteryMap.get(state.selectedBattery) ?? batteryMap.get('all');
  return [...new Set(battery.questions.map((question) => question.subtest))].sort();
}

function getPracticeLength() {
  return Math.min(QUESTION_LIMIT, state.questions.length);
}

function renderShell(content) {
  app.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <div class="brand" aria-label="Grade 4 CogAT Practice">
          <span class="brand-mark">4</span>
          <span>CogAT Practice</span>
        </div>
        <div class="topbar-meta">Grade 4 · minimal practice</div>
      </header>
      ${content}
    </div>
  `;
}

function renderSetup() {
  const subtests = getAvailableSubtests();
  const poolCount = getSelectedPool().length;

  renderShell(`
    <main class="hero">
      <section class="intro">
        <h1>Practice one thinking skill at a time.</h1>
        <p class="lede">Choose the CogAT area you want to train, start a short focused set, then review every answer with a clear explanation.</p>
        <div class="mini-stats" aria-label="Question bank summary">
          <span class="mini-stat">${verbalQuestions.length} verbal</span>
          <span class="mini-stat">${quantitativeQuestions.length} quantitative</span>
          <span class="mini-stat">${nonverbalQuestions.length} nonverbal</span>
        </div>
      </section>

      <section class="panel setup" aria-label="Practice setup">
        <h2 class="section-title">What do you want to test?</h2>
        <p class="section-note">Pick a battery, or narrow it down to one exact subtest.</p>

        <div class="field">
          <label for="student-name">Name</label>
          <input id="student-name" autocomplete="name" placeholder="Student name" value="${escapeHtml(state.studentName)}">
        </div>

        <div class="choice-label">Battery</div>
        <div class="mode-grid">
          ${batteries.map((battery) => `
            <button class="mode-card ${state.selectedBattery === battery.key ? 'is-selected' : ''}" type="button" data-battery="${battery.key}">
              <span class="mode-name">${battery.name}</span>
              <span class="mode-desc">${battery.description}</span>
            </button>
          `).join('')}
        </div>

        <div class="field">
          <label for="subtest">Subtest</label>
          <select id="subtest">
            <option value="all">All subtests in this battery</option>
            ${subtests.map((subtest) => `<option value="${escapeHtml(subtest)}" ${state.selectedSubtest === subtest ? 'selected' : ''}>${subtest}</option>`).join('')}
          </select>
        </div>

        <div class="actions">
          <button id="start" class="primary" ${poolCount === 0 ? 'disabled' : ''}>Start ${Math.min(QUESTION_LIMIT, poolCount)} questions</button>
        </div>
      </section>
    </main>
  `);

  document.querySelector('#student-name').addEventListener('input', (event) => {
    state.studentName = event.target.value;
  });

  document.querySelectorAll('[data-battery]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedBattery = button.dataset.battery;
      state.selectedSubtest = 'all';
      renderSetup();
    });
  });

  document.querySelector('#subtest').addEventListener('change', (event) => {
    state.selectedSubtest = event.target.value;
    renderSetup();
  });

  document.querySelector('#start').addEventListener('click', startPractice);
}

function startPractice() {
  const pool = getSelectedPool();
  if (pool.length === 0) {
    return;
  }

  state.studentName = state.studentName.trim() || 'Student';
  state.questions = shuffle(pool).slice(0, QUESTION_LIMIT);
  state.answers = new Array(state.questions.length).fill(null);
  state.currentIndex = 0;
  state.checked = false;
  state.view = 'practice';
  renderPractice();
}

function renderPractice() {
  const question = state.questions[state.currentIndex];
  const total = getPracticeLength();
  const answer = state.answers[state.currentIndex];
  const selectedBattery = batteryMap.get(state.selectedBattery);
  const progress = `${Math.round(((state.currentIndex + 1) / total) * 100)}%`;

  renderShell(`
    <main class="practice-layout">
      <aside class="panel side-panel" aria-label="Practice progress">
        <div class="progress-ring" style="--progress: ${progress}">
          <span>${state.currentIndex + 1}</span>
        </div>
        <div class="side-list">
          <div><strong>${escapeHtml(state.studentName)}</strong> learner</div>
          <div><strong>${selectedBattery.shortName}</strong> battery</div>
          <div><strong>${state.selectedSubtest === 'all' ? 'All subtests' : escapeHtml(state.selectedSubtest)}</strong> focus</div>
          <div><strong>${total} questions</strong> set length</div>
        </div>
      </aside>

      <section class="panel question-panel" aria-label="Question">
        <div class="question-head">
          <span>Question ${state.currentIndex + 1} of ${total}</span>
          <span>${escapeHtml(question.subtest)}</span>
        </div>

        <div class="question-body">
          <div>
            <div>${question.question}</div>
            ${question.questionNote ? `<div class="question-note">${question.questionNote}</div>` : ''}
          </div>
        </div>

        <div class="options">
          ${question.options.map((option) => {
            const isSelected = answer === option.label;
            const isCorrect = state.checked && option.label === question.correctAnswer;
            const isWrong = state.checked && isSelected && option.label !== question.correctAnswer;
            return `
              <button class="option-card ${isSelected ? 'is-selected' : ''} ${isCorrect ? 'is-correct' : ''} ${isWrong ? 'is-wrong' : ''}" type="button" data-option="${option.label}">
                <span class="option-letter">${option.label}</span>
                <span class="option-text">${option.text}</span>
              </button>
            `;
          }).join('')}
        </div>

        ${state.checked ? `
          <div class="feedback">
            <strong>${answer === question.correctAnswer ? 'Correct.' : `Answer: ${question.correctAnswer}.`}</strong>
            ${question.explanation}
          </div>
        ` : ''}

        <div class="actions">
          <button id="quit" class="ghost" type="button">Change test</button>
          <button id="check" class="primary" type="button">${state.checked ? (state.currentIndex + 1 === total ? 'See results' : 'Next question') : 'Check answer'}</button>
        </div>
      </section>
    </main>
  `);

  document.querySelectorAll('[data-option]').forEach((button) => {
    button.addEventListener('click', () => {
      if (state.checked) {
        return;
      }
      state.answers[state.currentIndex] = button.dataset.option;
      renderPractice();
    });
  });

  document.querySelector('#check').addEventListener('click', () => {
    if (!state.checked) {
      if (!state.answers[state.currentIndex]) {
        return;
      }
      state.checked = true;
      renderPractice();
      return;
    }

    if (state.currentIndex + 1 === total) {
      state.view = 'results';
      renderResults();
      return;
    }

    state.currentIndex += 1;
    state.checked = false;
    renderPractice();
  });

  document.querySelector('#quit').addEventListener('click', () => {
    state.view = 'setup';
    renderSetup();
  });
}

function renderResults() {
  const total = getPracticeLength();
  const correctCount = state.answers.reduce((sum, answer, index) => (
    answer === state.questions[index].correctAnswer ? sum + 1 : sum
  ), 0);
  const percent = Math.round((correctCount / total) * 100);
  const bySubtest = state.questions.reduce((summary, question, index) => {
    summary[question.subtest] ??= { correct: 0, total: 0 };
    summary[question.subtest].total += 1;
    if (state.answers[index] === question.correctAnswer) {
      summary[question.subtest].correct += 1;
    }
    return summary;
  }, {});

  renderShell(`
    <main class="results-grid">
      <section class="panel score-card">
        <h1 class="section-title">Session complete.</h1>
        <p class="section-note">Nice work, ${escapeHtml(state.studentName)}. Here is the clean readout.</p>
        <div class="score-number">${percent}</div>
        <p class="section-note">${correctCount} correct out of ${total} questions.</p>

        <div class="breakdown">
          ${Object.entries(bySubtest).map(([subtest, stats]) => `
            <div class="breakdown-row">
              <span>${escapeHtml(subtest)}</span>
              <strong>${stats.correct}/${stats.total}</strong>
            </div>
          `).join('')}
        </div>

        <div class="actions">
          <button id="restart" class="primary" type="button">Practice again</button>
        </div>
      </section>

      <section class="panel review-card">
        <h2 class="section-title">Review</h2>
        <p class="section-note">Answers and explanations from this set.</p>
        <div class="review-list">
          ${state.questions.map((question, index) => {
            const answer = state.answers[index];
            const isCorrect = answer === question.correctAnswer;
            return `
              <article class="review-item">
                <strong>${index + 1}. ${escapeHtml(question.subtest)} · ${isCorrect ? 'Correct' : 'Missed'}</strong><br>
                Your answer: ${answer ?? '—'} · Correct answer: ${question.correctAnswer}<br>
                ${question.explanation}
              </article>
            `;
          }).join('')}
        </div>
      </section>
    </main>
  `);

  document.querySelector('#restart').addEventListener('click', () => {
    state.view = 'setup';
    renderSetup();
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

renderSetup();
