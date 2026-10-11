import type { ItemSpec, Skill } from '../core/types'
import type { IxlRef } from '../ixl/map'
import { wrongFrom } from './util'

/**
 * Grades 3–5 English skills that were still missing, named like IXL's categories: tone, story elements,
 * literary and informational texts, idioms, categories, synonyms and antonyms, homographs, affixed words,
 * topic sentences, opinion writing, fragments and run-ons, editing, sentence variety, introductions and
 * conclusions, pronoun forms, perfect tenses, paragraph unity, and capitalization.
 *
 * Each skill is a hand-written bank per level. A row is one question (often with a short passage), one
 * right answer, and three wrong answers that were each checked by hand to be clearly wrong, so only one
 * choice is ever right. Keys are "<skill>:<level>:<row>", so a missed question can be rebuilt exactly.
 */

interface Row {
  q: string
  a: string
  w: string[]
}

const r = (q: string, a: string, ...w: string[]): Row => ({ q, a, w })
/** A short passage, then its question. */
const P = (p: string, question: string) => `${p}\n\n${question}`

function rowSkill(id: string, labels: string[], banks: Row[][], unlocksAfter: Skill['unlocksAfter'], exact = false): Skill {
  const itemAt = (level: number, i: number): ItemSpec => {
    const row = banks[level - 1]![i]!
    return {
      key: `${id}:${level}:${i}`,
      prompt: { text: row.q, say: row.q.replace(/___/g, 'blank') },
      answer: row.a,
      wrong: (n) => wrongFrom(row.a, n, row.w),
      ...(exact ? { check: (resp: string) => (resp.trim() === row.a ? 1 : 0) } : {}),
    }
  }
  return {
    id,
    label: (L) => labels[L - 1]!,
    maxLevel: banks.length,
    formats: ['choice'],
    unlocksAfter,
    generate: (L) => {
      // Mostly this level's questions; sometimes an easier level's, so older ones still come back.
      const level = L > 1 && Math.random() < 0.3 ? 1 + Math.floor(Math.random() * (L - 1)) : L
      return itemAt(level, Math.floor(Math.random() * banks[level - 1]!.length))
    },
    fromKey: (key, L) => {
      const [k, lv, idx] = key.split(':')
      const level = Number(lv)
      const i = Number(idx)
      if (k !== id || !Number.isInteger(level) || level < 1 || level > L) return null
      if (!Number.isInteger(i) || !banks[level - 1]?.[i]) return null
      return itemAt(level, i)
    },
  }
}

// --- Reading -----------------------------------------------------------------------------------

const toneSkill = rowSkill(
  'tone',
  ['Tone: words that show feelings', "Tone: the writer's attitude", 'Tone: how a passage changes'],
  [
    [
      r(P("The sun was warm, the grass was soft, and we laughed as our kites soared higher and higher.", "What is the tone of this passage?"), "Joyful", "Gloomy", "Angry", "Frightened"),
      r(P("The storm tore off the roof. Water poured into every room, and the family stood silently in the dark.", "What is the tone of this passage?"), "Serious", "Silly", "Cheerful", "Playful"),
      r(P("Grandma hummed as she baked cookies. The smell of cinnamon filled the warm, cozy kitchen.", "What is the tone of this passage?"), "Cozy", "Angry", "Scary", "Rude"),
      r(P("Don't you dare touch my things again! I told you a hundred times to stay out of my room!", "What is the tone of this passage?"), "Angry", "Cheerful", "Calm", "Curious"),
      r(P("The puppy wagged its tail and jumped into my arms. I giggled and hugged him tight.", "What is the tone of this passage?"), "Happy", "Scary", "Gloomy", "Bored"),
      r(P("We drove home in silence. The house felt empty, and nobody mentioned the lost game.", "What is the tone of this passage?"), "Sad", "Silly", "Excited", "Joyful"),
      r(P("Always wear your helmet and check the brakes before you ride. Safety comes first.", "What is the tone of this passage?"), "Serious", "Playful", "Silly", "Excited"),
      r(P("Oh, what a silly hat! It has a bunny ear, a fish, and three giant bows. Ha ha!", "What is the tone of this passage?"), "Playful", "Gloomy", "Angry", "Serious"),
    ],
    [
      r(P("The old oak has stood on this hill for three hundred years, and it still shelters birds every spring.", "What is the writer's attitude toward the oak?"), "Admiring", "Bored", "Scornful", "Afraid"),
      r(P("The team lost again, and nobody practiced all week. Honestly, they deserved to lose.", "What is the writer's attitude toward the team?"), "Critical", "Proud", "Hopeful", "Joyful"),
      r(P("Grandpa's farm is gone now, but I still remember the creek, the barn, and his laugh.", "What is the writer's attitude toward the farm?"), "Nostalgic", "Furious", "Bored", "Excited"),
      r(P("Our new library has bright reading nooks, a computer lab, and friendly helpers. I can't wait to go back!", "What is the writer's attitude?"), "Excited", "Bored", "Disgusted", "Scared"),
      r(P("Some people claim that homework helps, but the evidence is weak. Most of it is just busywork.", "What is the writer's attitude?"), "Skeptical", "Thrilled", "Frightened", "Sleepy"),
      r(P("The city will build a new park by the river next spring. Everyone is looking forward to it.", "What is the writer's attitude?"), "Hopeful", "Angry", "Bored", "Disgusted"),
      r(P("The lunch line was so long that I missed recess, and the food was cold. What a terrible day.", "What is the writer's attitude?"), "Frustrated", "Thankful", "Calm", "Amazed"),
      r(P("Thanks to the volunteers, the shelter has enough food for every animal. Their hard work changed lives.", "What is the writer's attitude?"), "Grateful", "Mocking", "Bored", "Angry"),
    ],
    [
      r(P("At first, the fair was loud and fun. Then the power went out, and everyone grew quiet and worried.", "How does the tone change?"), "From fun to worried", "From sad to angry", "From calm to silly", "From angry to bored"),
      r(P("The first page is full of jokes and bright colors. Later, the story turns dark as the hero faces a loss.", "How does the tone change?"), "From playful to serious", "From sad to happy", "From angry to calm", "From serious to silly"),
      r(P("Sam laughed at his own clumsy jump. But when his leg hurt, he stopped laughing and sat very still.", "How does the tone change?"), "From amused to worried", "From worried to excited", "From angry to joyful", "From calm to silly"),
      r(P("Early in the trip, we sang songs in the car. By midnight, the road was dark, and we were all drowsy.", "How does the tone change?"), "From lively to quiet", "From gloomy to cheerful", "From angry to calm", "From silly to scary"),
      r(P("The crowd cheered when the team scored. A minute later, the referee called a foul, and the cheering turned to boos.", "How does the tone change?"), "From excited to angry", "From bored to calm", "From sad to hopeful", "From worried to playful"),
      r(P("Mom's voice was calm at dinner. When she saw the broken window, her voice became sharp and stern.", "How does the tone change?"), "From calm to stern", "From stern to silly", "From sad to happy", "From angry to bored"),
      r(P("The first chapter describes a sunny beach full of laughing kids. The last chapter describes an empty beach at night.", "How does the tone change?"), "From cheerful to lonely", "From lonely to joyful", "From angry to calm", "From silly to serious"),
      r(P("I was so nervous before the recital that my hands shook. After the last note, I felt proud and relieved.", "How does the tone change?"), "From nervous to proud", "From proud to angry", "From calm to bored", "From sleepy to excited"),
    ],
  ],
  [{ skill: 'inference', level: 2 }],
)

const storyElements = rowSkill(
  'storyElements',
  ['Story elements: setting and characters', 'Story elements: the conflict', 'Story elements: the resolution'],
  [
    [
      r(P("Mia and her dog Biscuit walked through the rainy streets of Chicago late at night.", "Where does the story take place?"), "A rainy city at night", "A farm at noon", "A forest in summer", "A school gym"),
      r(P("The old lighthouse stood on a rocky cliff. Every evening, the keeper, Mr. Hale, climbed the stairs to light the lamp.", "Who is the main character?"), "Mr. Hale", "The lighthouse", "The rocky cliff", "The lamp"),
      r(P("Jenna packed her bag for camping. She set up her tent beside the pine trees near the lake.", "Where does the story take place?"), "By a lake, among pine trees", "In a busy train station", "Inside a school gym", "On a city rooftop"),
      r(P("Ravi wanted to win the science fair. He spent every night building a model volcano in his garage.", "Where does Ravi build his volcano?"), "In his garage", "At the library", "In the school kitchen", "On a sailboat"),
      r(P("The dragon Ferdinand lived in a cave under the mountain. He loved to read poems and drink tea.", "Who is the main character?"), "Ferdinand", "The mountain", "The cave", "The tea"),
      r(P("In 1880, a girl named Ada rode a horse to the frontier town of Dry Creek to start a school.", "When does the story take place?"), "In 1880", "In the year 2050", "On a rainy Monday", "At midnight"),
      r(P("Leo was the new kid at school. He sat alone at lunch, feeling shy and unsure.", "Who is the main character?"), "Leo", "The lunchroom", "The teacher", "The school"),
      r(P("Deep in the jungle, a tiny monkey named Pip swung from vine to vine, searching for mangoes.", "Where does the story take place?"), "In a jungle", "In a desert", "In an igloo", "In a school library"),
    ],
    [
      r(P("Tomas wanted to swim in the lake, but his mother said the water was too cold. He argued all afternoon.", "What is the conflict in this story?"), "Tomas wants to swim, but Mom says no", "Tomas lost his swimsuit", "Tomas is hungry for lunch", "Tomas wants a new boat"),
      r(P("The robot could not find its way home through the crowded city. Its battery was almost empty.", "What is the conflict in this story?"), "The robot is lost and low on power", "The robot wants a paint job", "The robot is learning to dance", "A parade blocks the street"),
      r(P("Priya's kitten climbed to the top of the tall oak and would not come down. Priya was afraid to climb after it.", "What is the conflict in this story?"), "The kitten is stuck up a tree", "Priya has a new kitten", "Priya lost her lunch", "The tree is being cut down"),
      r(P("The village had no clean water. Ana walked three miles each day to fetch it, and she grew tired.", "What is the conflict in this story?"), "The village lacks clean water", "Ana loves long walks", "Ana wants a bicycle", "The village is having a dance party"),
      r(P("Marcus has a big test tomorrow, but his best friend wants him to come to the movies tonight.", "What is the conflict in this story?"), "Marcus must choose: study or the movie", "Marcus lost his backpack", "Marcus wants a new bike", "The movie theater is closed"),
      r(P("The wind knocked the sail off the boat, and the captain had to fix it before the storm came.", "What is the conflict in this story?"), "A storm is coming, and the sail is broken", "The captain wants a new hat", "The boat is painted red", "The wind is very quiet"),
      r(P("Chloe was chosen as the lead in the play, but she was afraid to speak in front of a crowd.", "What is the conflict in this story?"), "Chloe is afraid to perform for people", "Chloe lost her costume", "The play is canceled for rain", "Chloe wants to be a chef"),
      r(P("A thief stole the baker's recipe book. The baker had to find it before the big contest on Saturday.", "What is the conflict in this story?"), "The recipe book was stolen", "The baker wants a new oven", "The contest was canceled", "The bread was too sweet"),
    ],
    [
      r(P("Tomas wanted to swim, but the lake was cold. His dad heated water in a big tub, and they splashed happily in the backyard.", "How is the problem solved?"), "His dad heats water in a tub", "Tomas swims in the freezing lake", "Tomas gives up and goes to bed", "His mom takes him to the ocean"),
      r(P("The kitten was stuck up the oak. Priya's brother brought a ladder, and the kitten jumped into Priya's arms.", "How is the problem solved?"), "A ladder helps the kitten come down", "Priya climbs the oak alone and falls", "The kitten stays up the tree all week", "A dog chases the kitten away"),
      r(P("Marcus studied for two hours, then he watched the movie with his friend on Saturday.", "How is the problem solved?"), "He studies first, then sees the movie", "He skips the test to see the movie", "He never studies or sees the movie", "He cleans the attic all night"),
      r(P("The village dug a new well. Now every family has clean water close to home.", "How is the problem solved?"), "The village digs a new well", "The village moves to a new city", "The village stops drinking water", "Ana buys bottles of soda"),
      r(P("The robot followed a blinking light to a charging station. It plugged in and got enough power to go home.", "How is the problem solved?"), "It finds a charging station", "It waits for the battery to die", "It asks a dog for a ride", "It paints itself bright red"),
      r(P("The wind tore the sail, so the crew sewed a new one from spare canvas. The boat sailed on before the storm arrived.", "How is the problem solved?"), "The crew sews a new sail", "The crew swims back to shore", "The captain sleeps through the storm", "They throw the boat into the sea"),
      r(P("Chloe practiced her lines every night in front of the mirror. On opening night, she spoke clearly, and the audience clapped.", "How is her problem solved?"), "She practices until she feels brave", "She quits the play and leaves town", "She gives her lines to a friend", "She hides under the stage"),
      r(P("The thief was caught when the baker noticed flour prints on the stairs. The police found the recipe book in his bag.", "How is the problem solved?"), "Flour prints lead police to the thief", "The baker writes a new book", "The contest is canceled for good", "The baker gives up on the contest"),
    ],
  ],
  [{ skill: 'settingCharacter', level: 3 }],
)

