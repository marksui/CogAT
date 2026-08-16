const LABELS = ['A', 'B', 'C', 'D', 'E'];

function makeOptions(correct, distractors, correctIndex) {
  const values = [...distractors];
  values.splice(correctIndex, 0, correct);
  return {
    options: values.map((text, index) => ({ label: LABELS[index], text })),
    correctAnswer: LABELS[correctIndex],
  };
}

function analogyHtml(a, b, c) {
  return `<div class="number-analogy"><span class="number-pair">[<b>${a}</b><i>&rarr;</i><b>${b}</b>]</span><span class="number-pair">[<b>${c}</b><i>&rarr;</i><b>?</b>]</span></div>`;
}

const verbalAnalogySeeds = [
  ['Cat', 'Kitten', 'Dog', 'Puppy', ['Puppy', 'Calf', 'Foal', 'Cub'], 'A kitten is a young cat. A puppy is a young dog.'],
  ['Bird', 'Nest', 'Bee', 'Hive', ['Flower', 'Honey', 'Sting', 'Web'], 'A bird lives in a nest. A bee lives in a hive.'],
  ['Book', 'Read', 'Song', 'Listen', ['Write', 'Dance', 'Draw', 'Speak'], 'You read a book. You listen to a song.'],
  ['Seed', 'Plant', 'Egg', 'Bird', ['Nest', 'Shell', 'Hatch', 'Feather'], 'A seed can grow into a plant. An egg can grow into a bird.'],
  ['Finger', 'Hand', 'Toe', 'Foot', ['Leg', 'Shoe', 'Arm', 'Knee'], 'A finger is part of a hand. A toe is part of a foot.'],
  ['Bark', 'Tree', 'Wool', 'Sheep', ['Fur', 'Grass', 'Cotton', 'Feather'], 'Bark comes from a tree. Wool comes from a sheep.'],
  ['Inch', 'Ruler', 'Ounce', 'Scale', ['Clock', 'Cup', 'Meter', 'Thermometer'], 'A ruler measures inches. A scale measures ounces.'],
  ['Smile', 'Happy', 'Frown', 'Sad', ['Angry', 'Laugh', 'Quiet', 'Excited'], 'A smile can show happiness. A frown can show sadness.'],
  ['Author', 'Book', 'Composer', 'Song', ['Piano', 'Poem', 'Painting', 'Reader'], 'An author creates a book. A composer creates a song.'],
  ['Captain', 'Ship', 'Pilot', 'Plane', ['Airport', 'Car', 'Sailor', 'Boat'], 'A captain leads a ship. A pilot flies a plane.'],
  ['Eye', 'See', 'Ear', 'Hear', ['Touch', 'Smell', 'Taste', 'Look'], 'You use your eye to see. You use your ear to hear.'],
  ['Knife', 'Cut', 'Pencil', 'Write', ['Erase', 'Draw', 'Point', 'Read'], 'A knife is used to cut. A pencil is used to write.'],
  ['Puppy', 'Dog', 'Kitten', 'Cat', ['Mouse', 'Pet', 'Animal', 'Rabbit'], 'A puppy grows into a dog. A kitten grows into a cat.'],
  ['Winter', 'Cold', 'Summer', 'Hot', ['Warm', 'Rain', 'Snow', 'Wind'], 'Winter is usually cold. Summer is usually hot.'],
  ['Clock', 'Time', 'Thermometer', 'Temperature', ['Weather', 'Heat', 'Hour', 'Medicine'], 'A clock tells time. A thermometer measures temperature.'],
  ['Nest', 'Bird', 'Den', 'Bear', ['Fox', 'Cave', 'Cub', 'Forest'], 'A nest is a home for a bird. A den is a home for a bear.'],
  ['Teacher', 'School', 'Doctor', 'Hospital', ['Medicine', 'Patient', 'Nurse', 'Office'], 'A teacher works at a school. A doctor works at a hospital.'],
  ['Painter', 'Brush', 'Writer', 'Pen', ['Paper', 'Book', 'Pencil', 'Story'], 'A painter uses a brush. A writer uses a pen.'],
  ['River', 'Water', 'Road', 'Cars', ['Bridge', 'Travel', 'Wheels', 'Traffic'], 'A river carries water. A road carries cars.'],
  ['Dawn', 'Morning', 'Dusk', 'Evening', ['Night', 'Sun', 'Dark', 'Noon'], 'Dawn begins the morning. Dusk begins the evening.'],
  ['Glove', 'Hand', 'Sock', 'Foot', ['Shoe', 'Leg', 'Toe', 'Hat'], 'A glove covers a hand. A sock covers a foot.'],
  ['Puppy', 'Bark', 'Kitten', 'Meow', ['Run', 'Purr', 'Climb', 'Scratch'], 'A puppy often barks. A kitten often meows.'],
  ['Honey', 'Bee', 'Milk', 'Cow', ['Farm', 'Calf', 'Grass', 'Goat'], 'Honey comes from a bee. Milk comes from a cow.'],
  ['Leaf', 'Tree', 'Petal', 'Flower', ['Stem', 'Garden', 'Rose', 'Seed'], 'A leaf is part of a tree. A petal is part of a flower.'],
  ['Whisper', 'Quiet', 'Shout', 'Loud', ['Talk', 'Noise', 'Voice', 'Sing'], 'A whisper is quiet. A shout is loud.'],
  ['Monday', 'Week', 'January', 'Year', ['Month', 'Day', 'Calendar', 'Winter'], 'Monday is part of a week. January is part of a year.'],
  ['Triangle', 'Three', 'Square', 'Four', ['Side', 'Corner', 'Five', 'Shape'], 'A triangle has three sides. A square has four sides.'],
  ['Lunch', 'Noon', 'Breakfast', 'Morning', ['Dinner', 'Food', 'Night', 'Meal'], 'Lunch is usually eaten around noon. Breakfast is eaten in the morning.'],
  ['Laugh', 'Joy', 'Cry', 'Sadness', ['Tears', 'Smile', 'Fear', 'Happiness'], 'Laughing can show joy. Crying can show sadness.'],
  ['Borrow', 'Return', 'Buy', 'Keep', ['Sell', 'Pay', 'Store', 'Give'], 'When you borrow something, you return it. When you buy something, you keep it.'],
];

