import {
  serializePaperPoints,
  unfoldPaperPoints,
} from '../lib/paperFoldingValidator.js';

const LABELS = ['A', 'B', 'C', 'D', 'E'];
const SOURCE = 'Original nine-subtest expansion 500 — 2026';

function difficultyFor(index, total) {
  if (index < Math.round(total * 0.3)) return 'easy';
  if (index < Math.round(total * 0.8)) return 'medium';
  return 'hard';
}

function rotate(values, offset) {
  const normalized = ((offset % values.length) + values.length) % values.length;
  return [...values.slice(normalized), ...values.slice(0, normalized)];
}

function makeOptions(answer, distractors, offset = 0) {
  const values = rotate([String(answer), ...distractors.map(String)], offset);
  return {
    options: values.map((text, index) => ({ label: LABELS[index], text })),
    correctAnswer: LABELS[values.indexOf(String(answer))],
  };
}

function makeVisualOptions(correct, distractors, offset = 0) {
  const values = rotate([correct, ...distractors], offset);
  return {
    options: values.map((text, index) => ({ label: LABELS[index], text })),
    correctAnswer: LABELS[values.indexOf(correct)],
  };
}

// Verbal: 40 Sentence Completion questions.
const sentenceGroups = [
  [
    ['patient', 'able to wait calmly', 'Even though the line moved slowly, Amara remained ___.'],
    ['eager', 'very ready and excited to do something', 'The class was ___ to begin the science experiment.'],
    ['weary', 'very tired after effort', 'After the long hike, the campers felt ___.'],
    ['grateful', 'thankful for help or kindness', 'Noah was ___ when his neighbor returned the lost dog.'],
    ['puzzled', 'confused because something is hard to understand', 'The missing piece left the builders feeling ___.'],
  ],
  [
    ['observe', 'watch carefully to notice details', 'Scientists ___ the caterpillar each day and record its changes.'],
    ['predict', 'say what is likely to happen next', 'Use the dark clouds to ___ tomorrow\'s weather.'],
    ['compare', 'look for similarities and differences', 'We will ___ the two maps to see how the town changed.'],
    ['measure', 'find the size or amount of something', 'Use the ruler to ___ the length of the leaf.'],
    ['record', 'write down information for later use', 'Please ___ each temperature in the chart.'],
  ],
  [
    ['fragile', 'easily broken or damaged', 'The museum worker carried the ___ vase with both hands.'],
    ['massive', 'very large and heavy', 'A ___ boulder blocked the narrow road.'],
    ['slender', 'long and thin', 'The ___ stem bent gently in the breeze.'],
    ['rough', 'not smooth to the touch', 'The tree bark felt ___ beneath my hand.'],
    ['hollow', 'empty on the inside', 'The woodpecker nested inside the ___ tree.'],
  ],
  [
    ['essential', 'completely necessary', 'Clean water is ___ for every living thing.'],
    ['optional', 'available as a choice but not required', 'The extra art activity is ___, so students may choose it.'],
    ['temporary', 'lasting only a short time', 'The workers built a ___ bridge until the old one was repaired.'],
    ['permanent', 'intended to last for a very long time', 'The artist used stone to create a ___ monument.'],
    ['ordinary', 'common and not unusual', 'At first the plain gray rock looked ___.'],
  ],
  [
    ['swiftly', 'very quickly', 'The fox moved ___ across the open field.'],
    ['silently', 'without making sound', 'Snow fell ___ through the night.'],
    ['precisely', 'with exactness and care', 'The carpenter cut the board ___ at the marked line.'],
    ['rarely', 'not often', 'Desert towns ___ receive heavy rain.'],
    ['eventually', 'at last, after some time', 'After several attempts, Mina ___ solved the riddle.'],
  ],
  [
    ['ancient', 'belonging to a very long time ago', 'Archaeologists uncovered an ___ clay bowl.'],
    ['modern', 'related to the present time', 'The new library has a ___ design with solar panels.'],
    ['recent', 'having happened not long ago', 'A ___ storm left branches across the trail.'],
    ['future', 'the time that has not happened yet', 'The class wrote letters to their ___ selves.'],
    ['historic', 'important in history', 'The first moon landing was a ___ event.'],
  ],
  [
    ['assemble', 'put separate parts together', 'The team will ___ the model airplane after reading the directions.'],
    ['scatter', 'spread in many directions', 'A strong wind can ___ dry leaves across the yard.'],
    ['separate', 'move or keep things apart', 'Use the screen to ___ the sand from the pebbles.'],
    ['combine', 'join things together', 'We will ___ blue and yellow paint to make green.'],
    ['arrange', 'place things in an organized order', 'Please ___ the books from shortest to tallest.'],
  ],
  [
    ['evidence', 'facts or signs that support an idea', 'The muddy tracks were ___ that an animal had crossed the garden.'],
    ['method', 'a planned way of doing something', 'The class tested a new ___ for sorting the seeds.'],
    ['result', 'what happens because of an action', 'The final score was the ___ of careful practice.'],
    ['purpose', 'the reason something exists or is done', 'The ___ of a helmet is to protect the head.'],
    ['detail', 'a small fact or feature', 'The detective noticed every tiny ___ in the photograph.'],
  ],
];