const literaryTexts = rowSkill(
  'literaryTexts',
  ['Stories: what happens', 'Stories: why characters act', 'Stories: the main message'],
  [
    [
      r(P("Lila wanted to win the race. She trained every morning before school, and on race day she ran her fastest.", "Why did Lila train every morning?"), "She wanted to win the race", "She wanted to skip school", "She was bored at home", "She lost her running shoes"),
      r(P("Ben forgot his lunch. His friend Sam shared a sandwich and an apple with him.", "What did Sam do?"), "Shared his lunch with Ben", "Ate all of Ben's lunch", "Hid the apple", "Went home early"),
      r(P("The bear found a honey pot in the woods. He was so happy that he sang and danced all afternoon.", "How did the bear feel?"), "Happy", "Sad", "Scared", "Angry"),
      r(P("Nina didn't want to leave the park. She sat on the swing and cried until her mom promised pizza for dinner.", "Why did Nina stop crying?"), "Her mom promised pizza", "She saw a bird", "She fell asleep", "A friend gave her a toy"),
      r(P("Tom lost his favorite hat at the beach. He searched the sand all day, and at sunset a kind lifeguard handed it back.", "Who found the hat?"), "A lifeguard", "Tom's sister", "A seagull", "Tom's dad"),
      r(P("The little hen laid her eggs in the barn. When the chicks hatched, she watched over them every minute.", "What did the hen do when the chicks hatched?"), "Watched over them", "Flew to the moon", "Sold the chicks", "Ate the eggs"),
      r(P("Ellie practiced piano every day. At the spring concert, she played a song without a single mistake.", "What did Ellie do at the concert?"), "Played without mistakes", "Forgot her piano", "Sang a silly song", "Left early"),
      r(P("Max was scared of the dark. Every night, his dad left the hall light on so Max could fall asleep.", "Why did Dad leave the light on?"), "To help Max feel safe", "To wake Max up", "To find his shoes", "To read a book"),
    ],
    [
      r(P("Jada hid behind the couch when the doorbell rang. She peeked out, saw her cousin, and laughed with relief.", "Why did Jada hide?"), "She was afraid of who was at the door", "She was playing with the cat", "She wanted a snack", "She was sleepy and needed a nap"),
      r(P("Carlos kept reading his grandpa's old letters. Each one described the farm they once shared, and Carlos began to miss a place he had never visited.", "How does Carlos feel?"), "Longing for a place he has never seen", "Excited to move far away", "Angry at his grandpa", "Bored with reading"),
      r(P("The coach told Dana to rest her ankle. She sat on the bench, but she kept cheering loudly for her team.", "Why does Dana keep cheering?"), "She still wants to support her team", "She is trying to hurt her ankle", "She wants to leave the game", "She is bored by the sport"),
      r(P("Omar always forgot his homework. This week, he set a timer each night and finished every assignment before dinner.", "Why did Omar set a timer?"), "To finish his homework on time", "To win a video game", "To get a new pet", "To sleep later"),
      r(P("When the wolf knocked, the three pigs huddled in the brick house. The wolf huffed and puffed, but the house did not move.", "Why could the wolf not blow the house down?"), "The house was made of strong brick", "The wolf had a cold", "The pigs were too fast", "The wolf got lost in the woods"),
      r(P("Ruth felt proud when her science project won first place. She thanked her teacher and then called her grandmother.", "How does Ruth feel?"), "Proud and grateful", "Hungry and tired", "Angry at her teacher", "Bored and sleepy"),
      r(P("Tyler stared at the empty chair. His best friend had moved away over the summer, and the classroom felt strange without him.", "How does Tyler feel?"), "Lonely and sad", "Thrilled and excited", "Angry at the teacher", "Calm and sleepy"),
      r(P("Leah offered her seat to an old man on the bus. He smiled and thanked her warmly.", "What kind of person is Leah?"), "Kind and thoughtful", "Rude and selfish", "Lazy and grumpy", "Silly and loud"),
    ],
    [
      r(P("Ron wanted a new bike. He saved coins for months, skipped treats, and finally bought it with his own money. He felt proud every time he rode it.", "What lesson does this story teach?"), "Hard work can earn a reward", "Money grows on trees", "Treats matter more than bikes", "Bikes are too expensive to ride"),
      r(P("The fox boasted that he was the smartest animal in the forest. When a hunter came, his clever tricks failed, and a rabbit escaped by hiding quietly.", "What lesson does this story teach?"), "Bragging does not make you wise", "Foxes are always the cleverest", "Hunters are easy to fool", "Clever tricks never fail"),
      r(P("Anna and Grace were best friends until they argued over a book. For weeks, neither would speak. Finally, Anna wrote a note, and they laughed about it together.", "What is the story mostly about?"), "Making up after a fight with a friend", "Losing a book at the library", "Learning to write letters", "Building a treehouse with friends"),
      r(P("Mr. Lopez planted seeds every spring. He watered them each day, pulled the weeds, and waited. Each fall, his garden gave him more than he could eat.", "What is the main message?"), "Patience and care help things grow", "Gardens grow without any help", "Weeds are the best part of a garden", "Spring is the only season to plant"),
      r(P("Lucy broke Grandma's vase by accident. She was afraid to tell the truth, but she finally did, and Grandma hugged her and said, \"Accidents happen.\"", "What lesson does this story teach?"), "Telling the truth takes courage", "Vases should never be touched", "Lying is the easiest choice", "Grandma is always angry"),
      r(P("The little train kept saying, \"I think I can.\" It climbed the steep hill slowly, and at the top it cheered, \"I knew I could!\"", "What is the message of this story?"), "Believing in yourself helps you succeed", "Trains should never climb hills", "Hills are too steep to climb", "Talking is more useful than moving"),
      r(P("Jordan's team lost every game all season. Instead of quitting, they practiced together, cheered each other on, and won their final match.", "What is the story mostly about?"), "A team that works together to improve", "A boy who quits sports", "A referee who makes mistakes", "A field that is too small"),
      r(P("Mina found a lost wallet on the way to school. Even though she needed money, she returned it to its owner, who thanked her with a smile.", "What does this story teach?"), "Honesty matters even when it is hard", "Wallets should always be hidden", "Money is the most important thing", "Schools are far from home"),
    ],
  ],
  [{ skill: 'mainIdea', level: 2 }],
)

const informationalTexts = rowSkill(
  'informationalTexts',
  ['Informational text: main facts', 'Informational text: details and evidence', 'Informational text: reading closely'],
  [
    [
      r(P("Bees visit flowers to collect nectar. They carry it back to the hive, where it becomes honey.", "What does nectar become in the hive?"), "Honey", "Milk", "Bread", "Soup"),
      r(P("Penguins cannot fly, but they are excellent swimmers. They use their wings like flippers to move through the water.", "What do penguins use their wings for in the water?"), "Swimming, like flippers", "Flying high", "Building nests", "Carrying fish"),
      r(P("The Nile River flows north through Africa. It is one of the longest rivers in the world.", "Which direction does the Nile flow?"), "North", "South", "East", "West"),
      r(P("Glaciers are huge sheets of ice that move slowly over land. Some have existed for thousands of years.", "What are glaciers?"), "Huge sheets of moving ice", "Hot springs under the sea", "Small piles of rock", "Dry deserts"),
      r(P("Octopuses have three hearts. Their blood is blue, and each heart pumps blood through the body.", "How many hearts does an octopus have?"), "Three", "One", "Five", "Eight"),
      r(P("Thunder is the sound made when lightning heats the air very quickly. The hot air expands and makes a loud boom.", "What makes thunder?"), "Lightning heating the air", "Clouds crashing together", "Birds flying fast", "Rain hitting the roof"),
      r(P("Honeybees dance to tell their hive where flowers are. The direction of the dance shows the direction of the flowers.", "How do honeybees share information?"), "They dance", "They sing loudly", "They whistle", "They hum softly"),
      r(P("Mount Everest is the tallest mountain above sea level. It sits on the border between Nepal and China.", "Where is Mount Everest?"), "On the border of Nepal and China", "In the middle of Canada", "In the Sahara Desert", "On the coast of Peru"),
    ],
    [
      r(P("Sharks have skin covered with tiny toothlike scales called denticles. This rough skin helps them move through the water with less drag.", "Which detail shows that shark skin is rough?"), "It is covered with tiny toothlike scales", "Sharks live in deserts", "Sharks eat only plants", "Sharks sleep in dark caves"),
      r(P("The Arctic stays very cold all year. Animals there have thick fur or layers of fat to stay warm.", "Which detail shows how animals stay warm?"), "They have thick fur or fat", "They fly south in winter", "They live underground in sand", "They eat only fruit"),
      r(P("Many people think spiders are insects, but they are arachnids. Insects have six legs, while spiders have eight.", "What is one way spiders differ from insects?"), "Spiders have eight legs", "Spiders have six legs", "Spiders have wings", "Spiders have no legs at all"),
      r(P("Recycling saves energy. Making new items from recycled materials takes less energy than starting from raw materials.", "What is the main reason recycling helps?"), "It saves energy", "It uses more raw materials", "It makes trash bigger", "It wastes more energy"),
      r(P("Volcanoes form where magma rises through cracks in Earth's crust. When magma erupts onto the surface, it is called lava.", "What is lava?"), "Magma that has erupted onto the surface", "Ice that falls from clouds", "Sand that blows in the wind", "Rain that freezes in the sky"),
      r(P("Our school garden grows carrots, beans, and tomatoes. Students water the plants each morning before class.", "What do students do each morning?"), "Water the plants", "Pick all the tomatoes", "Dig a new pond", "Paint the school fence"),
      r(P("The Amazon rainforest is home to millions of insects and thousands of plant species. Scientists still discover new species there every year.", "Why do scientists keep exploring the Amazon?"), "They keep finding new species there", "They want to build a city there", "It is too cold to visit", "There are no plants there"),
      r(P("Coral reefs are built by tiny animals called polyps. Over thousands of years, their skeletons pile up into huge reefs.", "What builds coral reefs?"), "Tiny animals called polyps", "Huge fish with sharp teeth", "Strong ocean winds", "Melted glaciers"),
    ],
    [
      r(P("Many people think cats are lazy. In fact, cats sleep up to sixteen hours a day to save energy for hunting.", "What is the author's main point?"), "Cats sleep a lot for a good reason", "Cats hate being around people", "Cats never hunt for food", "Cats are the laziest pets"),
      r(P("Dust storms form when strong winds lift loose soil into the air. Farmers can reduce them by planting cover crops that hold the soil in place.", "What do farmers do to reduce dust storms?"), "Plant cover crops that hold soil", "Build tall walls of sand", "Stop farming forever", "Move soil into the sky"),
      r(P("The printing press, invented around 1440, let books be made quickly. Before it, scribes copied every book by hand, which could take months.", "What changed because of the printing press?"), "Books could be made much faster", "Books stopped being made at all", "Scribes became the most famous writers", "Printing took months to finish"),
      r(P("Migrating birds fly thousands of miles each year. They use the sun, the stars, and Earth's magnetic field to find their way.", "How do migrating birds find their way?"), "Using the sun, stars, and magnetism", "By following roads on the ground", "By asking other birds for maps", "By flying randomly until they arrive"),
      r(P("Sunflowers turn to face the sun during the day. This movement, called heliotropism, helps young sunflowers grow strong and warm.", "What does heliotropism mean in this passage?"), "Turning to face the sun", "Growing very tall", "Dropping seeds to the ground", "Losing leaves in the fall"),
      r(P("Early explorers used the stars to navigate. Sailors who could read the night sky could find their way across oceans.", "Why were stars important to sailors?"), "They helped sailors find their way", "They kept sailors from getting sleepy", "They made the ocean warmer", "They helped fish find food"),
      r(P("Tardigrades are tiny animals that can survive extreme cold, intense heat, and even the vacuum of space. Scientists study them to learn how life can endure harsh conditions.", "Why do scientists study tardigrades?"), "To learn how life survives harsh conditions", "To learn how to make candy", "To train them as pets", "To prove that fish can fly"),
      r(P("Dolphins communicate with clicks and whistles. Each dolphin may have its own special whistle, almost like a name.", "What does the passage suggest about dolphin whistles?"), "They may work like names", "They are used only for eating", "They are the same for every dolphin", "They are made by the wind"),
    ],
  ],
  [{ skill: 'mainIdea', level: 2 }],
)

