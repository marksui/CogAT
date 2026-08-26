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
import { bonusQuestions } from './data/bonusQuestions.js';
import { supabaseConfig } from './supabase-config.js';

const QUESTION_LIMIT = 30;
const DEFAULT_DAILY_GOAL = 30;
const STORAGE_KEY = 'grade4-cogat-history-v2';
const LEGACY_STORAGE_KEY = 'grade4-cogat-history-v1';

const rawQuestionSets = {
  verbal: [...verbalQuestions, ...verbalExtraQuestions, ...verbalWorkbookQuestions, ...level10OriginalQuestions.filter((question) => question.battery === 'Verbal Battery'), ...g4WorkbookQuestions.filter((question) => question.battery === 'Verbal Battery'), ...bonusQuestions.filter((question) => question.battery === 'Verbal Battery')],
  quantitative: [...quantitativeQuestions, ...quantitativeExtraQuestions, ...level10OriginalQuestions.filter((question) => question.battery === 'Quantitative Battery'), ...g4WorkbookQuestions.filter((question) => question.battery === 'Quantitative Battery'), ...bonusQuestions.filter((question) => question.battery === 'Quantitative Battery')],
  nonverbal: [...nonverbalQuestions, ...nonverbalExtraQuestions, ...mockExamQuestions, ...level10OriginalQuestions.filter((question) => question.battery === 'Nonverbal Battery'), ...g4WorkbookQuestions.filter((question) => question.battery === 'Nonverbal Battery'), ...bonusQuestions.filter((question) => question.battery === 'Nonverbal Battery')],
};

function normalizeQuestionContent(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function getQuestionDedupKeys(question) {
  const prompt = normalizeQuestionContent(question.question);
  const note = normalizeQuestionContent(question.questionNote);
  const options = (question.options ?? []).map((option) => `${option.label}:${normalizeQuestionContent(option.text)}`).join('|');
  const exactKey = `exact|${question.battery}|${question.subtest}|${prompt}|${note}|${options}|${getCorrectAnswer(question)}`;
  const isPlainTextPrompt = !/<[a-z][\s\S]*>/i.test(prompt);
  const correctOption = (question.options ?? []).find((option) => getOptionValue(option) === getCorrectAnswer(question));
  const meaningKey = isPlainTextPrompt && correctOption
    ? `meaning|${question.battery}|${question.subtest}|${prompt}|${note}|${normalizeQuestionContent(correctOption.text)}`
    : '';
  return [exactKey, meaningKey].filter(Boolean);
}

function dedupeQuestions(questions) {
  const seen = new Set();
  return questions.filter((question) => {
    const keys = getQuestionDedupKeys(question);
    if (keys.some((key) => seen.has(key))) {
      return false;
    }
    keys.forEach((key) => seen.add(key));
    return true;
  });
}

const questionSets = Object.fromEntries(Object.entries(rawQuestionSets).map(([battery, questions]) => [battery, dedupeQuestions(questions)]));

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

const MOCK_FORM_ID = 'level-10-form-a';
const MOCK_DIFFICULTY_ORDER = ['easy', 'medium', 'hard', 'very-hard'];
const MOCK_DIFFICULTY_RANK = Object.fromEntries(MOCK_DIFFICULTY_ORDER.map((difficulty, index) => [difficulty, index]));

const BADGE_REWARDS = {
  basic: 5,
  medium: 10,
  advanced: 20,
};

const BADGE_DEFINITIONS = [
  { id: 'first-step', name: 'First Step', description: 'Complete your first question.', icon: 'steps', artwork: 'checklist', category: 'Practice Count', tier: 'basic', price: 30 },
  { id: 'getting-started', name: 'Getting Started', description: 'Complete 10 questions.', icon: 'spark', artwork: 'star', category: 'Practice Count', tier: 'basic', price: 35 },
  { id: 'question-explorer', name: 'Question Explorer', description: 'Complete 50 questions.', icon: 'map', artwork: 'book', category: 'Practice Count', tier: 'medium', price: 45 },
  { id: 'century-club', name: 'Century Club', description: 'Complete 100 questions.', icon: 'medal', artwork: 'shapes', category: 'Practice Count', tier: 'advanced', price: 75 },
  { id: 'practice-champion', name: 'Practice Champion', description: 'Complete 500 questions.', icon: 'trophy', artwork: 'puzzle', category: 'Practice Count', tier: 'advanced', price: 100 },
  { id: 'first-correct', name: 'First Correct', description: 'Answer your first question correctly.', icon: 'check', artwork: 'medal', category: 'Correct Answers', tier: 'basic', price: 30 },
  { id: 'sharp-thinker', name: 'Sharp Thinker', description: 'Answer 25 questions correctly.', icon: 'bolt', artwork: 'maze', category: 'Correct Answers', tier: 'medium', price: 50 },
  { id: 'brain-builder', name: 'Brain Builder', description: 'Answer 100 questions correctly.', icon: 'brain', artwork: 'cards', category: 'Correct Answers', tier: 'advanced', price: 85 },
  { id: 'word-wizard', name: 'Word Wizard', description: 'Answer 30 Verbal Battery questions correctly.', icon: 'book', artwork: 'book', category: 'Battery Mastery', tier: 'medium', price: 55 },
  { id: 'number-ninja', name: 'Number Ninja', description: 'Answer 30 Quantitative Battery questions correctly.', icon: 'numbers', artwork: 'abacus', category: 'Battery Mastery', tier: 'medium', price: 55 },
  { id: 'pattern-pro', name: 'Pattern Pro', description: 'Answer 30 Nonverbal Battery questions correctly.', icon: 'pattern', artwork: 'shapes', category: 'Battery Mastery', tier: 'medium', price: 55 },
  { id: 'perfect-set', name: 'Perfect Set', description: 'Finish a practice set of at least 10 questions with every answer correct.', icon: 'star', artwork: 'star', category: 'Special', tier: 'medium', price: 60 },
  { id: 'comeback-kid', name: 'Comeback Kid', description: 'Correctly answer a question you missed before.', icon: 'return', artwork: 'checklist', category: 'Special', tier: 'basic', price: 40 },
  { id: 'mock-exam-finisher', name: 'Mock Exam Finisher', description: 'Complete one full mock exam.', icon: 'clock', artwork: 'medal', category: 'Special', tier: 'medium', price: 70 },
  { id: 'balanced-brain', name: 'Balanced Brain', description: 'Complete at least 20 questions in each Battery.', icon: 'balance', artwork: 'lightbulb', category: 'Special', tier: 'medium', price: 65 },
  { id: 'jewel-maze', name: 'Royal Maze', description: 'A jeweled maze keepsake.', icon: 'maze', artwork: 'jewel-maze', category: 'Collectible', tier: 'advanced', price: 80 },
  { id: 'jewel-puzzle', name: 'Jewel Puzzle', description: 'A sparkling puzzle keepsake.', icon: 'puzzle', artwork: 'jewel-puzzle', category: 'Collectible', tier: 'advanced', price: 85 },
  { id: 'jewel-shapes', name: 'Shape Parade', description: 'A jeweled shape keepsake.', icon: 'shapes', artwork: 'jewel-shapes', category: 'Collectible', tier: 'advanced', price: 75 },
  { id: 'jewel-crown', name: 'Heart Crown', description: 'A royal heart keepsake.', icon: 'crown', artwork: 'jewel-crown', category: 'Collectible', tier: 'advanced', price: 90 },
  { id: 'jewel-cards', name: 'Card Collection', description: 'A sparkling card keepsake.', icon: 'cards', artwork: 'jewel-cards', category: 'Collectible', tier: 'advanced', price: 70 },
  { id: 'story-owl', name: 'Story Owl', description: 'A sunset storybook keepsake.', icon: 'book', artwork: 'story-owl', category: 'Collectible', tier: 'advanced', price: 80 },
  { id: 'trail-marker', name: 'Trail Marker', description: 'A cheerful adventure keepsake.', icon: 'map', artwork: 'trail-marker', category: 'Collectible', tier: 'advanced', price: 75 },
  { id: 'acorn-friend', name: 'Acorn Friend', description: 'A woodland friend keepsake.', icon: 'spark', artwork: 'acorn-friend', category: 'Collectible', tier: 'advanced', price: 85 },
  { id: 'shape-garden', name: 'Shape Garden', description: 'A playful shape keepsake.', icon: 'pattern', artwork: 'shape-garden', category: 'Collectible', tier: 'advanced', price: 70 },
  { id: 'meadow-cards', name: 'Meadow Cards', description: 'A garden card keepsake.', icon: 'cards', artwork: 'meadow-cards', category: 'Collectible', tier: 'advanced', price: 75 },
];

const SHOP_THEMES = [
  { id: 'blue', kind: 'theme', name: 'Blue', description: 'The default CogAT color.', price: 0 },
  { id: 'black', kind: 'theme', name: 'Black', description: 'A sharp deep-ink color.', price: 20 },
  { id: 'forest', kind: 'theme', name: 'Deep Green', description: 'A calm evergreen color.', price: 20 },
  { id: 'crimson', kind: 'theme', name: 'Deep Red', description: 'A bold berry-red color.', price: 20 },
  { id: 'gold', kind: 'theme', name: 'Gold', description: 'A bright golden color.', price: 20 },
  { id: 'purple', kind: 'theme', name: 'Purple', description: 'A bright violet color.', price: 20 },
  { id: 'pink', kind: 'theme', name: 'Pink', description: 'A playful rosy color.', price: 20 },
  { id: 'navy', kind: 'theme', name: 'Deep Blue', description: 'A rich navy color.', price: 20 },
  { id: 'white', kind: 'theme', name: 'White', description: 'A clean white color.', price: 20 },
];

const SHOP_DECOR = [
  { id: 'star-frame', kind: 'decor', name: 'Star Frame', description: 'A bright accent for your Today card.', price: 25, icon: 'frame' },
  { id: 'spark-card', kind: 'decor', name: 'Spark Card', description: 'A little extra energy for daily practice.', price: 30, icon: 'spark-card' },
  { id: 'study-shelf', kind: 'decor', name: 'Study Shelf', description: 'A tidy learning-room accent.', price: 35, icon: 'shelf' },
  { id: 'focus-ring', kind: 'decor', name: 'Focus Ring', description: 'A calm focus accent for your dashboard.', price: 40, icon: 'ring' },
];

const SHOP_ITEMS = [...SHOP_THEMES, ...SHOP_DECOR];

const batteryMap = new Map(batteries.map((battery) => [battery.key, battery]));
const allQuestions = batteries[0].questions;
const questionById = new Map(Object.values(rawQuestionSets).flat().map((question) => [String(question.id), question]));

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
  dailyGoal: DEFAULT_DAILY_GOAL,
  sessionKind: 'custom',
  message: '',
  mockPartIndex: 0,
  mockResults: [],
  mockSecondsRemaining: 0,
  mockConfirmFinish: false,
  mockConfirmExamSubmit: false,
  mockSubmittedEarly: false,
  mockExitConfirm: false,
  mockMode: 'sheet',
  gameCenterTab: 'badges',
  practiceCoinMessage: '',
  bankBattery: 'all',
  bankSubtest: 'all',
};

const app = document.querySelector('#app');
let mockTimerHandle = null;
let supabase = null;
let cloudSyncTimer = null;
let authMode = 'signin';
let authMenuOpen = false;
let aboutMenuOpen = false;
let adminTestModeOpen = false;
let customPracticeOpen = false;
let coinDisplayValue = null;
let coinAnimationHandle = null;
const authState = {
  status: 'checking',
  user: null,
  message: '',
  syncStatus: 'local',
};
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
  if (state.view === 'mock-intro') {
    renderMockIntro();
    return;
  }
  if (state.view === 'mock-break') {
    renderMockBreak();
    return;
  }
  if (state.view === 'game-center') {
    renderGameCenter();
    return;
  }
  if (state.view === 'bank') {
    renderQuestionBank();
    return;
  }
  renderSetup();
}