const sentenceCompletionQuestions = sentenceGroups.flatMap((group, groupIndex) => group.map(([answer, meaning, sentence], itemIndex) => {
  const index = (groupIndex * 5) + itemIndex;
  const words = group.map(([word]) => word);
  const optionData = makeOptions(answer, words.filter((word) => word !== answer), index % 5);
  return {
    id: `exp500-sentence-${String(index + 1).padStart(3, '0')}`,
    subtest: 'Sentence Completion', battery: 'Verbal Battery', difficulty: difficultyFor(index, 40), source: SOURCE,
    question: sentence,
    ...optionData,
    wordMeanings: optionData.options.map((option) => ({ word: option.text, meaning: group.find(([word]) => word === option.text)?.[1] ?? '' })),
    explanation: `${answer[0].toUpperCase()}${answer.slice(1)} means ${meaning}. It is the only word that makes the sentence clear and logical.`,
    whyOtherChoices: 'The other words have meanings that do not fit the clue or action in this sentence.',
  };
}));

// Verbal: 40 analogy questions across eight relationship families.
const analogyFamilies = [
  ['tool and purpose', [['compass', 'find direction'], ['thermometer', 'measure temperature'], ['scale', 'measure weight'], ['clock', 'tell time'], ['telescope', 'view distant objects'], ['microscope', 'view tiny objects']]],
  ['object and source', [['honey', 'bee'], ['wool', 'sheep'], ['silk', 'silkworm'], ['milk', 'cow'], ['maple syrup', 'maple tree'], ['paper', 'wood']]],
  ['cause and result', [['practice', 'improvement'], ['rain', 'puddles'], ['heat', 'melting'], ['wind', 'movement'], ['exercise', 'strength'], ['study', 'knowledge']]],
  ['part and whole', [['petal', 'flower'], ['page', 'book'], ['brick', 'wall'], ['wheel', 'bicycle'], ['key', 'keyboard'], ['room', 'house']]],
  ['item and usual place', [['painting', 'gallery'], ['airplane', 'hangar'], ['book', 'library'], ['actor', 'stage'], ['ship', 'harbor'], ['judge', 'courtroom']]],
  ['degree of intensity', [['warm', 'hot'], ['cool', 'cold'], ['tired', 'exhausted'], ['pleased', 'delighted'], ['concerned', 'alarmed'], ['breeze', 'gale']]],
  ['action and result', [['weave', 'cloth'], ['bake', 'bread'], ['sculpt', 'statue'], ['compose', 'music'], ['write', 'story'], ['build', 'shelter']]],
  ['sequence', [['seed', 'sprout'], ['dawn', 'morning'], ['caterpillar', 'butterfly'], ['draft', 'final copy'], ['question', 'answer'], ['practice', 'performance']]],
];

const verbalAnalogyQuestions = analogyFamilies.flatMap(([relation, pairs], familyIndex) => Array.from({ length: 5 }, (_, itemIndex) => {
  const index = (familyIndex * 5) + itemIndex;
  const first = pairs[itemIndex];
  const target = pairs[itemIndex + 1];
  const answer = target[1];
  const distractors = pairs.filter((pair) => pair[1] !== answer && pair[1] !== first[1]).slice(0, 4).map((pair) => pair[1]);
  return {
    id: `exp500-verbal-analogy-${String(index + 1).padStart(3, '0')}`,
    subtest: 'Verbal Analogies', battery: 'Verbal Battery', difficulty: difficultyFor(index, 40), source: SOURCE,
    question: `${first[0]} is to ${first[1]} as ${target[0]} is to ___`,
    ...makeOptions(answer, distractors, (index + 1) % 5),
    explanation: `The relationship is ${relation}. ${first[0]} connects to ${first[1]} in the same way that ${target[0]} connects to ${answer}.`,
    whyOtherChoices: `The other choices do not complete the same ${relation} relationship.`,
  };
}));

// Verbal: 40 classification questions with a different outsider each time.
const classificationFamilies = [
  ['types of trees', ['oak', 'maple', 'pine', 'birch', 'willow'], ['tulip', 'daisy', 'rose', 'lily', 'violet']],
  ['ways to speak', ['whisper', 'shout', 'murmur', 'announce', 'reply'], ['skip', 'crawl', 'sprint', 'climb', 'slide']],
  ['measuring tools', ['ruler', 'scale', 'thermometer', 'stopwatch', 'measuring cup'], ['pillow', 'blanket', 'curtain', 'rug', 'towel']],
  ['weather words', ['drizzle', 'thunder', 'fog', 'hail', 'breeze'], ['island', 'valley', 'canyon', 'plateau', 'desert']],
  ['musical instruments', ['violin', 'trumpet', 'flute', 'drum', 'piano'], ['hammer', 'wrench', 'pliers', 'saw', 'level']],
  ['ways to think', ['infer', 'reason', 'analyze', 'consider', 'conclude'], ['stir', 'pour', 'slice', 'knead', 'boil']],
  ['units of time', ['second', 'minute', 'hour', 'day', 'week'], ['inch', 'foot', 'yard', 'mile', 'meter']],
  ['protective items', ['helmet', 'gloves', 'goggles', 'shield', 'knee pads'], ['spoon', 'plate', 'bowl', 'cup', 'fork']],
];

