const LABELS = ['A', 'B', 'C', 'D', 'E'];
const source = 'Original verbal expansion 200 — 2026';

function difficultyFor(index, total) {
  if (index < Math.round(total * 0.35)) return 'easy';
  if (index < Math.round(total * 0.8)) return 'medium';
  return 'hard';
}

function buildOptions(values, answer, rotation = 0) {
  const offset = ((rotation % values.length) + values.length) % values.length;
  const rotated = [...values.slice(offset), ...values.slice(0, offset)];
  const correctIndex = rotated.indexOf(answer);
  return {
    options: rotated.map((text, index) => ({ label: LABELS[index], text })),
    correctAnswer: LABELS[correctIndex],
    orderedValues: rotated,
  };
}

const sentenceGroups = [
  [
    ['relieved', 'no longer worried because a problem has ended', 'After finding her missing backpack, Elena felt ___.'],
    ['anxious', 'worried or nervous about what may happen', 'Marcus felt ___ while waiting to hear the contest results.'],
    ['delighted', 'very pleased and happy', 'The children were ___ when the surprise guest arrived.'],
    ['irritated', 'slightly angry or annoyed', 'The constant buzzing sound made the reader feel ___.'],
    ['astonished', 'very surprised by something unexpected', 'We were ___ to see snow falling in the desert.'],
  ],
  [
    ['mutter', 'speak in a low voice that is difficult to hear', 'Instead of speaking clearly, Theo began to ___ under his breath.'],
    ['proclaim', 'announce something publicly and confidently', 'The captain stepped forward to ___ that the team had won.'],
    ['request', 'ask politely for something', 'The student raised her hand to ___ more time for the project.'],
    ['respond', 'answer or react to a question or event', 'Please listen to the question before you ___.'],
    ['interrupt', 'stop someone by speaking or acting before the person finishes', 'It is impolite to ___ a speaker in the middle of a sentence.'],
  ],
  [
    ['conclude', 'decide something after considering the evidence', 'From the wet footprints, the detective could ___ that someone had entered.'],
    ['distinguish', 'notice or explain the difference between things', 'The twins looked alike, but their teacher could easily ___ between their voices.'],
    ['estimate', 'make a careful guess about an amount', 'Without counting every bean, Rosa tried to ___ how many were in the jar.'],
    ['verify', 'check that something is true or correct', 'The scientist repeated the measurement to ___ the result.'],
    ['interpret', 'explain the meaning of information', 'The class used the map key to ___ the symbols.'],
  ],
  [
    ['sturdy', 'strong and not easily damaged', 'The carpenter chose a ___ table that could hold many heavy books.'],
    ['flexible', 'able to bend or change without breaking', 'The ___ branch bent in the wind but did not snap.'],
    ['transparent', 'clear enough for light and images to pass through', 'The jar was ___, so we could see the marbles inside.'],
    ['scarce', 'available only in a small amount', 'Fresh water became ___ during the long drought.'],
    ['complex', 'made of many connected parts and difficult to understand', 'The machine looked ___ because it contained dozens of gears.'],
  ],
  [
    ['considerate', 'thoughtful about the needs and feelings of others', 'It was ___ of Noor to lower the music while her brother studied.'],
    ['dependable', 'able to be trusted to do what is expected', 'A ___ teammate arrives on time and completes every task.'],
    ['courageous', 'brave when facing danger or difficulty', 'The firefighter was ___ when she entered the smoky building.'],
    ['cautious', 'careful to avoid danger or mistakes', 'The hiker was ___ while crossing the slippery bridge.'],
    ['resourceful', 'skilled at finding clever ways to solve problems', 'Using a shoelace to repair the torn strap showed that Luis was ___.'],
  ],
  [
    ['initially', 'at the beginning', 'The puzzle seemed impossible ___, but it became easier after we found the pattern.'],
    ['afterward', 'at a later time following an event', 'We finished the experiment and cleaned the table ___.'],
    ['frequently', 'often or many times', 'Hummingbirds ___ return to the same flowers for nectar.'],
    ['gradually', 'slowly over a period of time', 'As spring arrived, the frozen pond ___ melted.'],
    ['immediately', 'without any delay', 'When the alarm sounded, everyone left the room ___.'],
  ],
  [
    ['plateau', 'a large area of high, flat land', 'The hikers reached a broad ___ at the top of the steep trail.'],
    ['coast', 'land beside an ocean or sea', 'Fishing villages dotted the rocky ___ beside the ocean.'],
    ['tributary', 'a smaller stream or river that flows into a larger one', 'The narrow ___ joined the main river near the bridge.'],
    ['glacier', 'a large, slow-moving mass of ice', 'The enormous ___ carved a valley as it moved downhill.'],
    ['prairie', 'a wide, mostly treeless grassland', 'Tall grasses waved across the open ___.'],
  ],
  [
    ['blizzard', 'a severe snowstorm with strong winds', 'The roads closed when the ___ made it difficult to see.'],
    ['drought', 'a long period with very little rain', 'Months without rain caused a serious ___.'],
    ['breeze', 'a light and gentle wind', 'A cool ___ moved the curtains beside the open window.'],
    ['overcast', 'covered with clouds', 'The sky remained ___ all morning, even though no rain fell.'],
    ['lightning', 'a bright electrical flash in the sky during a storm', 'A flash of ___ appeared before we heard the thunder.'],
  ],
  [
    ['analyze', 'study something carefully to understand its parts', 'The students will ___ the graph before writing a conclusion.'],
    ['classify', 'arrange things into groups based on shared features', 'We used leaf shapes to ___ the plants.'],
    ['demonstrate', 'show how something works or is done', 'The coach will ___ the new exercise before practice begins.'],
    ['evaluate', 'judge quality or value using evidence', 'The judges will ___ each invention using the same checklist.'],
    ['justify', 'give reasons or evidence that support an answer', 'Be ready to ___ your choice with details from the passage.'],
  ],
  [
    ['scent', 'a smell, especially one left or carried through the air', 'The dog followed the rabbit\'s ___ through the field.'],
    ['vibration', 'a quick back-and-forth movement', 'We felt the drum\'s ___ through the wooden floor.'],
    ['reflection', 'an image produced by light bouncing from a surface', 'Nina saw her ___ in the still pond.'],
    ['silhouette', 'a dark outline seen against a lighter background', 'At sunset, the tree appeared as a dark ___.'],
    ['temperature', 'a measure of how hot or cold something is', 'The thermometer showed that the ___ had fallen overnight.'],
  ],
  [
    ['dash', 'move somewhere very quickly', 'When the bell rang, the runners began to ___ toward the finish line.'],
    ['drift', 'move slowly without a clear direction', 'The empty boat began to ___ across the calm lake.'],
    ['descend', 'move from a higher place to a lower one', 'The hikers started to ___ the mountain before sunset.'],
    ['rotate', 'turn around a center point', 'The gears ___ whenever the handle is turned.'],
    ['approach', 'move closer to a person, place, or time', 'We watched the train ___ the station.'],
  ],
  [
    ['abundant', 'present in a large amount', 'Wildflowers were ___ after weeks of spring rain.'],
    ['sufficient', 'enough for a particular purpose', 'We packed ___ food for the two-day trip.'],
    ['minimal', 'very small in amount', 'The sturdy case suffered only ___ damage when it fell.'],
    ['maximum', 'the greatest amount allowed or possible', 'The elevator sign listed the ___ number of passengers.'],
    ['average', 'a typical amount found by comparing a group of values', 'The class calculated the ___ height of all the plants.'],
  ],
  [
    ['expand', 'become larger or take up more space', 'Warm air can ___ and fill a larger container.'],
    ['dissolve', 'mix completely into a liquid', 'The sugar began to ___ in the hot tea.'],
    ['preserve', 'protect something so it remains in good condition', 'The museum controls light and moisture to ___ old documents.'],
    ['transform', 'change greatly in form or appearance', 'A caterpillar will ___ into a butterfly.'],
    ['erode', 'wear away gradually through wind, water, or ice', 'Ocean waves can ___ a rocky shore over many years.'],
  ],
  [
    ['volunteer', 'offer to help without being forced or paid', 'Several students decided to ___ at the food drive.'],
    ['cooperate', 'work together toward a shared goal', 'The partners had to ___ to finish the model on time.'],
    ['contribute', 'give or add something that helps a group effort', 'Each family will ___ one dish to the community meal.'],
    ['represent', 'speak or act for a person or group', 'Two students were chosen to ___ the class at the meeting.'],
    ['resolve', 'find a solution to a problem or disagreement', 'The teammates talked calmly to ___ their disagreement.'],
  ],
];

