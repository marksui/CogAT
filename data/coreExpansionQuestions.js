const LABELS = ['A', 'B', 'C', 'D', 'E'];

function difficultyFor(index) {
  if (index < 7) return 'easy';
  if (index < 16) return 'medium';
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
  return `<div class="number-analogy">${[...examples, [target, '?']].map(([input, output]) => `<span class="number-pair">[<b>${input}</b><i>&rarr;</i><b>${output}</b>]</span>`).join('')}</div>`;
}

const sentenceSeeds = [
  ['Although the path was muddy, the hikers remained ___ and reached the waterfall.', 'determined', ['careless', 'hollow', 'silent', 'square'], 'Determined means they kept trying even when the muddy path was difficult.'],
  ['The museum guide spoke clearly so every visitor could ___ the directions.', 'understand', ['scatter', 'polish', 'borrow', 'freeze'], 'Clear speech helps listeners understand directions.'],
  ['Mina placed the plant near the window because it needed ___ to grow.', 'sunlight', ['thunder', 'plastic', 'music', 'dust'], 'Plants need sunlight to make food and grow.'],
  ['The puppy wagged its tail to show that it was ___ to see us.', 'excited', ['ancient', 'wooden', 'empty', 'narrow'], 'A wagging tail often shows that a puppy is excited or happy.'],
  ['Before mailing the package, Dad checked that the address was ___.', 'correct', ['sleepy', 'spicy', 'curved', 'noisy'], 'A correct address helps a package reach the right place.'],
  ['The class lowered its voices when the principal began the ___.', 'announcement', ['blanket', 'harvest', 'puddle', 'ladder'], 'People listen quietly when an important announcement begins.'],
  ['Because the glass vase was fragile, Noah carried it ___.', 'carefully', ['wildly', 'hungrily', 'briefly', 'loosely'], 'A fragile vase can break, so it should be carried carefully.'],
  ['The two stories had similar characters but very different ___.', 'plots', ['engines', 'shadows', 'temperatures', 'pockets'], 'A plot is the sequence of events in a story.'],
  ['The rabbit disappeared quickly because its brown fur provided ___.', 'camouflage', ['applause', 'gravity', 'permission', 'nutrition'], 'Camouflage helps an animal blend into its surroundings.'],
  ['Lena reread the paragraph to find evidence that would ___ her answer.', 'support', ['erase', 'float', 'divide', 'whisper'], 'Evidence supports an answer by showing why it is reasonable.'],
  ['The bridge was closed, so the driver had to choose an ___ route.', 'alternate', ['identical', 'invisible', 'fragile', 'ordinary'], 'An alternate route is a different way to reach the same place.'],
  ['The scientist repeated the experiment to make sure the result was ___.', 'reliable', ['jealous', 'shallow', 'colorful', 'temporary'], 'A reliable result can be trusted because it can be repeated.'],
  ['When the temperature dropped below freezing, the puddle began to ___.', 'solidify', ['evaporate', 'expand', 'sparkle', 'wander'], 'Water solidifies when it freezes and changes from liquid to solid.'],
  ['The author included a diagram to ___ the complicated idea.', 'clarify', ['hide', 'delay', 'scatter', 'replace'], 'To clarify an idea is to make it easier to understand.'],
  ['Even though the twins look alike, their interests are quite ___.', 'distinct', ['equal', 'ancient', 'silent', 'smooth'], 'Distinct interests are clearly different from one another.'],
  ['The mayor asked residents to ___ water during the long drought.', 'conserve', ['spill', 'measure', 'heat', 'decorate'], 'To conserve water means to use it carefully and avoid waste.'],
  ['The reviewer gave an ___ opinion by listing both strengths and weaknesses.', 'balanced', ['careless', 'secret', 'sudden', 'narrow'], 'A balanced opinion considers both positive and negative points.'],
  ['The new evidence caused the detective to ___ her first conclusion.', 'revise', ['celebrate', 'repeat', 'memorize', 'announce'], 'To revise a conclusion is to change it when new evidence appears.'],
  ['The instructions were so ___ that every group built the model correctly.', 'precise', ['vague', 'cheerful', 'distant', 'gentle'], 'Precise instructions are exact and leave little room for confusion.'],
  ['The small stream gradually became ___ after several days of heavy rain.', 'swollen', ['transparent', 'motionless', 'artificial', 'shallow'], 'A swollen stream contains more water than usual after heavy rain.'],
];