const idioms = rowSkill(
  'idioms',
  ['Idioms: what they mean', 'Idioms in sentences', 'Proverbs and sayings'],
  [
    [
      r("What does 'under the weather' mean?", "Feeling sick", "Standing in the rain", "Very happy", "Hiding under a blanket"),
      r("What does 'hit the hay' mean?", "Go to bed", "Eat a snack", "Feed the farm animals", "Play outside"),
      r("What does 'break the ice' mean?", "Start a friendly conversation", "Smash a frozen lake", "Cool a drink", "Leave a party early"),
      r("What does 'spill the beans' mean?", "Reveal a secret", "Make a big mess", "Cook dinner", "Win a prize"),
      r("What does 'once in a blue moon' mean?", "Very rarely", "Every single night", "Very often", "At exactly noon"),
      r("What does 'call it a day' mean?", "Stop working for the day", "Plan a holiday", "Start a new project", "Celebrate a birthday"),
      r("What does 'hold your horses' mean?", "Wait a moment", "Ride faster", "Feed the horses", "Go to the stable"),
      r("What does 'get cold feet' mean?", "Feel nervous about doing something", "Get frostbite on your toes", "Put on warm socks", "Go swimming in winter"),
    ],
    [
      r(P("Maya was so excited about the trip that she was on cloud nine all week.", "What does 'on cloud nine' mean?"), "Extremely happy", "Very tired", "Lost in the clouds", "Standing on a hill"),
      r(P("The mechanic said the new engine would cost an arm and a leg.", "What does 'cost an arm and a leg' mean?"), "Be very expensive", "Be broken into pieces", "Need a doctor", "Be easy to repair"),
      r(P("We were in hot water after we broke the window.", "What does 'in hot water' mean?"), "In trouble", "Very hot", "Lost in a lake", "Swimming for fun"),
      r(P("The team had to bite the bullet and finish the hard job.", "What does 'bite the bullet' mean?"), "Face something hard bravely", "Eat a snack quickly", "Quit the job", "Get bored and leave"),
      r(P("The whole class was all ears when the storyteller began.", "What does 'all ears' mean?"), "Listening carefully", "Covered with hair", "Loud and noisy", "Sleepy and yawning"),
      r(P("Dad said he would pull my leg, but he was only joking.", "What does 'pull my leg' mean?"), "Tease me or joke with me", "Pull me to the floor", "Hurt my leg", "Give me a ride"),
      r(P("Grandma said the lost cat was a needle in a haystack.", "What does 'a needle in a haystack' mean?"), "Very hard to find", "Very easy to see", "Made of metal", "Stuck in the hay"),
      r(P("Now the ball is in your court, so you decide what happens next.", "What does 'the ball is in your court' mean?"), "It is your turn to decide", "You must play tennis", "The game is over", "You dropped the ball"),
    ],
    [
      r("What does 'Don't count your chickens before they hatch' mean?", "Don't plan on results you don't have yet", "Count chickens very slowly", "Hatch eggs faster", "Never buy any chickens"),
      r("What does 'A stitch in time saves nine' mean?", "Fix small problems early", "Sewing takes nine hours", "Save your stitches for later", "Time is the best tailor"),
      r("What does 'Actions speak louder than words' mean?", "What you do matters more than words", "Speaking loudly is always best", "Words are always more useful", "Actions are always noisy"),
      r("What does 'The early bird catches the worm' mean?", "Acting early gives you an advantage", "Birds must eat worms every day", "Worms come out only at night", "Sleeping late is the best plan"),
      r("What does 'Better late than never' mean?", "Finishing late is better than quitting", "Being late is always the best plan", "Never finish anything you start", "Late birds never catch worms"),
      r("What does 'You can't judge a book by its cover' mean?", "Don't judge things by how they look", "Books should always have covers", "Covers matter more than pages", "Only read books with pictures"),
      r("What does 'Many hands make light work' mean?", "Working together makes a task easier", "Hands should never be used", "Work is always heavy", "Only strong people can work"),
      r("What does 'Practice makes perfect' mean?", "Doing something often makes you better", "Perfect people never need practice", "Practice is only for sports", "One try is enough to master anything"),
    ],
  ],
  [{ skill: 'figurative', level: 2 }],
)

const wordGroups = rowSkill(
  'wordGroups',
  ['Categories: name the group', 'Categories: which one does not belong', 'Categories: the best label'],
  [
    [
      r("Which word names this group: oak, maple, pine?", "Trees", "Fruits", "Vehicles", "Instruments"),
      r("Which word names this group: cello, drum, flute?", "Instruments", "Furniture", "Vegetables", "Clothing"),
      r("Which word names this group: cabbage, carrot, peas?", "Vegetables", "Animals", "Toys", "Shapes"),
      r("Which word names this group: robin, owl, duck?", "Birds", "Insects", "Fish", "Dinosaurs"),
      r("Which word names this group: sled, bus, tractor?", "Vehicles", "Clothes", "Flowers", "Spices"),
      r("Which word names this group: red, blue, green?", "Colors", "Numbers", "Animals", "Sounds"),
      r("Which word names this group: Tuesday, Friday, Sunday?", "Days of the week", "Months", "Seasons", "Holidays"),
      r("Which word names this group: hammer, saw, wrench?", "Tools", "Fruits", "Pets", "Clouds"),
    ],
    [
      r("Which one is NOT a mammal?", "Lizard", "Whale", "Bat", "Dolphin"),
      r("Which one is NOT a planet?", "Moon", "Mars", "Venus", "Saturn"),
      r("Which one is NOT a metal?", "Granite", "Iron", "Copper", "Silver"),
      r("Which one is NOT a reptile?", "Frog", "Turtle", "Snake", "Crocodile"),
      r("Which one is NOT a grain?", "Potato", "Wheat", "Rice", "Oats"),
      r("Which one is NOT a continent?", "Greenland", "Africa", "Asia", "Europe"),
      r("Which one is NOT a polygon?", "Circle", "Triangle", "Square", "Hexagon"),
      r("Which one is NOT a kind of bread?", "Pasta", "Bagel", "Baguette", "Pita"),
    ],
    [
      r("Which label best names: whale, shark, octopus, crab?", "Sea creatures", "Desert animals", "Farm animals", "Insects"),
      r("Which label best names: tulip, rose, daisy, lily?", "Flowers", "Trees", "Rocks", "Vehicles"),
      r("Which label best names: Mars, Venus, Jupiter, Saturn?", "Planets", "Stars", "Moons", "Comets"),
      r("Which label best names: piano, guitar, drum, violin?", "Musical instruments", "Sports equipment", "Kitchen tools", "Art supplies"),
      r("Which label best names: Paris, Tokyo, Cairo, Lima?", "Cities", "Countries", "Rivers", "Mountains"),
      r("Which label best names: ruby, emerald, sapphire, diamond?", "Gemstones", "Fruits", "Fabrics", "Insects"),
      r("Which label best names: spring, summer, fall, winter?", "Seasons", "Months", "Holidays", "Weather"),
      r("Which label best names: hiking, swimming, soccer, tennis?", "Sports", "Crafts", "Foods", "Jobs"),
    ],
  ],
  [{ skill: 'contextClues', level: 1 }],
)

const synonymsAntonyms = rowSkill(
  'synonymsAntonyms',
  ['Synonyms: same meaning', 'Antonyms: opposite meaning', 'Synonyms in sentences'],
  [
    [
      r("Which word means the same as 'happy'?", "Glad", "Angry", "Tired", "Sleepy"),
      r("Which word means the same as 'big'?", "Large", "Tiny", "Quiet", "Quick"),
      r("Which word means the same as 'begin'?", "Start", "Finish", "Sleep", "Wander"),
      r("Which word means the same as 'quick'?", "Fast", "Slow", "Heavy", "Sweet"),
      r("Which word means the same as 'cold'?", "Chilly", "Hot", "Bright", "Smooth"),
      r("Which word means the same as 'shout'?", "Yell", "Whisper", "Sleep", "Smile"),
      r("Which word means the same as 'brave'?", "Courageous", "Fearful", "Lazy", "Sneaky"),
      r("Which word means the same as 'tiny'?", "Little", "Enormous", "Loud", "Bitter"),
    ],
    [
      r("Which word means the opposite of 'ancient'?", "Modern", "Old", "Broken", "Dusty"),
      r("Which word means the opposite of 'generous'?", "Selfish", "Kind", "Giving", "Friendly"),
      r("Which word means the opposite of 'expand'?", "Shrink", "Grow", "Stretch", "Swell"),
      r("Which word means the opposite of 'strict'?", "Relaxed", "Harsh", "Severe", "Firm"),
      r("Which word means the opposite of 'vast'?", "Tiny", "Huge", "Wide", "Endless"),
      r("Which word means the opposite of 'remember'?", "Forget", "Recall", "Notice", "Learn"),
      r("Which word means the opposite of 'hostile'?", "Friendly", "Angry", "Rude", "Cruel"),
      r("Which word means the opposite of 'accept'?", "Reject", "Agree", "Receive", "Welcome"),
    ],
    [
      r(P("The enormous dog barked at the mailman.", "Which word could replace 'enormous'?"), "Huge", "Tiny", "Quiet", "Gentle"),
      r(P("The detective searched the dim room for clues.", "Which word could replace 'dim'?"), "Dark", "Bright", "Clean", "Warm"),
      r(P("The lazy cat stretched in the sun all afternoon.", "Which word could replace 'lazy'?"), "Idle", "Hungry", "Busy", "Angry"),
      r(P("She was furious when she saw the broken window.", "Which word could replace 'furious'?"), "Angry", "Pleased", "Sleepy", "Hungry"),
      r(P("The chef added a dash of pepper to the soup.", "Which word could replace 'dash'?"), "A little bit", "A huge pile", "A long line", "A deep hole"),
      r(P("The old bridge was fragile, so we crossed it slowly.", "Which word could replace 'fragile'?"), "Delicate", "Heavy", "Colorful", "Sturdy"),
      r(P("The students were eager to start the new project.", "Which word could replace 'eager'?"), "Excited", "Bored", "Unwilling", "Sleepy"),
      r(P("We had to hurry because the train was about to depart.", "Which word could replace 'depart'?"), "Leave", "Arrive", "Sleep", "Repair"),
    ],
  ],
  [{ skill: 'contextClues', level: 2 }],
)