const verbalClassificationQuestions = classificationFamilies.flatMap(([category, members, outsiders], familyIndex) => outsiders.map((outsider, itemIndex) => {
  const index = (familyIndex * 5) + itemIndex;
  const included = members.filter((_, memberIndex) => memberIndex !== itemIndex);
  const words = rotate([...included, outsider], index % 5);
  return {
    id: `exp500-classification-${String(index + 1).padStart(3, '0')}`,
    subtest: 'Verbal Classification', battery: 'Verbal Battery', difficulty: difficultyFor(index, 40), source: SOURCE,
    question: 'Which word does NOT belong?', questionNote: words.join(', '),
    ...makeOptions(outsider, included, (index + 2) % 5),
    explanation: `${included.map((word) => word[0].toUpperCase() + word.slice(1)).join(', ')} are ${category}. ${outsider[0].toUpperCase()}${outsider.slice(1)} belongs to a different group.`,
    whyOtherChoices: `Each other choice is one of the ${category}.`,
  };
}));

// Quantitative: 50 Number Analogies, each with three independent examples.
function analogyHtml(examples, target) {
  return `<div class="number-analogy">${[...examples, [target, '?']].map(([input, output]) => `<span class="number-pair">[<b>${input}</b><i>&rarr;</i><b>${output}</b>]</span>`).join('')}</div>`;
}

const numberAnalogyRuleSets = [
  { label: (k) => `Add ${k}`, values: [6, 7, 9, 11, 13], apply: (x, k) => x + k, inputs: [3, 8, 14, 20] },
  { label: (k) => `Subtract ${k}`, values: [4, 5, 7, 8, 12], apply: (x, k) => x - k, inputs: [18, 25, 33, 42] },
  { label: (k) => `Multiply by ${k}`, values: [2, 3, 4, 5, 6], apply: (x, k) => x * k, inputs: [2, 5, 8, 11] },
  { label: (k) => `Divide by ${k}`, values: [2, 3, 4, 5, 6], apply: (x, k) => x / k, inputs: [60, 120, 180, 240] },
  { label: (k) => `Multiply by 2, then add ${k}`, values: [1, 3, 5, 7, 9], apply: (x, k) => (2 * x) + k, inputs: [2, 6, 11, 15] },
  { label: (k) => `Multiply by 3, then subtract ${k}`, values: [1, 2, 4, 5, 7], apply: (x, k) => (3 * x) - k, inputs: [4, 7, 10, 13] },
  { label: (k) => `Multiply by 4, then add ${k}`, values: [1, 2, 3, 5, 6], apply: (x, k) => (4 * x) + k, inputs: [2, 5, 8, 12] },
  { label: (k) => `Square the number, then add ${k}`, values: [1, 2, 4, 5, 7], apply: (x, k) => (x ** 2) + k, inputs: [2, 4, 6, 8] },
  { label: (k) => `Square the number, then subtract ${k}`, values: [1, 2, 3, 5, 6], apply: (x, k) => (x ** 2) - k, inputs: [4, 6, 8, 10] },
  { label: (k) => `Multiply by ${k}, then subtract 1`, values: [2, 3, 5, 6, 7], apply: (x, k) => (k * x) - 1, inputs: [3, 6, 9, 12] },
];

const numberAnalogyQuestions = numberAnalogyRuleSets.flatMap((ruleSet, setIndex) => ruleSet.values.map((parameter, itemIndex) => {
  const index = (setIndex * 5) + itemIndex;
  const shift = itemIndex % 3;
  const inputs = ruleSet.inputs.map((value) => value + (setIndex === 3 ? 0 : shift));
  const examples = inputs.slice(0, 3).map((input) => [input, ruleSet.apply(input, parameter)]);
  const target = inputs[3];
  const answer = ruleSet.apply(target, parameter);
  const distractors = [answer - 2, answer - 1, answer + 1, answer + 2].filter((value) => value >= 0);
  while (distractors.length < 4) distractors.push(answer + distractors.length + 3);
  return {
    id: `exp500-number-analogy-${String(index + 1).padStart(3, '0')}`,
    subtest: 'Number Analogies', battery: 'Quantitative Battery', difficulty: difficultyFor(index, 50), source: SOURCE,
    question: analogyHtml(examples, target),
    ...makeOptions(answer, distractors.slice(0, 4), index % 5),
    explanation: `${ruleSet.label(parameter)}. Applying the same rule to ${target} gives ${answer}.`,
    whyOtherChoices: 'The other numbers do not follow the same operation for all four pairs.',
  };
}));

