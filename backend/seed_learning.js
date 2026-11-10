require('dotenv').config();
const mongoose = require('mongoose');
const Game = require('./models/Game');
const Tutorial = require('./models/Tutorial');
const FAQ = require('./models/FAQ');

const faqsData = [
  {
    question: 'What is FolkBoard and what is its mission?',
    answer:
      'FolkBoard is a digital revival sanctuary for ancient, forgotten, and underrepresented traditional board games. Our mission is to preserve cultural heritage by providing accurate historical documentation, step-by-step interactive learning, and an authoritative server-validated gaming platform.',
    category: 'General',
    difficulty: 'All',
    order: 1,
  },
  {
    question: 'How does FolkBoard ensure historical accuracy?',
    answer:
      'We strictly distinguish documented archaeological and epigraphical facts from modern reconstructed rules. All historical claims are accompanied by citations from verified sources, such as Archaeological Survey of India (ASI) temple floor surveys and academic publications by scholars like H.J.R. Murray.',
    category: 'General',
    difficulty: 'All',
    order: 2,
  },
  {
    question: 'How do Tigers capture Goats in Aadu Puli Aatam?',
    answer:
      'A Tiger can capture an adjacent Goat by leaping over it in a straight line into an immediately vacant vertex. Leaps cannot be made over empty spaces, multiple goats, or other tigers.',
    category: 'Aadu Puli Aatam',
    gameSlug: 'aadu-puli-aatam',
    difficulty: 'Beginner',
    order: 3,
  },
  {
    question: 'Can Goats move along the lines during the initial Placement Phase?',
    answer:
      'No. In traditional rules, during Phase 1 (Placement Phase), goats can only be entered onto vacant vertices one-by-one. Once all 15 goats have entered the board, Phase 2 (Movement Phase) begins, allowing goats to step along connected lines.',
    category: 'Aadu Puli Aatam',
    gameSlug: 'aadu-puli-aatam',
    difficulty: 'Beginner',
    order: 4,
  },
  {
    question: 'How can Goats defeat the Tigers?',
    answer:
      'Goats win by surrounding and immobilizing all 3 tigers simultaneously so that no tiger has a legal move (neither a 1-step walk nor a jump capture). Patience and formation building are the keys to victory.',
    category: 'Aadu Puli Aatam',
    gameSlug: 'aadu-puli-aatam',
    difficulty: 'Intermediate',
    order: 5,
  },
  {
    question: 'What is the multi-lap cascading mechanic in Pallanguzhi?',
    answer:
      'When sowing cowrie shells counter-clockwise, if your last shell lands in a pit that already contains shells, you do not stop. You scoop up all shells in that pit (including the one you just dropped) and continue distributing counter-clockwise until you land in an empty pit or trigger a capture.',
    category: 'Pallanguzhi',
    gameSlug: 'pallanguzhi',
    difficulty: 'Beginner',
    order: 6,
  },
  {
    question: 'How does an Empty Pit Capture work in Pallanguzhi?',
    answer:
      'If your last shell lands and the immediate next pit is completely empty, you tap the empty pit and capture all shells in the pit directly following it! If the pit after that is also empty, you claim a cascading double-capture.',
    category: 'Pallanguzhi',
    gameSlug: 'pallanguzhi',
    difficulty: 'Intermediate',
    order: 7,
  },
  {
    question: 'What is the "Explain My Move" feature?',
    answer:
      'Instead of simply rejecting an illegal action with a generic "Invalid Move" banner, FolkBoard\'s backend rules engine analyzes the exact geometry of your attempt and explains why it violates traditional rules (e.g. non-adjacent path, jumping over empty space, or moving out of turn).',
    category: 'Technical & Caching',
    difficulty: 'Beginner',
    order: 8,
  },
  {
    question: 'What happens if I accidentally refresh my browser during a match?',
    answer:
      'Your match state is stored authoritatively in MongoDB. Thanks to our hybrid caching and silent JWT refresh mechanism, your active match state is immediately retrieved from the server without losing a single move.',
    category: 'Technical & Caching',
    difficulty: 'Beginner',
    order: 9,
  },
];