function renderShell(content) {
  document.body.dataset.theme = getActiveTheme();
  document.body.dataset.decor = getActiveDecor()?.id ?? 'none';
  app.innerHTML = `
    <main class="app-shell">
      <header class="topbar">
        <div class="brand-row">
          <button class="wordmark" type="button" data-home>CogAT 4</button>
          <details class="about-menu" ${aboutMenuOpen ? 'open' : ''}>
            <summary aria-label="About this site">?</summary>
            <div class="about-card">
              <div class="about-head">
                <span class="about-kicker">About</span>
                <b>CogAT 4</b>
                <small>Updated July 27, 2026.</small>
              </div>
              <p>Focused Grade 4 practice for verbal, quantitative, and nonverbal questions.</p>
              <div class="about-points">
                <span><b>Practice</b> One-tap 30-question daily practice and question bank.</span>
                <span><b>Test mode</b> Timed mock exam with section checkpoints.</span>
                <span><b>Rewards</b> Coins, badges, and cosmetic items in Game Center.</span>
              </div>
              <div class="about-foot">
                <span>Progress stays local, with optional sync and JSON backup.</span>
                <a href="https://github.com/marksui/CogAT" target="_blank" rel="noopener noreferrer">View source</a>
              </div>
              <details class="about-admin" ${adminTestModeOpen ? 'open' : ''}>
                <summary><span>Admin test mode</span><small>Local only</small></summary>
                <div class="about-admin-body">
                  <p>Preview reward states without changing question progress.</p>
                  <div class="about-admin-actions">
                    <button class="ghost" type="button" id="admin-add-coins">+100 coins</button>
                    <button class="ghost" type="button" id="admin-unlock-badges">Unlock badges</button>
                    <button class="ghost" type="button" id="admin-reset-rewards">Reset rewards</button>
                  </div>
                </div>
              </details>
            </div>
          </details>
          <button class="bank-link" type="button" data-bank>Question bank</button>
        </div>
        <div class="topbar-actions">
          ${renderCoinButton()}
          ${renderAuthControl()}
          <span class="question-count">${allQuestions.length} questions</span>
        </div>
      </header>
      ${content}
    </main>
  `;

  document.querySelector('[data-home]').addEventListener('click', () => {
    authMenuOpen = false;
    aboutMenuOpen = false;
    adminTestModeOpen = false;
    goHome();
  });

  document.querySelector('[data-bank]').addEventListener('click', () => {
    authMenuOpen = false;
    aboutMenuOpen = false;
    adminTestModeOpen = false;
    persistActiveSession();
    stopMockTimer();
    state.view = 'bank';
    state.examType = 'practice';
    state.message = '';
    render();
  });

  document.querySelector('[data-game-center]')?.addEventListener('click', () => {
    authMenuOpen = false;
    aboutMenuOpen = false;
    adminTestModeOpen = false;
    persistActiveSession();
    stopMockTimer();
    state.view = 'game-center';
    state.message = '';
    render();
  });

  document.querySelector('#auth-form')?.addEventListener('submit', sendMagicLink);
  document.querySelector('[data-sign-out]')?.addEventListener('click', signOut);
  document.querySelector('.auth-menu')?.addEventListener('toggle', (event) => {
    authMenuOpen = event.target.open;
  });
  document.querySelector('.about-menu')?.addEventListener('toggle', (event) => {
    aboutMenuOpen = event.target.open;
  });
  document.querySelector('.about-admin')?.addEventListener('toggle', (event) => {
    adminTestModeOpen = event.target.open;
  });
  document.querySelector('#admin-add-coins')?.addEventListener('click', adminAddCoins);
  document.querySelector('#admin-unlock-badges')?.addEventListener('click', adminUnlockBadges);
  document.querySelector('#admin-reset-rewards')?.addEventListener('click', adminResetRewards);
  document.querySelectorAll('[data-auth-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      authMode = button.dataset.authMode;
      authState.message = '';
      authMenuOpen = true;
      render();
    });
  });
}

function renderCoinButton() {
  const coins = coinDisplayValue ?? state.history.currentCoins ?? 0;
  return `<button class="coin-button" type="button" data-game-center aria-label="Open game center, ${coins} coins">${renderCoinIcon()}<span data-coin-count>${coins}</span></button>`;
}

function adminAddCoins() {
  aboutMenuOpen = true;
  adminTestModeOpen = true;
  awardCoins(100, 'admin', 'Admin test coins');
  saveHistory();
  render();
}

function adminUnlockBadges() {
  aboutMenuOpen = true;
  adminTestModeOpen = true;
  BADGE_DEFINITIONS.forEach((definition) => {
    if (state.history.badges.some((badge) => badge.id === definition.id)) {
      return;
    }
    state.history.badges.push({
      id: definition.id,
      name: definition.name,
      description: definition.description,
      icon: definition.icon,
      category: definition.category,
      unlockedAt: new Date().toISOString(),
    });
  });
  state.history.updatedAt = new Date().toISOString();
  saveHistory();
  render();
}

function adminResetRewards() {
  aboutMenuOpen = true;
  adminTestModeOpen = true;
  state.history.currentCoins = 0;
  state.history.lifetimeCoins = 0;
  state.history.badges = [];
  state.history.claimedMilestones = {};
  state.history.coinHistory = [];
  state.history.shop = { owned: ['blue'], equipped: 'blue', decor: '' };
  state.history.updatedAt = new Date().toISOString();
  saveHistory();
  render();
}

function renderAuthControl() {
  const syncIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 0 1-14.6 7.05"/><path d="M3 12a9 9 0 0 1 14.6-7.05"/><path d="M7 19H4v-3M17 5h3v3"/></svg>';

  if (authState.status === 'checking') {
    return `<span class="sync-status is-checking"><span class="sync-dot checking"></span>${syncIcon}<span>Checking</span></span>`;
  }

  if (authState.status === 'signed-in' && authState.user) {
    const syncLabel = authState.syncStatus === 'syncing' ? 'Syncing…' : authState.syncStatus === 'error' ? 'Sync issue' : 'Synced';
    return `<details class="auth-menu" ${authMenuOpen ? 'open' : ''}><summary aria-label="${syncLabel}">${syncIcon}<span class="sync-dot ${authState.syncStatus}"></span><span>${syncLabel}</span></summary><div class="auth-card"><div class="auth-card-head"><b>Cloud sync</b><span>${escapeHtml(authState.user.email ?? 'Signed-in account')}</span></div><button class="ghost auth-signout" type="button" data-sign-out>Sign out</button>${authState.message ? `<small class="auth-message">${escapeHtml(authState.message)}</small>` : ''}</div></details>`;
  }

  const isConfigured = Boolean(supabaseConfig.url && supabaseConfig.publishableKey);
  const isSigningUp = authMode === 'signup';
  const actionLabel = isSigningUp ? 'Create' : 'Send link';
  return `<details class="auth-menu" ${authMenuOpen ? 'open' : ''}><summary aria-label="Sync progress">${syncIcon}<span class="sync-dot local"></span><span>Sync</span></summary><div class="auth-card"><div class="auth-card-head"><b>Sync progress</b><span>${isConfigured ? 'Email link' : 'Setup needed'}</span></div>${isConfigured ? `<div class="auth-mode-switch" role="group" aria-label="Account access"><button class="auth-mode-button ${!isSigningUp ? 'is-selected' : ''}" type="button" data-auth-mode="signin" aria-pressed="${!isSigningUp}">Sign in</button><button class="auth-mode-button ${isSigningUp ? 'is-selected' : ''}" type="button" data-auth-mode="signup" aria-pressed="${isSigningUp}">Create</button></div><form id="auth-form" class="auth-form"><label><span>Email</span><input id="auth-email" type="email" autocomplete="email" placeholder="you@example.com" required></label><button class="primary" type="submit">${actionLabel}</button></form>` : `<small class="auth-message">Add Supabase details to enable sync.</small>`}${authState.message ? `<small class="auth-message">${escapeHtml(authState.message)}</small>` : ''}</div></details>`;
}

function renderDashboardIcon(name) {
  const icons = {
    missed: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h9a6 6 0 1 1-4.24 10.24"/><path d="M4 8l4-4M4 8l4 4"/></svg>',
    new: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    mock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="7"/><path d="M12 13V9M12 13l3 2M9 2h6"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  };
  return icons[name] ?? '';
}

function renderCoinIcon() {
  return '<svg class="coin-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 7v10M9 9.5h5.25a2.25 2.25 0 0 1 0 4.5H9"/></svg>';
}

function renderBadgeIcon(name) {
  const icons = {
    steps: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 19h10M8 15h8M10 11h4M12 5v6"/></svg>',
    spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15z"/></svg>',
    map: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l-5 2V6l5-2 6 2 5-2v14l-5 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>',
    medal: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3l4 6 4-6M12 9a6 6 0 1 0 0 12 6 6 0 0 0 0-12z"/><path d="M12 13v4M10 15h4"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v4a4 4 0 0 1-8 0V4z"/><path d="M8 6H4a4 4 0 0 0 4 4M16 6h4a4 4 0 0 1-4 4M12 12v5M9 20h6"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2L5 14h6l-1 8 9-13h-6l0-7z"/></svg>',
    brain: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5a3 3 0 0 0-3 3 3.5 3.5 0 0 0-1 6.8A4 4 0 0 0 9 20V5z"/><path d="M15 5a3 3 0 0 1 3 3 3.5 3.5 0 0 1 1 6.8A4 4 0 0 1 15 20V5z"/><path d="M9 9h3M12 15h3"/></svg>',
    book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H20v17H8.5A3.5 3.5 0 0 0 5 22V5.5z"/><path d="M5 5.5A3.5 3.5 0 0 0 1.5 2H1v17h.5A3.5 3.5 0 0 1 5 22"/></svg>',
    numbers: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4v16M4 6h4M4 18h4M12 7a3 3 0 0 1 6 0c0 4-6 4-6 9h6"/></svg>',
    pattern: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1"/><circle cx="17" cy="7" r="3"/><path d="M7 14l4 6H3l4-6z"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3z"/></svg>',
    return: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h10a6 6 0 1 1-4.2 10.2"/><path d="M4 9l4-4M4 9l4 4"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="7"/><path d="M12 13V9M12 13l3 2M9 2h6"/></svg>',
    balance: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M5 7h14M7 7l-4 7h8L7 7zM17 7l-4 7h8l-4-7z"/></svg>',
  };
  return icons[name] ?? icons.star;
}

function renderBadgeArtwork(definition) {
  return `<img src="assets/badges/${definition.artwork}.png" alt="" width="320" height="320" loading="lazy" decoding="async">`;
}

