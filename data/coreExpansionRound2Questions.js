const LABELS = ['A', 'B', 'C', 'D', 'E'];

function difficultyFor(index) {
  if (index < 3) return 'easy';
  if (index < 8) return 'medium';
  return 'hard';
}

function makeOptions(answer, distractors, correctIndex) {
  const values = distractors.map(String);
  values.splice(correctIndex, 0, String(answer));
  return {
    options: values.map((text, index) => ({ label: LABELS[index], text })),
    correctAnswer: LABELS[correctIndex],
  };
}

function analogyHtml(examples, target) {
  const pairs = [...examples, [target, '?']];
  return `<div class="number-analogy">${pairs.map(([input, output]) => `<span class="number-pair">[<b>${input}</b><i>&rarr;</i><b>${output}</b>]</span>`).join('')}</div>`;
}

const sentenceSeeds = [
  ['The moon was barely visible because thick clouds ___ the sky.', 'covered', ['measured', 'polished', 'borrowed', 'divided'], 'Covered means spread over or hid from view. Thick clouds covered the sky and made the moon hard to see.'],
  ['Jamal organized the facts into a chart so the pattern would be easier to ___.', 'recognize', ['scatter', 'postpone', 'whisper', 'decorate'], 'To recognize a pattern is to notice and identify it. Organizing facts can make a pattern easier to see.'],
  ['The audience remained ___ while the violinist played the quiet passage.', 'attentive', ['reckless', 'bitter', 'vacant', 'crooked'], 'Attentive means listening or watching carefully, which fits an audience during a quiet performance.'],
  ['A good summary includes the main ideas but leaves out ___ details.', 'minor', ['essential', 'central', 'major', 'crucial'], 'Minor details are less important, so they can be left out of a concise summary.'],
  ['The engineer tested several materials before selecting the most ___ one for the bridge.', 'durable', ['fragile', 'temporary', 'silent', 'ordinary'], 'Durable means strong enough to last, an important quality for bridge material.'],
  ['Since the directions were ambiguous, Priya asked the teacher to ___ them.', 'explain', ['misplace', 'repeat silently', 'ignore', 'shorten randomly'], 'Ambiguous directions are unclear, so Priya asked the teacher to explain them.'],
  ['The animal\'s tracks were faint, but the ranger could still ___ them.', 'identify', ['invent', 'erase', 'deliver', 'divide'], 'To identify tracks is to recognize which animal made them.'],
  ['The debate team used facts rather than opinions to make its argument more ___.', 'convincing', ['accidental', 'fragile', 'ordinary', 'secret'], 'Facts provide evidence, making an argument more convincing or believable.'],
  ['The sudden drop in temperature was an ___ that snow might arrive.', 'indication', ['obstacle', 'apology', 'ingredient', 'argument'], 'An indication is a sign that something may happen. The colder temperature was a sign of possible snow.'],
  ['By comparing both accounts, the historian noticed a serious ___ between them.', 'contradiction', ['celebration', 'translation', 'agreement', 'decoration'], 'A contradiction occurs when two statements cannot both be true. Comparing the accounts revealed that conflict.'],
];

const verbalAnalogySeeds = [
  ['Key is to lock as password is to ___', 'account', ['window', 'pencil', 'bicycle', 'garden'], 'A key gives access through a lock. A password gives access to an account.'],
  ['Feather is to light as boulder is to ___', 'heavy', ['smooth', 'quiet', 'tiny', 'hollow'], 'A feather is light in weight. A boulder is heavy in weight.'],
  ['Cub is to bear as foal is to ___', 'horse', ['goat', 'chicken', 'deer', 'rabbit'], 'A cub is a young bear. A foal is a young horse.'],
  ['Recipe is to meal as blueprint is to ___', 'building', ['song', 'river', 'blanket', 'garden'], 'A recipe is a plan for making a meal. A blueprint is a plan for constructing a building.'],
  ['Gill is to fish as lung is to ___', 'human', ['tree', 'insect', 'stone', 'mushroom'], 'A fish uses gills to breathe. A human uses lungs to breathe.'],
  ['Expand is to contract as accept is to ___', 'reject', ['collect', 'explain', 'protect', 'expect'], 'Expand and contract are opposites. Accept and reject are opposites.'],
  ['Orchestra is to musicians as fleet is to ___', 'ships', ['drivers', 'books', 'mountains', 'artists'], 'An orchestra is a group of musicians. A fleet is a group of ships.'],
  ['Stanza is to poem as chapter is to ___', 'novel', ['sentence', 'dictionary', 'newspaper', 'speech'], 'A stanza is a section of a poem. A chapter is a section of a novel.'],
  ['Erosion is to rock as rust is to ___', 'metal', ['glass', 'cloth', 'paper', 'rubber'], 'Erosion gradually wears away rock. Rust gradually damages metal.'],
  ['Curious is to inquire as hungry is to ___', 'eat', ['sleep', 'listen', 'measure', 'paint'], 'Curiosity can lead someone to inquire. Hunger can lead someone to eat.'],
];