// Quantitative: 50 Number Puzzles with a unique nonnegative integer solution.
const puzzleBuilders = [
  (n) => [`___ + ${14 + n} = ${39 + (2 * n)}`, 25 + n, `Subtract ${14 + n} from ${39 + (2 * n)}.`],
  (n) => [`${70 + (3 * n)} &minus; ___ = ${31 + n}`, 39 + (2 * n), `Subtract ${31 + n} from ${70 + (3 * n)}.`],
  (n) => [`${3 + n} &times; ___ = ${(3 + n) * (7 + n)}`, 7 + n, `Divide ${(3 + n) * (7 + n)} by ${3 + n}.`],
  (n) => [`${(5 + n) * (6 + n)} &divide; ___ = ${5 + n}`, 6 + n, `Divide ${(5 + n) * (6 + n)} by ${5 + n}.`],
  (n) => [`___ &divide; ${4 + n} = ${6 + n}`, (4 + n) * (6 + n), `Multiply ${4 + n} by ${6 + n}.`],
  (n) => [`(___ + ${3 + n}) &times; 2 = ${30 + (4 * n)}`, 12 + n, `Divide by 2, then subtract ${3 + n}.`],
  (n) => [`3 &times; ___ + ${5 + n} = ${35 + (4 * n)}`, 10 + n, `Subtract ${5 + n}, then divide by 3.`],
  (n) => [`(${8 + n} &times; ${5 + n}) &minus; ___ = ${(8 + n) * (5 + n) - (9 + n)}`, 9 + n, `Subtract the right side from ${(8 + n) * (5 + n)}.`],
  (n) => [`&Delta; + &Delta; = ${20 + (2 * n)}<br>&Delta; + &#9633; = ${17 + (2 * n)}<br>&#9633; = ?`, 7 + n, `Each triangle is ${10 + n}. The box is ${17 + (2 * n)} minus ${10 + n}.`],
  (n) => [`&#9675; &times; 4 = ${32 + (4 * n)}<br>&#9675; + &#9671; = ${15 + (2 * n)}<br>&#9671; = ?`, 7 + n, `The circle is ${8 + n}. Subtract it from ${15 + (2 * n)}.`],
];

const numberPuzzleQuestions = puzzleBuilders.flatMap((build, builderIndex) => Array.from({ length: 5 }, (_, itemIndex) => {
  const index = (builderIndex * 5) + itemIndex;
  const [expression, answer, explanation] = build(itemIndex);
  return {
    id: `exp500-number-puzzle-${String(index + 1).padStart(3, '0')}`,
    subtest: 'Number Puzzles', battery: 'Quantitative Battery', difficulty: difficultyFor(index, 50), source: SOURCE,
    question: `What number makes this true?<br>${expression}`,
    ...makeOptions(answer, [answer - 2, answer - 1, answer + 1, answer + 2].filter((value) => value >= 0).slice(0, 4), (index + 1) % 5),
    explanation: `${explanation} The missing number is ${answer}.`,
    whyOtherChoices: 'Each other number makes at least one equation false.',
  };
}));

// Quantitative: 50 Number Series with six visible terms.
const seriesBuilders = [
  (n) => ({ terms: Array.from({ length: 6 }, (_, i) => 3 + n + (i * (4 + n))), answer: 3 + n + (6 * (4 + n)), rule: `Add ${4 + n} each time.` }),
  (n) => ({ terms: Array.from({ length: 6 }, (_, i) => 90 + (4 * n) - (i * (5 + n))), answer: 90 + (4 * n) - (6 * (5 + n)), rule: `Subtract ${5 + n} each time.` }),
  (n) => ({ terms: Array.from({ length: 6 }, (_, i) => (2 + n) * (2 ** i)), answer: (2 + n) * 64, rule: 'Multiply by 2 each time.' }),
  (n) => {
    const terms = [2 + n];
    for (let i = 1; i < 6; i += 1) terms.push(terms.at(-1) + (i + n + 1));
    return { terms, answer: terms.at(-1) + n + 7, rule: `Add ${n + 2}, ${n + 3}, ${n + 4}, and continue increasing the add-on by 1.` };
  },
  (n) => {
    const factor = 2;
    const offset = n + 1;
    const terms = [2 + n];
    for (let i = 1; i < 6; i += 1) terms.push((factor * terms.at(-1)) + offset);
    return { terms, answer: (factor * terms.at(-1)) + offset, rule: `Multiply by 2, then add ${offset}.` };
  },
  (n) => {
    const first = 3 + n;
    const steps = [4 + n, 7 + n];
    const terms = [first];
    for (let i = 0; i < 5; i += 1) terms.push(terms.at(-1) + steps[i % 2]);
    return { terms, answer: terms.at(-1) + steps[1], rule: `Alternate adding ${steps[0]} and ${steps[1]}.` };
  },
  (n) => ({ terms: [2 + n, 20 + n, 5 + n, 24 + n, 8 + n, 28 + n], answer: 11 + n, rule: 'The odd-position numbers add 3 while the even-position numbers add 4.' }),
  (n) => ({ terms: [4 + n, 15 + n, 7 + n, 20 + n, 10 + n, 25 + n], answer: 13 + n, rule: 'The odd-position numbers add 3 while the even-position numbers add 5.' }),
  (n) => ({ terms: [1 + n, 4 + n, 9 + n, 16 + n, 25 + n, 36 + n], answer: 49 + n, rule: 'The differences are consecutive odd numbers: 3, 5, 7, 9, 11, then 13.' }),
  (n) => ({ terms: [70 + n, 67 + n, 61 + n, 52 + n, 40 + n, 25 + n], answer: 7 + n, rule: 'Subtract 3, 6, 9, 12, 15, then 18.' }),
];

const numberSeriesQuestions = seriesBuilders.flatMap((build, builderIndex) => Array.from({ length: 5 }, (_, itemIndex) => {
  const index = (builderIndex * 5) + itemIndex;
  const { terms, answer, rule } = build(itemIndex);
  return {
    id: `exp500-number-series-${String(index + 1).padStart(3, '0')}`,
    subtest: 'Number Series', battery: 'Quantitative Battery', difficulty: difficultyFor(index, 50), source: SOURCE,
    question: `What comes next? ${terms.join(', ')}, ___`,
    ...makeOptions(answer, [answer - 3, answer - 1, answer + 1, answer + 3].filter((value) => value >= 0).slice(0, 4), (index + 2) % 5),
    explanation: `${rule} The next number is ${answer}.`,
    whyOtherChoices: 'The other numbers do not continue every step of the series rule.',
  };
}));