const homographs = rowSkill(
  'homographs',
  ['Homonyms: the meaning in a sentence', 'Homonyms: which meaning fits', 'Homonyms: tricky meanings'],
  [
    [
      r(P("The bat flew out of the cave at dusk.", "What does 'bat' mean here?"), "A flying animal", "A baseball bat", "A small ball", "A bowl of soup"),
      r(P("I need to book a room for the trip.", "What does 'book' mean here?"), "To reserve", "A set of pages", "To stand up", "To run fast"),
      r(P("The leaves fell from the trees in the fall.", "What does 'fall' mean here?"), "A season", "To drop down", "To trip over", "To come out"),
      r(P("Please lie down and rest for a while.", "What does 'lie' mean here?"), "To rest flat", "To tell an untruth", "To sit on a chair", "To hide behind a tree"),
      r(P("The plant needs water to grow in the spring.", "What does 'plant' mean here?"), "A living thing that grows in soil", "A factory", "To put seeds in soil", "A kind of shoe"),
      r(P("Mom wore a ring with a shiny stone.", "What does 'ring' mean here?"), "A circle of metal worn on a finger", "A telephone call", "The sound of a bell", "To call out loudly"),
      r(P("The river bank was covered with tall grass.", "What does 'bank' mean here?"), "The land beside a river", "A place to keep money", "To tilt to one side", "A pile of snow"),
      r(P("Please park the car on the street.", "What does 'park' mean here?"), "Leave a car in a spot", "A place with swings", "To play outside", "A big green field"),
    ],
    [
      r(P("We sat in the front row of the theater.", "What does 'row' mean here?"), "A line of seats", "To paddle a boat", "A loud argument", "To dig a hole"),
      r(P("A tear rolled down her cheek when she heard the sad news.", "What does 'tear' mean here?"), "A drop from the eye", "To rip a sheet of paper", "To run very fast", "To pull something apart"),
      r(P("The wind blew the kite high into the sky.", "What does 'wind' mean here?"), "Moving air", "To wrap around something", "To turn a key", "To make a crooked path"),
      r(P("Wait a minute while I find my shoes.", "What does 'minute' mean here?"), "A short amount of time", "Very tiny", "A heavy load", "A bright light"),
      r(P("The present on the table is for my little sister.", "What does 'present' mean here?"), "A gift", "To show to others", "Right now", "A kind of stone"),
      r(P("She tied a bow on the gift.", "What does 'bow' mean here?"), "A loop of ribbon", "To bend at the waist", "A type of arrow", "A wooden boat"),
      r(P("The lead singer stepped up to the microphone.", "What does 'lead' mean here?"), "The main one", "A soft gray metal", "To be led down a path", "A pencil core"),
      r(P("Please close the door when you leave.", "What does 'close' mean here?"), "To shut", "Near in distance", "Very warm", "Fast"),
    ],
    [
      r(P("The soldier was accused of trying to desert his post.", "What does 'desert' mean here?"), "To leave and abandon", "A dry sandy land", "To dig in the sand", "A cactus plant"),
      r(P("The wound on her knee healed in one week.", "What does 'wound' mean here?"), "An injury", "Wrapped around something", "Turned a crank", "Walked slowly"),
      r(P("The diver dove straight into the lake.", "What does 'dove' mean here?"), "Jumped in headfirst", "Cooed softly", "Ran away", "Flew very high"),
      r(P("We were content with a simple dinner.", "What does 'content' mean here?"), "Happy and satisfied", "A list of what is inside", "Angry and loud", "A kind of cake"),
      r(P("The old farmer planned to sow the seeds on the hill.", "What does 'sow' mean here?"), "To plant seeds", "A female pig", "To ride a bike", "To hide a treasure"),
      r(P("The band will live on stage tonight.", "What does 'live' mean here?"), "In front of an audience", "Breathing and growing", "Living in a house", "Waiting for a long time"),
      r(P("The bass guitar played low, rumbling notes.", "What does 'bass' mean here?"), "Low-pitched music", "A type of fish", "A deep bowl", "A tall plant"),
      r(P("The clock needed to be wound every morning.", "What does 'wound' mean here?"), "Turned to make it run", "Hurt badly", "Covered in a sheet", "Broken into pieces"),
    ],
  ],
  [{ skill: 'homophones', level: 3 }],
)

const affixedWords = rowSkill(
  'affixedWords',
  ['Affixed words: prefixes and suffixes', 'Affixed words: more suffixes', 'Prefixes and suffixes: harder words'],
  [
    [
      r("Which word means 'not safe'?", "unsafe", "safer", "safely", "safest"),
      r("Which word means 'to write again'?", "rewrite", "writer", "writing", "written"),
      r("Which word means 'full of wonder'?", "wonderful", "wondered", "wonderland", "wonders"),
      r("Which word means 'without a home'?", "homeless", "homemade", "homework", "homesick"),
      r("Which word means 'able to be washed'?", "washable", "washer", "washed", "washing"),
      r("Which word means 'one who teaches'?", "teacher", "teachable", "teaching", "taught"),
      r("Which word means 'not fair'?", "unfair", "fairly", "fairer", "fairness"),
      r("Which word means 'to fill again'?", "refill", "filler", "filled", "fillable"),
    ],
    [
      r("Which word means 'the state of being kind'?", "kindness", "kindly", "kinder", "unkind"),
      r("Which word means 'to not agree'?", "disagree", "agreeable", "agreement", "agreed"),
      r("Which word means 'to see before others'?", "preview", "review", "viewer", "overview"),
      r("Which word means 'able to be enjoyed'?", "enjoyable", "enjoyment", "enjoyed", "enjoying"),
      r("Which word means 'to make smaller'?", "minimize", "minimal", "minimum", "miniature"),
      r("Which word means 'the act of achieving'?", "achievement", "achiever", "achieved", "achievable"),
      r("Which word means 'not able to be believed'?", "unbelievable", "believable", "believer", "disbelief"),
      r("Which word means 'one who plays'?", "player", "playful", "playground", "replay"),
    ],
    [
      r("Which word means 'between two nations'?", "international", "interrupt", "intermission", "intercom"),
      r("Which word means 'to make into a symbol'?", "symbolize", "symbolic", "symbolism", "symbols"),
      r("Which word means 'a train that runs under the city'?", "subway", "subtitle", "submit", "subtract"),
      r("Which word means 'able to be seen'?", "visible", "visitor", "vision", "visionary"),
      r("Which word means 'full of danger'?", "dangerous", "endangered", "dangerously", "danger"),
      r("Which word means 'the state of being equal'?", "equality", "equally", "equalize", "equator"),
      r("Which word means 'to make legal'?", "legalize", "legal", "legality", "legally"),
      r("Which word means 'not able to be read'?", "illegible", "legible", "legibly", "illegal"),
    ],
  ],
  [{ skill: 'affixes', level: 2 }],
)

// --- Writing -----------------------------------------------------------------------------------

const topicSentences = rowSkill(
  'topicSentences',
  ['Topic sentences: find the main idea', 'Topic sentences: the best one for a list', 'Topic sentences: start a paragraph'],
  [
    [
      r("Which sentence is the topic sentence?\n\nDogs make wonderful pets. They are loyal to their families. Many love to play fetch in the yard. Some even know dozens of tricks.", "Dogs make wonderful pets.", "They are loyal to their families.", "Many love to play fetch in the yard.", "Some even know dozens of tricks."),
      r("Which sentence is the topic sentence?\n\nA bike ride is a great way to exercise. You can ride with friends after school. Your legs get stronger every time. Fresh air clears your head.", "A bike ride is a great way to exercise.", "You can ride with friends after school.", "Your legs get stronger every time.", "Fresh air clears your head."),
      r("Which sentence is the topic sentence?\n\nOur class garden grows many vegetables. Carrots grow under the soil. Tomatoes need lots of sun. Peas climb up tiny sticks.", "Our class garden grows many vegetables.", "Carrots grow under the soil.", "Tomatoes need lots of sun.", "Peas climb up tiny sticks."),
      r("Which sentence is the topic sentence?\n\nLibraries offer more than books. Many have computers you can use. Some hold story hours for little kids. You can even borrow movies.", "Libraries offer more than books.", "Many have computers you can use.", "Some hold story hours for little kids.", "You can even borrow movies."),
      r("Which sentence is the topic sentence?\n\nSnow can be a lot of fun. Kids can build snowmen and forts. Sledding down a hill is thrilling. Hot cocoa tastes great after playing.", "Snow can be a lot of fun.", "Kids can build snowmen and forts.", "Sledding down a hill is thrilling.", "Hot cocoa tastes great after playing."),
      r("Which sentence is the topic sentence?\n\nThe moon changes shape every month. Sometimes it looks like a thin crescent. Other times it looks like a big round circle. Scientists call these shapes phases.", "The moon changes shape every month.", "Sometimes it looks like a thin crescent.", "Other times it looks like a big round circle.", "Scientists call these shapes phases."),
      r("Which sentence is the topic sentence?\n\nOur family has a busy morning routine. Dad makes toast for everyone. I brush my teeth and pack my backpack. Mom checks that the car has gas.", "Our family has a busy morning routine.", "Dad makes toast for everyone.", "I brush my teeth and pack my backpack.", "Mom checks that the car has gas."),
      r("Which sentence is the topic sentence?\n\nMany animals hide to stay safe. A rabbit can freeze in the tall grass. Some fish blend in with the rocks. Chameleons change color to hide.", "Many animals hide to stay safe.", "A rabbit can freeze in the tall grass.", "Some fish blend in with the rocks.", "Chameleons change color to hide."),
    ],
    [
      r("Which sentence is the best topic sentence for these details?\n\n• Mix the flour and sugar.\n• Crack two eggs into a bowl.\n• Bake for twenty minutes.", "Making a simple cake takes just a few steps.", "The bus was late this morning.", "Cats like to nap in sunny spots.", "My favorite color is green."),
      r("Which sentence is the best topic sentence for these details?\n\n• Stretch before you run.\n• Drink water during the race.\n• Wear shoes that fit well.", "Runners can prepare in several ways.", "Shells wash up on the beach.", "Clouds float across the sky.", "Penguins live in cold places."),
      r("Which sentence is the best topic sentence for these details?\n\n• Mars is the fourth planet from the sun.\n• Mars has two small moons.\n• Mars looks red from Earth.", "Mars is an interesting planet.", "Fish live under the ocean.", "Birthdays are fun parties.", "My cousin likes trucks."),
      r("Which sentence is the best topic sentence for these details?\n\n• Cacti store water in their thick stems.\n• Their spines protect them from hungry animals.\n• Some cacti bloom with bright flowers.", "Cacti have special features for dry places.", "Cacti are sold in many stores.", "Rain falls on the mountains.", "Shoes help us walk safely."),
      r("Which sentence is the best topic sentence for these details?\n\n• Owls have big eyes for seeing in the dark.\n• Their ears can hear tiny sounds.\n• Their soft feathers let them fly silently.", "Owls have amazing features for night hunting.", "The school bell rings at eight.", "Chickens lay eggs every morning.", "Pencils need to be sharpened."),
      r("Which sentence is the best topic sentence for these details?\n\n• Drums keep the beat.\n• Violins play the melody.\n• Trumpets add loud, bright notes.", "Each instrument in a band has a job.", "The river runs past our school.", "Trees lose their leaves in autumn.", "Bread is baked in a hot oven."),
      r("Which sentence is the best topic sentence for these details?\n\n• Pack a water bottle.\n• Bring a map of the trail.\n• Wear sturdy boots.", "Hikers should plan ahead before a trip.", "Our library got new carpet.", "Clouds float across the sky.", "Pine trees smell fresh."),
      r("Which sentence is the best topic sentence for these details?\n\n• Fold the paper in half.\n• Draw the wings and head.\n• Color your bird with markers.", "Making a paper bird is simple.", "Birds migrate south in winter.", "Our class has a reading corner.", "Snow fell on the playground."),
    ],
    [
      r("Which sentence is the best topic sentence for a paragraph about recess?", "Recess is my favorite part of the school day.", "Swings are fun to pump high.", "Our teacher has a red car.", "Lunch is served at noon."),
      r("Which sentence is the best topic sentence for a paragraph about a rainy day?", "A rainy day can be cozy and fun.", "Puddles are great for jumping.", "The grocery store was closed.", "Umbrellas come in many colors."),
      r("Which sentence is the best topic sentence for a paragraph about pets at home?", "Pets teach kids responsibility.", "Hamsters sleep during the day.", "The vet clinic is on Oak Street.", "Goldfish live in a glass bowl."),
      r("Which sentence is the best topic sentence for a paragraph about our class trip to the farm?", "Our class trip to the farm was amazing.", "The bus had blue seats.", "Farmers wake up very early.", "Cows say moo."),
      r("Which sentence is the best topic sentence for a paragraph about the ocean?", "The ocean covers most of our planet.", "Seashells can be very pretty.", "Dolphins are often seen in bays.", "Umbrellas keep us dry."),
      r("Which sentence is the best topic sentence for a paragraph about healthy breakfasts?", "A healthy breakfast gives lasting energy.", "Cereal boxes have toys inside.", "Eggs can be cooked in many ways.", "My breakfast was eaten at noon."),
      r("Which sentence is the best topic sentence for a paragraph about the library?", "Our library offers many ways to learn.", "The carpet is green and blue.", "Librarians wear name tags.", "Books have a title on the spine."),
      r("Which sentence is the best topic sentence for a paragraph about exercise?", "Exercise keeps our bodies strong and healthy.", "Running shoes have bright laces.", "Jump ropes are easy to carry.", "The gym opens at six in the morning."),
    ],
  ],
  [{ skill: 'commas', level: 1 }],
)