const analogyFamilies = [
  ['young animal and its adult', [['puppy', 'dog'], ['kitten', 'cat'], ['calf', 'cow'], ['foal', 'horse'], ['chick', 'chicken']]],
  ['animal and its home', [['bird', 'nest'], ['bee', 'hive'], ['rabbit', 'burrow'], ['spider', 'web'], ['horse', 'stable']]],
  ['worker and usual workplace', [['teacher', 'school'], ['chef', 'kitchen'], ['judge', 'courtroom'], ['pilot', 'cockpit'], ['librarian', 'library']]],
  ['measuring tool and what it measures', [['ruler', 'length'], ['scale', 'weight'], ['clock', 'time'], ['thermometer', 'temperature'], ['compass', 'direction']]],
  ['part and the whole it belongs to', [['page', 'book'], ['wheel', 'car'], ['petal', 'flower'], ['branch', 'tree'], ['brick', 'wall']]],
  ['sound and the animal that makes it', [['bark', 'dog'], ['meow', 'cat'], ['neigh', 'horse'], ['croak', 'frog'], ['chirp', 'bird']]],
  ['member and its organized group', [['musician', 'orchestra'], ['player', 'team'], ['sailor', 'crew'], ['actor', 'cast'], ['ship', 'fleet']]],
  ['item and the container that usually holds it', [['letter', 'envelope'], ['soup', 'bowl'], ['water', 'bottle'], ['flowers', 'vase'], ['tools', 'toolbox']]],
  ['words with similar meanings', [['rapid', 'fast'], ['tiny', 'small'], ['joyful', 'happy'], ['silent', 'quiet'], ['clever', 'smart']]],
  ['words with opposite meanings', [['ancient', 'modern'], ['narrow', 'wide'], ['accept', 'reject'], ['scarce', 'abundant'], ['include', 'exclude']]],
  ['example and its category', [['robin', 'bird'], ['salmon', 'fish'], ['oak', 'tree'], ['ruby', 'gem'], ['violin', 'instrument']]],
  ['creator and what the person creates', [['author', 'book'], ['composer', 'song'], ['baker', 'bread'], ['architect', 'building'], ['painter', 'portrait']]],
  ['action and the tool commonly used for it', [['cut', 'scissors'], ['write', 'pencil'], ['sweep', 'broom'], ['unlock', 'key'], ['dig', 'shovel']]],
];