const verbalAnalogyQuestions = verbalAnalogySeeds.map(([a, b, c, answer, distractors, explanation], index) => {
  const choice = makeOptions(answer, distractors, index % 5);
  return {
    id: 1001 + index,
    subtest: 'Verbal Analogies',
    battery: 'Verbal Battery',
    question: `${a} is to ${b} as ${c} is to ___`,
    ...choice,
    explanation,
  };
});

const sentenceSeeds = [
  ['The gardener ___ the flowers every morning.', 'waters', ['reads', 'folds', 'carries', 'counts'], 'A gardener waters flowers.'],
  ['The children ___ quietly while the teacher read.', 'listened', ['jumped', 'cooked', 'swam', 'painted'], 'Children listen while someone reads to them.'],
  ['A compass helps travelers find the right ___.', 'direction', ['flavor', 'season', 'animal', 'color'], 'A compass shows direction.'],
  ['The baker put the bread into the hot ___.', 'oven', ['river', 'pocket', 'drawer', 'basket'], 'Bread is baked in an oven.'],
  ['Mina wore a coat because the morning was ___.', 'chilly', ['square', 'hungry', 'shiny', 'noisy'], 'A coat is useful when the weather is chilly.'],
  ['The scientist used a magnifying glass to ___ the tiny shell.', 'examine', ['throw', 'wash', 'sing', 'hide'], 'To examine something is to look at it carefully.'],
  ['After the rain, a bright ___ appeared in the sky.', 'rainbow', ['whistle', 'pillow', 'shadow', 'ladder'], 'Rainbows can appear after rain.'],
  ['The team practiced every day so it could ___ the game.', 'improve', ['forget', 'spill', 'sleep', 'borrow'], 'Practice helps a team improve.'],
  ['Please ___ the door when you leave the room.', 'close', ['taste', 'draw', 'plant', 'carry'], 'You close a door when leaving.'],
  ['The librarian asked everyone to speak ___.', 'softly', ['quickly', 'brightly', 'heavily', 'coldly'], 'Libraries are quiet places, so people speak softly.'],
  ['The map showed a narrow ___ across the mountain.', 'trail', ['blanket', 'puzzle', 'cloud', 'pencil'], 'A trail is a path through a place.'],
  ['We used a flashlight because the cave was ___.', 'dark', ['sweet', 'round', 'loud', 'early'], 'A flashlight helps people see in the dark.'],
  ['The chef added salt to ___ the soup.', 'season', ['measure', 'fold', 'erase', 'repair'], 'Salt can season soup.'],
  ['The baby bird opened its beak and waited for its ___.', 'food', ['mirror', 'shoe', 'blanket', 'key'], 'A baby bird waits for food.'],
  ['The old bridge was closed because it was not ___.', 'safe', ['green', 'musical', 'hungry', 'young'], 'A bridge should be safe to cross.'],
  ['The class planted seeds and watched them ___.', 'sprout', ['whistle', 'freeze', 'bounce', 'whisper'], 'Seeds sprout as they begin to grow.'],
  ['A calendar helps us remember important ___.', 'dates', ['colors', 'flavors', 'shapes', 'sounds'], 'Calendars show dates.'],
  ['The athlete drank water to stay ___.', 'hydrated', ['wooden', 'silent', 'crooked', 'ancient'], 'Water helps an athlete stay hydrated.'],
  ['The detective looked for a ___ that could solve the mystery.', 'clue', ['pillow', 'planet', 'tunnel', 'recipe'], 'A clue gives information about a mystery.'],
  ['The bell rang to ___ that recess had ended.', 'signal', ['decorate', 'measure', 'whistle', 'invent'], 'A bell can signal that something has happened.'],
];