const opinionFact = rowSkill(
  'opinionFact',
  ['Opinion or fact?', 'Fact or opinion?', 'Reasons that support an opinion'],
  [
    [
      r("Which sentence is an opinion?", "Pizza is the best food ever.", "There are seven days in a week.", "Dogs have four legs.", "The sun rises in the east."),
      r("Which sentence is an opinion?", "Recess is the most fun part of school.", "Water freezes at 32 degrees Fahrenheit.", "Frogs lay eggs in water.", "A hexagon has six sides."),
      r("Which sentence is an opinion?", "That painting is the ugliest one here.", "Snakes do not have legs.", "Bees make honey.", "Earth orbits the sun."),
      r("Which sentence is an opinion?", "Soccer is more exciting than baseball.", "A year has twelve months.", "Lions are a type of cat.", "Trees need water to grow."),
      r("Which sentence is an opinion?", "Cats make better pets than hamsters.", "Hamsters are small rodents.", "Cats have whiskers.", "Hamsters sleep during the day."),
      r("Which sentence is an opinion?", "Winter is the coolest season of all.", "Winter comes after fall.", "Snow is frozen water.", "The year has four seasons."),
      r("Which sentence is an opinion?", "Chocolate cake is tastier than carrot cake.", "Cakes are often baked in an oven.", "Carrot cake has carrots in it.", "Cake batter contains flour."),
      r("Which sentence is an opinion?", "Reading is the best way to relax.", "Books have pages and a cover.", "Libraries have shelves of books.", "Authors write the stories in books."),
    ],
    [
      r("Which sentence is a fact?", "Oranges contain vitamin C.", "Oranges are the tastiest fruit.", "Oranges are too sour to eat.", "Oranges are the best snack ever."),
      r("Which sentence is a fact?", "The Pacific is the largest ocean.", "The ocean is too cold for swimming.", "The beach is the best place to visit.", "The ocean is very beautiful."),
      r("Which sentence is a fact?", "Spiders have eight legs.", "Spiders are scary creatures.", "Spiders are the most annoying bugs.", "Spiders are the coolest animals."),
      r("Which sentence is a fact?", "A mile is longer than a kilometer.", "Running a mile is hard work.", "Miles are the best way to measure.", "Walking is more fun than running."),
      r("Which sentence is a fact?", "The Earth travels around the sun.", "Lemons taste better than limes.", "Summer is the best season.", "Mondays are the worst days."),
      r("Which sentence is a fact?", "Plants need sunlight to grow.", "Hats look better than scarves.", "Puppies are much cuter than kittens.", "Playing outside is more fun than sleeping."),
      r("Which sentence is a fact?", "Thunder comes after lightning.", "Thunder is the loudest sound ever.", "Storms are boring to watch.", "Lightning is the prettiest sight."),
      r("Which sentence is a fact?", "The Nile is a river in Africa.", "The Nile is the most beautiful river.", "Rivers are better than lakes.", "Rivers are boring to visit."),
    ],
    [
      r("Opinion: We should adopt a dog from the shelter.\n\nWhich reason best supports this opinion?", "A shelter dog gets a loving home.", "Shelters are open on Mondays.", "The shelter is painted green.", "Dog food comes in big bags."),
      r("Opinion: Our class should have a class pet.\n\nWhich reason best supports this opinion?", "Pets teach us to care for living things.", "Fish swim in circles.", "Our room has twenty desks.", "Snails move very slowly."),
      r("Opinion: Everyone should wear a helmet when biking.\n\nWhich reason best supports this opinion?", "Helmets protect your head in a fall.", "Bikes have two wheels.", "Helmets come in many colors.", "The bike shop is on Main Street."),
      r("Opinion: We should plant more trees in our park.\n\nWhich reason best supports this opinion?", "Trees give shade and clean the air.", "The park gate is painted red.", "Benches are made of wood.", "Parks close at sunset."),
      r("Opinion: School should start later in the morning.\n\nWhich reason best supports this opinion?", "Kids need more sleep to learn well.", "The lunch menu has pizza today.", "Our school has a big gym.", "The cafeteria has blue tables."),
      r("Opinion: Libraries should stay open on Saturdays.\n\nWhich reason best supports this opinion?", "Families can read and learn together.", "Books have covers and pages.", "The librarian wears glasses.", "Libraries have a fish tank."),
      r("Opinion: Kids should drink more water.\n\nWhich reason best supports this opinion?", "Water helps your body work well.", "Water bottles come in many colors.", "Bottles are made of plastic.", "The water fountain is by the gym."),
      r("Opinion: Every town should have a community garden.\n\nWhich reason best supports this opinion?", "Gardens bring neighbors together.", "Garden tools are kept in sheds.", "Flowers bloom in the spring.", "Shovels are made of metal."),
    ],
  ],
  [{ skill: 'commas', level: 1 }],
)

const fragmentsRunOns = rowSkill(
  'fragmentsRunOns',
  ['Sentence or fragment?', 'Run-on or not?', 'Fix the run-on'],
  [
    [
      r("Which one is a complete sentence?", "The dog barked loudly.", "Ran to the store.", "The big brown box.", "After the rain stopped."),
      r("Which one is a complete sentence?", "Maya read three books this week.", "In the tall green tree.", "Playing with the ball all day.", "Because the bus was late."),
      r("Which one is a complete sentence?", "The baby giggled at the bubbles.", "Floated up into the sky.", "Under the big yellow umbrella.", "When the sun came out."),
      r("Which one is a complete sentence?", "We planted corn in the garden.", "Watering the new seeds each day.", "The tall corn stalks.", "Until the frost came."),
      r("Which one is a complete sentence?", "The cat slept on the warm rug.", "Near the big window.", "Jumped off the shelf quickly.", "Although it was raining."),
      r("Which one is a complete sentence?", "My brother fixed his bike himself.", "Covered in mud and leaves.", "Because the chain broke.", "Riding down the long hill."),
      r("Which one is a complete sentence?", "The students cheered for the winner.", "Every single student in the room.", "Went to the gym after lunch.", "Cheering loudly for the team."),
      r("Which one is a complete sentence?", "Snow covered the playground overnight.", "Frozen and white.", "While the children slept.", "Built a snowman by the fence."),
    ],
    [
      r("Which one is a run-on sentence?", "We went outside the sun was shining.", "We went outside, and the sun was shining.", "We went outside.", "Outside in the sunshine."),
      r("Which one is a run-on sentence?", "Lia baked bread she gave some to Mom.", "Lia baked bread and gave some to Mom.", "Lia baked bread.", "Baked bread for Mom."),
      r("Which one is a run-on sentence?", "Rain fell all day the streets were wet.", "Rain fell all day, and the streets were wet.", "Rain fell all day.", "Wet streets after the rain."),
      r("Which one is a run-on sentence?", "Tom likes soccer he plays every Saturday.", "Tom likes soccer, and he plays Saturdays.", "Tom plays soccer on Saturdays.", "Likes soccer very much."),
      r("Which one is a run-on sentence?", "The bell rang class began right away.", "The bell rang, and class began right away.", "The bell rang.", "Rang loudly at noon."),
      r("Which one is a run-on sentence?", "I finished my homework I went to bed.", "I finished my homework, then I went to bed.", "I finished my homework.", "After finishing my homework."),
      r("Which one is a run-on sentence?", "The river flooded the bridge washed away.", "The river flooded, and a bridge washed away.", "The river flooded the town.", "Washed away by the flood."),
      r("Which one is a run-on sentence?", "Sara sang the birds joined in.", "Sara sang, and the birds joined in.", "Sara sang a happy song.", "Sang with the birds."),
    ],
    [
      r("Which version fixes this run-on?\n\nThe storm was loud the power went out.", "The storm was loud, and the power went out.", "The storm was loud the power went out.", "The storm was loud. Because power failed.", "The storm, was loud the power went out."),
      r("Which version fixes this run-on?\n\nCarla loves art she paints every day.", "Carla loves art. She paints every day.", "Carla loves art she paints every day.", "Carla loves art. Paints every day.", "Carla loves art because paints every day."),
      r("Which version fixes this run-on?\n\nJake ran to the bus he missed the stop.", "Jake ran to the bus. He missed the stop.", "Jake ran to the bus he missed the stop.", "Jake ran to the bus. Missed the stop.", "Jake ran, to the bus he missed the stop."),
      r("Which version fixes this run-on?\n\nThe kids cleaned the room floor spotless.", "The kids cleaned. The floor was spotless.", "The kids cleaned the room floor spotless.", "The kids cleaned the room. Floor spotless.", "The kids cleaned room the floor spotless."),
      r("Which version fixes this run-on?\n\nWe ate pancakes we went to the park.", "We ate pancakes, then we went to the park.", "We ate pancakes we went to the park.", "We ate pancakes. Went to the park.", "We ate pancakes to the park went."),
      r("Which version fixes this run-on?\n\nThe dog wagged the cat hid under the bed.", "The dog wagged its tail. The cat hid under the bed.", "The dog wagged the cat hid under the bed.", "The dog wagged its tail. Hid under the bed.", "The dog wagged under the cat hid bed."),
      r("Which version fixes this run-on?\n\nEllen practiced hard she won the contest.", "Ellen practiced hard, so she won the contest.", "Ellen practiced hard she won the contest.", "Ellen practiced hard. Won the contest.", "Ellen practiced hard won the contest."),
      r("Which version fixes this run-on?\n\nWe got a new library the books are new.", "We got a new library. The books are new.", "We got a new library the books are new.", "We got a new library. Brand new books.", "We got, a new library the books are new."),
    ],
  ],
  [{ skill: 'conjunctions', level: 1 }],
)

// Capital letters are part of the mistakes here, so answers must match exactly.
const editRevise = rowSkill(
  'editRevise',
  ['Editing: find the correct sentence', 'Revising: fix the mistake', 'Revising: make it precise'],
  [
    [
      r("Which sentence has no mistakes?", "The kids played at the park.", "the kids played at the park.", "The kids played at the park", "The kids plays at the park."),
      r("Which sentence has no mistakes?", "My dad drives a blue truck.", "my dad drives a blue truck.", "My dad drive a blue truck.", "My dad drives a blue truck"),
      r("Which sentence has no mistakes?", "We saw three birds on the fence.", "We seen three birds on the fence.", "We saw three bird on the fence.", "we saw three birds on the fence."),
      r("Which sentence has no mistakes?", "Ms. Lee gave us a math quiz.", "Ms. Lee give us a math quiz.", "Ms. lee gave us a math quiz.", "Ms. Lee gave us a math quiz"),
      r("Which sentence has no mistakes?", "The dog wagged its tail happily.", "The dog wagged it's tail happily.", "The dog wag its tail happily.", "the dog wagged its tail happily."),
      r("Which sentence has no mistakes?", "Our class went to the zoo on Friday.", "Our class went to the Zoo on friday.", "Our class go to the zoo on Friday.", "Our class went to the zoo on friday."),
      r("Which sentence has no mistakes?", "I have two sisters and one brother.", "i have two sisters and one brother.", "I has two sisters and one brother.", "I have two sister and one brother."),
      r("Which sentence has no mistakes?", "The sun was warm, so we went swimming.", "The sun were warm, so we went swimming.", "the sun was warm, so we went swimming.", "The sun was warm, so we went swimming"),
    ],
    [
      r("Which is the correct revision?\n\nOriginal: Everyone in the class like pizza.", "Everyone in the class likes pizza.", "Everyone in the class like pizza.", "Everyone in the class are pizza.", "Everyone in the class liking pizza."),
      r("Which is the correct revision?\n\nOriginal: Me and Jake went to the store.", "Jake and I went to the store.", "Me and Jake went to the store.", "Jake and me went to the store.", "Jake and I goes to the store."),
      r("Which is the correct revision?\n\nOriginal: Yesterday we walk to school.", "Yesterday we walked to school.", "Yesterday we walk to school.", "Yesterday we will walked to school.", "Yesterday we walking to school."),
      r("Which is the correct revision?\n\nOriginal: The dogs barks at the mail carrier.", "The dogs bark at the mail carrier.", "The dogs barks at the mail carrier.", "The dog bark at the mail carrier.", "The dogs barking at the mail carrier."),
      r("Which is the correct revision?\n\nOriginal: She has went to the library twice.", "She has gone to the library twice.", "She has went to the library twice.", "She had went to the library twice.", "She gone to the library twice."),
      r("Which is the correct revision?\n\nOriginal: Their going to the beach tomorrow.", "They're going to the beach tomorrow.", "Their going to the beach tomorrow.", "There going to the beach tomorrow.", "Theyre going to the beach tomorrow."),
      r("Which is the correct revision?\n\nOriginal: The boy, which lost his hat, cried.", "The boy, who lost his hat, cried.", "The boy, which lost his hat, cried.", "The boy, whom lost his hat, cried.", "The boy, what lost his hat, cried."),
      r("Which is the correct revision?\n\nOriginal: I can not hardly wait for summer.", "I can hardly wait for summer.", "I can not hardly wait for summer.", "I cannot hardly wait for summer.", "I can hardly waited for summer."),
    ],
    [
      r("Which revision is the most precise?\n\nOriginal: The cake was really good.", "The cake was moist and sweet.", "The cake was really good, really good.", "The cake was good good.", "The cake was thing."),
      r("Which revision is the most precise?\n\nOriginal: The room was nice.", "The room was bright and tidy.", "The room was nice, very nice.", "The room was nice and nice.", "The room was a thing."),
      r("Which revision is the most precise?\n\nOriginal: The hike was kind of hard and long.", "The hike was long and steep.", "The hike was very very hard and long.", "The hike was hard and long and hard.", "The hike was stuff."),
      r("Which revision is the most precise?\n\nOriginal: The dog did a thing with the ball.", "The dog caught the ball in its mouth.", "The dog did a thing with the ball.", "The dog did stuff with the ball.", "The dog thing the ball."),
      r("Which revision is the most precise?\n\nOriginal: We went to a place that was pretty.", "We went to a beach with white sand.", "We went to a place that was pretty.", "We went to a pretty place, pretty.", "We went to a place, a pretty place."),
      r("Which revision is the most precise?\n\nOriginal: The teacher said some stuff about the test.", "The teacher explained how the test is graded.", "The teacher said some stuff about the test.", "The teacher said stuff, some stuff.", "The teacher said the test stuff."),
      r("Which revision is the most precise?\n\nOriginal: She got a lot of things at the store.", "She bought apples, bread, and milk.", "She got a lot of things at the store.", "She got lots and lots of things.", "She got things, things, and more things."),
      r("Which revision is the most precise?\n\nOriginal: It was a really big, big dog.", "It was an enormous dog.", "It was a really big, big dog.", "It was a big dog, big.", "It was a big, big, really big dog."),
    ],
  ],
  [{ skill: 'commas', level: 2 }],
  true,
)