const verbalAnalogySeeds = [
  ['Sapling is to tree as calf is to ___', 'cow', ['nest', 'wool', 'grass', 'herd'], 'A sapling is a young tree. A calf is a young cow.'],
  ['Bark is to dog as neigh is to ___', 'horse', ['sheep', 'duck', 'mouse', 'frog'], 'A bark is a sound made by a dog. A neigh is a sound made by a horse.'],
  ['Fin is to fish as wing is to ___', 'bird', ['worm', 'snake', 'spider', 'whale'], 'A fin helps a fish move. A wing helps a bird move.'],
  ['Book is to library as painting is to ___', 'gallery', ['factory', 'bakery', 'stadium', 'harbor'], 'A library holds books. A gallery displays paintings.'],
  ['Minute is to hour as inch is to ___', 'foot', ['mile', 'pound', 'gallon', 'degree'], 'Minutes are smaller units within an hour. Inches are smaller units within a foot.'],
  ['Generous is to selfish as ancient is to ___', 'modern', ['fragile', 'famous', 'distant', 'valuable'], 'Generous and selfish are opposites. Ancient and modern are opposites.'],
  ['Whisper is to quiet as thunder is to ___', 'loud', ['smooth', 'bright', 'slow', 'warm'], 'A whisper is quiet. Thunder is loud.'],
  ['Compass is to direction as scale is to ___', 'weight', ['weather', 'speed', 'sound', 'time'], 'A compass shows direction. A scale shows weight.'],
  ['Sculptor is to clay as carpenter is to ___', 'wood', ['glass', 'water', 'paper', 'wool'], 'A sculptor may shape clay. A carpenter commonly works with wood.'],
  ['Teacher is to school as doctor is to ___', 'hospital', ['museum', 'airport', 'theater', 'farm'], 'A teacher works in a school. A doctor often works in a hospital.'],
  ['Caterpillar is to butterfly as tadpole is to ___', 'frog', ['fish', 'lizard', 'beetle', 'rabbit'], 'A caterpillar develops into a butterfly. A tadpole develops into a frog.'],
  ['Dawn is to morning as dusk is to ___', 'evening', ['winter', 'noon', 'spring', 'weekend'], 'Dawn begins the morning. Dusk begins the evening.'],
  ['Pedal is to bicycle as oar is to ___', 'boat', ['train', 'airplane', 'wagon', 'elevator'], 'A pedal moves a bicycle. An oar moves a boat.'],
  ['Island is to ocean as oasis is to ___', 'desert', ['forest', 'mountain', 'river', 'valley'], 'An island is surrounded by ocean water. An oasis is a fertile place within a desert.'],
  ['Helmet is to head as mitten is to ___', 'hand', ['knee', 'neck', 'foot', 'elbow'], 'A helmet protects the head. A mitten covers and protects the hand.'],
  ['Paragraph is to essay as scene is to ___', 'play', ['chapter', 'poem', 'letter', 'map'], 'A paragraph is part of an essay. A scene is part of a play.'],
  ['Liquid is to evaporate as solid is to ___', 'melt', ['freeze', 'drip', 'flow', 'pour'], 'A liquid can evaporate into gas. A solid can melt into liquid.'],
  ['Telescope is to distant as microscope is to ___', 'tiny', ['heavy', 'noisy', 'ancient', 'colorful'], 'A telescope helps us see distant objects. A microscope helps us see tiny objects.'],
  ['Cautious is to careful as enormous is to ___', 'huge', ['empty', 'narrow', 'gentle', 'brief'], 'Cautious and careful are synonyms. Enormous and huge are synonyms.'],
  ['Thermometer is to temperature as stopwatch is to ___', 'time', ['length', 'volume', 'direction', 'brightness'], 'A thermometer measures temperature. A stopwatch measures time.'],
];