// Shared SVG primitives for the 230 Nonverbal questions.
const COLORS = ['#3b82f6', '#ef8354', '#14b8a6', '#8b5cf6', '#eab308'];
const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'hexagon'];

function shapeMarkup({ shape = 'circle', fill = 'none', stroke = '#26344d', size = 17, x = 30, y = 30, feature = '', count = 1, color = null }) {
  const paint = color ?? fill;
  const drawOne = (cx, cy, scale = 1) => {
    const radius = size * scale;
    const attrs = `fill="${paint}" stroke="${stroke}" stroke-width="2.5"`;
    if (shape === 'circle') return `<circle cx="${cx}" cy="${cy}" r="${radius}" ${attrs}/>`;
    if (shape === 'square') return `<rect x="${cx - radius}" y="${cy - radius}" width="${radius * 2}" height="${radius * 2}" rx="2" ${attrs}/>`;
    if (shape === 'triangle') return `<polygon points="${cx},${cy - radius} ${cx + radius},${cy + radius} ${cx - radius},${cy + radius}" ${attrs}/>`;
    if (shape === 'diamond') return `<polygon points="${cx},${cy - radius} ${cx + radius},${cy} ${cx},${cy + radius} ${cx - radius},${cy}" ${attrs}/>`;
    return `<polygon points="${cx - radius},${cy} ${cx - radius / 2},${cy - radius * 0.86} ${cx + radius / 2},${cy - radius * 0.86} ${cx + radius},${cy} ${cx + radius / 2},${cy + radius * 0.86} ${cx - radius / 2},${cy + radius * 0.86}" ${attrs}/>`;
  };
  const positions = count === 1 ? [[x, y]] : count === 2 ? [[x - 10, y], [x + 10, y]] : [[x, y - 12], [x - 12, y + 10], [x + 12, y + 10]];
  const shapes = positions.map(([cx, cy]) => drawOne(cx, cy, count > 1 ? 0.55 : 1)).join('');
  const extras = {
    dot: `<circle cx="${x}" cy="${y}" r="4" fill="#26344d"/>`,
    horizontal: `<line x1="${x - 18}" y1="${y}" x2="${x + 18}" y2="${y}" stroke="#26344d" stroke-width="3"/>`,
    diagonal: `<line x1="${x - 14}" y1="${y + 14}" x2="${x + 14}" y2="${y - 14}" stroke="#26344d" stroke-width="3"/>`,
    topdot: `<circle cx="${x}" cy="${y - size - 6}" r="4" fill="#ef8354"/>`,
    inner: `<circle cx="${x}" cy="${y}" r="6" fill="#ef8354"/>`,
  };
  return shapes + (extras[feature] ?? '');
}

function iconSvg(descriptor, width = 64, height = 64) {
  return `<svg width="${width}" height="${height}" viewBox="0 0 60 60" role="img" aria-label="pattern figure">${shapeMarkup(descriptor)}</svg>`;
}

function varyDescriptor(descriptor, variant) {
  return {
    ...descriptor,
    size: (descriptor.size ?? 17) + (Math.floor(variant / 5) * 2),
  };
}

function groupSvg(descriptors) {
  return `<svg width="260" height="82" viewBox="0 0 240 72" role="img" aria-label="three figures that follow one rule">${descriptors.map((descriptor, index) => `<g transform="translate(${index * 80},6)">${shapeMarkup(descriptor)}</g>`).join('')}</svg>`;
}

const classificationRules = [
  { name: 'Each shape is filled with color', make: (v, i) => ({ shape: SHAPES[(v + i) % 5], fill: COLORS[v % 5] }), wrong: (v) => [{ shape: 'circle' }, { shape: 'square', feature: 'dot' }, { shape: 'triangle', feature: 'horizontal' }, { shape: 'diamond', feature: 'topdot' }] },
  { name: 'Each outline shape has a dot in its center', make: (v, i) => ({ shape: SHAPES[(v + i) % 5], feature: 'dot' }), wrong: (v) => [{ shape: SHAPES[v % 5] }, { shape: 'square', feature: 'topdot' }, { shape: 'triangle', fill: COLORS[2] }, { shape: 'diamond', feature: 'horizontal' }] },
  { name: 'Each figure contains two matching shapes', make: (v, i) => ({ shape: SHAPES[(v + i) % 5], count: 2, size: 16 }), wrong: () => [{ shape: 'circle', count: 1 }, { shape: 'square', count: 3 }, { shape: 'triangle', feature: 'dot' }, { shape: 'diamond', fill: COLORS[3] }] },
  { name: 'Each outline shape has a horizontal line through its center', make: (v, i) => ({ shape: SHAPES[(v + i) % 5], feature: 'horizontal' }), wrong: () => [{ shape: 'circle', feature: 'diagonal' }, { shape: 'square' }, { shape: 'triangle', feature: 'dot' }, { shape: 'diamond', fill: COLORS[1] }] },
  { name: 'Every figure uses the same color', make: (v, i) => ({ shape: SHAPES[(v + i) % 5], fill: COLORS[v % 5] }), wrong: (v) => [1, 2, 3, 4].map((shift, i) => ({ shape: SHAPES[(v + i + 1) % 5], fill: COLORS[(v + shift) % 5] })) },
  { name: 'Each outline shape has one small dot above it', make: (v, i) => ({ shape: SHAPES[(v + i) % 5], size: 14, feature: 'topdot' }), wrong: () => [{ shape: 'circle', feature: 'dot' }, { shape: 'square' }, { shape: 'triangle', feature: 'diagonal' }, { shape: 'hexagon', fill: COLORS[4] }] },
  { name: 'Each outline shape contains a smaller filled circle', make: (v, i) => ({ shape: SHAPES[(v + i) % 5], feature: 'inner' }), wrong: () => [{ shape: 'circle' }, { shape: 'square', feature: 'dot' }, { shape: 'triangle', fill: COLORS[0] }, { shape: 'diamond', feature: 'topdot' }] },
];