function renderShopIcon(name) {
  const icons = {
    frame: '<svg viewBox="0 0 72 54" aria-hidden="true"><rect x="8" y="8" width="56" height="38" rx="10"/><rect x="18" y="17" width="36" height="20" rx="6"/><path d="M23 27h26"/></svg>',
    'spark-card': '<svg viewBox="0 0 72 54" aria-hidden="true"><rect x="10" y="9" width="52" height="36" rx="10"/><path d="M36 16l2.4 6.8L45 25l-6.6 2.2L36 34l-2.4-6.8L27 25l6.6-2.2L36 16z"/></svg>',
    shelf: '<svg viewBox="0 0 72 54" aria-hidden="true"><path d="M12 39h48M18 15h36v18H18z"/><path d="M26 33V21M36 33V21M46 33V21"/></svg>',
    ring: '<svg viewBox="0 0 72 54" aria-hidden="true"><circle cx="36" cy="27" r="17"/><circle cx="36" cy="27" r="8"/><path d="M36 5v8M36 41v8M14 27h8M50 27h8"/></svg>',
  };
  return icons[name] ?? icons.frame;
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
    <section class="panel daily-card ${dailyComplete ? 'is-complete' : ''}">
      <div class="daily-copy">
        <span class="eyebrow daily-eyebrow">Today&rsquo;s practice</span>
        <h1>${dailyComplete ? 'Great work!' : hasActiveDaily ? 'Keep going!' : 'Ready to think?'}</h1>
        <p class="daily-message">${dailyComplete ? 'Your 30-question goal is complete. Start another mixed set whenever you want.' : hasActiveDaily ? 'Your 30-question practice is saved exactly where you left it.' : 'One smart mix of verbal, quantitative, and nonverbal questions.'}</p>
        <div class="daily-highlights" aria-label="Today&rsquo;s learning highlights">
          <span><b>${summary.streak}</b> day streak</span>
          <span><b>${summary.totalAnswered}</b> answered</span>
          <span>${renderCoinIcon()}<b>${state.history.currentCoins}</b> coins</span>
        </div>
        <div class="daily-start-row">
          <button class="primary daily-cta" type="button" data-start-daily>${dailyComplete ? 'Start 30 more' : hasActiveDaily ? 'Continue practice' : 'Start 30 questions'}</button>
          <small>No timer &middot; progress saves automatically</small>
        </div>
      </div>
      <div class="daily-visual">
        <div class="home-decoration" aria-hidden="true">${renderShopIcon(getActiveDecor()?.icon ?? 'spark-card')}</div>
        <div class="daily-progress-wrap">
          <div class="daily-progress" style="--progress:${dailyPercent}%" aria-label="${daily.answered} of ${dailyGoal} questions complete">
            <div><strong>${daily.answered}</strong><span>of ${dailyGoal} done</span></div>
          </div>
          <div class="daily-plan-label"><b>30 questions</b><span>Smart mixed practice</span></div>
        </div>
      </div>
    </section>

    <section class="dashboard-grid">
      <div class="panel progress-panel">
        <div class="section-heading"><h2>Progress</h2></div>
        <div class="progress-list">
          ${batteries.filter((battery) => battery.key !== 'all').map((battery) => {
            const item = getBatteryProgress(battery.key);
            return `<div class="progress-row"><b>${battery.label}</b><strong>${item.accuracy === null ? 'Ready' : `${item.accuracy}%`}</strong></div>`;
          }).join('')}
        </div>
      </div>

      <div class="panel quick-panel">
        <div class="section-heading"><h2>More practice</h2></div>
        <div class="quick-actions">
          <button class="quick-action" type="button" data-quick-mode="missed"><span class="quick-action-icon">${renderDashboardIcon('missed')}</span><b>Missed</b><span class="arrow">${renderDashboardIcon('arrow')}</span></button>
          <button class="quick-action" type="button" data-quick-mode="new"><span class="quick-action-icon">${renderDashboardIcon('new')}</span><b>New</b><span class="arrow">${renderDashboardIcon('arrow')}</span></button>
          <button class="quick-action" type="button" data-quick-mock><span class="quick-action-icon">${renderDashboardIcon('mock')}</span><b>Mock Exam</b><span class="arrow">${renderDashboardIcon('arrow')}</span></button>
        </div>
      </div>
    </section>

    <section class="panel custom-practice home-advanced">
      <details id="custom-practice-details" ${customPracticeOpen ? 'open' : ''}>
        <summary class="custom-practice-summary">
          <span><b>Build a custom practice set</b><small>Choose a Battery, Subtest, or review mode.</small></span>
          <span class="custom-summary-arrow">${renderDashboardIcon('arrow')}</span>
        </summary>
        <div class="custom-practice-body">
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
        </div>
      </details>
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

  document.querySelector('#custom-practice-details').addEventListener('toggle', (event) => {
    customPracticeOpen = event.currentTarget.open;
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
    startMockIntro();
  });

  document.querySelector('#export-history').addEventListener('click', exportHistory);
  document.querySelector('#import-history').addEventListener('click', () => document.querySelector('#history-file').click());
  document.querySelector('#history-file').addEventListener('change', importHistory);
  document.querySelector('#clear-history').addEventListener('click', clearHistory);

  if (state.examType === 'mock') {
    document.querySelector('#setup-form').addEventListener('submit', (event) => {
      event.preventDefault();
      startMockIntro();
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
  const isCorrect = answer === getCorrectAnswer(question);

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
          <b>${isCorrect ? 'Correct! You earned 1 coin.' : 'Nice work &mdash; you earned 1 coin for practicing.'}</b>
          ${!isCorrect ? `<small>Correct answer: ${getCorrectAnswer(question)}</small>` : ''}
          <span>${question.explanation}</span>
          <span class="coin-reward-pill">${renderCoinIcon()}+1 Coin</span>
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
      const rewardOrigin = document.querySelector('.option.selected') ?? document.querySelector('.question-card');
      state.checked = true;
      state.practiceCoinMessage = answer === getCorrectAnswer(question) ? 'correct' : 'practice';
      recordAnswer(question, answer, { save: false });
      awardCoins(1, 'practice', 'Practice answer', { animate: true, originElement: rewardOrigin });
      saveHistory();
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
      state.practiceCoinMessage = '';
      persistActiveSession();
    }
    render();
  });

  document.querySelector('#back').addEventListener('click', () => {
    goHome();
  });
}

function renderMockIntro() {
  const totalQuestions = mockParts.reduce((sum, part) => sum + part.questionCount, 0);
  const totalMinutes = mockParts.reduce((sum, part) => sum + part.minutes, 0);

  renderShell(`
    <section class="panel mock-launch">
      <div class="mock-launch-head">
        <span class="eyebrow">Mock exam</span>
        <h1>Level 10 Form A</h1>
        <div class="mock-exam-stats" aria-label="Mock exam summary">
          <span><b>${mockParts.length}</b> parts</span>
          <span><b>${totalQuestions}</b> questions</span>
          <span><b>${totalMinutes}</b> minutes</span>
        </div>
      </div>

      <div class="mock-rules" aria-label="Exam rules">
        <div><b>10-minute sections</b><span>Each subtest starts its own clock.</span></div>
        <div><b>Exam pacing</b><span>Questions progress from easier items to harder items.</span></div>
        <div><b>Final scoring</b><span>Blank answers count as missed.</span></div>
      </div>

      <div class="mock-mode-picker" role="radiogroup" aria-label="Mock exam layout">
        <button class="${state.mockMode === 'sheet' ? 'selected' : ''}" type="button" role="radio" aria-checked="${state.mockMode === 'sheet'}" data-mock-mode="sheet">
          <b>Worksheet</b>
          <span>Default exam layout with question navigation.</span>
        </button>
        <button class="${state.mockMode === 'bubble' ? 'selected' : ''}" type="button" role="radio" aria-checked="${state.mockMode === 'bubble'}" data-mock-mode="bubble">
          <b>Bubble sheet</b>
          <span>Read prompts on the left and fill A-E bubbles on the answer sheet.</span>
        </button>
        <button class="${state.mockMode === 'guided' ? 'selected' : ''}" type="button" role="radio" aria-checked="${state.mockMode === 'guided'}" data-mock-mode="guided">
          <b>Question by question</b>
          <span>One question at a time with a jump card.</span>
        </button>
      </div>

      <div class="mock-section-strip" aria-label="Exam parts">
        ${mockParts.map((part, index) => `<div class="mock-section-pill"><span>${index + 1}</span><b>${part.label}</b><small>${part.minutes}m - ${part.questionCount}q</small></div>`).join('')}
      </div>

      <div class="footer-actions">
        <button class="ghost" type="button" id="mock-cancel">Back</button>
        <button class="primary" type="button" id="mock-start">Start exam</button>
      </div>
    </section>
  `);

  document.querySelectorAll('[data-mock-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      state.mockMode = button.dataset.mockMode;
      renderMockIntro();
    });
  });
  document.querySelector('#mock-start').addEventListener('click', startMockExam);
  document.querySelector('#mock-cancel').addEventListener('click', () => {
    state.view = 'setup';
    state.examType = 'mock';
    render();
  });
}

function renderMockBreak() {
  const completed = state.mockResults[state.mockResults.length - 1];
  const nextPart = mockParts[state.mockPartIndex];
  const completedCount = state.mockResults.length;

  renderShell(`
    <section class="panel mock-break">
      <span class="eyebrow">Section checkpoint</span>
      <h1>Part complete</h1>
      <div class="mock-break-summary">
        <div><span>Finished</span><b>${escapeHtml(completed.label)}</b></div>
        <div><span>Answered</span><b>${completed.total - completed.unanswered}/${completed.total}</b></div>
        <div><span>Time used</span><b>${formatTime(completed.secondsUsed)}</b></div>
      </div>

      <div class="mock-next-card">
        <span>Next part</span>
        <b>${escapeHtml(nextPart.label)}</b>
        <small>${nextPart.minutes} minutes - ${nextPart.questionCount} questions</small>
      </div>

      <div class="mock-progress-steps" aria-label="Mock exam progress">
        ${mockParts.map((part, index) => `<span class="${index < completedCount ? 'done' : index === state.mockPartIndex ? 'current' : ''}">${index + 1}</span>`).join('')}
      </div>

      <div class="footer-actions">
        <button class="ghost" type="button" id="exit-mock">Leave exam</button>
        <button class="ghost mock-submit-now" type="button" id="submit-mock-now">Submit exam now</button>
        <button class="primary" type="button" id="continue-mock">Start next part</button>
      </div>
    </section>
    ${renderMockExitDialog()}
    ${renderMockExamSubmitDialog()}
  `);

  document.querySelector('#continue-mock').addEventListener('click', startMockPart);
  document.querySelector('#exit-mock').addEventListener('click', requestMockExit);
  document.querySelector('#submit-mock-now').addEventListener('click', requestMockExamSubmit);
  attachMockExitDialogHandlers();
  attachMockExamSubmitDialogHandlers();
}

function renderMockPractice() {
  if (state.mockMode === 'sheet') {
    renderMockSheetPractice();
    return;
  }
  if (state.mockMode === 'bubble') {
    renderMockBubblePractice();
    return;
  }
  renderMockGuidedPracticeWithCard();
}

function renderMockAnswerCard() {
  const part = mockParts[state.mockPartIndex];
  const answeredCount = state.answers.filter(Boolean).length;
  const total = state.questions.length;

  return `
    <aside class="mock-answer-card" aria-label="Mock exam answer card">
      <div class="mock-answer-head">
        <span>Answer card</span>
        <b>${answeredCount}/${total}</b>
      </div>
      <div class="mock-answer-meta">
        <span>Part ${state.mockPartIndex + 1}</span>
        <strong>${escapeHtml(part.label)}</strong>
      </div>
      <div class="mock-answer-grid" role="list" aria-label="Questions">
        ${state.questions.map((question, index) => {
          const isCurrent = index === state.currentIndex;
          const isAnswered = Boolean(state.answers[index]);
          return `<button class="mock-answer-button ${isCurrent ? 'current' : ''} ${isAnswered ? 'answered' : 'blank'}" type="button" data-mock-jump="${index}" aria-label="Go to question ${index + 1}${isAnswered ? ', answered' : ', blank'}" aria-current="${isCurrent ? 'true' : 'false'}">${index + 1}</button>`;
        }).join('')}
      </div>
      <div class="mock-answer-legend" aria-hidden="true">
        <span><i class="current"></i>Current</span>
        <span><i class="answered"></i>Answered</span>
        <span><i></i>Blank</span>
      </div>
    </aside>
  `;
}

function attachMockAnswerCardHandlers({ renderOnJump = true } = {}) {
  document.querySelectorAll('[data-mock-jump]').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.mockJump);
      state.currentIndex = index;
      state.mockConfirmFinish = false;
      if (renderOnJump) {
        renderMockPractice();
        return;
      }
      updateMockAnswerCardState();
      updateMockSheetCurrentQuestion(index);
      resetMockSheetSubmitPrompt();
      scrollToMockQuestion(index);
    });
  });
}

function updateMockAnswerCardState() {
  const answeredCount = state.answers.filter(Boolean).length;
  document.querySelector('.mock-answer-head b')?.replaceChildren(document.createTextNode(`${answeredCount}/${state.questions.length}`));
  document.querySelectorAll('[data-mock-jump]').forEach((button) => {
    const index = Number(button.dataset.mockJump);
    const isCurrent = index === state.currentIndex;
    const isAnswered = Boolean(state.answers[index]);
    button.classList.toggle('current', isCurrent);
    button.classList.toggle('answered', isAnswered);
    button.classList.toggle('blank', !isAnswered);
    button.setAttribute('aria-current', isCurrent ? 'true' : 'false');
    button.setAttribute('aria-label', `Go to question ${index + 1}${isAnswered ? ', answered' : ', blank'}`);
  });
  document.querySelector('[data-sheet-answered]')?.replaceChildren(document.createTextNode(`${answeredCount}/${state.questions.length} answered`));
  const sectionProgress = ((state.mockPartIndex + answeredCount / state.questions.length) / mockParts.length) * 100;
  const progressBar = document.querySelector('.mock-sheet .mock-progress-rail span');
  if (progressBar) {
    progressBar.style.width = `${sectionProgress}%`;
  }
}