const classificationSeeds = [
  [['Violin', 'Cello', 'Trumpet', 'Guitar', 'Harp'], 'Trumpet', 'Violin, cello, guitar, and harp are string instruments. A trumpet is a brass instrument.'],
  [['Copper', 'Iron', 'Silver', 'Granite', 'Gold'], 'Granite', 'Copper, iron, silver, and gold are metals. Granite is a rock.'],
  [['Jog', 'Sprint', 'Stroll', 'Crawl', 'Nap'], 'Nap', 'Jog, sprint, stroll, and crawl are ways to move. Nap means to sleep.'],
  [['Mercury', 'Venus', 'Earth', 'Moon', 'Mars'], 'Moon', 'Mercury, Venus, Earth, and Mars are planets. The Moon is a natural satellite.'],
  [['Rectangle', 'Triangle', 'Pentagon', 'Cylinder', 'Hexagon'], 'Cylinder', 'The other choices are flat polygons. A cylinder is a three-dimensional solid.'],
  [['Pine', 'Oak', 'Maple', 'Tulip', 'Birch'], 'Tulip', 'Pine, oak, maple, and birch are trees. A tulip is a flower.'],
  [['January', 'April', 'Monday', 'August', 'November'], 'Monday', 'January, April, August, and November are months. Monday is a day of the week.'],
  [['Transparent', 'Clear', 'See-through', 'Cloudy', 'Lucid'], 'Cloudy', 'The other words can describe something easy to see through or understand. Cloudy means unclear.'],
  [['Predict', 'Forecast', 'Anticipate', 'Remember', 'Expect'], 'Remember', 'Predict, forecast, anticipate, and expect concern what may happen. Remember concerns the past.'],
  [['Gram', 'Kilogram', 'Ounce', 'Liter', 'Pound'], 'Liter', 'Gram, kilogram, ounce, and pound measure weight or mass. Liter measures volume.'],
  [['Whale', 'Dolphin', 'Seal', 'Shark', 'Otter'], 'Shark', 'Whale, dolphin, seal, and otter are mammals. A shark is a fish.'],
  [['Joyful', 'Cheerful', 'Delighted', 'Pleased', 'Miserable'], 'Miserable', 'The first four words describe happiness. Miserable describes unhappiness.'],
  [['Chapter', 'Index', 'Paragraph', 'Cover', 'Keyboard'], 'Keyboard', 'Chapter, index, paragraph, and cover can be parts of a book. A keyboard is not.'],
  [['Condense', 'Freeze', 'Melt', 'Evaporate', 'Measure'], 'Measure', 'Condense, freeze, melt, and evaporate are changes of state. Measure is an action for finding an amount.'],
  [['Senator', 'Mayor', 'Governor', 'Carpenter', 'President'], 'Carpenter', 'Senator, mayor, governor, and president are government leaders. A carpenter builds with wood.'],
  [['Scarlet', 'Crimson', 'Ruby', 'Navy', 'Cherry'], 'Navy', 'Scarlet, crimson, ruby, and cherry can describe shades of red. Navy is a shade of blue.'],
  [['Fragile', 'Delicate', 'Brittle', 'Sturdy', 'Breakable'], 'Sturdy', 'Fragile, delicate, brittle, and breakable describe things easily damaged. Sturdy means strong.'],
  [['Observe', 'Inspect', 'Examine', 'Notice', 'Ignore'], 'Ignore', 'Observe, inspect, examine, and notice involve paying attention. Ignore means not to pay attention.'],
  [['Equator', 'Latitude', 'Longitude', 'Compass', 'Hemisphere'], 'Compass', 'Equator, latitude, longitude, and hemisphere describe locations or divisions on Earth. A compass is a tool.'],
  [['Fraction', 'Decimal', 'Percent', 'Equation', 'Metaphor'], 'Metaphor', 'Fraction, decimal, percent, and equation are mathematical ideas. A metaphor is a language device.'],
];