const sentenceVariety = rowSkill(
  'sentenceVariety',
  ['Sentence variety: join with and, but, or', 'Sentence variety: compound sentences', 'Sentence variety: complex sentences'],
  [
    [
      r("Which sentence combines these two sentences correctly?\n\nThe sun came out. The rain stopped.", "The sun came out, and the rain stopped.", "The sun came out the rain stopped.", "The sun came out. Rain stopped.", "Came out the sun, the rain stopped."),
      r("Which sentence combines these two sentences correctly?\n\nLily likes apples. Lily likes pears.", "Lily likes apples and pears.", "Lily likes apples, pears.", "Lily likes apples. Pears.", "Lily, likes apples pears."),
      r("Which sentence combines these two sentences correctly?\n\nThe bus was late. We missed a song.", "The bus was late, so we missed a song.", "The bus was late, we missed a song.", "The bus was late. So missed a song.", "Late bus we missed a song."),
      r("Which sentence combines these two sentences correctly?\n\nBen packed a lunch. Ben forgot his bottle.", "Ben packed a lunch but forgot his bottle.", "Ben packed a lunch, Ben forgot his bottle.", "Ben packed a lunch forgot his bottle.", "Ben packed a lunch. Forgot his water bottle."),
      r("Which sentence combines these two sentences correctly?\n\nThe park was empty. It was raining.", "The park was empty because it was raining.", "The park was empty, it was raining.", "The park was empty raining.", "Empty park. Raining."),
      r("Which sentence combines these two sentences correctly?\n\nMia read a book. Mia took a nap.", "Mia read a book, and then she took a nap.", "Mia read a book took a nap.", "Mia read a book. Took a nap.", "Mia, read a book, took a nap"),
      r("Which sentence combines these two sentences correctly?\n\nThe soup was hot. It was delicious.", "The soup was hot and delicious.", "The soup was hot, it was delicious.", "The soup was hot delicious.", "Hot soup. It was delicious."),
      r("Which sentence combines these two sentences correctly?\n\nWe walked to the lake. We went swimming.", "We walked to the lake and went swimming.", "We walked to the lake, went swimming.", "We walked. To the lake went swimming.", "We walked to the lake we went swimming."),
    ],
    [
      r("Which one is a compound sentence (two complete ideas joined correctly)?", "The sky was dark, and the wind began to howl.", "The sky was dark and windy.", "The sky was dark, the wind began to howl.", "The dark sky, howling wind."),
      r("Which one is a compound sentence (two complete ideas joined correctly)?", "Jen opened the box, and a kitten jumped out.", "Jen opened the box.", "Jen opened the box a kitten jumped out.", "A kitten jumped out of the box."),
      r("Which one is a compound sentence (two complete ideas joined correctly)?", "We could walk home, or we could take the bus.", "We could walk home or take the bus.", "We could walk home, we could take the bus.", "Walking home or the bus."),
      r("Which one is a compound sentence (two complete ideas joined correctly)?", "It was late, so we ordered pizza.", "It was late and cold.", "It was late we ordered pizza.", "Late, so we ordered pizza."),
      r("Which one is a compound sentence (two complete ideas joined correctly)?", "Tom wanted to play, but it started to rain.", "Tom wanted to play outside.", "Tom wanted to play it started to rain.", "Wanted to play, but it rained."),
      r("Which one is a compound sentence (two complete ideas joined correctly)?", "The bell rang, and we rushed to class.", "The bell rang loudly.", "The bell rang we rushed to class.", "Rushed to class after the bell."),
      r("Which one is a compound sentence (two complete ideas joined correctly)?", "I like math, but I love science more.", "I like math and science.", "I like math I love science more.", "Like math, love science more."),
      r("Which one is a compound sentence (two complete ideas joined correctly)?", "Plants need water, and they need sun.", "The plants need water and sunlight.", "The plants need water, they need sunlight.", "Needing water and sunlight."),
    ],
    [
      r("Which one is a complex sentence (one main clause plus a dependent clause)?", "Although the trail was steep, we kept going.", "The trail was steep.", "The trail was steep, and we rested.", "Although the trail was steep."),
      r("Which one is a complex sentence (one main clause plus a dependent clause)?", "Because the bell rang, we ran outside.", "The students ran outside.", "The bell rang, and the students ran outside.", "Because the bell rang."),
      r("Which one is a complex sentence (one main clause plus a dependent clause)?", "When the movie ended, we went home.", "We went home.", "The movie ended, and we went home.", "When the movie ended."),
      r("Which one is a complex sentence (one main clause plus a dependent clause)?", "I brushed my teeth before I went to bed.", "I brushed my teeth.", "I brushed my teeth, and I went to bed.", "Before I went to bed."),
      r("Which one is a complex sentence (one main clause plus a dependent clause)?", "If it rains tomorrow, we will stay inside.", "It will rain tomorrow.", "It will rain, and we will stay inside.", "If it rains tomorrow."),
      r("Which one is a complex sentence (one main clause plus a dependent clause)?", "Since the store was closed, we walked home.", "We walked home.", "The store was closed, so we walked home.", "Since the store was closed."),
      r("Which one is a complex sentence (one main clause plus a dependent clause)?", "Lia smiled when she saw her friends.", "Lia smiled.", "Lia smiled, and she saw her friends.", "When she saw her friends."),
      r("Which one is a complex sentence (one main clause plus a dependent clause)?", "After the storm passed, the sun came out.", "The sun came out.", "The storm passed, and the sun came out.", "After the storm passed."),
    ],
  ],
  [{ skill: 'conjunctions', level: 2 }],
)

const introConclusion = rowSkill(
  'introConclusion',
  ['Introductions: hook the reader', 'Introductions: state the main idea', 'Conclusions: wrap it up'],
  [
    [
      r("Which sentence is the best opening for an essay about a trip to the aquarium?", "Have you touched a rubbery starfish?", "In conclusion, the aquarium was great.", "My brother spilled juice on the bus.", "Next, we looked at the penguins."),
      r("Which sentence is the best opening for an essay about learning to swim?", "Did you know your body floats?", "To sum up, swimming is a fun sport.", "Our class bought new towels.", "Then the coach blew the whistle."),
      r("Which sentence is the best opening for an essay about recycling?", "Imagine a town where every bottle is reused.", "Finally, recycling matters to all of us.", "Cars need gas to run.", "Paper is made from trees."),
      r("Which sentence is the best opening for an essay about a school science fair?", "What if your volcano really erupted?", "All in all, the fair was a success.", "The gym floor was shiny.", "Next, the judges walked around the tables."),
      r("Which sentence is the best opening for an essay about a family road trip?", "What is the best road trip you've taken?", "Thus, our road trip ended happily.", "Our dog wears a blue collar.", "Then we stopped for gas."),
      r("Which sentence is the best opening for an essay about a rainy day?", "Rain drums on the roof like a song.", "In the end, the rain stopped.", "Socks come in many colors.", "Last, we played a board game."),
      r("Which sentence is the best opening for an essay about the first snow of winter?", "Hush! Snow is falling softly outside.", "To conclude, snow is cold.", "The math test was on Monday.", "Then we built a snowman."),
      r("Which sentence is the best opening for an essay about saving money?", "Would you rather have one dollar now?", "In summary, saving money is smart.", "Coins come in several sizes.", "Next, we will talk about budgets."),
    ],
    [
      r("Which introduction best states the main idea of the essay?\n\nTopic: parks", "More parks help families stay healthy.", "Parks have swings, slides, and benches.", "In the end, parks are nice.", "My cousin lives in a city far away."),
      r("Which introduction best states the main idea of the essay?\n\nTopic: school uniforms", "School uniforms make mornings calmer.", "Uniforms are made of cotton and polyester.", "To wrap up, uniforms are okay.", "Our school bell rings at eight."),
      r("Which introduction best states the main idea of the essay?\n\nTopic: homework", "Homework helps students practice skills.", "Homework is written with pencils.", "Finally, I hope you enjoyed reading.", "The teacher collects papers on Friday."),
      r("Which introduction best states the main idea of the essay?\n\nTopic: recess", "Recess should be longer for kids.", "Recess lasts twenty minutes each day.", "Finally, recess is the best part of school.", "The playground has a big slide."),
      r("Which introduction best states the main idea of the essay?\n\nTopic: reading at home", "Reading at home builds strong skills.", "Books have chapters and pages.", "In closing, reading is fun.", "The library is on Oak Street."),
      r("Which introduction best states the main idea of the essay?\n\nTopic: bike helmets", "Every rider should wear a helmet.", "Helmets come in many colors.", "To sum up, helmets are important.", "The bike shop is closed on Sundays."),
      r("Which introduction best states the main idea of the essay?\n\nTopic: community gardens", "Community gardens bring neighbors together.", "Gardens need water and sunlight.", "Thanks for reading about gardens.", "Gardens are quiet places in the city."),
      r("Which introduction best states the main idea of the essay?\n\nTopic: animal shelters", "Shelters need volunteers to care for pets.", "Dogs and cats fill most shelters.", "In conclusion, shelters are good places.", "My favorite toy is a stuffed bear."),
    ],
    [
      r("Which sentence is the best conclusion for an essay arguing that the beach should stay clean?", "So let's keep our beach clean.", "Sea turtles can hold their breath for hours.", "Next, we should buy a new umbrella.", "Have you ever seen a crab on the sand?"),
      r("Which sentence is the best conclusion for an essay arguing that lunches should include fresh fruit?", "Schools should serve fresh fruit daily.", "Apples come in red and green.", "Lunch is served at noon.", "Our cafeteria has round tables."),
      r("Which sentence is the best conclusion for an essay arguing that everyone should learn to swim?", "Swimming can save lives, so learn to swim.", "Pools are often very chlorinated.", "The first swimmers wore wooden goggles.", "Next week, we start the science unit."),
      r("Which sentence is the best conclusion for an essay arguing that libraries are valuable?", "Libraries are worth protecting for everyone.", "The library has a red door.", "Librarians know many great stories.", "Books were once copied by hand."),
      r("Which sentence is the best conclusion for an essay arguing that our town needs a bike lane?", "A bike lane keeps riders safe, so build one.", "Bikes have two wheels and a seat.", "Next, the mayor will visit the school.", "Traffic lights are red, yellow, and green."),
      r("Which sentence is the best conclusion for an essay arguing that kids should get enough sleep?", "Sleep helps kids learn, so bedtime matters.", "Pillows come in many shapes.", "The alarm clock is on the desk.", "Dreams can be very strange."),
      r("Which sentence is the best conclusion for an essay arguing that recycling protects our planet?", "Recycling keeps our planet healthy.", "Paper cups are used at parties.", "My cousin has a blue bike.", "Trash trucks come on Tuesdays."),
      r("Which sentence is the best conclusion for an essay arguing that pets need regular checkups?", "Regular checkups keep pets healthy.", "Vets wear white coats.", "Cats sleep for many hours.", "The clinic has a fish tank in the lobby."),
    ],
  ],
  [{ skill: 'essayParts', level: 2 }],
)