function resetMockSheetSubmitPrompt() {
  document.querySelector('#mock-next')?.replaceChildren(document.createTextNode('Submit part'));
}

function updateMockSheetCurrentQuestion(index) {
  document.querySelectorAll('.mock-sheet-question').forEach((questionElement, questionIndex) => {
    questionElement.classList.toggle('current', questionIndex === index);
  });
}

function scrollToMockQuestion(index) {
  window.requestAnimationFrame(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelector(`#mock-question-${index}`)?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  });
}

function renderMockExitDialog() {
  if (!state.mockExitConfirm) {
    return '';
  }

  return `
    <div class="mock-exit-backdrop" role="presentation">
      <div class="mock-exit-dialog" role="dialog" aria-modal="true" aria-labelledby="mock-exit-title" aria-describedby="mock-exit-copy">
        <h2 id="mock-exit-title">Leave exam?</h2>
        <p id="mock-exit-copy">Your answers in this section will not be submitted.</p>
        <div class="mock-exit-actions">
          <button class="ghost" type="button" id="mock-stay">Stay</button>
          <button class="primary danger" type="button" id="mock-confirm-exit">Leave exam</button>
        </div>
      </div>
    </div>
  `;
}

function renderMockSubmitDialog(unansweredCount) {
  if (!state.mockConfirmFinish) {
    return '';
  }

  return `
    <div class="mock-exit-backdrop" role="presentation">
      <div class="mock-exit-dialog mock-submit-dialog" role="dialog" aria-modal="true" aria-labelledby="mock-submit-title" aria-describedby="mock-submit-copy">
        <h2 id="mock-submit-title">Submit this part?</h2>
        <p id="mock-submit-copy">${unansweredCount ? `${unansweredCount} blank ${unansweredCount === 1 ? 'answer' : 'answers'} will be scored as missed.` : 'You answered every question in this part.'}</p>
        <div class="mock-exit-actions">
          <button class="ghost" type="button" id="mock-keep-working">Keep working</button>
          <button class="primary" type="button" id="mock-confirm-submit">Submit part</button>
        </div>
      </div>
    </div>
  `;
}

function renderMockExamSubmitDialog() {
  if (!state.mockConfirmExamSubmit) {
    return '';
  }

  const hasActivePart = state.view === 'mock-practice';
  const unansweredCount = hasActivePart ? state.answers.filter((answer) => !answer).length : 0;
  const remainingParts = hasActivePart
    ? mockParts.length - state.mockPartIndex - 1
    : mockParts.length - state.mockPartIndex;
  const blankCopy = hasActivePart && unansweredCount
    ? `${unansweredCount} blank ${unansweredCount === 1 ? 'answer' : 'answers'} in this part will be scored as missed. `
    : '';
  const remainingCopy = remainingParts
    ? `${remainingParts} later ${remainingParts === 1 ? 'part' : 'parts'} will not be included in this result.`
    : 'This is the final part of the exam.';

  return `
    <div class="mock-exit-backdrop" role="presentation">
      <div class="mock-exit-dialog mock-submit-dialog" role="dialog" aria-modal="true" aria-labelledby="mock-submit-exam-title" aria-describedby="mock-submit-exam-copy">
        <h2 id="mock-submit-exam-title">Submit exam now?</h2>
        <p id="mock-submit-exam-copy">${blankCopy}${remainingCopy}</p>
        <div class="mock-exit-actions">
          <button class="ghost" type="button" id="mock-keep-exam">Keep working</button>
          <button class="primary danger" type="button" id="mock-confirm-exam-submit">Submit exam now</button>
        </div>
      </div>
    </div>
  `;
}

function requestMockExit() {
  state.mockExitConfirm = true;
  state.mockConfirmFinish = false;
  state.mockConfirmExamSubmit = false;
  render();
}

function cancelMockExit() {
  state.mockExitConfirm = false;
  render();
}

function confirmMockExit() {
  stopMockTimer();
  state.mockExitConfirm = false;
  state.mockConfirmFinish = false;
  state.mockConfirmExamSubmit = false;
  state.view = 'setup';
  state.examType = 'mock';
  render();
}

function attachMockExitDialogHandlers() {
  document.querySelector('#mock-stay')?.addEventListener('click', cancelMockExit);
  document.querySelector('#mock-confirm-exit')?.addEventListener('click', confirmMockExit);
  if (state.mockExitConfirm) {
    window.requestAnimationFrame(() => document.querySelector('#mock-stay')?.focus());
  }
}

function requestMockPartSubmit(unansweredCount) {
  if (unansweredCount === 0) {
    finishMockPart();
    return;
  }
  state.mockConfirmFinish = true;
  state.mockConfirmExamSubmit = false;
  renderMockPractice();
}

function cancelMockPartSubmit() {
  state.mockConfirmFinish = false;
  renderMockPractice();
}

function attachMockSubmitDialogHandlers() {
  document.querySelector('#mock-keep-working')?.addEventListener('click', cancelMockPartSubmit);
  document.querySelector('#mock-confirm-submit')?.addEventListener('click', finishMockPart);
  if (state.mockConfirmFinish) {
    window.requestAnimationFrame(() => document.querySelector('#mock-keep-working')?.focus());
  }
}

function requestMockExamSubmit() {
  state.mockConfirmFinish = false;
  state.mockExitConfirm = false;
  state.mockConfirmExamSubmit = true;
  if (state.view === 'mock-break') {
    renderMockBreak();
    return;
  }
  renderMockPractice();
}

function cancelMockExamSubmit() {
  state.mockConfirmExamSubmit = false;
  if (state.view === 'mock-break') {
    renderMockBreak();
    return;
  }
  renderMockPractice();
}

function attachMockExamSubmitDialogHandlers() {
  document.querySelector('#mock-keep-exam')?.addEventListener('click', cancelMockExamSubmit);
  document.querySelector('#mock-confirm-exam-submit')?.addEventListener('click', submitMockExamNow);
  if (state.mockConfirmExamSubmit) {
    window.requestAnimationFrame(() => document.querySelector('#mock-keep-exam')?.focus());
  }
}

function renderMockGuidedPractice() {
  const part = mockParts[state.mockPartIndex];
  const question = state.questions[state.currentIndex];
  const answer = state.answers[state.currentIndex];
  const total = state.questions.length;
  const isLast = state.currentIndex === total - 1;
  const answeredCount = state.answers.filter(Boolean).length;
  const unansweredCount = total - answeredCount;
  const sectionProgress = ((state.mockPartIndex + (state.currentIndex + 1) / total) / mockParts.length) * 100;

  renderShell(`
    <section class="panel practice mock-practice">
      <div class="mock-topline">
        <div>
          <span class="eyebrow">Mock exam · Part ${state.mockPartIndex + 1} of ${mockParts.length}</span>
          <h2>${part.label}</h2>
        </div>
        <div class="timer" id="timer" aria-live="polite">${formatTime(state.mockSecondsRemaining)}</div>
      </div>
      <div class="mock-progress-rail" aria-hidden="true"><span style="width:${sectionProgress}%"></span></div>

      <div class="practice-head">
        <div class="question-kicker">
          <span>Question ${state.currentIndex + 1} of ${total}</span>
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
        <button class="ghost mock-submit-now" type="button" id="submit-mock-now">Submit exam now</button>
        <button class="primary" type="button" id="mock-next">${isLast ? 'Submit part' : 'Next'}</button>
      </div>
    </section>
    ${renderMockExitDialog()}
    ${renderMockSubmitDialog(unansweredCount)}
    ${renderMockExamSubmitDialog()}
  `);

  startMockTimer();
  attachMockExitDialogHandlers();
  attachMockSubmitDialogHandlers();
  attachMockExamSubmitDialogHandlers();

  document.querySelectorAll('[data-option]').forEach((button) => {
    button.addEventListener('click', () => {
      state.answers[state.currentIndex] = button.dataset.option;
      renderMockPractice();
    });
  });

  document.querySelector('#mock-next').addEventListener('click', () => {
    if (isLast) {
      requestMockPartSubmit(unansweredCount);
      return;
    }
    state.mockConfirmFinish = false;
    state.currentIndex += 1;
    renderMockPractice();
  });

  document.querySelector('#exit-mock').addEventListener('click', requestMockExit);
  document.querySelector('#submit-mock-now').addEventListener('click', requestMockExamSubmit);
}

function renderMockGuidedPracticeWithCard() {
  const part = mockParts[state.mockPartIndex];
  const question = state.questions[state.currentIndex];
  const answer = state.answers[state.currentIndex];
  const total = state.questions.length;
  const isLast = state.currentIndex === total - 1;
  const answeredCount = state.answers.filter(Boolean).length;
  const unansweredCount = total - answeredCount;
  const sectionProgress = ((state.mockPartIndex + (state.currentIndex + 1) / total) / mockParts.length) * 100;

  renderShell(`
    <section class="mock-exam-layout mock-mode-guided">
      <div class="panel practice mock-practice">
        <div class="mock-topline">
          <div>
            <span class="eyebrow">Mock exam - Part ${state.mockPartIndex + 1} of ${mockParts.length}</span>
            <h2>${part.label}</h2>
          </div>
          <div class="timer" id="timer" aria-live="polite">${formatTime(state.mockSecondsRemaining)}</div>
        </div>
        <div class="mock-progress-rail" aria-hidden="true"><span style="width:${sectionProgress}%"></span></div>

        <div class="practice-head">
          <div class="question-kicker">
            <span>Question ${state.currentIndex + 1} of ${total}</span>
          </div>
          <span>${answeredCount}/${total} answered</span>
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
            return `
              <button class="option ${selected ? 'selected' : ''}" type="button" data-option="${escapeHtml(optionValue)}" aria-pressed="${selected}">
                <b>${option.label}</b>
                <span>${option.text}</span>
              </button>
            `;
          }).join('')}
        </div>

        <div class="footer-actions">
          <button class="ghost" type="button" id="exit-mock">Leave exam</button>
          <button class="ghost mock-submit-now" type="button" id="submit-mock-now">Submit exam now</button>
          <button class="primary" type="button" id="mock-next">${isLast ? 'Submit part' : 'Next'}</button>
        </div>
      </div>
      ${renderMockAnswerCard()}
    </section>
    ${renderMockExitDialog()}
    ${renderMockSubmitDialog(unansweredCount)}
    ${renderMockExamSubmitDialog()}
  `);

  startMockTimer();
  attachMockAnswerCardHandlers();
  attachMockExitDialogHandlers();
  attachMockSubmitDialogHandlers();
  attachMockExamSubmitDialogHandlers();

  document.querySelectorAll('[data-option]').forEach((button) => {
    button.addEventListener('click', () => {
      state.answers[state.currentIndex] = button.dataset.option;
      state.mockConfirmFinish = false;
      renderMockPractice();
    });
  });

  document.querySelector('#mock-next').addEventListener('click', () => {
    if (isLast) {
      requestMockPartSubmit(unansweredCount);
      return;
    }
    state.mockConfirmFinish = false;
    state.currentIndex += 1;
    renderMockPractice();
  });

  document.querySelector('#exit-mock').addEventListener('click', requestMockExit);
  document.querySelector('#submit-mock-now').addEventListener('click', requestMockExamSubmit);
}