const sentenceQuestions = sentenceSeeds.map(([question, answer, distractors, explanation], index) => {
  const choice = makeOptions(answer, distractors, (index + 2) % 5);
  return {
    id: 1031 + index,
    subtest: 'Sentence Completion',
    battery: 'Verbal Battery',
    question,
    ...choice,
    explanation,
  };
});

const classificationSeeds = [
  [['Violin', 'Trumpet', 'Flute', 'Drum'], 'Piano', 'The first four are musical instruments played with the hands or breath; a piano is the odd choice in this group.'],
  [['January', 'March', 'August', 'December'], 'Tuesday', 'The first four are months. Tuesday is a day of the week.'],
  [['Copper', 'Gold', 'Iron', 'Silver'], 'Glass', 'The first four are metals. Glass is not a metal.'],
  [['Rectangle', 'Triangle', 'Pentagon', 'Hexagon'], 'Circle', 'The first four are polygons with straight sides. A circle has no straight sides.'],
  [['Whale', 'Dolphin', 'Seal', 'Manatee'], 'Eagle', 'The first four are mammals that live in or near water. An eagle is a bird.'],
  [['Tulip', 'Rose', 'Daisy', 'Lily'], 'Cedar', 'The first four are flowers. Cedar is a tree.'],
  [['Mercury', 'Venus', 'Earth', 'Mars'], 'Moon', 'The first four are planets. The moon is a natural satellite.'],
  [['Spoon', 'Fork', 'Knife', 'Ladle'], 'Broom', 'The first four are kitchen utensils. A broom is used for cleaning.'],
  [['Whisper', 'Murmur', 'Speak softly', 'Mutter'], 'Roar', 'The first four describe quiet ways to use your voice. A roar is loud.'],
  [['Oak', 'Maple', 'Pine', 'Birch'], 'Moss', 'The first four are trees. Moss is a small plant that is not a tree.'],
  [['Kilometer', 'Meter', 'Centimeter', 'Millimeter'], 'Liter', 'The first four measure length. A liter measures volume.'],
  [['Basketball', 'Soccer', 'Tennis', 'Baseball'], 'Chess', 'The first four are physical sports. Chess is a strategy game.'],
  [['Ruby', 'Emerald', 'Sapphire', 'Diamond'], 'Granite', 'The first four are gemstones. Granite is a type of rock.'],
  [['Monday', 'Wednesday', 'Friday', 'Sunday'], 'April', 'The first four are days of the week. April is a month.'],
  [['Laugh', 'Smile', 'Giggle', 'Grin'], 'Cry', 'The first four can show happiness. Crying usually shows sadness.'],
  [['Hammer', 'Saw', 'Wrench', 'Screwdriver'], 'Ruler', 'The first four are tools used to build or fix things. A ruler measures.'],
  [['Oxygen', 'Water', 'Food', 'Sleep'], 'Homework', 'The first four are needs of a living person. Homework is an activity, not a basic need.'],
  [['North', 'South', 'East', 'West'], 'Left', 'The first four are compass directions. Left is a relative direction.'],
  [['Novel', 'Poem', 'Essay', 'Story'], 'Dictionary', 'The first four are types of writing. A dictionary is a reference book.'],
  [['Caterpillar', 'Butterfly', 'Beetle', 'Ant'], 'Frog', 'The first four are insects. A frog is an amphibian.'],
];