const figureClassificationQuestions = classificationRules.flatMap((rule, ruleIndex) => Array.from({ length: 10 }, (_, variant) => {
  const index = (ruleIndex * 10) + variant;
  const examples = [0, 1, 2].map((item) => varyDescriptor(rule.make(variant, item), variant));
  const correct = varyDescriptor(rule.make(variant, 3), variant);
  const wrong = rule.wrong(variant).slice(0, 4).map((item) => varyDescriptor(item, variant));
  return {
    id: `exp500-figure-classification-${String(index + 1).padStart(3, '0')}`,
    subtest: 'Figure Classification', battery: 'Nonverbal Battery', difficulty: difficultyFor(index, 70), source: SOURCE,
    question: `<div>Which figure belongs with this group?</div>${groupSvg(examples)}`,
    ...makeVisualOptions(iconSvg(correct), wrong.map((item) => iconSvg(item)), index % 5),
    explanation: `${rule.name}. The correct option is the only choice that follows this rule.`,
    whyOtherChoices: 'Each other option changes, removes, or adds one feature required by the group rule.',
  };
}));

function matrixSvg(cells) {
  const positions = [[36, 34], [96, 34], [156, 34], [36, 94], [96, 94], [156, 94]];
  return `<svg width="220" height="150" viewBox="0 0 192 128" role="img" aria-label="two row figure matrix with one missing cell"><path d="M6 4H186V124H6Z M66 4V124 M126 4V124 M6 64H186" fill="none" stroke="#c6cedb" stroke-width="2"/>${cells.map((cell, index) => cell ? shapeMarkup({ ...cell, x: positions[index][0], y: positions[index][1] }) : `<text x="${positions[index][0]}" y="${positions[index][1] + 11}" font-size="30" text-anchor="middle" fill="#26344d">?</text>`).join('')}</svg>`;
}