const numberAnalogySeeds = [
  [[[3, 7], [11, 15], [20, 24]], 27, 31, [23, 29, 30, 34], 'Add 4'],
  [[[14, 8], [25, 19], [37, 31]], 42, 36, [34, 35, 37, 48], 'Subtract 6'],
  [[[4, 8], [9, 18], [13, 26]], 16, 32, [24, 30, 34, 48], 'Multiply by 2'],
  [[[3, 9], [7, 21], [11, 33]], 14, 42, [28, 39, 41, 45], 'Multiply by 3'],
  [[[18, 9], [26, 13], [42, 21]], 34, 17, [15, 16, 18, 19], 'Divide by 2'],
  [[[20, 5], [36, 9], [52, 13]], 44, 11, [9, 10, 12, 14], 'Divide by 4'],
  [[[2, 5], [6, 13], [10, 21]], 14, 29, [27, 28, 30, 42], 'Multiply by 2, then add 1'],
  [[[4, 5], [9, 15], [13, 23]], 17, 31, [29, 30, 32, 34], 'Multiply by 2, then subtract 3'],
  [[[2, 8], [5, 17], [9, 29]], 12, 38, [34, 36, 37, 40], 'Multiply by 3, then add 2'],
  [[[3, 5], [7, 17], [11, 29]], 15, 41, [39, 40, 42, 45], 'Multiply by 3, then subtract 4'],
  [[[2, 11], [5, 23], [8, 35]], 10, 43, [40, 41, 42, 46], 'Multiply by 4, then add 3'],
  [[[8, 7], [18, 12], [30, 18]], 42, 24, [20, 22, 23, 27], 'Divide by 2, then add 3'],
  [[[9, 5], [18, 8], [30, 12]], 39, 15, [11, 13, 14, 17], 'Divide by 3, then add 2'],
  [[[2, 4], [5, 25], [8, 64]], 7, 49, [42, 47, 48, 56], 'Square the number'],
  [[[3, 10], [6, 37], [9, 82]], 8, 65, [62, 63, 64, 72], 'Square the number, then add 1'],
  [[[3, 7], [5, 23], [8, 62]], 7, 47, [45, 46, 48, 49], 'Square the number, then subtract 2'],
  [[[23, 5], [41, 5], [72, 9]], 64, 10, [8, 9, 11, 24], 'Add the digits'],
  [[[23, 6], [41, 4], [32, 6]], 42, 8, [6, 7, 9, 12], 'Multiply the digits'],
  [[[12, 21], [35, 53], [64, 46]], 81, 18, [16, 19, 81, 88], 'Reverse the digits'],
  [[[2, 8], [3, 27], [5, 125]], 4, 64, [16, 32, 60, 81], 'Cube the number'],
];