const classificationQuestions = classificationSeeds.map(([group, odd, explanation], index) => {
  const oddIndex = index % 5;
  const values = [...group];
  values.splice(oddIndex, 0, odd);
  return {
    id: 1051 + index,
    subtest: 'Verbal Classification',
    battery: 'Verbal Battery',
    question: 'Which word does NOT belong?',
    questionNote: values.join(', '),
    ...makeOptions(odd, group, oddIndex),
    explanation,
  };
});

const quantitativeAnalogySeeds = [
  [2, 6, 5, 15, ['10', '12', '20', '8'], 'Multiply by 3.'],
  [4, 2, 14, 7, ['5', '28', '9', '12'], 'Divide by 2.'],
  [3, 8, 6, 11, ['12', '14', '9', '10'], 'Add 5.'],
  [12, 7, 20, 15, ['10', '13', '17', '25'], 'Subtract 5.'],
  [5, 25, 8, 64, ['16', '32', '40', '72'], 'Square the number.'],
  [9, 3, 16, 4, ['5', '6', '8', '12'], 'Find the square root.'],
  [6, 18, 4, 12, ['8', '10', '16', '24'], 'Multiply by 3.'],
  [20, 5, 28, 7, ['4', '6', '8', '9'], 'Divide by 4.'],
  [7, 14, 10, 20, ['17', '21', '30', '40'], 'Multiply by 2.'],
  [15, 12, 21, 18, ['15', '20', '24', '27'], 'Subtract 3.'],
  [8, 10, 13, 15, ['16', '18', '20', '21'], 'Add 2.'],
  [30, 10, 42, 14, ['12', '16', '18', '21'], 'Divide by 3.'],
  [4, 20, 6, 30, ['24', '26', '36', '40'], 'Multiply by 5.'],
  [11, 22, 16, 32, ['24', '28', '30', '36'], 'Multiply by 2.'],
  [18, 9, 26, 13, ['11', '12', '14', '15'], 'Divide by 2.'],
  [2, 10, 5, 25, ['15', '20', '30', '35'], 'Multiply by 5. 2 × 5 = 10, so 5 × 5 = 25.'],
  [10, 13, 16, 19, ['20', '21', '22', '24'], 'Add 3.'],
  [25, 20, 18, 13, ['10', '11', '12', '15'], 'Subtract 5.'],
  [3, 12, 7, 28, ['21', '24', '30', '35'], 'Multiply by 4.'],
  [36, 6, 49, 7, ['8', '9', '12', '14'], 'Find the square root.'],
  [14, 7, 22, 11, ['9', '12', '15', '16'], 'Divide by 2.'],
  [5, 9, 8, 12, ['10', '13', '15', '16'], 'Add 4.'],
  [17, 12, 25, 20, ['15', '17', '18', '22'], 'Subtract 5.'],
  [6, 36, 9, 81, ['18', '27', '45', '72'], 'Square the number.'],
  [40, 8, 55, 11, ['10', '12', '13', '15'], 'Divide by 5.'],
  [7, 21, 12, 36, ['24', '30', '42', '48'], 'Multiply by 3.'],
  [24, 8, 33, 11, ['9', '12', '15', '16'], 'Divide by 3.'],
  [9, 18, 12, 24, ['20', '21', '30', '36'], 'Multiply by 2.'],
  [13, 17, 21, 25, ['26', '27', '28', '29'], 'Add 4.'],
  [50, 45, 32, 27, ['22', '23', '24', '25'], 'Subtract 5.'],
];

const quantitativeAnalogyQuestions = quantitativeAnalogySeeds.map(([a, b, c, answer, distractors, rule], index) => {
  const choice = makeOptions(String(answer), distractors, (index + 1) % 5);
  return {
    id: 1071 + index,
    subtest: 'Number Analogies',
    battery: 'Quantitative Battery',
    question: analogyHtml(a, b, c),
    questionNote: 'Find the same rule.',
    ...choice,
    explanation: `${rule} ${a} becomes ${b}, so ${c} becomes ${answer}.`,
  };
});

