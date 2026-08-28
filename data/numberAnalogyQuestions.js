const LABELS = ['A', 'B', 'C', 'D', 'E'];

function analogyHtml(examples, target) {
  const pairs = [...examples, [target, '?']];
  return `<div class="number-analogy">${pairs.map(([input, output]) => `<span class="number-pair">[<b>${input}</b><i>&rarr;</i><b>${output}</b>]</span>`).join('')}</div>`;
}

function makeOptions(answer, distractors, correctIndex) {
  const values = distractors.map(String);
  values.splice(correctIndex, 0, String(answer));
  return {
    options: values.map((text, index) => ({ label: LABELS[index], text })),
    correctAnswer: LABELS[correctIndex],
  };
}

const seeds = [
  // Easy: one-step whole-number transformations (15)
  { difficulty: 'easy', examples: [[2, 5], [7, 10], [11, 14]], target: 15, answer: 18, distractors: [12, 16, 17, 20], rule: 'Add 3' },
  { difficulty: 'easy', examples: [[1, 6], [6, 11], [12, 17]], target: 14, answer: 19, distractors: [9, 16, 18, 21], rule: 'Add 5' },
  { difficulty: 'easy', examples: [[3, 11], [10, 18], [15, 23]], target: 20, answer: 28, distractors: [22, 25, 27, 30], rule: 'Add 8' },
  { difficulty: 'easy', examples: [[8, 6], [13, 11], [19, 17]], target: 24, answer: 22, distractors: [20, 21, 23, 26], rule: 'Subtract 2' },
  { difficulty: 'easy', examples: [[9, 5], [15, 11], [22, 18]], target: 30, answer: 26, distractors: [24, 25, 27, 34], rule: 'Subtract 4' },
  { difficulty: 'easy', examples: [[3, 6], [8, 16], [11, 22]], target: 14, answer: 28, distractors: [16, 24, 26, 42], rule: 'Multiply by 2' },
  { difficulty: 'easy', examples: [[2, 6], [5, 15], [9, 27]], target: 12, answer: 36, distractors: [24, 30, 33, 48], rule: 'Multiply by 3' },
  { difficulty: 'easy', examples: [[2, 8], [6, 24], [9, 36]], target: 11, answer: 44, distractors: [33, 40, 42, 48], rule: 'Multiply by 4' },
  { difficulty: 'easy', examples: [[8, 4], [18, 9], [30, 15]], target: 26, answer: 13, distractors: [11, 12, 14, 16], rule: 'Divide by 2' },
  { difficulty: 'easy', examples: [[12, 4], [21, 7], [33, 11]], target: 27, answer: 9, distractors: [6, 8, 10, 12], rule: 'Divide by 3' },
  { difficulty: 'easy', examples: [[16, 4], [28, 7], [44, 11]], target: 36, answer: 9, distractors: [6, 8, 10, 12], rule: 'Divide by 4' },
  { difficulty: 'easy', examples: [[4, 14], [9, 19], [15, 25]], target: 22, answer: 32, distractors: [27, 30, 31, 34], rule: 'Add 10' },
  { difficulty: 'easy', examples: [[12, 5], [20, 13], [31, 24]], target: 35, answer: 28, distractors: [25, 27, 29, 42], rule: 'Subtract 7' },
  { difficulty: 'easy', examples: [[2, 10], [4, 20], [7, 35]], target: 9, answer: 45, distractors: [36, 40, 44, 50], rule: 'Multiply by 5' },
  { difficulty: 'easy', examples: [[20, 4], [35, 7], [55, 11]], target: 45, answer: 9, distractors: [7, 8, 10, 12], rule: 'Divide by 5' },

  // Medium: two-step, square, root, and digit rules (25)
  { difficulty: 'medium', examples: [[2, 5], [5, 11], [8, 17]], target: 11, answer: 23, distractors: [21, 22, 24, 33], rule: 'Multiply by 2, then add 1' },
  { difficulty: 'medium', examples: [[1, 5], [4, 11], [7, 17]], target: 10, answer: 23, distractors: [20, 21, 22, 25], rule: 'Multiply by 2, then add 3' },
  { difficulty: 'medium', examples: [[3, 5], [6, 11], [9, 17]], target: 12, answer: 23, distractors: [21, 22, 24, 36], rule: 'Multiply by 2, then subtract 1' },
  { difficulty: 'medium', examples: [[2, 7], [4, 13], [7, 22]], target: 9, answer: 28, distractors: [25, 26, 27, 30], rule: 'Multiply by 3, then add 1' },
  { difficulty: 'medium', examples: [[2, 4], [5, 13], [8, 22]], target: 10, answer: 28, distractors: [24, 27, 29, 30], rule: 'Multiply by 3, then subtract 2' },
  { difficulty: 'medium', examples: [[1, 6], [3, 14], [6, 26]], target: 8, answer: 34, distractors: [30, 32, 33, 36], rule: 'Multiply by 4, then add 2' },
  { difficulty: 'medium', examples: [[2, 5], [5, 17], [8, 29]], target: 10, answer: 37, distractors: [35, 36, 38, 40], rule: 'Multiply by 4, then subtract 3' },
  { difficulty: 'medium', examples: [[1, 7], [3, 17], [6, 32]], target: 8, answer: 42, distractors: [38, 40, 41, 45], rule: 'Multiply by 5, then add 2' },
  { difficulty: 'medium', examples: [[2, 6], [4, 16], [7, 31]], target: 9, answer: 41, distractors: [36, 40, 42, 45], rule: 'Multiply by 5, then subtract 4' },
  { difficulty: 'medium', examples: [[8, 6], [14, 9], [22, 13]], target: 30, answer: 17, distractors: [15, 16, 18, 20], rule: 'Divide by 2, then add 2' },
  { difficulty: 'medium', examples: [[6, 6], [12, 9], [20, 13]], target: 28, answer: 17, distractors: [14, 16, 18, 20], rule: 'Divide by 2, then add 3' },
  { difficulty: 'medium', examples: [[9, 5], [18, 8], [30, 12]], target: 24, answer: 10, distractors: [8, 9, 11, 12], rule: 'Divide by 3, then add 2' },
  { difficulty: 'medium', examples: [[12, 4], [24, 7], [40, 11]], target: 32, answer: 9, distractors: [7, 8, 10, 12], rule: 'Divide by 4, then add 1' },
  { difficulty: 'medium', examples: [[10, 5], [25, 8], [40, 11]], target: 35, answer: 10, distractors: [7, 9, 11, 12], rule: 'Divide by 5, then add 3' },
  { difficulty: 'medium', examples: [[2, 4], [4, 16], [6, 36]], target: 7, answer: 49, distractors: [42, 47, 48, 56], rule: 'Square the number' },
  { difficulty: 'medium', examples: [[3, 9], [5, 25], [8, 64]], target: 6, answer: 36, distractors: [30, 32, 35, 42], rule: 'Square the number' },
  { difficulty: 'medium', examples: [[2, 5], [4, 17], [6, 37]], target: 7, answer: 50, distractors: [48, 49, 51, 56], rule: 'Square the number, then add 1' },
  { difficulty: 'medium', examples: [[3, 8], [5, 24], [7, 48]], target: 6, answer: 35, distractors: [30, 34, 36, 42], rule: 'Square the number, then subtract 1' },
  { difficulty: 'medium', examples: [[16, 4], [36, 6], [64, 8]], target: 81, answer: 9, distractors: [7, 8, 10, 12], rule: 'Find the square root' },
  { difficulty: 'medium', examples: [[9, 3], [49, 7], [100, 10]], target: 121, answer: 11, distractors: [9, 10, 12, 13], rule: 'Find the square root' },
  { difficulty: 'medium', examples: [[23, 5], [41, 5], [62, 8]], target: 74, answer: 11, distractors: [9, 10, 12, 28], rule: 'Add the digits' },
  { difficulty: 'medium', examples: [[34, 7], [52, 7], [81, 9]], target: 63, answer: 9, distractors: [7, 8, 10, 18], rule: 'Add the digits' },
  { difficulty: 'medium', examples: [[23, 6], [41, 4], [62, 12]], target: 34, answer: 12, distractors: [7, 10, 11, 14], rule: 'Multiply the digits' },
  { difficulty: 'medium', examples: [[12, 21], [25, 52], [63, 36]], target: 72, answer: 27, distractors: [25, 28, 72, 79], rule: 'Reverse the digits' },
  { difficulty: 'medium', examples: [[42, 2], [73, 4], [95, 4]], target: 81, answer: 7, distractors: [5, 6, 8, 9], rule: 'Find the difference between the two digits' },

  // Hard: nonlinear, larger two-step, and digit transformations (10)
  { difficulty: 'hard', examples: [[2, 8], [3, 27], [4, 64]], target: 5, answer: 125, distractors: [25, 100, 120, 130], rule: 'Cube the number' },
  { difficulty: 'hard', examples: [[1, 1], [2, 8], [4, 64]], target: 3, answer: 27, distractors: [9, 18, 24, 30], rule: 'Cube the number' },
  { difficulty: 'hard', examples: [[2, 6], [5, 27], [7, 51]], target: 8, answer: 66, distractors: [62, 64, 65, 68], rule: 'Square the number, then add 2' },
  { difficulty: 'hard', examples: [[3, 6], [5, 22], [8, 61]], target: 7, answer: 46, distractors: [42, 45, 47, 49], rule: 'Square the number, then subtract 3' },
  { difficulty: 'hard', examples: [[2, 17], [5, 35], [8, 53]], target: 11, answer: 71, distractors: [65, 69, 70, 72], rule: 'Multiply by 6, then add 5' },
  { difficulty: 'hard', examples: [[2, 10], [4, 24], [7, 45]], target: 9, answer: 59, distractors: [56, 57, 60, 63], rule: 'Multiply by 7, then subtract 4' },
  { difficulty: 'hard', examples: [[12, 9], [24, 13], [39, 18]], target: 30, answer: 15, distractors: [13, 14, 16, 18], rule: 'Divide by 3, then add 5' },
  { difficulty: 'hard', examples: [[24, 8], [32, 6], [53, 15]], target: 43, answer: 12, distractors: [7, 10, 11, 14], rule: 'Multiply the digits' },
  { difficulty: 'hard', examples: [[13, 31], [42, 24], [75, 57]], target: 86, answer: 68, distractors: [66, 67, 69, 86], rule: 'Reverse the digits' },
  { difficulty: 'hard', examples: [[61, 5], [83, 5], [92, 7]], target: 74, answer: 3, distractors: [2, 4, 7, 11], rule: 'Find the difference between the two digits' },
];

export const numberAnalogyQuestions = seeds.map((seed, index) => ({
  id: `number-analogy-new-${String(index + 1).padStart(3, '0')}`,
  subtest: 'Number Analogies',
  battery: 'Quantitative Battery',
  difficulty: seed.difficulty,
  source: 'Original Number Analogy practice',
  question: analogyHtml(seed.examples, seed.target),
  questionNote: 'Use the same rule for every pair.',
  ...makeOptions(seed.answer, seed.distractors, index % LABELS.length),
  explanation: `${seed.rule}. ${seed.target} becomes ${seed.answer}.`,
}));

if (numberAnalogyQuestions.length !== 50) {
  throw new Error(`Expected 50 new Number Analogies, found ${numberAnalogyQuestions.length}.`);
}