function renderMockSheetPractice() {
  const part = mockParts[state.mockPartIndex];
  const total = state.questions.length;
  const answeredCount = state.answers.filter(Boolean).length;
  const unansweredCount = total - answeredCount;
  const sectionProgress = ((state.mockPartIndex + answeredCount / total) / mockParts.length) * 100;

  renderShell(`
    <section class="mock-exam-layout mock-mode-sheet">
      <div class="panel mock-sheet">
        <div class="mock-topline">
          <div>
            <span class="eyebrow">Mock exam - Part ${state.mockPartIndex + 1} of ${mockParts.length}</span>
            <h2>${part.label}</h2>
          </div>
          <div class="timer" id="timer" aria-live="polite">${formatTime(state.mockSecondsRemaining)}</div>
        </div>
        <div class="mock-progress-rail" aria-hidden="true"><span style="width:${sectionProgress}%"></span></div>

        <div class="practice-head mock-sheet-head">
          <div class="question-kicker">
            <span>Worksheet</span>
          </div>
          <span data-sheet-answered>${answeredCount}/${total} answered</span>
        </div>

        <div class="mock-sheet-list">
          ${state.questions.map((question, index) => {
            const answer = state.answers[index];
            return `
              <article class="mock-sheet-question ${index === state.currentIndex ? 'current' : ''}" id="mock-question-${index}">
                <div class="mock-sheet-number">Question ${index + 1}</div>
                <div class="question-card mock-sheet-card">
                  <div>${question.question}</div>
                  ${question.questionNote ? `<p>${question.questionNote}</p>` : ''}
                </div>
                <div class="options mock-sheet-options">
                  ${question.options.map((option) => {
                    const optionValue = getOptionValue(option);
                    const selected = answer === optionValue;
                    return `
                      <button class="option ${selected ? 'selected' : ''}" type="button" data-sheet-question="${index}" data-sheet-option="${escapeHtml(optionValue)}" aria-pressed="${selected}">
                        <b>${option.label}</b>
                        <span>${option.text}</span>
                      </button>
                    `;
                  }).join('')}
                </div>
              </article>
            `;
          }).join('')}
        </div>

        <div class="footer-actions">
          <button class="ghost" type="button" id="exit-mock">Leave exam</button>
          <button class="ghost mock-submit-now" type="button" id="submit-mock-now">Submit exam now</button>
          <button class="primary" type="button" id="mock-next">Submit part</button>
        </div>
      </div>
      ${renderMockAnswerCard()}
    </section>
    ${renderMockExitDialog()}
    ${renderMockSubmitDialog(unansweredCount)}
    ${renderMockExamSubmitDialog()}
  `);

  startMockTimer();
  attachMockAnswerCardHandlers({ renderOnJump: false });
  attachMockExitDialogHandlers();
  attachMockSubmitDialogHandlers();
  attachMockExamSubmitDialogHandlers();

  document.querySelectorAll('[data-sheet-option]').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.sheetQuestion);
      state.answers[index] = button.dataset.sheetOption;
      state.currentIndex = index;
      state.mockConfirmFinish = false;
      document.querySelectorAll(`[data-sheet-question="${index}"]`).forEach((optionButton) => {
        const selected = optionButton.dataset.sheetOption === button.dataset.sheetOption;
        optionButton.classList.toggle('selected', selected);
        optionButton.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });
      updateMockSheetCurrentQuestion(index);
      updateMockAnswerCardState();
      resetMockSheetSubmitPrompt();
    });
  });

  document.querySelector('#mock-next').addEventListener('click', () => {
    requestMockPartSubmit(unansweredCount);
  });

  document.querySelector('#exit-mock').addEventListener('click', requestMockExit);
  document.querySelector('#submit-mock-now').addEventListener('click', requestMockExamSubmit);
}

function renderMockBubblePrompt(question) {
  return `
    <div class="mock-bubble-question-prompt" data-bubble-prompt>
      ${question.question}
    </div>
    ${question.questionNote ? `<p>${question.questionNote}</p>` : ''}
  `;
}

function renderMockBubblePractice() {
  const part = mockParts[state.mockPartIndex];
  const total = state.questions.length;
  const answeredCount = state.answers.filter(Boolean).length;
  const unansweredCount = total - answeredCount;
  const sectionProgress = ((state.mockPartIndex + answeredCount / total) / mockParts.length) * 100;

  renderShell(`
    <section class="mock-exam-layout mock-mode-bubble">
      <div class="panel mock-bubble-sheet">
        <div class="mock-topline">
          <div>
            <span class="eyebrow">Mock exam - Part ${state.mockPartIndex + 1} of ${mockParts.length}</span>
            <h2>${part.label}</h2>
          </div>
          <div class="timer" id="timer" aria-live="polite">${formatTime(state.mockSecondsRemaining)}</div>
        </div>
        <div class="mock-progress-rail" aria-hidden="true"><span style="width:${sectionProgress}%"></span></div>

        <div class="practice-head mock-bubble-head">
          <div class="question-kicker">
            <span>Bubble sheet</span>
          </div>
          <span data-bubble-answered>${answeredCount}/${total} answered</span>
        </div>

        <div class="mock-bubble-board">
          <div class="mock-bubble-questions" aria-label="Questions">
            ${state.questions.map((question, index) => `
              <article class="mock-bubble-question-item ${index === state.currentIndex ? 'current' : ''} ${state.answers[index] ? 'answered' : ''}" id="mock-bubble-question-${index}">
                <button class="mock-bubble-number" type="button" data-bubble-jump="${index}" aria-label="Go to question ${index + 1}">${index + 1}</button>
                <div class="mock-bubble-question">
                  ${renderMockBubblePrompt(question)}
                </div>
              </article>
            `).join('')}
          </div>

          <aside class="mock-bubble-card" aria-label="Bubble answer sheet">
            <div class="mock-bubble-card-head">
              <div>
                <span>Answer Sheet</span>
                <b>Part ${state.mockPartIndex + 1}</b>
              </div>
              <div class="mock-student-id" aria-hidden="true">
                <span>Student ID</span>
                <i></i><i></i><i></i><i></i><i></i>
              </div>
            </div>
            <div class="mock-bubble-answer-list">
              ${state.questions.map((question, index) => {
                const answer = state.answers[index];
                return `
                  <div class="mock-bubble-answer-row ${index === state.currentIndex ? 'current' : ''} ${answer ? 'answered' : ''}">
                    <button class="mock-bubble-answer-number" type="button" data-bubble-jump="${index}" aria-label="Go to question ${index + 1}">${index + 1}</button>
                    <div class="mock-bubble-options" role="radiogroup" aria-label="Question ${index + 1} choices">
                      ${question.options.map((option) => {
                        const optionValue = getOptionValue(option);
                        const selected = answer === optionValue;
                        return `
                          <button class="mock-bubble-choice ${selected ? 'selected' : ''}" type="button" data-bubble-question="${index}" data-bubble-option="${escapeHtml(optionValue)}" aria-pressed="${selected}" aria-label="Question ${index + 1}, choice ${escapeHtml(option.label)}">
                            <span>${escapeHtml(option.label)}</span>
                          </button>
                        `;
                      }).join('')}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </aside>
        </div>

        <div class="footer-actions">
          <button class="ghost" type="button" id="exit-mock">Leave exam</button>
          <button class="ghost mock-submit-now" type="button" id="submit-mock-now">Submit exam now</button>
          <button class="primary" type="button" id="mock-next">Submit part</button>
        </div>
      </div>
    </section>
    ${renderMockExitDialog()}
    ${renderMockSubmitDialog(unansweredCount)}
    ${renderMockExamSubmitDialog()}
  `);

  startMockTimer();
  attachMockExitDialogHandlers();
  attachMockSubmitDialogHandlers();
  attachMockExamSubmitDialogHandlers();

  document.querySelectorAll('[data-bubble-jump]').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.bubbleJump);
      state.currentIndex = index;
      state.mockConfirmFinish = false;
      updateMockBubbleState();
      resetMockSheetSubmitPrompt();
      scrollToMockBubbleQuestion(index);
    });
  });

  document.querySelectorAll('[data-bubble-option]').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.bubbleQuestion);
      state.answers[index] = button.dataset.bubbleOption;
      state.currentIndex = index;
      state.mockConfirmFinish = false;
      document.querySelectorAll(`[data-bubble-question="${index}"]`).forEach((optionButton) => {
        const selected = optionButton.dataset.bubbleOption === button.dataset.bubbleOption;
        optionButton.classList.toggle('selected', selected);
        optionButton.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });
      updateMockBubbleState();
      resetMockSheetSubmitPrompt();
    });
  });

  document.querySelector('#mock-next').addEventListener('click', () => {
    requestMockPartSubmit(unansweredCount);
  });

  document.querySelector('#exit-mock').addEventListener('click', requestMockExit);
  document.querySelector('#submit-mock-now').addEventListener('click', requestMockExamSubmit);
}

function updateMockBubbleState() {
  const answeredCount = state.answers.filter(Boolean).length;
  document.querySelector('[data-bubble-answered]')?.replaceChildren(document.createTextNode(`${answeredCount}/${state.questions.length} answered`));
  const progressBar = document.querySelector('.mock-bubble-sheet .mock-progress-rail span');
  if (progressBar) {
    const sectionProgress = ((state.mockPartIndex + answeredCount / state.questions.length) / mockParts.length) * 100;
    progressBar.style.width = `${sectionProgress}%`;
  }
  document.querySelectorAll('.mock-bubble-question-item, .mock-bubble-answer-row').forEach((row) => {
    const jumpButton = row.querySelector('[data-bubble-jump]');
    const optionButton = row.querySelector('[data-bubble-option]');
    const index = Number(jumpButton?.dataset.bubbleJump ?? optionButton?.dataset.bubbleQuestion);
    if (Number.isNaN(index)) {
      return;
    }
    const isCurrent = index === state.currentIndex;
    const isAnswered = Boolean(state.answers[index]);
    row.classList.toggle('current', isCurrent);
    row.classList.toggle('answered', isAnswered);
  });
}

function scrollToMockBubbleQuestion(index) {
  window.requestAnimationFrame(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelector(`#mock-bubble-question-${index}`)?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
  });
}

function startMockIntro() {
  stopMockTimer();
  state.mockPartIndex = 0;
  state.mockResults = [];
  state.examType = 'mock';
  state.message = '';
  state.mockConfirmFinish = false;
  state.mockConfirmExamSubmit = false;
  state.mockSubmittedEarly = false;
  state.mockExitConfirm = false;
  state.view = 'mock-intro';
  render();
}

function startMockExam() {
  stopMockTimer();
  state.mockPartIndex = 0;
  state.mockResults = [];
  state.examType = 'mock';
  state.message = '';
  state.mockConfirmFinish = false;
  state.mockConfirmExamSubmit = false;
  state.mockSubmittedEarly = false;
  state.mockExitConfirm = false;
  startMockPart();
}

function startMockPart() {
  const part = mockParts[state.mockPartIndex];
  state.questions = getMockPartQuestions(part);
  state.answers = new Array(state.questions.length).fill(null);
  state.currentIndex = 0;
  state.checked = false;
  state.mockConfirmFinish = false;
  state.mockConfirmExamSubmit = false;
  state.mockExitConfirm = false;
  state.mockSecondsRemaining = part.minutes * 60;
  state.view = 'mock-practice';
  render();
}

function getMockPartQuestions(part) {
  const source = questionSets[part.key].filter((question) => question.subtest === part.subtest);
  return selectOfficialStyleMockQuestions(source, part.questionCount, part);
}

function selectOfficialStyleMockQuestions(source, count, part) {
  const targetCounts = {
    easy: Math.floor(count * 0.15),
    medium: Math.ceil(count * 0.55),
    hard: Math.floor(count * 0.22),
  };
  targetCounts['very-hard'] = count - targetCounts.easy - targetCounts.medium - targetCounts.hard;

  const selectedQuestions = [];
  MOCK_DIFFICULTY_ORDER.forEach((difficulty) => {
    const bucket = source.filter((question) => getMockDifficulty(question) === difficulty);
    const formSeed = `${MOCK_FORM_ID}:${part.subtest}:${difficulty}`;
    selectedQuestions.push(...stableMockShuffle(bucket, formSeed).slice(0, targetCounts[difficulty]));
  });

  if (selectedQuestions.length < count) {
    const selectedIds = new Set(selectedQuestions.map((question) => question.id));
    const remainingQuestions = source.filter((question) => !selectedIds.has(question.id));
    selectedQuestions.push(...stableMockShuffle(remainingQuestions, `${MOCK_FORM_ID}:${part.subtest}:fill`).slice(0, count - selectedQuestions.length));
  }

  return sortMockQuestionsForExam(selectedQuestions).slice(0, count);
}

function getMockDifficulty(question) {
  const explicitDifficulty = String(question.difficulty ?? '').toLowerCase();
  if (MOCK_DIFFICULTY_RANK[explicitDifficulty] !== undefined) {
    return explicitDifficulty;
  }

  const inferredDifficulty = getDifficulty(question);
  return MOCK_DIFFICULTY_RANK[inferredDifficulty] !== undefined ? inferredDifficulty : 'medium';
}

function getMockDifficultyRank(question) {
  return MOCK_DIFFICULTY_RANK[getMockDifficulty(question)] ?? MOCK_DIFFICULTY_RANK.medium;
}