async function seedLearning() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Learning Seed] Connected to MongoDB.');

    await FAQ.deleteMany({});
    await Tutorial.deleteMany({});
    console.log('[Learning Seed] Cleared FAQ and Tutorial collections.');

    // Insert FAQs
    const insertedFaqs = await FAQ.insertMany(faqsData);
    console.log(`[Learning Seed] Inserted ${insertedFaqs.length} FAQs.`);

    // Locate games to link tutorials
    const aaduGame = await Game.findOne({ slug: 'aadu-puli-aatam' });
    const palGame = await Game.findOne({ slug: 'pallanguzhi' });

    if (aaduGame) {
      await Tutorial.create({
        gameId: aaduGame._id,
        gameSlug: 'aadu-puli-aatam',
        title: 'Mastering the Hunt: Aadu Puli Aatam',
        difficulty: 'Beginner',
        summary:
          'Learn the tactical principles of the ancient Indian tiger hunt game across 4 guided steps.',
        steps: [
          {
            stepNumber: 1,
            title: 'The 23-Point Pyramid Grid & Asymmetric Sides',
            instruction: 'Observe the board: 3 fierce tigers are placed on the apex and upper tiers.',
            explanation:
              'The board is an inverted triangle connected by radial, diagonal, and horizontal lines. As the Goat player, your mission is not to fight the tigers directly, but to coordinate 15 goats into an inescapable barricade.',
            boardSnapshot: {
              nodes: [
                'tiger', 'tiger', null, 'tiger',
                null, null, null, null, null,
                null, null, null, null, null, null, null,
                null, null, null, null, null, null, null,
              ],
              turn: 'goats',
              phase: 'placement',
              goatsPlaced: 0,
            },
            expectedAction: { actionType: 'place', to: 2 },
            hint: 'Tap on empty point 2 (center of Tier 1) to place your first scout goat.',
          },
          {
            stepNumber: 2,
            title: 'Beware the Tiger Jump Capture',
            instruction: 'Watch how tigers leap over isolated goats.',
            explanation:
              'A Tiger can leap over an adjacent Goat along any straight connected line, landing on the vacant vertex behind it. Never leave a goat unprotected in front of an empty landing point.',
            boardSnapshot: {
              nodes: [
                'tiger', null, 'goat', null,
                null, null, null, null, null,
                null, null, null, null, null, null, null,
                null, null, null, null, null, null, null,
              ],
              turn: 'tigers',
              phase: 'placement',
              goatsPlaced: 1,
            },
            expectedAction: { actionType: 'jump', from: 0, to: 6 },
            hint: 'The tiger at the apex can jump over the goat at point 2 and land at vertex 6.',
          },
          {
            stepNumber: 3,
            title: 'Forming Protective Pairs',
            instruction: 'Place goats adjacent to each other to prevent jumps.',
            explanation:
              'Tigers cannot jump over two goats in a row! By grouping your goats in pairs and lines, you create impenetrable walls that tigers cannot leap across.',
            boardSnapshot: {
              nodes: [
                'tiger', 'goat', 'goat', null,
                null, null, null, null, null,
                null, null, null, null, null, null, null,
                null, null, null, null, null, null, null,
              ],
              turn: 'goats',
              phase: 'placement',
              goatsPlaced: 2,
            },
            expectedAction: { actionType: 'place', to: 5 },
            hint: 'Support your front line by placing another goat at point 5.',
          },
        ],
      });
      console.log('[Learning Seed] Inserted Aadu Puli Aatam interactive tutorial.');
    }

    if (palGame) {
      await Tutorial.create({
        gameId: palGame._id,
        gameSlug: 'pallanguzhi',
        title: 'The Art of Sowing: Pallanguzhi',
        difficulty: 'Beginner',
        summary:
          'Discover the cascading rhythms of South Indian 14-pit mancala through hands-on distribution.',
        steps: [
          {
            stepNumber: 1,
            title: 'Starting the Sowing Distribution',
            instruction: 'Select a non-empty pit on your bottom row (Pits 1–7).',
            explanation:
              'Each pit begins with 5 cowrie shells. When you lift shells from a pit, you sow them one-by-one counter-clockwise around the oval board.',
            boardSnapshot: {
              pits: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
              turn: 'player1',
              stores: { player1: 0, player2: 0 },
            },
            expectedAction: { actionType: 'sow', from: 0 },
            hint: 'Tap Pit 1 (bottom left) to start your sowing lap.',
          },
          {
            stepNumber: 2,
            title: 'Cascading Multi-Lap Chains',
            instruction: 'Notice how occupied landing pits trigger continuous sowing.',
            explanation:
              'If your final shell drops into a pit that already has shells, you pick up that entire pit and continue distributing. This cascading chain can circle the board multiple times in a single turn!',
            boardSnapshot: {
              pits: [0, 6, 6, 6, 6, 6, 5, 5, 5, 5, 5, 5, 5, 5],
              turn: 'player1',
              stores: { player1: 0, player2: 0 },
            },
            expectedAction: { actionType: 'sow', from: 1 },
            hint: 'Select Pit 2 to see another cascading distribution unfold.',
          },
        ],
      });
      console.log('[Learning Seed] Inserted Pallanguzhi interactive tutorial.');
    }

    await mongoose.connection.close();
    console.log('[Learning Seed] Seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('[Learning Seed Error]', error);
    process.exit(1);
  }
}

seedLearning();