const puzzleSeeds = [
  ['___ + 27 = 68', 41, [39, 40, 42, 95], 'Subtract 27 from 68 to get 41.'],
  ['93 &minus; ___ = 47', 46, [44, 45, 47, 140], '93 minus 47 equals 46.'],
  ['8 &times; ___ = 72', 9, [7, 8, 10, 12], '72 divided by 8 equals 9.'],
  ['96 &divide; ___ = 12', 8, [6, 7, 9, 12], '96 divided by 8 equals 12.'],
  ['___ &divide; 7 = 9', 63, [56, 62, 64, 72], '9 times 7 equals 63.'],
  ['___ &minus; 35 = 28', 63, [53, 57, 62, 73], '28 plus 35 equals 63.'],
  ['(6 &times; 8) &minus; ___ = 31', 17, [15, 16, 18, 19], '6 times 8 is 48. Then 48 minus 31 equals 17.'],
  ['___ &divide; 4 + 9 = 21', 48, [40, 44, 52, 84], '21 minus 9 is 12. The missing number is 12 times 4, or 48.'],
  ['5 &times; ___ + 3 = 43', 8, [7, 9, 10, 11], '43 minus 3 is 40. Then 40 divided by 5 equals 8.'],
  ['84 &divide; 7 + ___ = 25', 13, [11, 12, 14, 18], '84 divided by 7 is 12. Then 25 minus 12 equals 13.'],
  ['(9 &times; 5) &minus; 11 = 2 &times; ___', 17, [15, 16, 18, 22], '9 times 5 minus 11 is 34. Half of 34 is 17.'],
  ['3 &times; (___ + 4) = 36', 8, [6, 7, 9, 12], '36 divided by 3 is 12. Then 12 minus 4 equals 8.'],
  ['72 &divide; (___ + 1) = 8', 8, [7, 9, 10, 11], '72 divided by 8 is 9, so the missing number plus 1 is 9. The answer is 8.'],
  ['(___ &minus; 6) &divide; 5 = 7', 41, [35, 39, 40, 43], '7 times 5 is 35. Then add 6 to get 41.'],
  ['4 &times; ___ &minus; 9 = 35', 11, [9, 10, 12, 14], '35 plus 9 is 44. Then 44 divided by 4 equals 11.'],
  ['&Delta; &times; 3 = 27<br>&Delta; + &#9633; = 15<br>&#9633; = ?', 6, [3, 5, 7, 9], 'The triangle is 9. Since 9 plus the box equals 15, the box is 6.'],
  ['&#9675; + &#9675; = 18<br>&#9675; &times; &#9671; = 27<br>&#9671; = ?', 3, [2, 4, 6, 9], 'The circle is 9. Since 9 times the diamond equals 27, the diamond is 3.'],
  ['&#9633; &times; &#9633; = 49<br>&#9633; + &Delta; = 19<br>&Delta; = ?', 12, [7, 10, 11, 14], 'The box is 7. Since 7 plus the triangle equals 19, the triangle is 12.'],
  ['&#9671; + 5 = 13<br>&#9675; = &#9671; &times; 4<br>&#9675; = ?', 32, [26, 28, 36, 52], 'The diamond is 8. Four diamonds equal 32, so the circle is 32.'],
  ['&Delta; + &Delta; + &Delta; = 33<br>&Delta; &minus; &#9633; = 4<br>&#9633; = ?', 7, [4, 6, 8, 11], 'Each triangle is 11. Since 11 minus the box equals 4, the box is 7.'],
];

const seriesSeeds = [
  [[3, 7, 11, 15], 19, [17, 18, 20, 22], 'Add 4 each time.'],
  [[5, 12, 19, 26], 33, [31, 32, 34, 40], 'Add 7 each time.'],
  [[44, 38, 32, 26], 20, [18, 19, 21, 22], 'Subtract 6 each time.'],
  [[3, 6, 12, 24], 48, [30, 36, 42, 52], 'Multiply by 2 each time.'],
  [[1, 3, 9, 27], 81, [54, 72, 80, 90], 'Multiply by 3 each time.'],
  [[2, 5, 10, 17, 26], 37, [34, 35, 36, 38], 'Add consecutive odd numbers: 3, 5, 7, 9, then 11.'],
  [[1, 4, 9, 16, 25], 36, [30, 32, 35, 49], 'These are square numbers from 1 squared through 6 squared.'],
  [[40, 37, 33, 28, 22], 15, [13, 14, 16, 17], 'Subtract 3, 4, 5, 6, then 7.'],
  [[5, 13, 29, 61], 125, [115, 121, 123, 127], 'Multiply by 2, then add 3.'],
  [[3, 8, 18, 38], 78, [68, 74, 76, 80], 'Multiply by 2, then add 2.'],
  [[10, 15, 13, 18, 16, 21], 19, [17, 18, 20, 23], 'Alternate adding 5 and subtracting 2.'],
  [[4, 7, 13, 16, 22, 25], 31, [28, 29, 30, 32], 'Alternate adding 3 and adding 6.'],
  [[2, 10, 4, 14, 6, 18], 8, [7, 9, 20, 22], 'The odd-position numbers add 2: 2, 4, 6, 8.'],
  [[3, 30, 8, 27, 13, 24], 18, [16, 17, 19, 21], 'The odd-position numbers add 5: 3, 8, 13, 18.'],
  [[31, 29, 27, 25], 23, [21, 22, 24, 27], 'Subtract 2 each time.'],
  [[96, 48, 24, 12], 6, [3, 4, 8, 10], 'Divide by 2 each time.'],
  [[4, 7, 13, 25], 49, [37, 43, 47, 51], 'Multiply by 2, then subtract 1.'],
  [[5, 8, 12, 17, 23], 30, [28, 29, 31, 32], 'Add 3, 4, 5, 6, then 7.'],
  [[50, 43, 35, 26, 16], 5, [4, 6, 7, 8], 'Subtract 7, 8, 9, 10, then 11.'],
  [[1, 20, 3, 17, 5, 14], 7, [6, 8, 11, 16], 'The odd-position numbers add 2: 1, 3, 5, 7.'],
];