function sortMockQuestionsForExam(items) {
  return [...items].sort((first, second) => {
    const difficultyDelta = getMockDifficultyRank(first) - getMockDifficultyRank(second);
    if (difficultyDelta !== 0) {
      return difficultyDelta;
    }
    return stableMockHash(`${MOCK_FORM_ID}:${first.subtest}:${first.id}`) - stableMockHash(`${MOCK_FORM_ID}:${second.subtest}:${second.id}`);
  });
}

function stableMockShuffle(items, seed) {
  return [...items].sort((first, second) => (
    stableMockHash(`${seed}:${first.id}`) - stableMockHash(`${seed}:${second.id}`)
  ));
}

function stableMockHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
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

function recordMockPartResult() {
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
    recordAnswer(question, answer, { save: false });
  });

  const result = {
    key: part.key,
    battery: part.battery,
    subtest: part.subtest,
    label: part.label,
    correct,
    total: state.questions.length,
    unanswered: state.answers.filter((answer) => !answer).length,
    secondsUsed: (part.minutes * 60) - state.mockSecondsRemaining,
    questionIds: state.questions.map((question) => String(question.id)),
    missedQuestionIds: state.questions
      .filter((question, index) => state.answers[index] !== getCorrectAnswer(question))
      .map((question) => String(question.id)),
  };
  state.mockResults.push(result);
  return result;
}

function finishMockPart() {
  stopMockTimer();
  recordMockPartResult();

  if (state.mockPartIndex < mockParts.length - 1) {
    state.mockPartIndex += 1;
    state.mockConfirmFinish = false;
    state.mockConfirmExamSubmit = false;
    state.mockExitConfirm = false;
    state.view = 'mock-break';
    state.history.updatedAt = new Date().toISOString();
    saveHistory();
    render();
    return;
  }

  finishMockExam();
}

function finishMockExam({ submittedEarly = false } = {}) {
  if (!submittedEarly) {
    checkAndUnlockBadges({ type: 'mock-complete' });
  }
  state.mockSubmittedEarly = submittedEarly;
  state.mockConfirmExamSubmit = false;
  state.mockConfirmFinish = false;
  state.mockExitConfirm = false;
  state.view = 'results';
  state.history.updatedAt = new Date().toISOString();
  saveHistory();
  render();
}

function submitMockExamNow() {
  stopMockTimer();
  if (state.view === 'mock-practice') {
    recordMockPartResult();
  }
  finishMockExam({ submittedEarly: true });
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
  const submittedPartCount = state.mockResults.length;
  const report = buildMockScoreReport();
  const batteryScores = report.batteries;
  const prescription = buildMockPrescription();

  renderShell(`
    <section class="results mock-results">
      <div class="panel score">
        <span class="eyebrow">${state.mockSubmittedEarly ? 'Mock exam submitted early' : 'Mock exam complete'}</span>
        <h1>${report.overall.accuracy}%</h1>
        <p>${correct}/${total} correct · practice accuracy${state.mockSubmittedEarly ? ' · early submission' : ''}</p>
        <div class="estimate-grid" aria-label="Practice score estimate">
          <article class="estimate-card"><span>Estimated SAS</span><strong>${report.overall.sas}</strong><small>Mean 100 · SD 16</small></article>
          <article class="estimate-card"><span>Estimated percentile</span><strong>${formatOrdinal(report.overall.percentile)}</strong><small>Grade 4 practice model</small></article>
          <article class="estimate-card"><span>Estimated stanine</span><strong>${report.overall.stanine}</strong><small>Scale from 1 to 9</small></article>
        </div>
        ${prescription ? `
          <section class="mock-prescription" aria-label="Your next practice">
            <div>
              <span class="eyebrow">Your next practice</span>
              <h2>${escapeHtml(prescription.label)}</h2>
              <p>${prescription.accuracy}% accuracy · ${formatQuestionCount(prescription.missedCount)} missed. ${prescription.missedCount ? 'Review the questions that were hardest today, then build confidence with similar ones.' : 'You got this section right today. Keep that skill strong with a fresh set.'}</p>
            </div>
            <button class="primary" type="button" id="start-mock-prescription">Start ${prescription.questionCount}-question practice</button>
          </section>
        ` : ''}
        <div class="result-actions">
          <button class="primary" type="button" id="again">Try again</button>
          <button class="ghost" type="button" id="export-history">Export JSON</button>
        </div>
      </div>

      <div class="panel summary">
        <div class="score-section-heading"><div><span class="eyebrow">Practice estimate</span><h2>Battery scores</h2></div><span class="score-note">Not an official CogAT score</span></div>
        ${Object.entries(batteryScores).map(([battery, score]) => `
          <div class="row">
            <span><b>${escapeHtml(battery.replace(' Battery', ''))}</b><small>${score.correct}/${score.total} correct · ${score.accuracy}% accuracy</small></span>
            <b>SAS ${score.sas} · PR ${score.percentile} · S${score.stanine}</b>
          </div>
        `).join('')}

        <h2>Subtest scores</h2>
        ${state.mockResults.map((part) => `
          <div class="row">
            <span><b>${escapeHtml(part.label)}</b><small>${part.correct}/${part.total} correct · ${scorePracticeAccuracy(part.correct, part.total)}% accuracy</small></span>
            <b>${part.unanswered ? `${part.unanswered} blank` : 'Complete'}</b>
          </div>
        `).join('')}
        <p class="microcopy mock-result-note">${state.mockSubmittedEarly ? `Early submission: ${submittedPartCount} of ${mockParts.length} parts were scored. The remaining parts were not included, so this estimate is less reliable. ` : ''}This estimate converts practice accuracy into a simple normalized score for motivation. Official CogAT results use the test form, level, age or grade norms, and Riverside conversion tables.</p>
      </div>
    </section>
  `);

  document.querySelector('#again').addEventListener('click', startMockIntro);
  document.querySelector('#start-mock-prescription')?.addEventListener('click', () => startMockPrescription(prescription));
  document.querySelector('#export-history').addEventListener('click', exportHistory);
}

function renderGameCenter() {
  const unlockedCount = state.history.badges.length;
  const tabs = [
    { key: 'badges', label: 'Badges' },
    { key: 'shop', label: 'Reward Shop' },
    { key: 'history', label: 'Coin History' },
  ];

  renderShell(`
    <section class="game-center">
      <div class="panel game-hero ${getEquippedClass('hero')}">
        <div>
          <span class="eyebrow">Game Center</span>
          <h1>Rewards</h1>
        </div>
        <button class="ghost" type="button" id="game-home">Back home</button>
      </div>

      <div class="game-stats" aria-label="Game center stats">
        <article class="panel game-stat"><span>Current Coins</span><strong>${state.history.currentCoins}</strong></article>
        <article class="panel game-stat"><span>Lifetime Coins</span><strong>${state.history.lifetimeCoins}</strong></article>
        <article class="panel game-stat"><span>Badges Earned</span><strong>${unlockedCount}/${BADGE_DEFINITIONS.length}</strong></article>
      </div>

      <div class="game-tabs" role="tablist" aria-label="Game center sections">
        ${tabs.map((tab) => `<button class="${state.gameCenterTab === tab.key ? 'selected' : ''}" type="button" role="tab" aria-selected="${state.gameCenterTab === tab.key}" data-game-tab="${tab.key}">${tab.label}</button>`).join('')}
      </div>

      <section class="panel game-panel ${getEquippedClass('panel')}">
        ${renderGameCenterPanel()}
      </section>
    </section>
  `);

  document.querySelector('#game-home').addEventListener('click', goHome);
  document.querySelectorAll('[data-game-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      state.gameCenterTab = button.dataset.gameTab;
      renderGameCenter();
    });
  });
  document.querySelectorAll('[data-shop-action]').forEach((button) => {
    button.addEventListener('click', () => {
      handleShopAction(button.dataset.shopAction);
    });
  });
  document.querySelectorAll('[data-badge-action]').forEach((button) => {
    button.addEventListener('click', () => {
      handleBadgePurchase(button.dataset.badgeAction);
    });
  });
}

function renderGameCenterPanel() {
  if (state.gameCenterTab === 'shop') {
    return renderRewardShop();
  }
  if (state.gameCenterTab === 'history') {
    return renderCoinHistory();
  }
  return renderBadgesPanel();
}

