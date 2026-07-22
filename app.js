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
const STORAGE_KEY = 'grade4-cogat-history-v1';

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
  message: '',
  mockPartIndex: 0,
  mockResults: [],
  mockSecondsRemaining: 0,
  bankBattery: 'all',
  bankSubtest: 'all',
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
          <button class="bank-link" type="button" data-bank>题库</button>
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

  document.querySelector('[data-bank]').addEventListener('click', () => {
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
                  <div><b>${part.label}</b><small>${part.minutes} minutes - ${part.questionCount} questions</small></div>
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
            <option value="weak" ${state.mode === 'weak' ? 'selected' : ''}>Weak areas</option>
            <option value="very-hard" ${state.mode === 'very-hard' ? 'selected' : ''}>Very hard only</option>
            <option value="pdf" ${state.mode === 'pdf' ? 'selected' : ''}>PDF workbook only</option>
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
  const difficulty = getDifficulty(question);

  renderShell(`
    <section class="panel practice">
      <div class="practice-head">
        <div class="question-kicker">
          <span>${state.currentIndex + 1}/${total}</span>
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
            <button class="option ${selected ? 'selected' : ''} ${correct ? 'correct' : ''} ${wrong ? 'wrong' : ''}" type="button" data-option="${escapeHtml(optionValue)}">
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
        <h1>题库</h1>
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
    startPractice();
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

document.addEventListener('keydown', handleKeyboard);
render();