const classificationGroups = [
  ['mammals', ['lion', 'whale', 'rabbit', 'horse', 'bat', 'dolphin', 'elephant', 'otter', 'fox'], [['eagle', 'a bird'], ['trout', 'a fish'], ['lizard', 'a reptile'], ['frog', 'an amphibian'], ['beetle', 'an insect']]],
  ['fruits', ['apple', 'pear', 'peach', 'plum', 'grape', 'mango', 'orange', 'cherry', 'kiwi'], [['carrot', 'a vegetable'], ['celery', 'a vegetable'], ['lettuce', 'a vegetable'], ['onion', 'a vegetable'], ['spinach', 'a vegetable']]],
  ['landforms', ['mountain', 'valley', 'canyon', 'plateau', 'island', 'peninsula', 'hill', 'cliff', 'plain'], [['river', 'a body of flowing water'], ['ocean', 'a large body of salt water'], ['lake', 'a body of water surrounded by land'], ['stream', 'a small body of flowing water'], ['pond', 'a small body of still water']]],
  ['tools', ['hammer', 'saw', 'wrench', 'drill', 'pliers', 'chisel', 'screwdriver', 'level', 'rake'], [['pillow', 'bedding'], ['blanket', 'bedding'], ['curtain', 'fabric used to cover a window'], ['rug', 'a floor covering'], ['towel', 'cloth used for drying']]],
  ['metals', ['copper', 'iron', 'silver', 'gold', 'aluminum', 'tin', 'nickel', 'steel', 'bronze'], [['glass', 'a nonmetal material'], ['wood', 'a plant material'], ['cotton', 'a plant fiber'], ['rubber', 'a nonmetal material'], ['clay', 'a mineral-rich earth material']]],
  ['emotions or feelings', ['joyful', 'anxious', 'proud', 'jealous', 'calm', 'angry', 'excited', 'worried', 'grateful'], [['rectangular', 'a shape word'], ['wooden', 'a material word'], ['striped', 'a pattern word'], ['curved', 'a shape word'], ['circular', 'a shape word']]],
  ['ways of moving', ['sprint', 'crawl', 'leap', 'march', 'stroll', 'climb', 'slide', 'swim', 'gallop'], [['whisper', 'a way of speaking'], ['calculate', 'a thinking action'], ['remember', 'a thinking action'], ['compare', 'a thinking action'], ['listen', 'a hearing action']]],
  ['government or civic roles', ['mayor', 'governor', 'senator', 'president', 'judge', 'councilmember', 'representative', 'ambassador', 'legislator'], [['carpenter', 'a building trade'], ['plumber', 'a repair trade'], ['chef', 'a food-service job'], ['mechanic', 'a repair job'], ['artist', 'a creative job']]],
  ['parts or features of written works', ['sentence', 'paragraph', 'chapter', 'title', 'index', 'glossary', 'page', 'preface', 'appendix'], [['compass', 'a navigation tool'], ['engine', 'a machine part'], ['ladder', 'a climbing tool'], ['helmet', 'protective equipment'], ['telescope', 'a viewing tool']]],
  ['mathematics terms', ['numerator', 'denominator', 'fraction', 'decimal', 'equation', 'quotient', 'product', 'sum', 'angle'], [['adjective', 'a grammar term'], ['syllable', 'a language term'], ['paragraph', 'a writing term'], ['rhyme', 'a poetry term'], ['metaphor', 'a language device']]],
  ['weather events or conditions', ['rain', 'snow', 'sleet', 'hail', 'fog', 'wind', 'thunder', 'lightning', 'drizzle'], [['tide', 'a regular rise and fall of ocean water'], ['soil', 'earth in which plants grow'], ['mineral', 'a natural solid substance'], ['rock', 'a solid earth material'], ['island', 'land surrounded by water']]],
  ['musical instruments', ['violin', 'cello', 'flute', 'trumpet', 'piano', 'guitar', 'harp', 'clarinet', 'drum'], [['canvas', 'a painting surface'], ['easel', 'a stand for artwork'], ['palette', 'a surface for mixing paint'], ['brush', 'an art tool'], ['sketch', 'a type of drawing']]],
  ['ways to communicate', ['speak', 'write', 'signal', 'gesture', 'announce', 'whisper', 'email', 'call', 'broadcast'], [['calculate', 'a mathematics action'], ['measure', 'an action for finding an amount'], ['divide', 'a mathematics operation'], ['subtract', 'a mathematics operation'], ['estimate', 'an action for making a careful guess']]],
];