const matrixFamilies = [
  (v) => { const a = SHAPES[v % 5]; const b = SHAPES[(v + 1) % 5]; return { cells: [{ shape: a }, { shape: a, fill: COLORS[v % 5] }, { shape: a }, { shape: b }, { shape: b, fill: COLORS[v % 5] }, null], answer: { shape: b }, wrong: [{ shape: b, fill: COLORS[v % 5] }, { shape: a }, { shape: 'circle', feature: 'dot' }, { shape: b, feature: 'horizontal' }], rule: 'Each row follows outline, filled, outline.' }; },
  (v) => { const s = [SHAPES[v % 5], SHAPES[(v + 1) % 5], SHAPES[(v + 2) % 5]]; return { cells: [{ shape: s[0] }, { shape: s[1] }, { shape: s[2] }, { shape: s[1], fill: COLORS[v % 5] }, { shape: s[2], fill: COLORS[v % 5] }, null], answer: { shape: s[0], fill: COLORS[v % 5] }, wrong: [{ shape: s[0] }, { shape: s[1], fill: COLORS[v % 5] }, { shape: s[2], fill: COLORS[v % 5] }, { shape: 'diamond', feature: 'dot' }], rule: 'The bottom row repeats the shape cycle one step later and uses filled shapes.' }; },
  (v) => { const shape = SHAPES[v % 5]; const next = SHAPES[(v + 2) % 5]; return { cells: [{ shape, size: 10 }, { shape, size: 14 }, { shape, size: 18 }, { shape: next, size: 10 }, { shape: next, size: 14 }, null], answer: { shape: next, size: 18 }, wrong: [{ shape: next, size: 10 }, { shape: next, size: 14 }, { shape, size: 18 }, { shape: next, size: 18, fill: COLORS[v % 5] }], rule: 'Shapes grow from small to medium to large across each row.' }; },
  (v) => { const shape = SHAPES[v % 5]; const next = SHAPES[(v + 1) % 5]; return { cells: [{ shape, count: 1 }, { shape, count: 2 }, { shape, count: 3 }, { shape: next, count: 1 }, { shape: next, count: 2 }, null], answer: { shape: next, count: 3 }, wrong: [{ shape: next, count: 1 }, { shape: next, count: 2 }, { shape, count: 3 }, { shape: next, count: 3, fill: COLORS[v % 5] }], rule: 'The number of matching shapes increases from one to two to three.' }; },
  (v) => { const shape = SHAPES[v % 5]; const next = SHAPES[(v + 3) % 5]; return { cells: [{ shape, feature: 'diagonal' }, { shape, feature: 'horizontal' }, { shape, feature: 'dot' }, { shape: next, feature: 'diagonal' }, { shape: next, feature: 'horizontal' }, null], answer: { shape: next, feature: 'dot' }, wrong: [{ shape: next, feature: 'diagonal' }, { shape: next, feature: 'horizontal' }, { shape: next }, { shape, feature: 'dot' }], rule: 'The inside mark changes from diagonal line to horizontal line to center dot.' }; },
  (v) => { const shape = SHAPES[v % 5]; const colors = [COLORS[v % 5], COLORS[(v + 1) % 5], COLORS[(v + 2) % 5]]; return { cells: [{ shape, fill: colors[0] }, { shape, fill: colors[1] }, { shape, fill: colors[2] }, { shape: SHAPES[(v + 1) % 5], fill: colors[1] }, { shape: SHAPES[(v + 1) % 5], fill: colors[2] }, null], answer: { shape: SHAPES[(v + 1) % 5], fill: colors[0] }, wrong: [{ shape: SHAPES[(v + 1) % 5], fill: colors[1] }, { shape: SHAPES[(v + 1) % 5], fill: colors[2] }, { shape, fill: colors[0] }, { shape: SHAPES[(v + 1) % 5] }], rule: 'The three colors cycle one place to the left in the second row.' }; },
  (v) => { const shape = SHAPES[v % 5]; const next = SHAPES[(v + 2) % 5]; const left = { x: 20, size: 10 }; const center = { x: 30, size: 10 }; const right = { x: 40, size: 10 }; return { cells: [{ shape, ...left }, { shape, ...center }, { shape, ...right }, { shape: next, ...left }, { shape: next, ...center }, null], answer: { shape: next, ...right }, wrong: [{ shape: next, ...left }, { shape: next, ...center }, { shape, ...right }, { shape: next, ...right, fill: COLORS[v % 5] }], rule: 'The shape moves from left to center to right across each row.' }; },
  (v) => { const shape = SHAPES[v % 5]; const next = SHAPES[(v + 1) % 5]; return { cells: [{ shape }, { shape, feature: 'inner' }, { shape, feature: 'topdot', size: 14 }, { shape: next }, { shape: next, feature: 'inner' }, null], answer: { shape: next, feature: 'topdot', size: 14 }, wrong: [{ shape: next }, { shape: next, feature: 'inner' }, { shape: next, feature: 'dot' }, { shape, feature: 'topdot', size: 14 }], rule: 'Each row adds an inside circle, then moves the small circle above the shape.' }; },
];

const figureMatrixQuestions = matrixFamilies.flatMap((build, familyIndex) => Array.from({ length: 10 }, (_, variant) => {
  const index = (familyIndex * 10) + variant;
  const built = build(variant);
  const cells = built.cells.map((cell) => (cell ? varyDescriptor(cell, variant) : null));
  const answer = varyDescriptor(built.answer, variant);
  const wrong = built.wrong.map((item) => varyDescriptor(item, variant));
  const { rule } = built;
  return {
    id: `exp500-figure-matrix-${String(index + 1).padStart(3, '0')}`,
    subtest: 'Figure Matrices', battery: 'Nonverbal Battery', difficulty: difficultyFor(index, 80), source: SOURCE,
    question: `<div>What completes the pattern?</div>${matrixSvg(cells)}`,
    ...makeVisualOptions(iconSvg(answer), wrong.map((item) => iconSvg(item)), (index + 1) % 5),
    explanation: `${rule} The correct option completes both rows using the same change.`,
    whyOtherChoices: 'The other choices break the row pattern in shape, count, position, color, or marking.',
  };
}));