const classificationSeeds = [
  [['Robin', 'Eagle', 'Sparrow', 'Penguin', 'Bat'], 'Bat', 'Robin, eagle, sparrow, and penguin are birds. A bat is a mammal.'],
  [['Cube', 'Sphere', 'Cone', 'Pyramid', 'Circle'], 'Circle', 'Cube, sphere, cone, and pyramid are three-dimensional solids. A circle is a two-dimensional shape.'],
  [['Celsius', 'Fahrenheit', 'Kelvin', 'Thermometer', 'Inch'], 'Inch', 'Celsius, Fahrenheit, Kelvin, and thermometer relate to temperature. An inch measures length.'],
  [['Persuade', 'Convince', 'Influence', 'Encourage', 'Measure'], 'Measure', 'Persuade, convince, influence, and encourage can affect a person\'s actions or beliefs. Measure means to find an amount.'],
  [['Peninsula', 'Island', 'Continent', 'Archipelago', 'River'], 'River', 'Peninsula, island, continent, and archipelago name land areas. A river is flowing water.'],
  [['Copper', 'Silver', 'Aluminum', 'Gold', 'Rubber'], 'Rubber', 'Copper, silver, aluminum, and gold conduct electricity well. Rubber is an electrical insulator.'],
  [['Quickly', 'Slowly', 'Gently', 'Carefully', 'Bright'], 'Bright', 'Quickly, slowly, gently, and carefully are adverbs ending in -ly. Bright does not belong to that pattern.'],
  [['Democracy', 'Monarchy', 'Republic', 'Dictatorship', 'Currency'], 'Currency', 'Democracy, monarchy, republic, and dictatorship are forms of government. Currency is a system of money.'],
  [['Numerator', 'Denominator', 'Fraction', 'Decimal', 'Paragraph'], 'Paragraph', 'Numerator, denominator, fraction, and decimal are mathematical terms. Paragraph is a writing term.'],
  [['Hatchling', 'Chick', 'Foal', 'Calf', 'Parent'], 'Parent', 'Hatchling, chick, foal, and calf name young animals. A parent is an adult.'],
];

const numberAnalogySeeds = [
  [[[2, 11], [7, 16], [15, 24]], 21, 30, [27, 28, 29, 31], 'Add 9'],
  [[[12, 7], [20, 15], [33, 28]], 41, 36, [34, 35, 37, 46], 'Subtract 5'],
  [[[2, 12], [4, 24], [7, 42]], 9, 54, [45, 48, 52, 63], 'Multiply by 6'],
  [[[18, 3], [42, 7], [66, 11]], 54, 9, [6, 8, 10, 12], 'Divide by 6'],
  [[[2, 9], [6, 17], [11, 27]], 14, 33, [29, 31, 32, 35], 'Multiply by 2, then add 5'],
  [[[2, 7], [5, 19], [9, 35]], 12, 47, [43, 45, 46, 48], 'Multiply by 4, then subtract 1'],
  [[[8, 4], [20, 7], [36, 11]], 44, 13, [10, 12, 14, 15], 'Divide by 4, then add 2'],
  [[[2, 7], [4, 19], [7, 52]], 6, 39, [35, 36, 38, 42], 'Square the number, then add 3'],
  [[[52, 3], [83, 5], [94, 5]], 71, 6, [4, 5, 7, 8], 'Find the difference between the digits'],
  [[[24, 8], [31, 3], [52, 10]], 63, 18, [9, 12, 16, 21], 'Multiply the digits'],
];

const puzzleSeeds = [
  ['___ + 46 = 91', 45, [43, 44, 46, 47], 'Subtract 46 from 91 to get 45.'],
  ['120 &minus; ___ = 73', 47, [43, 46, 48, 53], '120 minus 73 equals 47.'],
  ['9 &times; ___ = 108', 12, [9, 10, 11, 13], '108 divided by 9 equals 12.'],
  ['144 &divide; ___ = 16', 9, [7, 8, 10, 12], '144 divided by 16 equals 9.'],
  ['___ &divide; 8 = 11', 88, [80, 84, 89, 96], '11 times 8 equals 88.'],
  ['(7 &times; 9) &minus; ___ = 44', 19, [17, 18, 20, 21], '7 times 9 is 63. Then 63 minus 44 equals 19.'],
  ['___ &divide; 5 + 6 = 18', 60, [50, 55, 65, 90], '18 minus 6 is 12. The missing number is 12 times 5, or 60.'],
  ['6 &times; ___ &minus; 7 = 47', 9, [7, 8, 10, 12], '47 plus 7 is 54. Then 54 divided by 6 equals 9.'],
  ['&Delta; + &Delta; = 20<br>&Delta; + &#9633; = 17<br>&#9633; = ?', 7, [5, 6, 8, 10], 'Each triangle is 10. Since 10 plus the box equals 17, the box is 7.'],
  ['&#9675; &times; 4 = 36<br>&#9675; + &#9671; = 15<br>&#9671; = ?', 6, [4, 5, 7, 9], 'The circle is 9. Since 9 plus the diamond equals 15, the diamond is 6.'],
];