const puzzleSeeds = [
  ['___ + 17 = 32', 15, 'Subtract 17 from 32.'],
  ['48 - ___ = 19', 29, 'Subtract 19 from 48.'],
  ['7 × ___ = 56', 8, 'Divide 56 by 7.'],
  ['___ ÷ 6 = 9', 54, 'Multiply 6 by 9.'],
  ['25 + ___ = 60', 35, 'Subtract 25 from 60.'],
  ['72 - ___ = 45', 27, 'Subtract 45 from 72.'],
  ['9 × ___ = 63', 7, 'Divide 63 by 9.'],
  ['___ ÷ 8 = 7', 56, 'Multiply 8 by 7.'],
  ['14 + ___ = 41', 27, 'Subtract 14 from 41.'],
  ['90 - ___ = 38', 52, 'Subtract 38 from 90.'],
  ['6 × ___ = 54', 9, 'Divide 54 by 6.'],
  ['___ ÷ 5 = 12', 60, 'Multiply 5 by 12.'],
  ['18 + ___ = 47', 29, 'Subtract 18 from 47.'],
  ['65 - ___ = 28', 37, 'Subtract 28 from 65.'],
  ['4 × ___ = 44', 11, 'Divide 44 by 4.'],
  ['___ ÷ 9 = 8', 72, 'Multiply 9 by 8.'],
  ['33 + ___ = 75', 42, 'Subtract 33 from 75.'],
  ['100 - ___ = 64', 36, 'Subtract 64 from 100.'],
  ['8 × ___ = 96', 12, 'Divide 96 by 8.'],
  ['___ ÷ 7 = 11', 77, 'Multiply 7 by 11.'],
];

const quantitativePuzzleQuestions = puzzleSeeds.map(([question, answer, explanation], index) => {
  const distractors = [answer - 2, answer + 2, answer - 5, answer + 5].map(String);
  const choice = makeOptions(String(answer), distractors, (index + 3) % 5);
  return {
    id: 1101 + index,
    subtest: 'Number Puzzles',
    battery: 'Quantitative Battery',
    question,
    questionNote: 'What number belongs in the blank?',
    ...choice,
    explanation,
  };
});

const seriesSeeds = [
  [[3, 6, 9, 12], 15, 'Add 3 each time.'],
  [[20, 18, 16, 14], 12, 'Subtract 2 each time.'],
  [[2, 4, 8, 16], 32, 'Double each term.'],
  [[81, 27, 9, 3], 1, 'Divide by 3 each time.'],
  [[5, 10, 15, 20], 25, 'Add 5 each time.'],
  [[45, 40, 35, 30], 25, 'Subtract 5 each time.'],
  [[1, 3, 5, 7], 9, 'Add 2 each time.'],
  [[4, 8, 12, 16], 20, 'Add 4 each time.'],
  [[100, 90, 80, 70], 60, 'Subtract 10 each time.'],
  [[3, 9, 27, 81], 243, 'Multiply by 3 each time.'],
  [[64, 32, 16, 8], 4, 'Divide by 2 each time.'],
  [[7, 14, 21, 28], 35, 'Add 7 each time.'],
  [[2, 5, 8, 11], 14, 'Add 3 each time.'],
  [[50, 45, 40, 35], 30, 'Subtract 5 each time.'],
  [[6, 12, 24, 48], 96, 'Double each term.'],
  [[96, 48, 24, 12], 6, 'Divide by 2 each time.'],
  [[10, 20, 30, 40], 50, 'Add 10 each time.'],
  [[4, 7, 10, 13], 16, 'Add 3 each time.'],
  [[90, 80, 70, 60], 50, 'Subtract 10 each time.'],
  [[1, 4, 16, 64], 256, 'Multiply by 4 each time.'],
];

const quantitativeSeriesQuestions = seriesSeeds.map(([sequence, answer, explanation], index) => {
  const distractors = [answer - 1, answer + 1, answer + 3, Math.max(0, answer - 3)].map(String);
  const choice = makeOptions(String(answer), distractors, index % 5);
  return {
    id: 1121 + index,
    subtest: 'Number Series',
    battery: 'Quantitative Battery',
    question: `${sequence.join(', ')}, ___`,
    questionNote: 'What number comes next?',
    ...choice,
    explanation,
  };
});