const source = 'Original core expansion 2026';

const sentenceQuestions = sentenceSeeds.map(([question, answer, distractors, explanation], index) => ({
  id: `core-sentence-${String(index + 1).padStart(2, '0')}`,
  subtest: 'Sentence Completion', battery: 'Verbal Battery', difficulty: difficultyFor(index), source,
  question, ...makeOptions(answer, distractors, index % 5), explanation,
}));

const verbalAnalogyQuestions = verbalAnalogySeeds.map(([question, answer, distractors, explanation], index) => ({
  id: `core-verbal-analogy-${String(index + 1).padStart(2, '0')}`,
  subtest: 'Verbal Analogies', battery: 'Verbal Battery', difficulty: difficultyFor(index), source,
  question, ...makeOptions(answer, distractors, (index + 1) % 5), explanation,
}));

const classificationQuestions = classificationSeeds.map(([words, answer, explanation], index) => ({
  id: `core-classification-${String(index + 1).padStart(2, '0')}`,
  subtest: 'Verbal Classification', battery: 'Verbal Battery', difficulty: difficultyFor(index), source,
  question: 'Which word does NOT belong?', questionNote: words.join(', '),
  ...makeOptions(answer, words.filter((word) => word !== answer), (index + 2) % 5), explanation,
}));

const numberAnalogyQuestions = numberAnalogySeeds.map(([examples, target, answer, distractors, rule], index) => ({
  id: `core-number-analogy-${String(index + 1).padStart(2, '0')}`,
  subtest: 'Number Analogies', battery: 'Quantitative Battery', difficulty: difficultyFor(index), source,
  question: analogyHtml(examples, target), questionNote: 'Use the same rule for every pair.',
  ...makeOptions(answer, distractors, (index + 3) % 5), explanation: `${rule}. ${target} becomes ${answer}.`,
}));

const puzzleQuestions = puzzleSeeds.map(([question, answer, distractors, explanation], index) => ({
  id: `core-number-puzzle-${String(index + 1).padStart(2, '0')}`,
  subtest: 'Number Puzzles', battery: 'Quantitative Battery', difficulty: difficultyFor(index), source,
  question, questionNote: 'What number makes the statement true?',
  ...makeOptions(answer, distractors, (index + 4) % 5), explanation,
}));

const seriesQuestions = seriesSeeds.map(([terms, answer, distractors, rule], index) => ({
  id: `core-number-series-${String(index + 1).padStart(2, '0')}`,
  subtest: 'Number Series', battery: 'Quantitative Battery', difficulty: difficultyFor(index), source,
  question: `${terms.join(', ')}, ___`, questionNote: 'What comes next?',
  ...makeOptions(answer, distractors, index % 5), explanation: `${rule} The next number is ${answer}.`,
}));

export const coreExpansionQuestions = [
  ...sentenceQuestions,
  ...verbalAnalogyQuestions,
  ...classificationQuestions,
  ...numberAnalogyQuestions,
  ...puzzleQuestions,
  ...seriesQuestions,
];

if (coreExpansionQuestions.length !== 120) {
  throw new Error(`Expected 120 core expansion questions, found ${coreExpansionQuestions.length}.`);
}