const seriesSeeds = [
  [[4, 10, 16, 22], 28, [26, 27, 29, 32], 'Add 6 each time.'],
  [[67, 59, 51, 43], 35, [33, 34, 36, 37], 'Subtract 8 each time.'],
  [[2, 6, 18, 54], 162, [108, 144, 160, 164], 'Multiply by 3 each time.'],
  [[162, 54, 18, 6], 2, [1, 3, 4, 6], 'Divide by 3 each time.'],
  [[3, 5, 9, 15, 23], 33, [29, 31, 32, 35], 'Add 2, 4, 6, 8, then 10.'],
  [[45, 43, 39, 33, 25], 15, [13, 14, 16, 17], 'Subtract 2, 4, 6, 8, then 10.'],
  [[2, 8, 20, 44], 92, [84, 88, 90, 96], 'Multiply by 2, then add 4.'],
  [[5, 12, 9, 16, 13, 20], 17, [15, 16, 18, 23], 'Alternate adding 7 and subtracting 3.'],
  [[2, 20, 5, 25, 8, 30], 11, [10, 12, 33, 35], 'The odd-position numbers add 3: 2, 5, 8, 11.'],
  [[4, 9, 16, 25, 36], 49, [42, 45, 48, 64], 'These are consecutive square numbers from 2 squared through 7 squared.'],
];

const source = 'Original core expansion round 2 2026';

const sentenceQuestions = sentenceSeeds.map(([question, answer, distractors, explanation], index) => ({
  id: `round2-sentence-${String(index + 1).padStart(2, '0')}`,
  subtest: 'Sentence Completion', battery: 'Verbal Battery', difficulty: difficultyFor(index), source,
  question, ...makeOptions(answer, distractors, index % 5), explanation,
}));

const verbalAnalogyQuestions = verbalAnalogySeeds.map(([question, answer, distractors, explanation], index) => ({
  id: `round2-verbal-analogy-${String(index + 1).padStart(2, '0')}`,
  subtest: 'Verbal Analogies', battery: 'Verbal Battery', difficulty: difficultyFor(index), source,
  question, ...makeOptions(answer, distractors, (index + 1) % 5), explanation,
}));

const classificationQuestions = classificationSeeds.map(([words, answer, explanation], index) => ({
  id: `round2-classification-${String(index + 1).padStart(2, '0')}`,
  subtest: 'Verbal Classification', battery: 'Verbal Battery', difficulty: difficultyFor(index), source,
  question: 'Which word does NOT belong?', questionNote: words.join(', '),
  ...makeOptions(answer, words.filter((word) => word !== answer), (index + 2) % 5), explanation,
}));

const numberAnalogyQuestions = numberAnalogySeeds.map(([examples, target, answer, distractors, rule], index) => ({
  id: `round2-number-analogy-${String(index + 1).padStart(2, '0')}`,
  subtest: 'Number Analogies', battery: 'Quantitative Battery', difficulty: difficultyFor(index), source,
  question: analogyHtml(examples, target), questionNote: 'Use the same rule for every pair.',
  ...makeOptions(answer, distractors, (index + 3) % 5), explanation: `${rule}. ${target} becomes ${answer}.`,
}));

const puzzleQuestions = puzzleSeeds.map(([question, answer, distractors, explanation], index) => ({
  id: `round2-number-puzzle-${String(index + 1).padStart(2, '0')}`,
  subtest: 'Number Puzzles', battery: 'Quantitative Battery', difficulty: difficultyFor(index), source,
  question, questionNote: 'What number makes the statement true?',
  ...makeOptions(answer, distractors, (index + 4) % 5), explanation,
}));

const seriesQuestions = seriesSeeds.map(([terms, answer, distractors, rule], index) => ({
  id: `round2-number-series-${String(index + 1).padStart(2, '0')}`,
  subtest: 'Number Series', battery: 'Quantitative Battery', difficulty: difficultyFor(index), source,
  question: `${terms.join(', ')}, ___`, questionNote: 'What comes next?',
  ...makeOptions(answer, distractors, index % 5), explanation: `${rule} The next number is ${answer}.`,
}));

export const coreExpansionRound2Questions = [
  ...sentenceQuestions,
  ...verbalAnalogyQuestions,
  ...classificationQuestions,
  ...numberAnalogyQuestions,
  ...puzzleQuestions,
  ...seriesQuestions,
];

if (coreExpansionRound2Questions.length !== 60) {
  throw new Error(`Expected 60 round 2 expansion questions, found ${coreExpansionRound2Questions.length}.`);
}