function renderBadgesPanel() {
  const unlocked = new Map(state.history.badges.map((badge) => [badge.id, badge]));
  return `
    <div class="game-section-head">
      <div>
        <span class="eyebrow">Badge shop</span>
        <h2>${state.history.badges.length} collected</h2>
      </div>
      <span>${renderCoinIcon()}${state.history.currentCoins}</span>
    </div>
    <div class="badge-grid">
      ${BADGE_DEFINITIONS.map((definition) => {
        const badge = unlocked.get(definition.id);
        const canBuy = state.history.currentCoins >= definition.price;
        const buttonLabel = badge ? 'Collected' : canBuy ? 'Buy' : `Need ${definition.price - state.history.currentCoins}`;
        return `
          <article class="badge-card badge-tier-${definition.tier} ${badge ? 'is-unlocked' : 'is-locked'} ${getEquippedClass('badge')}">
            <div class="badge-icon-shell">
              <div class="badge-icon">${badge ? renderBadgeArtwork(definition) : '<span class="badge-question-mark" aria-label="Mystery badge">?</span>'}</div>
            </div>
            <div class="badge-copy">
              <b>${escapeHtml(definition.name)}</b>
              <div class="badge-card-foot">
                <span class="badge-price">${renderCoinIcon()}${definition.price}</span>
                <button class="${badge ? 'ghost' : 'primary'}" type="button" data-badge-action="${definition.id}" aria-label="${badge ? `${escapeHtml(definition.name)} badge collected` : `Buy ${escapeHtml(definition.name)} badge for ${definition.price} coins`}" ${badge || !canBuy ? 'disabled' : ''}>${buttonLabel}</button>
              </div>
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function handleBadgePurchase(badgeId) {
  const definition = BADGE_DEFINITIONS.find((badge) => badge.id === badgeId);
  if (!definition || state.history.badges.some((badge) => badge.id === definition.id) || state.history.currentCoins < definition.price) {
    return;
  }

  if (!window.confirm(`Buy ${definition.name} for ${definition.price} coins?`)) {
    return;
  }

  state.history.currentCoins -= definition.price;
  state.history.badges.push({
    id: definition.id,
    name: definition.name,
    description: definition.description,
    icon: definition.icon,
    category: definition.category,
    unlockedAt: new Date().toISOString(),
  });
  addCoinHistory(-definition.price, 'badge-shop', `${definition.name} badge`);
  state.history.updatedAt = new Date().toISOString();
  saveHistory();
  renderGameCenter();
}

function renderRewardShop() {
  const owned = new Set(state.history.shop.owned);
  return `
    <div class="game-section-head">
      <div>
        <span class="eyebrow">Reward shop</span>
        <h2>Choose a theme</h2>
      </div>
      <span>${renderCoinIcon()}${state.history.currentCoins}</span>
    </div>
    ${renderShopCollection('Color themes', 'Change the colors across CogAT.', SHOP_THEMES, owned)}
    ${renderShopCollection('Today card decor', 'Choose one accent for your home dashboard.', SHOP_DECOR, owned)}
  `;
}

function renderShopCollection(title, description, items, owned) {
  return `
    <section class="shop-collection">
      <div class="shop-collection-head"><div><h3>${title}</h3><p>${description}</p></div><span>${items.length} items</span></div>
      <div class="shop-grid">
        ${items.map((item) => renderShopCard(item, owned)).join('')}
      </div>
    </section>
  `;
}

function renderShopCard(item, owned) {
  const isOwned = owned.has(item.id);
  const isEquipped = item.kind === 'theme'
    ? state.history.shop.equipped === item.id
    : state.history.shop.decor === item.id;
  const canBuy = state.history.currentCoins >= item.price;
  const useLabel = item.kind === 'theme' ? 'Use theme' : 'Use decor';
  const label = isEquipped ? 'Using' : isOwned ? useLabel : canBuy ? 'Buy' : `Need ${item.price - state.history.currentCoins}`;
  const preview = item.kind === 'theme'
    ? `<span class="theme-swatch"></span><span class="theme-preview-label">${escapeHtml(item.name)}</span>`
    : renderShopIcon(item.icon);
  return `
    <article class="shop-card shop-card-${item.id} shop-card-${item.kind} ${isEquipped ? 'is-equipped' : ''}">
      <div class="shop-preview" aria-hidden="true">${preview}</div>
      <div class="shop-copy">
        <div class="shop-card-top">
          <b>${escapeHtml(item.name)}</b>
          <span class="shop-price">${item.price ? `${renderCoinIcon()}${item.price}` : 'Default'}</span>
        </div>
        <span>${escapeHtml(item.description)}</span>
        <div class="shop-card-foot">
          <span class="shop-state ${isEquipped ? 'is-equipped' : isOwned ? 'is-owned' : canBuy ? 'can-buy' : 'locked'}">${label}</span>
          <small>${isEquipped ? 'Showing on your dashboard' : isOwned ? 'Ready to use' : canBuy ? 'Tap to buy' : 'Practice to earn more coins'}</small>
        </div>
      </div>
      <button class="${isEquipped ? 'ghost' : 'primary'}" type="button" data-shop-action="${item.id}" ${(!isOwned && !canBuy) || isEquipped ? 'disabled' : ''}>${label}</button>
    </article>
  `;
}

function renderCoinHistory() {
  const entries = [...state.history.coinHistory].sort((first, second) => timestamp(second.createdAt) - timestamp(first.createdAt)).slice(0, 30);
  return `
    <div class="game-section-head">
      <div><span class="eyebrow">Coin History</span><h2>Recent rewards</h2></div>
      <span>${entries.length} shown</span>
    </div>
    <div class="coin-history-list">
      ${entries.length ? entries.map((entry) => `
        <div class="coin-history-row">
          <span class="${entry.amount >= 0 ? 'positive' : 'negative'}">${entry.amount >= 0 ? '+' : ''}${entry.amount}</span>
          <b>${escapeHtml(entry.label)}</b>
          <small>${formatShortDate(entry.createdAt)}</small>
        </div>
      `).join('') : '<div class="empty-game-state">No coin activity yet.</div>'}
    </div>
  `;
}

function handleShopAction(itemId) {
  const item = SHOP_ITEMS.find((shopItem) => shopItem.id === itemId);
  if (!item) {
    return;
  }

  const owned = new Set(state.history.shop.owned);
  if (owned.has(item.id)) {
    if (item.kind === 'theme') {
      state.history.shop.equipped = item.id;
    } else {
      state.history.shop.decor = item.id;
    }
  } else {
    if (state.history.currentCoins < item.price) {
      return;
    }
    state.history.currentCoins -= item.price;
    state.history.shop.owned = [...owned, item.id];
    if (item.kind === 'theme') {
      state.history.shop.equipped = item.id;
    } else {
      state.history.shop.decor = item.id;
    }
    addCoinHistory(-item.price, 'shop', item.name);
  }
  state.history.updatedAt = new Date().toISOString();
  saveHistory();
  renderGameCenter();
}

function buildMockScoreReport() {
  const batteryScores = summarizeMockScores();
  const batteries = Object.fromEntries(Object.entries(batteryScores).map(([battery, score]) => [battery, scorePracticeEstimate(score.correct, score.total)]));
  const batteryEstimates = Object.values(batteries).filter((score) => Number.isFinite(score.sas));
  const compositeSas = batteryEstimates.length
    ? Math.round(batteryEstimates.reduce((sum, score) => sum + score.sas, 0) / batteryEstimates.length)
    : 100;
  const total = state.mockResults.reduce((sum, part) => sum + part.total, 0);
  const correct = state.mockResults.reduce((sum, part) => sum + part.correct, 0);
  const overallAccuracy = scorePracticeAccuracy(correct, total);
  return {
    batteries,
    overall: {
      accuracy: overallAccuracy,
      sas: compositeSas,
      percentile: percentileFromSas(compositeSas),
      stanine: stanineFromPercentile(percentileFromSas(compositeSas)),
    },
  };
}

function buildMockPrescription() {
  const parts = state.mockResults
    .filter((part) => part.total > 0)
    .map((part) => ({
      ...part,
      accuracy: scorePracticeAccuracy(part.correct, part.total),
      missedCount: part.total - part.correct,
    }))
    .sort((first, second) => (
      first.accuracy - second.accuracy
      || second.missedCount - first.missedCount
      || first.label.localeCompare(second.label)
    ));
  const target = parts[0];
  if (!target) {
    return null;
  }
  const questionCount = Math.min(10, buildMockPrescriptionPool(target).length);
  return { ...target, questionCount };
}

function buildMockPrescriptionPool(prescription, limit = 10) {
  const selected = [];
  const seen = new Set();
  const addQuestion = (question) => {
    if (!question || selected.length >= limit || seen.has(String(question.id))) {
      return;
    }
    seen.add(String(question.id));
    selected.push(question);
  };
  const missedQuestions = (prescription.missedQuestionIds ?? [])
    .map((id) => questionById.get(String(id)))
    .filter(Boolean);
  const subtestQuestions = (batteryMap.get(prescription.key)?.questions ?? [])
    .filter((question) => question.subtest === prescription.subtest);

  shuffle(missedQuestions).forEach(addQuestion);
  shuffle(subtestQuestions.filter((question) => !state.history.stats[String(question.id)])).forEach(addQuestion);
  shuffle(subtestQuestions).forEach(addQuestion);
  return selected;
}

function startMockPrescription(prescription) {
  const pool = buildMockPrescriptionPool(prescription);
  if (!pool.length) {
    state.message = 'No practice questions are available for this subtest yet.';
    state.view = 'setup';
    state.examType = 'practice';
    render();
    return;
  }
  state.examType = 'practice';
  state.battery = prescription.key;
  state.subtest = prescription.subtest;
  state.mode = prescription.missedCount ? 'missed' : 'all';
  startPractice({ kind: 'review', pool, limit: 10 });
}

function scorePracticeEstimate(correct, total) {
  const accuracy = scorePracticeAccuracy(correct, total);
  if (!total) {
    return { correct, total, accuracy, sas: null, percentile: null, stanine: null };
  }
  const proportion = correct / total;
  const z = (proportion - 0.5) / 0.15;
  const sas = Math.round(clamp(100 + (z * 16), 50, 160));
  const percentile = percentileFromSas(sas);
  return { correct, total, accuracy, sas, percentile, stanine: stanineFromPercentile(percentile) };
}

function scorePracticeAccuracy(correct, total) {
  return total ? Math.round((correct / total) * 100) : 0;
}

function formatOrdinal(value) {
  const remainder100 = value % 100;
  if (remainder100 >= 11 && remainder100 <= 13) {
    return `${value}th`;
  }
  const suffixes = { 1: 'st', 2: 'nd', 3: 'rd' };
  return `${value}${suffixes[value % 10] ?? 'th'}`;
}

function percentileFromSas(sas) {
  return clamp(Math.round(normalCdf((sas - 100) / 16) * 100), 1, 99);
}

function stanineFromPercentile(percentile) {
  if (percentile >= 96) return 9;
  if (percentile >= 89) return 8;
  if (percentile >= 77) return 7;
  if (percentile >= 60) return 6;
  if (percentile >= 41) return 5;
  if (percentile >= 24) return 4;
  if (percentile >= 12) return 3;
  if (percentile >= 5) return 2;
  return 1;
}

function normalCdf(value) {
  return 0.5 * (1 + erf(value / Math.sqrt(2)));
}

function erf(value) {
  const sign = value < 0 ? -1 : 1;
  const absolute = Math.abs(value);
  const t = 1 / (1 + (0.3275911 * absolute));
  const polynomial = 1 - (((((1.061405429 * t) - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(absolute * absolute));
  return sign * polynomial;
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
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
  const isWorkbookQuestion = question.source === 'G4 PDF workbook';
  return `
    <article class="bank-question ${isWorkbookQuestion ? 'is-workbook-question' : ''}" id="question-${question.id}">
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
  return Boolean(hasStoredActiveDailySession() && active && !getDailyProgress().completed);
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

  checkAndUnlockBadges({ type: 'practice-complete', correct, total, kind: state.sessionKind });
  state.history.updatedAt = completedAt;
  saveHistory();
}

function goHome() {
  persistActiveSession();
  stopMockTimer();
  state.view = 'setup';
  state.examType = 'practice';
  customPracticeOpen = false;
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

function awardCoins(amount, reason, label, { animate = false, originElement = null } = {}) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value === 0) {
    return;
  }

  const previousCoins = state.history.currentCoins;
  state.history.currentCoins = Math.max(0, state.history.currentCoins + value);
  if (value > 0) {
    state.history.lifetimeCoins += value;
  }
  addCoinHistory(value, reason, label);
  state.history.updatedAt = new Date().toISOString();

  if (value > 0 && animate) {
    animateCoinReward(originElement, previousCoins, state.history.currentCoins);
  } else {
    animateCoinTotal(previousCoins, state.history.currentCoins);
  }
}

function addCoinHistory(amount, reason, label) {
  state.history.coinHistory = [{
    id: `coin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    amount,
    reason,
    label,
    createdAt: new Date().toISOString(),
  }, ...state.history.coinHistory].slice(0, 80);
}

function checkAndUnlockBadges(context = {}) {
  BADGE_DEFINITIONS.forEach((definition) => {
    if (state.history.claimedMilestones[definition.id] || !isBadgeEarned(definition.id, context)) {
      return;
    }

    state.history.claimedMilestones[definition.id] = true;
    awardCoins(BADGE_REWARDS[definition.tier], 'milestone', `${definition.name} milestone`);
  });
}

function isBadgeEarned(id, context = {}) {
  const totals = getPracticeTotals();
  const batteryStats = getBatteryTotals();
  const completed = totals.completed;
  const correct = totals.correct;

  const rules = {
    'first-step': () => completed >= 1,
    'getting-started': () => completed >= 10,
    'question-explorer': () => completed >= 50,
    'century-club': () => completed >= 100,
    'practice-champion': () => completed >= 500,
    'first-correct': () => correct >= 1,
    'sharp-thinker': () => correct >= 25,
    'brain-builder': () => correct >= 100,
    'word-wizard': () => (batteryStats['Verbal Battery']?.correct ?? 0) >= 30,
    'number-ninja': () => (batteryStats['Quantitative Battery']?.correct ?? 0) >= 30,
    'pattern-pro': () => (batteryStats['Nonverbal Battery']?.correct ?? 0) >= 30,
    'perfect-set': () => context.type === 'practice-complete' && context.total >= 10 && context.correct === context.total,
    'comeback-kid': () => context.type === 'answer' && context.isCorrect && context.wasWrongBefore,
    'mock-exam-finisher': () => context.type === 'mock-complete',
    'balanced-brain': () => batteries.filter((battery) => battery.key !== 'all').every((battery) => (batteryStats[battery.battery ?? `${battery.label} Battery`]?.completed ?? 0) >= 20),
  };

  return Boolean(rules[id]?.());
}

function getPracticeTotals() {
  return Object.values(state.history.stats).reduce((totals, record) => {
    totals.completed += Number(record.attempts ?? 0);
    totals.correct += Number(record.correct ?? 0);
    return totals;
  }, { completed: 0, correct: 0 });
}

function getBatteryTotals() {
  return Object.values(state.history.stats).reduce((totals, record) => {
    totals[record.battery] ??= { completed: 0, correct: 0 };
    totals[record.battery].completed += Number(record.attempts ?? 0);
    totals[record.battery].correct += Number(record.correct ?? 0);
    return totals;
  }, {});
}

function animateCoinReward(originElement, fromCoins, toCoins) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || !originElement) {
    coinDisplayValue = null;
    updateCoinButtonDisplay(toCoins);
    return;
  }

  const target = document.querySelector('[data-game-center]');
  if (!target) {
    return;
  }

  window.clearTimeout(coinAnimationHandle);
  coinDisplayValue = fromCoins;
  const originRect = originElement.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const coin = document.createElement('div');
  coin.className = 'flying-coin';
  coin.innerHTML = renderCoinIcon();
  coin.style.setProperty('--coin-x', `${targetRect.left + targetRect.width / 2 - originRect.left - originRect.width / 2}px`);
  coin.style.setProperty('--coin-y', `${targetRect.top + targetRect.height / 2 - originRect.top - originRect.height / 2}px`);
  coin.style.left = `${originRect.left + originRect.width / 2 - 14}px`;
  coin.style.top = `${originRect.top + originRect.height / 2 - 14}px`;
  document.body.append(coin);

  coinAnimationHandle = window.setTimeout(() => {
    coin.remove();
    coinDisplayValue = null;
    updateCoinButtonDisplay(toCoins);
  }, 760);
}