const sentenceQuestions = sentenceGroups.flatMap((group, groupIndex) => {
  const words = group.map(([word]) => word);
  const meanings = new Map(group.map(([word, meaning]) => [word, meaning]));
  return group.map(([answer, meaning, question], itemIndex) => {
    const index = (groupIndex * 5) + itemIndex;
    const built = buildOptions(words, answer, groupIndex + itemIndex);
    return {
      id: `verbal-200-sentence-${String(index + 1).padStart(3, '0')}`,
      subtest: 'Sentence Completion',
      battery: 'Verbal Battery',
      difficulty: difficultyFor(index, 70),
      source,
      question,
      options: built.options,
      correctAnswer: built.correctAnswer,
      explanation: `“${answer}” means ${meaning}. It completes the sentence most precisely.`,
      hint: 'Read the whole sentence, look for context clues, and test each word in the blank.',
      wordMeanings: built.orderedValues.map((word, optionIndex) => ({
        label: LABELS[optionIndex],
        word,
        meaning: meanings.get(word),
      })),
      whyOtherChoices: 'The other words have different meanings and do not match all of the sentence clues.',
    };
  });
});

const verbalAnalogyQuestions = analogyFamilies.flatMap(([relationship, pairs], familyIndex) => {
  const answers = pairs.map(([, right]) => right);
  return pairs.map(([targetLeft, answer], itemIndex) => {
    const reference = pairs[(itemIndex + 1) % pairs.length];
    const index = (familyIndex * 5) + itemIndex;
    const built = buildOptions(answers, answer, familyIndex + itemIndex + 1);
    return {
      id: `verbal-200-analogy-${String(index + 1).padStart(3, '0')}`,
      subtest: 'Verbal Analogies',
      battery: 'Verbal Battery',
      difficulty: difficultyFor(index, 65),
      source,
      question: `${reference[0]} is to ${reference[1]} as ${targetLeft} is to ___`,
      options: built.options,
      correctAnswer: built.correctAnswer,
      explanation: `The first pair shows ${relationship}. Using the same relationship, ${targetLeft} matches ${answer}.`,
      whyOtherChoices: `The other choices do not complete the same ${relationship} relationship.`,
    };
  });
});

const classificationQuestions = classificationGroups.flatMap(([groupName, members, outsiders], groupIndex) => (
  outsiders.map(([answer, reason], itemIndex) => {
    const index = (groupIndex * 5) + itemIndex;
    const selectedMembers = Array.from({ length: 4 }, (_, offset) => members[(itemIndex + offset) % members.length]);
    const built = buildOptions([...selectedMembers, answer], answer, groupIndex + itemIndex + 2);
    return {
      id: `verbal-200-classification-${String(index + 1).padStart(3, '0')}`,
      subtest: 'Verbal Classification',
      battery: 'Verbal Battery',
      difficulty: difficultyFor(index, 65),
      source,
      question: 'Which word does NOT belong?',
      questionNote: built.orderedValues.join(', '),
      options: built.options,
      correctAnswer: built.correctAnswer,
      explanation: `${answer} is ${reason}. The other choices are ${groupName}.`,
      hint: 'Name the group shared by four choices, then find the one word outside that group.',
      whyOtherChoices: `The other four choices all belong to the group “${groupName}.”`,
    };
  })
));

export const verbalExpansion200Questions = [
  ...sentenceQuestions,
  ...verbalAnalogyQuestions,
  ...classificationQuestions,
];

if (verbalExpansion200Questions.length !== 200) {
  throw new Error(`Expected 200 verbal expansion questions, found ${verbalExpansion200Questions.length}.`);
}