function uniquePoints(points) {
  const seen = new Set();
  return points.filter(([x, y]) => {
    const key = `${Math.round(x)},${Math.round(y)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function paperPatternSvg(points) {
  const normalized = uniquePoints(points);
  return `<svg width="76" height="76" viewBox="0 0 70 70" role="img" aria-label="unfolded paper hole pattern" data-hole-points="${serializePaperPoints(normalized)}"><rect x="5" y="5" width="60" height="60" rx="2" fill="#fffdf7" stroke="#26344d" stroke-width="2.5"/>${normalized.map(([x, y]) => `<circle cx="${x + 5}" cy="${y + 5}" r="4" fill="#26344d"/>`).join('')}</svg>`;
}

function foldPromptSvg(lines, punch) {
  return `<svg width="150" height="120" viewBox="0 0 80 80" role="img" aria-label="folded square with fold lines and a punched hole"><rect x="10" y="10" width="60" height="60" rx="2" fill="#eef4ff" stroke="#26344d" stroke-width="2.5"/>${lines.map(([x1, y1, x2, y2]) => `<line x1="${x1 + 10}" y1="${y1 + 10}" x2="${x2 + 10}" y2="${y2 + 10}" stroke="#6b7a90" stroke-width="2" stroke-dasharray="5 4"/>`).join('')}<circle cx="${punch[0] + 10}" cy="${punch[1] + 10}" r="4.5" fill="#ef8354"/></svg>`;
}

const foldScenarios = [
  { text: 'The square is folded in half along the vertical dashed line, then one hole is punched.', lines: [[30, 0, 30, 60]], folds: [{ axis: 'vertical', value: 30 }] },
  { text: 'The square is folded in half along the horizontal dashed line, then one hole is punched.', lines: [[0, 30, 60, 30]], folds: [{ axis: 'horizontal', value: 30 }] },
  { text: 'The square is folded along the diagonal from top left to bottom right.', lines: [[0, 0, 60, 60]], folds: [{ axis: 'diagonal-main' }] },
  { text: 'The square is folded along the diagonal from top right to bottom left.', lines: [[60, 0, 0, 60]], folds: [{ axis: 'diagonal-anti' }] },
  { text: 'The square is folded in half vertically and then horizontally before the hole is punched.', lines: [[30, 0, 30, 60], [0, 30, 60, 30]], folds: [{ axis: 'vertical', value: 30 }, { axis: 'horizontal', value: 30 }] },
  { text: 'The square is folded diagonally and then along the vertical center line.', lines: [[0, 0, 60, 60], [30, 0, 30, 60]], folds: [{ axis: 'diagonal-main' }, { axis: 'vertical', value: 30 }] },
  { text: 'The square is folded along the other diagonal and then along the horizontal center line.', lines: [[60, 0, 0, 60], [0, 30, 60, 30]], folds: [{ axis: 'diagonal-anti' }, { axis: 'horizontal', value: 30 }] },
  { text: 'The square is folded along both diagonals in order.', lines: [[0, 0, 60, 60], [60, 0, 0, 60]], folds: [{ axis: 'diagonal-main' }, { axis: 'diagonal-anti' }] },
];

const paperFoldingQuestions = foldScenarios.flatMap((scenario, scenarioIndex) => Array.from({ length: 10 }, (_, variant) => {
  const index = (scenarioIndex * 10) + variant;
  const punch = [8 + ((variant * 4 + scenarioIndex * 3) % 18), 9 + ((variant * 7 + scenarioIndex * 5) % 17)];
  const answerPoints = unfoldPaperPoints(punch, scenario.folds, 60);
  const distractorCandidates = [
    [punch],
    answerPoints.slice(0, Math.max(1, answerPoints.length - 1)),
    answerPoints.map(([x, y]) => [60 - x, y]),
    answerPoints.map(([x, y]) => [Math.min(56, x + 6), Math.max(4, y - 5)]),
    answerPoints.map(([x, y]) => [x, Math.min(57, y + 7)]),
    [[10, 10], [50, 10], [10, 50], [50, 50]],
    [[15, 30], [45, 30]],
    [[30, 15], [30, 45]],
  ];
  const correctSvg = paperPatternSvg(answerPoints);
  const correctKey = serializePaperPoints(answerPoints);
  const wrongSvgs = [];
  const wrongKeys = new Set();
  for (const points of distractorCandidates) {
    const key = serializePaperPoints(points);
    const svg = paperPatternSvg(points);
    if (key && key !== correctKey && !wrongKeys.has(key)) {
      wrongKeys.add(key);
      wrongSvgs.push(svg);
    }
  }
  while (wrongSvgs.length < 4) {
    const step = wrongSvgs.length + 1;
    wrongSvgs.push(paperPatternSvg([[8 + (step * 9), 10 + (step * 7)], [48 - (step * 3), 44]]));
  }
  return {
    id: `exp500-paper-folding-${String(index + 1).padStart(3, '0')}`,
    subtest: 'Paper Folding', battery: 'Nonverbal Battery', difficulty: difficultyFor(index, 80), source: SOURCE,
    question: `<div>${scenario.text} What hole pattern appears when the paper is completely unfolded?</div>${foldPromptSvg(scenario.lines, punch)}`,
    ...makeVisualOptions(correctSvg, wrongSvgs.slice(0, 4), (index + 2) % 5),
    explanation: `Every fold reflects the punched hole across its fold line. The correct option shows all ${answerPoints.length} reflected hole positions.`,
    whyOtherChoices: 'The other patterns miss a reflection, mirror across the wrong line, or place holes at the wrong distance from a fold.',
    paperFolding: { paperSize: 60, folds: scenario.folds, punch, expectedPoints: answerPoints },
  };
}));

export const expansion500Questions = [
  ...sentenceCompletionQuestions,
  ...verbalAnalogyQuestions,
  ...verbalClassificationQuestions,
  ...numberAnalogyQuestions,
  ...numberPuzzleQuestions,
  ...numberSeriesQuestions,
  ...figureClassificationQuestions,
  ...figureMatrixQuestions,
  ...paperFoldingQuestions,
];

const expectedCounts = new Map([
  ['Sentence Completion', 40],
  ['Verbal Analogies', 40],
  ['Verbal Classification', 40],
  ['Number Analogies', 50],
  ['Number Puzzles', 50],
  ['Number Series', 50],
  ['Figure Classification', 70],
  ['Figure Matrices', 80],
  ['Paper Folding', 80],
]);

if (expansion500Questions.length !== 500) {
  throw new Error(`Expansion batch must contain exactly 500 questions; found ${expansion500Questions.length}.`);
}
for (const [subtest, expected] of expectedCounts) {
  const actual = expansion500Questions.filter((question) => question.subtest === subtest).length;
  if (actual !== expected) throw new Error(`${subtest} must contain ${expected} expansion questions; found ${actual}.`);
}