function animateCoinTotal(fromCoins, toCoins) {
  if (fromCoins === toCoins) {
    return;
  }
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    updateCoinButtonDisplay(toCoins);
    return;
  }

  const startedAt = performance.now();
  const duration = 650;
  const step = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    updateCoinButtonDisplay(Math.round(fromCoins + (toCoins - fromCoins) * eased));
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

function updateCoinButtonDisplay(coins) {
  const count = document.querySelector('[data-coin-count]');
  const button = document.querySelector('[data-game-center]');
  if (count) {
    count.textContent = String(coins);
  }
  if (button) {
    button.setAttribute('aria-label', `Open game center, ${coins} coins`);
  }
}

function formatShortDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getEquippedClass(area) {
  const equipped = state.history.shop.equipped;
  if (!equipped) {
    return '';
  }
  return `equipped-${area} equipped-${equipped}`;
}

function getActiveTheme() {
  const equipped = state.history.shop?.equipped;
  return SHOP_THEMES.some((item) => item.id === equipped) ? equipped : 'blue';
}

function getActiveDecor() {
  const decor = state.history.shop?.decor;
  return SHOP_DECOR.find((item) => item.id === decor) ?? null;
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

function recordAnswer(question, answer, { save = true } = {}) {
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
  const wasWrongBefore = Number(previous.wrong ?? 0) > 0 || previous.lastResult === 'wrong';

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
  checkAndUnlockBadges({ type: 'answer', question, answer, isCorrect, wasWrongBefore });
  state.history.updatedAt = new Date().toISOString();
  if (save) {
    saveHistory();
  }
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
  const activeGoal = Number(active?.goal ?? active?.questionIds?.length ?? 0);
  return Boolean(active && active.kind === 'daily' && active.date === getDateKey() && activeGoal === DEFAULT_DAILY_GOAL);
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
    currentCoins: 0,
    lifetimeCoins: 0,
    badges: [],
    claimedMilestones: {},
    coinHistory: [],
    shop: {
      owned: ['blue'],
      equipped: 'blue',
      decor: '',
    },
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

  next.dailyGoal = DEFAULT_DAILY_GOAL;
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
      updatedAt: record?.updatedAt ?? record?.completedAt ?? '',
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
  next.currentCoins = Math.max(0, Number(input?.currentCoins ?? 0));
  next.lifetimeCoins = Math.max(next.currentCoins, Number(input?.lifetimeCoins ?? next.currentCoins));
  next.badges = normalizeBadges(input?.badges);
  next.claimedMilestones = {
    ...Object.fromEntries(next.badges.map((badge) => [badge.id, true])),
    ...Object.fromEntries(Object.entries(input?.claimedMilestones ?? {}).filter(([, value]) => Boolean(value))),
  };
  next.coinHistory = normalizeCoinHistory(input?.coinHistory);
  next.shop = normalizeShop(input?.shop);
  next.updatedAt = input?.updatedAt ?? new Date().toISOString();
  return next;
}

function normalizeBadges(input = []) {
  if (!Array.isArray(input)) {
    return [];
  }
  const seen = new Set();
  return input.reduce((badges, badge) => {
    const definition = BADGE_DEFINITIONS.find((item) => item.id === badge?.id);
    if (!definition || seen.has(definition.id)) {
      return badges;
    }
    seen.add(definition.id);
    badges.push({
      id: definition.id,
      name: definition.name,
      description: definition.description,
      icon: definition.icon,
      category: definition.category,
      unlockedAt: badge.unlockedAt ?? badge.updatedAt ?? new Date().toISOString(),
    });
    return badges;
  }, []);
}

function normalizeCoinHistory(input = []) {
  if (!Array.isArray(input)) {
    return [];
  }
  const seen = new Set();
  return input.reduce((entries, entry) => {
    const id = String(entry?.id ?? '');
    if (!id || seen.has(id)) {
      return entries;
    }
    seen.add(id);
    entries.push({
      id,
      amount: Number(entry.amount ?? 0),
      reason: entry.reason ?? 'reward',
      label: entry.label ?? 'Coin reward',
      createdAt: entry.createdAt ?? new Date().toISOString(),
    });
    return entries;
  }, []).sort((first, second) => timestamp(second.createdAt) - timestamp(first.createdAt)).slice(0, 80);
}

function normalizeShop(input = {}) {
  const validIds = new Set(SHOP_ITEMS.map((item) => item.id));
  const owned = Array.isArray(input?.owned)
    ? [...new Set(['blue', ...input.owned.filter((id) => validIds.has(id))])]
    : ['blue'];
  const equipped = owned.includes(input?.equipped) && SHOP_THEMES.some((item) => item.id === input.equipped) ? input.equipped : 'blue';
  const decor = owned.includes(input?.decor) && SHOP_DECOR.some((item) => item.id === input.decor) ? input.decor : '';
  return { owned, equipped, decor };
}

function saveHistory({ queueSync = true } = {}) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.history));
  if (queueSync) {
    queueCloudSync();
  }
}

async function initializeCloudSync() {
  if (!supabaseConfig.url || !supabaseConfig.publishableKey) {
    authState.status = 'local';
    authState.syncStatus = 'local';
    return;
  }

  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    supabase = createClient(supabaseConfig.url, supabaseConfig.publishableKey);
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw error;
    }
    await handleAuthSession(data.session, false);
    supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => handleAuthSession(session), 0);
    });
  } catch (error) {
    console.error('Supabase initialization failed', error);
    authState.status = 'error';
    authState.syncStatus = 'error';
    authState.message = 'Cloud sync is unavailable. Local progress is still safe.';
  }
}

async function handleAuthSession(session, shouldRender = true) {
  if (!session?.user) {
    authState.status = supabase ? 'signed-out' : 'local';
    authState.user = null;
    authState.syncStatus = supabase ? 'local' : 'local';
    if (shouldRender) {
      render();
    }
    return;
  }

  authState.status = 'signed-in';
  authState.user = session.user;
  authState.syncStatus = 'syncing';
  try {
    await loadCloudHistory();
    authState.syncStatus = 'synced';
    authState.message = '';
  } catch (error) {
    console.error('Supabase sync failed', error);
    authState.syncStatus = 'error';
    authState.message = 'Could not sync yet. Local progress is still safe.';
  }
  if (shouldRender) {
    render();
  }
}

async function sendMagicLink(event) {
  event.preventDefault();
  const email = document.querySelector('#auth-email')?.value.trim();
  if (!email || !supabase) {
    return;
  }

  authMenuOpen = true;
  authState.message = 'Sending your sign-in link…';
  render();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: authMode === 'signup',
      emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
    },
  });
  authState.message = error
    ? error.message
    : authMode === 'signup'
      ? 'Check your email to finish creating your account.'
      : 'Check your email for the sign-in link.';
  render();
}

async function signOut() {
  if (!supabase) {
    return;
  }
  authMenuOpen = false;
  await syncHistoryToCloud();
  await supabase.auth.signOut();
}

function queueCloudSync() {
  if (!supabase || !authState.user) {
    return;
  }
  if (cloudSyncTimer) {
    window.clearTimeout(cloudSyncTimer);
  }
  cloudSyncTimer = window.setTimeout(() => {
    syncHistoryToCloud().catch((error) => {
      console.error('Supabase save failed', error);
      authState.syncStatus = 'error';
    });
  }, 350);
}

async function syncHistoryToCloud() {
  if (!supabase || !authState.user) {
    return;
  }
  authState.syncStatus = 'syncing';
  const { error } = await supabase.from('progress_snapshots').upsert({
    user_id: authState.user.id,
    history: state.history,
    updated_at: state.history.updatedAt ?? new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) {
    authState.syncStatus = 'error';
    throw error;
  }
  authState.syncStatus = 'synced';
}

async function loadCloudHistory() {
  const { data, error } = await supabase
    .from('progress_snapshots')
    .select('history, updated_at')
    .eq('user_id', authState.user.id)
    .maybeSingle();
  if (error) {
    throw error;
  }

  if (data?.history) {
    state.history = mergeHistories(state.history, normalizeHistory(data.history));
    state.dailyGoal = state.history.dailyGoal;
    saveHistory({ queueSync: false });
  }
  await syncHistoryToCloud();
}

function mergeHistories(local, remote) {
  const merged = createEmptyHistory();
  const localIsNewer = timestamp(local.updatedAt) >= timestamp(remote.updatedAt);
  const spendableSource = localIsNewer ? local : remote;
  merged.dailyGoal = localIsNewer ? local.dailyGoal : remote.dailyGoal;
  merged.stats = mergeRecordMaps(local.stats, remote.stats);
  merged.daily = mergeRecordMaps(local.daily, remote.daily);
  merged.activeSession = pickLatestRecord(local.activeSession, remote.activeSession);
  merged.lastSession = pickLatestRecord(local.lastSession, remote.lastSession);
  merged.currentCoins = Number(spendableSource.currentCoins ?? 0);
  merged.lifetimeCoins = Math.max(Number(local.lifetimeCoins ?? 0), Number(remote.lifetimeCoins ?? 0), merged.currentCoins);
  merged.badges = mergeBadges(local.badges, remote.badges);
  merged.claimedMilestones = {
    ...local.claimedMilestones,
    ...remote.claimedMilestones,
    ...Object.fromEntries(merged.badges.map((badge) => [badge.id, true])),
  };
  merged.coinHistory = mergeCoinHistory(local.coinHistory, remote.coinHistory);
  merged.shop = mergeShops(local.shop, remote.shop, spendableSource.shop);
  merged.updatedAt = new Date(Math.max(timestamp(local.updatedAt), timestamp(remote.updatedAt))).toISOString();
  return normalizeHistory(merged);
}

function mergeBadges(localBadges = [], remoteBadges = []) {
  const byId = new Map();
  [...localBadges, ...remoteBadges].forEach((badge) => {
    const existing = byId.get(badge.id);
    if (!existing || timestamp(badge.unlockedAt) < timestamp(existing.unlockedAt)) {
      byId.set(badge.id, badge);
    }
  });
  return [...byId.values()];
}

function mergeCoinHistory(localEntries = [], remoteEntries = []) {
  const byId = new Map();
  [...localEntries, ...remoteEntries].forEach((entry) => {
    if (!byId.has(entry.id)) {
      byId.set(entry.id, entry);
    }
  });
  return [...byId.values()].sort((first, second) => timestamp(second.createdAt) - timestamp(first.createdAt)).slice(0, 80);
}

function mergeShops(localShop = {}, remoteShop = {}, preferredShop = {}) {
  const owned = [...new Set([...(localShop.owned ?? []), ...(remoteShop.owned ?? [])])];
  const equipped = owned.includes(preferredShop.equipped) ? preferredShop.equipped : (owned.includes(localShop.equipped) ? localShop.equipped : null);
  const decor = owned.includes(preferredShop.decor) ? preferredShop.decor : (owned.includes(localShop.decor) ? localShop.decor : null);
  return { owned, equipped, decor };
}

function mergeRecordMaps(localRecords = {}, remoteRecords = {}) {
  const merged = {};
  const ids = new Set([...Object.keys(localRecords), ...Object.keys(remoteRecords)]);
  ids.forEach((id) => {
    merged[id] = pickLatestRecord(localRecords[id], remoteRecords[id]);
  });
  return merged;
}

function pickLatestRecord(localRecord, remoteRecord) {
  if (!localRecord) return remoteRecord;
  if (!remoteRecord) return localRecord;
  return timestamp(localRecord.updatedAt ?? localRecord.completedAt) >= timestamp(remoteRecord.updatedAt ?? remoteRecord.completedAt)
    ? localRecord
    : remoteRecord;
}

function timestamp(value) {
  const parsed = Date.parse(value ?? '');
  return Number.isFinite(parsed) ? parsed : 0;
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

async function boot() {
  await initializeCloudSync();
  render();
}

boot();