const advancedPronouns = rowSkill(
  'advancedPronouns',
  ['Pronouns: who, which, and where', 'Pronouns: who or whom', 'Pronouns: possessive and reflexive'],
  [
    [
      r("The boy ___ lives next door has a dog.", "who", "which", "where", "whom"),
      r("The bike ___ I found was red.", "which", "who", "where", "whose"),
      r("Ms. Patel, ___ class is fun, is our teacher.", "whose", "who", "which", "whom"),
      r("The park ___ we played is closed today.", "where", "who", "whom", "whose"),
      r("The students ___ finished early got extra recess.", "who", "which", "whom", "whose"),
      r("Grandma gave me a scarf, ___ she knitted herself.", "which", "who", "whom", "where"),
      r("The woman ___ helped us find the library was very kind.", "who", "which", "whom", "whose"),
      r("The hikers, ___ had been walking for hours, finally rested.", "who", "which", "whose", "where"),
    ],
    [
      r("To ___ should I address the letter?", "whom", "who", "whose", "which"),
      r("The coach ___ we trust gave good advice.", "whom", "who", "whose", "which"),
      r("Maya is the friend about ___ I told you.", "whom", "who", "whose", "which"),
      r("The players ___ scored were thrilled.", "who", "whom", "whose", "which"),
      r("She was the friend with ___ I shared my secret.", "whom", "who", "whose", "which"),
      r("___ is that tall man?", "Who", "Whom", "Whose", "Which"),
      r("The author ___ wrote this book is famous.", "who", "whom", "whose", "which"),
      r("Ask the teacher ___ can help you with the project.", "who", "whom", "whose", "which"),
    ],
    [
      r("The red bike is ___.", "mine", "my", "me", "I"),
      r("We made the dinner ___.", "ourselves", "ours", "us", "we"),
      r("The book on the table is ___.", "hers", "her", "she", "herself"),
      r("The team celebrated ___ after the win.", "themselves", "theirs", "them", "they"),
      r("Those shoes are ___, not yours.", "theirs", "their", "them", "they"),
      r("I taught ___ how to juggle.", "myself", "me", "mine", "I"),
      r("___ jacket is on the chair.", "Her", "Hers", "She", "Herself"),
      r("The dog wagged ___ tail happily.", "its", "it's", "it", "itself"),
    ],
  ],
  [{ skill: 'pronouns', level: 3 }],
)

const perfectTenses = rowSkill(
  'perfectTenses',
  ['Present perfect: has or have', 'Past perfect: had', 'Irregular past participles'],
  [
    [
      r("She has ___ her homework.", "finished", "finish", "finishes", "finishing"),
      r("We have ___ to the zoo many times.", "gone", "go", "went", "going"),
      r("Dad has ___ the car this morning.", "washed", "wash", "washes", "washing"),
      r("They have ___ the new song already.", "learned", "learn", "learns", "learning"),
      r("I have ___ that movie twice.", "seen", "saw", "see", "seeing"),
      r("The baby has ___ taller this year.", "grown", "grow", "grew", "growing"),
      r("Ana has ___ the letter to her aunt.", "written", "write", "wrote", "writing"),
      r("The kids have ___ their rooms.", "cleaned", "clean", "cleaning", "cleans"),
    ],
    [
      r("By the time I got home, Dad had ___ dinner.", "made", "make", "makes", "making"),
      r("When we reached the lake, the boat had already ___.", "left", "leave", "leaves", "leaving"),
      r("The class had ___ the test before the bell rang.", "finished", "finish", "finishes", "finishing"),
      r("She had ___ the story twice before she understood it.", "read", "reads", "reading", "reader"),
      r("Before the rain started, we had ___ the garden.", "watered", "water", "watering", "waters"),
      r("The farmers had ___ the wheat before the storm hit.", "harvested", "harvest", "harvests", "harvesting"),
      r("By noon, the cat had ___ the entire bowl of milk.", "drunk", "drink", "drank", "drinking"),
      r("Nobody had ___ the answer until Lila spoke.", "known", "know", "knew", "knows"),
    ],
    [
      r("The vase had been ___ by the cat.", "broken", "broke", "break", "breaking"),
      r("We have ___ this song many times.", "sung", "sang", "sing", "singing"),
      r("My sister has ___ a prize for her painting.", "won", "win", "wins", "winning"),
      r("The coach has ___ the team to the playoffs.", "taken", "took", "take", "taking"),
      r("I have ___ my keys somewhere.", "lost", "lose", "loses", "losing"),
      r("Has anyone ___ the way to the library?", "found", "find", "finds", "finding"),
      r("The leaves have ___ from the trees.", "fallen", "fell", "fall", "falling"),
      r("We had ___ our breakfast before the bell.", "eaten", "ate", "eat", "eating"),
    ],
  ],
  [{ skill: 'verbTense', level: 3 }],
)

const paragraphUnity = rowSkill(
  'paragraphUnity',
  ['Paragraphs: stay on topic', 'Paragraphs: put steps in order', 'Paragraphs: end strong'],
  [
    [
      r("Which sentence does NOT belong in this paragraph?\n\nDogs need daily walks to stay healthy. Many dogs enjoy playing fetch in the park. A cozy dog bed keeps them warm at night. My cousin bought a new pair of sneakers.", "My cousin bought a new pair of sneakers.", "Dogs need daily walks to stay healthy.", "Many dogs enjoy playing fetch in the park.", "A cozy dog bed keeps them warm at night."),
      r("Which sentence does NOT belong in this paragraph?\n\nVolcanoes form when magma rises. Some erupt with huge clouds of ash. Lava can flow for many miles. Our pizza was cold when it arrived.", "Our pizza was cold when it arrived.", "Volcanoes form when magma rises.", "Some erupt with huge clouds of ash.", "Lava can flow for many miles."),
      r("Which sentence does NOT belong in this paragraph?\n\nRecycling saves trees and water. Glass bottles can be melted and remade. Paper can be recycled many times. The bus driver wore a blue hat today.", "The bus driver wore a blue hat today.", "Recycling saves trees and water.", "Glass bottles can be melted and remade.", "Paper can be recycled many times."),
      r("Which sentence does NOT belong in this paragraph?\n\nBees collect nectar from flowers. Honeybees live in large colonies. Bees are important pollinators. My favorite cereal has marshmallows in it.", "My favorite cereal has marshmallows in it.", "Bees collect nectar from flowers.", "Honeybees live in large colonies.", "Bees are important pollinators."),
      r("Which sentence does NOT belong in this paragraph?\n\nThe party started at two o'clock. We played games in the backyard. Everyone sang and ate chocolate cake. The rocket launch was on Tuesday.", "The rocket launch was on Tuesday.", "The party started at two o'clock.", "We played games in the backyard.", "Everyone sang and ate chocolate cake."),
      r("Which sentence does NOT belong in this paragraph?\n\nThe library has thousands of books. Students can borrow five books. A quiet room is open for studying. Dinosaurs lived millions of years ago.", "Dinosaurs lived millions of years ago.", "The library has thousands of books.", "Students can borrow five books.", "A quiet room is open for studying."),
      r("Which sentence does NOT belong in this paragraph?\n\nDeserts get very little rain. Cacti store water in their thick stems. Some deserts are hot by day, cold by night. I like to eat fresh strawberries with cream.", "I like to eat fresh strawberries with cream.", "Deserts get very little rain.", "Cacti store water in their thick stems.", "Some deserts are hot by day, cold by night."),
      r("Which sentence does NOT belong in this paragraph?\n\nExercise makes your heart stronger. Walking every day is a simple habit. Stretching helps your muscles stay flexible. The museum opened a new dinosaur hall.", "The museum opened a new dinosaur hall.", "Exercise makes your heart stronger.", "Walking every day is a simple habit.", "Stretching helps your muscles stay flexible."),
    ],
    [
      r("Which sentence fits between these two?\n\nFirst, we planted the seeds. ___ Finally, we watered them every day.", "Next, we covered them with soil.", "The school bus was yellow.", "Our class visited the zoo.", "Our teacher likes music."),
      r("Which sentence fits between these two?\n\nFirst, I packed my backpack. ___ Finally, I walked to the bus stop.", "Next, I put on my shoes.", "Dogs can run very fast.", "Our library is on Main Street.", "The moon was bright last night."),
      r("Which sentence fits between these two?\n\nFirst, the seed sprouted. ___ Finally, the tree grew tall.", "Then, small leaves opened on the stem.", "The river was very cold.", "Elephants have big ears.", "Our bus was late today."),
      r("Which sentence fits between these two?\n\nFirst, Dad filled the tub with warm water. ___ Finally, we splashed in the bubbles.", "Next, we poured in the bubble soap.", "Our cat likes to nap in the sun.", "The school play starts at seven.", "Bread is baked in an oven."),
      r("Which sentence fits between these two?\n\nFirst, the caterpillar hatched from an egg. ___ Finally, it flew away as a butterfly.", "Then, it spun a chrysalis.", "Trains travel on steel tracks.", "The ocean is very salty.", "Our class sang a song."),
      r("Which sentence fits between these two?\n\nFirst, we measured the wood. ___ Finally, we painted the shelf.", "Next, we cut the wood into four pieces.", "Our neighbor has a big dog.", "Snow falls more in winter.", "The library closes at five."),
      r("Which sentence fits between these two?\n\nFirst, Ana chose a book from the shelf. ___ Finally, she returned it to the library.", "Then, she read every page carefully.", "Bananas are yellow fruit.", "The dog barked at the mailman.", "Lightning flashed across the sky."),
      r("Which sentence fits between these two?\n\nFirst, the team gathered at the field. ___ Finally, they cheered for the win.", "Next, they ran through the warm-up drills.", "Pizza is my favorite lunch.", "Our school has a green roof.", "Fish swim in the deep ocean."),
    ],
    [
      r("Which sentence is the best last sentence?\n\nDogs need daily walks. They also need fresh water and healthy food.", "A dog needs care every single day.", "Cats like to sleep in sunny spots.", "The park has a new swing set.", "Have you ever seen a dog do a backflip?"),
      r("Which sentence is the best last sentence?\n\nRecess gives students time to move. It also helps them focus in class afterward.", "Recess is an important part of school.", "Our lunch was pizza today.", "The gym has a basketball hoop.", "Teachers wear comfortable shoes."),
      r("Which sentence is the best last sentence?\n\nBees carry pollen from flower to flower. Many of our fruits depend on this work.", "Bees help grow the fruit we eat.", "Flowers come in many bright colors.", "Honey is sold in small jars.", "The bee hive was painted yellow."),
      r("Which sentence is the best last sentence?\n\nThe bakery opened at six this morning. Customers lined up for fresh bread and muffins.", "The bakery was busy from the very start.", "The bakery is painted blue.", "Bread can be frozen for later.", "Do you like muffins with blueberries?"),
      r("Which sentence is the best last sentence?\n\nOur town planted fifty new trees this spring. The shade will help keep the streets cool.", "Planting trees makes our town greener.", "Trees have green leaves in summer.", "The bus stop moved last week.", "My favorite tree is the maple."),
      r("Which sentence is the best last sentence?\n\nReading every night helps kids build vocabulary. It also makes them better writers.", "Nightly reading makes kids stronger readers.", "Books have colorful covers.", "The library closes at eight.", "Some authors write in cafes."),
      r("Which sentence is the best last sentence?\n\nSolar panels turn sunlight into electricity. They can lower a family's power bill.", "Solar panels can save energy and money.", "The sun is a bright star.", "Panels are often painted white.", "Electric cars are very quiet."),
      r("Which sentence is the best last sentence?\n\nOur class built a model city with cardboard and paint. Everyone worked together.", "Working together built a great city.", "Cardboard comes from trees.", "The paint dried very quickly.", "Our teacher drinks tea every morning."),
    ],
  ],
  [{ skill: 'essayParts', level: 2 }],
)