function shapeSvg(shape, size = 64) {
  const stroke = '#334155';
  const common = `fill="none" stroke="${stroke}" stroke-width="2"`;
  const shapes = {
    triangle: `<polygon points="32,7 57,55 7,55" ${common}/>` ,
    square: `<rect x="10" y="10" width="44" height="44" ${common}/>` ,
    rectangle: `<rect x="6" y="18" width="52" height="28" ${common}/>` ,
    diamond: `<polygon points="32,6 58,32 32,58 6,32" ${common}/>` ,
    pentagon: `<polygon points="32,6 58,24 48,57 16,57 6,24" ${common}/>` ,
    hexagon: `<polygon points="18,7 46,7 58,32 46,57 18,57 6,32" ${common}/>` ,
    circle: `<circle cx="32" cy="32" r="24" ${common}/>` ,
    oval: `<ellipse cx="32" cy="32" rx="26" ry="17" ${common}/>` ,
    star: `<polygon points="32,5 38,25 59,25 42,37 48,58 32,45 16,58 22,37 5,25 26,25" ${common}/>` ,
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">${shapes[shape] ?? shapes.circle}</svg>`;
}

function groupSvg(shapes) {
  return `<div class="shape-group">${shapes.map((shape) => shapeSvg(shape, 58)).join('')}</div>`;
}

const shapeSeeds = [
  [['triangle', 'triangle', 'triangle'], 'triangle', ['circle', 'square', 'pentagon', 'oval'], 'All of the group shapes have three sides.'],
  [['square', 'rectangle', 'diamond'], 'square', ['circle', 'triangle', 'oval', 'pentagon'], 'All of the group shapes have four sides.'],
  [['circle', 'oval', 'circle'], 'oval', ['triangle', 'square', 'diamond', 'hexagon'], 'All of the group shapes have curved boundaries.'],
  [['pentagon', 'hexagon', 'diamond'], 'pentagon', ['circle', 'triangle', 'oval', 'star'], 'All of the group shapes are polygons with straight sides.'],
  [['circle', 'circle', 'circle'], 'circle', ['triangle', 'square', 'diamond', 'star'], 'All of the group shapes have no corners.'],
  [['square', 'rectangle', 'square'], 'rectangle', ['circle', 'triangle', 'pentagon', 'oval'], 'All of the group shapes have four sides.'],
  [['hexagon', 'pentagon', 'diamond'], 'hexagon', ['circle', 'oval', 'triangle', 'star'], 'All of the group shapes are polygons.'],
  [['triangle', 'triangle', 'triangle'], 'triangle', ['square', 'circle', 'hexagon', 'oval'], 'All of the group shapes have three corners.'],
  [['oval', 'circle', 'oval'], 'circle', ['triangle', 'square', 'pentagon', 'diamond'], 'All of the group shapes are curved shapes.'],
  [['diamond', 'square', 'rectangle'], 'diamond', ['circle', 'triangle', 'oval', 'pentagon'], 'All of the group shapes have four sides.'],
  [['star', 'pentagon', 'hexagon'], 'pentagon', ['circle', 'oval', 'triangle', 'square'], 'All of the group shapes have straight sides and corners.'],
  [['circle', 'circle', 'oval'], 'circle', ['triangle', 'square', 'diamond', 'star'], 'All of the group shapes have a curved outline.'],
  [['triangle', 'triangle', 'diamond'], 'diamond', ['circle', 'oval', 'pentagon', 'hexagon'], 'The group contains only shapes with straight sides.'],
  [['square', 'square', 'rectangle'], 'square', ['circle', 'triangle', 'oval', 'star'], 'The group contains four-sided shapes.'],
  [['hexagon', 'pentagon', 'diamond'], 'hexagon', ['circle', 'oval', 'triangle', 'square'], 'The group contains polygons.'],
  [['oval', 'circle', 'circle'], 'oval', ['triangle', 'square', 'pentagon', 'star'], 'The group contains shapes with curved outlines.'],
  [['triangle', 'triangle', 'triangle'], 'triangle', ['circle', 'rectangle', 'hexagon', 'oval'], 'The group contains three-sided shapes.'],
  [['square', 'diamond', 'rectangle'], 'diamond', ['circle', 'triangle', 'oval', 'star'], 'The group contains four-sided shapes.'],
  [['pentagon', 'hexagon', 'star'], 'star', ['circle', 'oval', 'triangle', 'square'], 'The group contains shapes with several straight sides.'],
  [['circle', 'oval', 'circle'], 'oval', ['triangle', 'square', 'diamond', 'pentagon'], 'The group contains curved shapes.'],
  [['rectangle', 'square', 'diamond'], 'rectangle', ['circle', 'triangle', 'oval', 'star'], 'The group contains four-sided shapes.'],
  [['triangle', 'triangle', 'triangle'], 'triangle', ['circle', 'square', 'pentagon', 'hexagon'], 'The group contains shapes with three sides.'],
  [['hexagon', 'pentagon', 'diamond'], 'diamond', ['circle', 'oval', 'triangle', 'square'], 'The group contains straight-sided polygons.'],
  [['circle', 'circle', 'oval'], 'circle', ['triangle', 'square', 'diamond', 'star'], 'The group contains curved outlines.'],
  [['square', 'rectangle', 'diamond'], 'rectangle', ['circle', 'triangle', 'oval', 'pentagon'], 'The group contains four-sided shapes.'],
  [['pentagon', 'hexagon', 'star'], 'pentagon', ['circle', 'oval', 'triangle', 'square'], 'The group contains polygons with many straight sides.'],
  [['triangle', 'triangle', 'triangle'], 'triangle', ['circle', 'rectangle', 'hexagon', 'oval'], 'The group contains three-sided shapes.'],
  [['oval', 'circle', 'oval'], 'circle', ['triangle', 'square', 'diamond', 'star'], 'The group contains curved shapes.'],
  [['diamond', 'square', 'rectangle'], 'square', ['circle', 'triangle', 'oval', 'pentagon'], 'The group contains four-sided shapes.'],
  [['hexagon', 'pentagon', 'diamond'], 'hexagon', ['circle', 'oval', 'triangle', 'square'], 'The group contains straight-sided polygons.'],
];

const shapeQuestions = shapeSeeds.map(([group, answer, distractors, explanation], index) => {
  const choiceIndex = (index + 2) % 5;
  const shapes = [...distractors];
  shapes.splice(choiceIndex, 0, answer);
  const choice = makeOptions(answer, distractors.map((shape) => shapeSvg(shape)), choiceIndex);
  return {
    id: 1141 + index,
    subtest: 'Figure Classification',
    battery: 'Nonverbal Battery',
    question: `<div class="text-center mb-2 text-sm font-semibold text-slate-500">Which shape belongs with the group below?</div>${groupSvg(group)}`,
    ...choice,
    options: shapes.map((shape, optionIndex) => ({ label: LABELS[optionIndex], text: shapeSvg(shape) })),
    correctAnswer: LABELS[choiceIndex],
    explanation,
  };
});

function matrixSvg(count, filled = false) {
  const points = [[32, 10], [48, 16], [54, 32], [48, 48], [32, 54], [16, 48], [10, 32], [16, 16], [32, 32]];
  const dots = points.slice(0, count).map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="4" ${filled ? 'fill="#2f66d0"' : 'fill="none" stroke="#2f66d0" stroke-width="2"'}/>`).join('');
  return `<svg width="64" height="64" viewBox="0 0 64 64"><rect x="4" y="4" width="56" height="56" rx="8" fill="#f8fbff" stroke="#94a3b8" stroke-width="2"/>${dots}</svg>`;
}

function matrixPrompt(a, b, c, filled) {
  return `<div class="text-center mb-2 text-sm font-semibold text-slate-500">Which panel completes the pattern?</div><div class="matrix-prompt">${matrixSvg(a, filled)}${matrixSvg(b, filled)}<span class="matrix-question">?</span>${matrixSvg(c, filled)}</div>`;
}

const matrixSeeds = [
  [1, 2, 3, 4, 'The number of dots increases by one.'],
  [4, 3, 2, 1, 'The number of dots decreases by one.'],
  [1, 3, 2, 4, 'The bottom panel follows the same increase of two.'],
  [2, 4, 3, 5, 'The second panel has two more dots than the first.'],
  [3, 2, 1, 0, 'The pattern removes one dot each time.'],
  [1, 2, 4, 8, 'The number of dots doubles.'],
  [2, 3, 4, 5, 'The pattern adds one dot.'],
  [4, 2, 3, 1, 'The second row mirrors the decrease in the first row.'],
  [1, 4, 2, 5, 'The second panel has three more dots than the first.'],
  [2, 1, 4, 3, 'The bottom panel is one dot behind the panel above it.'],
  [3, 1, 2, 0, 'The pattern subtracts two dots.'],
  [1, 2, 3, 4, 'The panels count upward one dot at a time.'],
  [4, 3, 2, 1, 'The panels count downward one dot at a time.'],
  [2, 4, 3, 5, 'The number of dots increases by two across each row.'],
  [1, 3, 2, 4, 'The second row repeats the same increase of two.'],
];

const matrixQuestions = matrixSeeds.map(([a, b, c, answer, explanation], index) => {
  const distractors = [Math.max(0, answer - 1), answer + 1, Math.max(0, answer - 2), answer + 2].map((value) => Math.min(5, value));
  const choiceIndex = index % 5;
  const values = [...distractors];
  values.splice(choiceIndex, 0, answer);
  return {
    id: 1171 + index,
    subtest: 'Figure Matrices',
    battery: 'Nonverbal Battery',
    question: matrixPrompt(a, b, c, index % 2 === 0),
    options: values.map((value, optionIndex) => ({ label: LABELS[optionIndex], text: matrixSvg(value, index % 2 === 0) })),
    correctAnswer: LABELS[choiceIndex],
    explanation,
  };
});

function foldedSquareSvg() {
  return '<svg width="150" height="80" viewBox="0 0 150 80"><rect x="12" y="10" width="55" height="55" fill="#eef4ff" stroke="#334155" stroke-width="2"/><line x1="67" y1="10" x2="67" y2="65" stroke="#94a3b8" stroke-dasharray="4 3" stroke-width="2"/><path d="M82 38h48" stroke="#2f66d0" stroke-width="2"/><path d="M122 32l8 6-8 6" fill="none" stroke="#2f66d0" stroke-width="2"/><rect x="88" y="10" width="55" height="55" fill="#fff7ed" stroke="#334155" stroke-width="2" stroke-dasharray="4 3"/><circle cx="115" cy="28" r="5" fill="#f97316"/></svg>';
}

function holePatternSvg(count) {
  const points = [[32, 13], [51, 23], [51, 45], [32, 55], [13, 45], [13, 23], [32, 32], [42, 16]];
  const holes = points.slice(0, count).map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="4" fill="#f97316"/>`).join('');
  return `<svg width="64" height="64" viewBox="0 0 64 64"><rect x="6" y="6" width="52" height="52" fill="#fff7ed" stroke="#334155" stroke-width="2"/>${holes}</svg>`;
}

const foldingSeeds = [
  [2, 2, 'A half-fold creates two matching holes when the paper is opened.'],
  [2, 4, 'Two folds create four layers, so the hole appears four times.'],
  [2, 2, 'The paper is folded once, so the single hole is mirrored once.'],
  [2, 4, 'A quarter fold creates four matching positions.'],
  [2, 2, 'One fold makes two layers and two holes when unfolded.'],
  [2, 4, 'Two perpendicular folds create four matching holes.'],
  [2, 2, 'The fold doubles the number of visible holes.'],
  [2, 4, 'The quarter-fold pattern repeats in all four sections.'],
  [2, 2, 'Opening a single fold mirrors the punched hole.'],
  [2, 4, 'Opening two folds places one hole in each quarter.'],
  [2, 2, 'The hole is copied across the one fold line.'],
  [2, 4, 'The hole is copied across two fold lines.'],
  [2, 2, 'One fold means two layers of paper.'],
  [2, 4, 'Four layers produce four holes.'],
  [2, 2, 'The opened paper has a matching hole on each side.'],
];

const foldingQuestions = foldingSeeds.map(([folds, answer, explanation], index) => {
  const distractors = answer === 2 ? [1, 3, 4, 8] : [1, 2, 3, 8];
  const choiceIndex = (index + 3) % 5;
  const values = [...distractors];
  values.splice(choiceIndex, 0, answer);
  return {
    id: 1186 + index,
    subtest: 'Paper Folding',
    battery: 'Nonverbal Battery',
    question: `<div class="text-center mb-2 text-sm font-semibold text-slate-500">The paper is folded and punched as shown. What will you see when it is opened?</div>${foldedSquareSvg()}`,
    options: values.map((value, optionIndex) => ({ label: LABELS[optionIndex], text: holePatternSvg(value) })),
    correctAnswer: LABELS[choiceIndex],
    explanation,
  };
});

export const bonusQuestions = [
  ...verbalAnalogyQuestions,
  ...sentenceQuestions,
  ...classificationQuestions,
  ...quantitativeAnalogyQuestions,
  ...quantitativePuzzleQuestions,
  ...quantitativeSeriesQuestions,
  ...shapeQuestions,
  ...matrixQuestions,
  ...foldingQuestions,
];

if (bonusQuestions.length !== 200) {
  throw new Error(`Expected 200 bonus questions, found ${bonusQuestions.length}.`);
}