// Capital letters are the whole point here, so answers must match exactly.
const capitalizationAdv = rowSkill(
  'capitalizationAdv',
  ['Capitalization: titles', 'Capitalization: proper nouns', 'Capitalization: quotations'],
  [
    [
      r("Which title is written correctly?", "Charlotte's Web", "charlotte's web", "Charlotte's web", "Charlotte'S Web"),
      r("Which title is written correctly?", "The Lion and the Mouse", "the Lion and the Mouse", "The lion and the Mouse", "The Lion And The Mouse"),
      r("Which title is written correctly?", "Where the Wild Things Are", "where the wild things are", "Where The Wild Things Are", "Where the wild things are"),
      r("Which title is written correctly?", "My Day at the Zoo", "My day at the zoo", "My Day At The Zoo", "my Day at the Zoo"),
      r("Which title is written correctly?", "The Magic Tree House", "The magic tree house", "the Magic Tree House", "The Magic tree House"),
      r("Which title is written correctly?", "Stone Soup", "stone soup", "Stone soup", "Stone SOUP"),
      r("Which title is written correctly?", "Little Women", "little women", "Little women", "LITTLE women"),
      r("Which title is written correctly?", "Bridge to Terabithia", "bridge to Terabithia", "Bridge To Terabithia", "Bridge to terabithia"),
    ],
    [
      r("Which sentence is capitalized correctly?", "Our trip to Mount Rainier was fun.", "Our trip to mount rainier was fun.", "Our trip to Mount rainier was fun.", "our trip to Mount Rainier was fun."),
      r("Which sentence is capitalized correctly?", "Dr. Chen teaches at Lakeside School.", "dr. Chen teaches at Lakeside School.", "Dr. Chen teaches at Lakeside school.", "Dr. Chen teaches at lakeside School."),
      r("Which sentence is capitalized correctly?", "On Monday, we ate at Joe's Diner.", "on Monday, we ate at Joe's Diner.", "On monday, we ate at Joe's Diner.", "On Monday, we ate at joe's diner."),
      r("Which sentence is capitalized correctly?", "Grandma flew to Japan in March.", "grandma flew to Japan in March.", "Grandma flew to japan in March.", "Grandma flew to Japan in march."),
      r("Which sentence is capitalized correctly?", "The Atlantic Ocean is large.", "The atlantic Ocean is large.", "The Atlantic ocean is large.", "the Atlantic Ocean is large."),
      r("Which sentence is capitalized correctly?", "Mom works for Acme Bakery.", "mom works for Acme Bakery.", "Mom works for acme bakery.", "Mom works for Acme bakery."),
      r("Which sentence is capitalized correctly?", "Our class read Charlotte's Web in May.", "Our class read charlotte's web in May.", "Our class read Charlotte's web in May.", "Our class read Charlotte's Web in may."),
      r("Which sentence is capitalized correctly?", "Lila moved from Texas to Florida.", "lila moved from Texas to Florida.", "Lila moved from texas to Florida.", "Lila moved from Texas to florida."),
    ],
    [
      r("Which sentence is capitalized correctly?", 'She said, "Let\'s go now."', 'She said, "let\'s go now."', 'she said, "Let\'s go now."', 'She said, "Let\'s Go now."'),
      r("Which sentence is capitalized correctly?", 'Mom asked, "Did you feed the dog?"', 'Mom asked, "did you feed the dog?"', 'mom asked, "Did you feed the dog?"', 'Mom asked, "Did You feed the dog?"'),
      r("Which sentence is capitalized correctly?", 'The coach yelled, "Run faster!"', 'The coach yelled, "run faster!"', 'the coach yelled, "Run faster!"', 'The coach yelled, "Run Faster!"'),
      r("Which sentence is capitalized correctly?", 'Grandpa said, "The apples are ripe."', 'Grandpa said, "the apples are ripe."', 'grandpa said, "The apples are ripe."', 'Grandpa said, "The Apples are ripe."'),
      r("Which sentence is capitalized correctly?", 'Ben whispered, "I see a bird."', 'Ben whispered, "i see a bird."', 'ben whispered, "I see a bird."', 'Ben whispered, "I See a bird."'),
      r("Which sentence is capitalized correctly?", 'Our teacher said, "Please sit down."', 'Our teacher said, "please sit down."', 'Our teacher said, "Please Sit down."', 'our teacher said, "Please sit down."'),
      r("Which sentence is capitalized correctly?", 'The sign read, "Stop here."', 'The sign read, "stop here."', 'the sign read, "Stop here."', 'The sign read, "STOP here."'),
      r("Which sentence is capitalized correctly?", 'Lily asked, "Can we go to the park?"', 'Lily asked, "can we go to the park?"', 'lily asked, "Can we go to the park?"', 'Lily asked, "Can we go to the Park?"'),
    ],
  ],
  [{ skill: 'commas', level: 1 }],
  true,
)

// --- Exports -----------------------------------------------------------------------------------

// (The tone skill is written but left out: tone is a judgment call, and a child shouldn't be marked wrong on one.)
const summarizing = rowSkill(
  'summarize',
  ['Summarizing: short stories', 'Summarizing: facts and events'],
  [
    [
      r(P("Tom's kite got stuck in a tree. He tried to jump up and grab it, but he was too short. His sister Ana got a long stick and pulled the kite down.", "Which sentence is the best summary?"), "Tom's kite got stuck in a tree, and Ana helped get it down.", "Tom is too short to jump very high.", "Ana likes to carry long sticks.", "Kites are fun to fly on windy days."),
      r(P("Mia planted a seed in a pot. Every day she gave it water and put it by the window. After two weeks, a small green plant poked out of the dirt.", "Which sentence is the best summary?"), "Mia took care of a seed, and it grew into a small plant.", "Mia has a pot by her window.", "Mia grew a big tree in two weeks.", "Plants are better than toys."),
      r(P("The class went to the zoo. They saw lions, monkeys, and a tall giraffe. At lunch, a monkey grabbed a boy's sandwich, and everyone laughed.", "Which sentence is the best summary?"), "A class visited the zoo, saw animals, and a monkey took a sandwich.", "The giraffe at the zoo was very tall.", "The class went to the park for a picnic.", "Lions are the best animals at the zoo."),
      r(P("Sam's dog Rex was lost. Sam put up signs all over town. Two days later, a girl found Rex and brought him home.", "Which sentence is the best summary?"), "Sam's lost dog Rex was found after Sam put up signs.", "Sam made signs and put them up.", "Rex ran away because he was hungry.", "Dogs are better pets than cats."),
      r(P("It rained all morning, so the soccer game was moved to the gym. The team played inside instead. They won, 3 to 2.", "Which sentence is the best summary?"), "The soccer game moved inside because of rain, and the team won.", "The gym has a big, shiny floor.", "The team lost the game, 3 to 2.", "Soccer is played with a round ball."),
      r(P("Lena baked cookies for the bake sale. She mixed the dough, rolled it out, and cut it into stars. All the cookies sold in one hour.", "Which sentence is the best summary?"), "Lena baked star cookies, and they all sold at the bake sale.", "Lena mixed dough in a big bowl.", "Lena ate all of the cookies herself.", "Cookies taste best when they are warm."),
      r(P("A little bird fell out of its nest. Max found it and put it in a box with a soft cloth. A week later, the bird could fly, and Max set it free.", "Which sentence is the best summary?"), "Max helped a bird that fell, then let it go when it could fly.", "Max put a soft cloth in a box.", "Max kept the bird as a pet forever.", "Birds build nests out of sticks."),
      r(P("Eli lost his library book. He looked under his bed, in his bag, and in the car. Finally, he found it in the dog's bed.", "Which sentence is the best summary?"), "Eli lost his library book and found it after looking in many places.", "Eli has a dog with a bed.", "Eli forgot to go to the library.", "Library books are fun to read."),
    ],
    [
      r(P("Bees live in hives. Worker bees collect nectar from flowers and turn it into honey. Bees also carry pollen from flower to flower, which helps plants make seeds.", "Which sentence is the best summary?"), "Bees make honey and help plants make seeds by carrying pollen.", "Bees live together in hives.", "Bees are the only insects that visit flowers.", "Honey is sweeter than sugar."),
      r(P("The water cycle moves water around Earth. The sun heats water in oceans and lakes, and it rises as vapor. High in the sky, the vapor cools and forms clouds. Then the water falls back down as rain or snow.", "Which sentence is the best summary?"), "In the water cycle, water rises as vapor, forms clouds, and falls as rain or snow.", "The sun heats the oceans and lakes.", "Clouds are made of smoke from factories.", "Rain is better than snow."),
      r(P("Long ago, people used horses to send mail across the country. Riders passed letters from one stop to the next. Later, trains and planes carried mail much faster.", "Which sentence is the best summary?"), "Mail once traveled by horse, and later trains and planes made it faster.", "Riders stopped at many places along the way.", "Planes carried mail before horses did.", "Letters are nicer than text messages."),
      r(P("Penguins cannot fly, but they are strong swimmers. Their wings work like flippers in the water. Their thick feathers and a layer of fat keep them warm in the cold.", "Which sentence is the best summary?"), "Penguins cannot fly, but they swim well and stay warm in the cold.", "Penguins have thick feathers.", "Penguins fly south every winter.", "Penguins are cuter than other birds."),
      r(P("A volcano erupts when hot, melted rock called magma pushes up from deep inside Earth. The magma flows out as lava, and ash shoots into the air. After the lava cools, it turns into hard rock.", "Which sentence is the best summary?"), "A volcano erupts when magma rises and flows out as lava, which cools into rock.", "Ash can shoot high into the air.", "Lava is cold when it comes out of a volcano.", "Volcanoes are the scariest thing on Earth."),
      r(P("Our class made a recycling plan. We put bins for paper and cans in the hall. Each week, two students empty the bins. After a month, our school threw away much less trash.", "Which sentence is the best summary?"), "A class started a recycling plan, and the school made less trash.", "Two students empty the bins each week.", "The class stopped using paper completely.", "Recycling is boring work."),
      r(P("Many frogs start life as tadpoles in water. Tadpoles have tails and breathe through gills. As they grow, they grow legs, lose their tails, and get lungs so they can live on land.", "Which sentence is the best summary?"), "Frogs begin as tadpoles and change as they grow so they can live on land.", "Tadpoles have tails.", "Frogs are born with legs and lungs.", "Frogs jump higher than rabbits."),
      r(P("Maya wanted to buy a bike that cost $60. She walked dogs for her neighbors and saved $5 each time. After twelve walks, she had enough money and bought the bike.", "Which sentence is the best summary?"), "Maya earned money walking dogs until she could buy a bike.", "The bike Maya wanted cost $60.", "Maya's neighbors gave her a bike as a gift.", "Walking dogs is easier than riding bikes."),
    ],
  ],
  [{ skill: 'mainIdea', level: 2 }],
)

export const READING_U2: Skill[] = [summarizing, storyElements, literaryTexts, informationalTexts, idioms, wordGroups, synonymsAntonyms, homographs, affixedWords]
export const WRITING_U2: Skill[] = [topicSentences, opinionFact, fragmentsRunOns, editRevise, sentenceVariety, introConclusion, advancedPronouns, perfectTenses, paragraphUnity, capitalizationAdv]

const e = (grade: number, category: string): IxlRef => ({ subject: 'ela', grade, category })

/** One IXL topic per level (index 0 = level 1), keyed "<subject>.<skill id>". Grades never go down by level. */
export const LANGUAGE_U2_IXL: Record<string, IxlRef[]> = {
  'reading.summarize': [e(4, 'Summarizing'), e(4, 'Summarizing')],
  'reading.storyElements': [e(4, 'Story elements'), e(5, 'Story elements'), e(5, 'Story elements')],
  'reading.literaryTexts': [e(3, 'Literary texts: level 1'), e(4, 'Literary texts: level 1'), e(5, 'Literary texts: level 2')],
  'reading.informationalTexts': [e(3, 'Informational texts: level 1'), e(4, 'Informational texts: level 2'), e(5, 'Informational texts: level 2')],
  'reading.idioms': [e(3, 'Idioms'), e(5, 'Idioms and adages'), e(5, 'Idioms and adages')],
  'reading.wordGroups': [e(3, 'Categories'), e(4, 'Categories'), e(5, 'Categories')],
  'reading.synonymsAntonyms': [e(3, 'Synonyms and antonyms'), e(4, 'Synonyms and antonyms'), e(5, 'Synonyms and antonyms')],
  'reading.homographs': [e(5, 'Homophones and homonyms'), e(5, 'Homophones and homonyms'), e(5, 'Homophones and homonyms')],
  'reading.affixedWords': [e(3, 'Affixed words'), e(4, 'Affixed words'), e(5, 'Prefixes and suffixes')],
  'writing.topicSentences': [e(3, 'Topic sentences'), e(3, 'Topic sentences'), e(3, 'Topic sentences')],
  'writing.opinionFact': [e(3, 'Opinion writing'), e(3, 'Opinion writing'), e(3, 'Opinion writing')],
  'writing.fragmentsRunOns': [e(3, 'Sentences, fragments, and run-ons'), e(4, 'Sentences, fragments, and run-ons'), e(5, 'Sentences, fragments, and run-ons')],
  'writing.editRevise': [e(3, 'Editing and revising'), e(4, 'Editing and revising'), e(5, 'Editing and revising')],
  'writing.sentenceVariety': [e(3, 'Sentence variety'), e(4, 'Sentence variety'), e(5, 'Sentence variety')],
  'writing.introConclusion': [e(4, 'Introductions and conclusions'), e(4, 'Introductions and conclusions'), e(4, 'Introductions and conclusions')],
  'writing.advancedPronouns': [e(5, 'Pronouns'), e(5, 'Pronouns'), e(5, 'Pronouns')],
  'writing.perfectTenses': [e(5, 'Verb tense'), e(5, 'Verb tense'), e(5, 'Verb tense')],
  'writing.paragraphUnity': [e(5, 'Organizing writing'), e(5, 'Organizing writing'), e(5, 'Organizing writing')],
  'writing.capitalizationAdv': [e(3, 'Capitalization'), e(4, 'Capitalization'), e(5, 'Capitalization')],
}
