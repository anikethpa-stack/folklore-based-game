require('dotenv').config();
const mongoose = require('mongoose');
const Game = require('./models/Game');
const GameVariant = require('./models/GameVariant');

const gamesData = [
  {
    name: 'Aadu Puli Aatam',
    slug: 'aadu-puli-aatam',
    alternateNames: ['Goats and Tigers', 'Pulijudam', 'Puli Meka', 'Adu Huli'],
    category: 'Hunt & Strategy',
    origin: 'Southern India (Tamil Nadu, Karnataka, Andhra Pradesh)',
    estimatedAge: 'Circa 12th–14th Century CE (Over 800 years documented)',
    players: { min: 2, max: 2, recommended: 2 },
    difficulty: 'Intermediate',
    description:
      'An ancient asymmetric hunt game pitting three apex tigers against a collective herd of fifteen agile goats on an inverted triangular 23-point grid.',
    historicalBackground:
      'Aadu Puli Aatam is an indigenous Indian strategic board game with widespread archaeological evidence across Southern India. Game diagrams identical to modern Aadu Puli boards have been discovered incised directly into the granitic courtyards and stone floors of Chola and Vijayanagara period temples, including monuments at Mahabalipuram, the Brihadisvara temple complex at Thanjavur, and the Chamundeshwari temple hill in Karnataka.\n\nHistorically, the game served not merely as a pastime but as an allegory for strategic warfare: illustrating how a smaller, coordinated collective (the goats) can trap and neutralize vastly more powerful individual aggressors (the tigers). Unlike symmetrical games like chess, the mathematical asymmetry creates intense tactical depth.',
    culturalSignificance:
      'Traditionally played outdoors on courtyard verandas, village pyols (thinnai), and temple plinths, using pebbles and tamarind seeds as markers. In rural lore, elders used the game to impart lessons in unity, collective defence, and positional patience.',
    isReconstruction: false,
    reconstructionNotes:
      'The 3-Tiger, 15-Goat rules represent a living, unbroken oral and recorded tradition, cross-referenced with ethnographical studies by H.J.R. Murray.',
    boardConfiguration: {
      boardType: 'Inverted Triangular Grid with Cross Rays',
      pointCount: 23,
      pitCount: 0,
      counterType: 'Tigers (Red/Orange stones) and Goats (Cream pebbles)',
      layoutDescription:
        'A main triangle with apex point at the top, divided by two internal vertical lines and two horizontal cross tiers, connected to a lower four-point rectangular base extension, creating 23 interconnected vertices.',
    },
    rules: {
      objective:
        'Tigers win by capturing at least 5 goats so the herd cannot complete a blockade. Goats win by surrounding all three tigers so none have a legal move.',
      setup:
        'The game begins with the board empty of goats. The Tiger player places the first tiger at the apex vertex. The remaining two tigers enter on subsequent turns.',
      turnStructure:
        'Play alternates strictly between Goat and Tiger. Goats always take the first move.',
      movement:
        'Phase 1 (Placement): Goats enter the board one-by-one on any vacant vertex. Until all 15 goats have entered, goats cannot move along the lines. Tigers may move 1 step along any connected line or jump to capture.\nPhase 2 (Movement): Once all 15 goats are on the board, goats may move 1 step along any connected line to an adjacent vacant vertex.',
      capturing:
        'Only Tigers can capture. A Tiger captures an adjacent Goat by leaping over it along a straight line into an immediately vacant vertex. Leaps cannot be made over empty spaces, multiple goats, or other tigers.',
      winningCondition:
        'Tigers Win: If 5 or more goats are captured, the remaining goats cannot effectively trap the tigers.\nGoats Win: If all 3 tigers are completely immobilized with zero legal moves.',
    },
    references: [
      {
        title: 'A History of Board-Games Other than Chess',
        author: 'H. J. R. Murray',
        year: '1952',
        citationType: 'Academic Publication',
        url: 'https://archive.org/details/AHistoryOfBoardGamesOtherThanChess',
      },
      {
        title: 'Board and Table Games from Many Civilizations',
        author: 'R. C. Bell',
        year: '1979',
        citationType: 'Academic Publication',
      },
      {
        title: 'Epigraphical and Courtyard Surveys of Tamil Temples',
        author: 'Archaeological Survey of India',
        year: '1984',
        citationType: 'Archaeological',
      },
    ],
    status: 'active',
    badgeTheme: 'terracotta',
  },
  {
    name: 'Pallanguzhi',
    slug: 'pallanguzhi',
    alternateNames: ['Ali Guli Mane', 'Vamana Guntalu', 'Kuzhipara', 'Pallankuzhi'],
    category: 'Mancala & Sowing',
    origin: 'Southern India & Sri Lanka (Tamil Nadu, Karnataka, Kerala, Northern Sri Lanka)',
    estimatedAge: '1st Millennium CE (Over 1,000 years documented)',
    players: { min: 2, max: 2, recommended: 2 },
    difficulty: 'Beginner',
    description:
      'A classical 14-pit mancala game played on a carved wooden board using cowrie shells or tamarind seeds, featuring cascading multi-lap distribution and tactical capture mechanics.',
    historicalBackground:
      'Pallanguzhi is one of the oldest counting games in the world, belonging to the global Mancala family. Mentioned in classical Tamil and Kannada folklore, the game was historically carved from solid rosewood or teakwood into ornate fish or boat shapes with brass hinges.\n\nArcheologists have recorded Pallanguzhi pit boards carved directly into rock-cut caves and temple pavements across South India. The game was especially celebrated as a social pastime among women and children, revered for honing rapid mental arithmetic, memory retention, and hand-eye coordination without reliance on literacy or written notation.',
    culturalSignificance:
      'Often played during cultural gatherings and festivals such as Vaikunta Ekadasi to maintain wakefulness through the night. Cowrie shells (chozhi) were considered auspicious symbols of prosperity and maritime trade.',
    isReconstruction: false,
    reconstructionNotes:
      'The 5-seed-per-pit rules (Ainthu Kaa) are the most widely attested living tradition across rural and urban Tamil Nadu.',
    boardConfiguration: {
      boardType: 'Two-Row Wooden Mancala Trough',
      pointCount: 0,
      pitCount: 14,
      counterType: 'Cowrie shells (Chozhi) or Tamarind seeds (Puliyankottai)',
      layoutDescription:
        'A wooden board with two horizontal rows of seven pits each, facing the two players. Each player owns the row of seven pits immediately in front of them.',
    },
    rules: {
      objective:
        'Capture the maximum number of cowrie shells by the end of the round through strategic sowing and exploiting empty pits.',
      setup:
        'Each of the 14 pits is seeded with exactly 5 shells (70 shells total on the board). Each player controls the 7 pits on their side.',
      turnStructure:
        'Players alternate turns. On their turn, a player chooses any non-empty pit on their side of the board to begin sowing.',
      movement:
        'The player picks up all shells from the selected pit and distributes them one-by-one counter-clockwise into subsequent pits.\nMulti-lap sowing: If the last shell lands in a pit containing other shells, the player scoops up all shells in that pit (including the one just placed) and continues distributing counter-clockwise.',
      capturing:
        'Empty Pit Capture: If the last shell lands and the immediate next pit is completely empty, the player taps the empty pit and captures all shells in the pit directly after the empty one. If that subsequent pit also leads into another empty pit, a cascading double-capture is awarded.',
      winningCondition:
        'When no shells remain on the board or no legal moves can be made, players count their captured shells. The player with the highest shell tally wins the match.',
    },
    references: [
      {
        title: 'Folk Games of Tamil Nadu',
        author: 'Dr. V. Balambal',
        year: '2005',
        citationType: 'Academic Publication',
      },
      {
        title: 'Mancala Board Games',
        author: 'Alexander J. de Voogt',
        year: '1997',
        citationType: 'Academic Publication',
      },
      {
        title: 'Traditional Board Games of Karnataka',
        author: 'Mysore Heritage Trust',
        year: '2012',
        citationType: 'Ethnographic',
      },
    ],
    status: 'active',
    badgeTheme: 'forest',
  },
];

const variantsData = [
  {
    gameSlug: 'aadu-puli-aatam',
    variantName: 'Pulijudam (4-Tiger Deccan Variant)',
    slug: 'pulijudam-4-tigers',
    region: 'Andhra Pradesh & Telangana',
    differences: [
      'Starts with 4 Tigers instead of 3.',
      'Goat herd expanded from 15 to 16 goats.',
      'Tigers start at 4 predetermined vertices along the central spine.',
    ],
    rulesSummary:
      'Played on the same 23-point grid, but the inclusion of an extra tiger tightens the spatial margin for the goats, demanding immediate perimeter containment.',
    historicalNotes:
      'Frequently referenced in folklore across Rayalaseema and the Deccan plateau, noted for intense, faster-paced tactical engagements.',
    references: [
      { title: 'Deccan Folk Traditions and Pastimes', author: 'S. Ramana Rao', year: '1989' },
    ],
  },
  {
    gameSlug: 'pallanguzhi',
    variantName: 'Kaashi (Raja-Rani 6-Seed Variant)',
    slug: 'kaashi-raja-rani',
    region: 'Chettinad & Central Tamil Nadu',
    differences: [
      'Each pit begins with 6 seeds instead of 5 (84 seeds total).',
      'The central pit on each side is designated as the "Kaashi" or royal sanctuary.',
      'Four seeds accumulating in any pit during sowing can be immediately claimed as a "Pasu" (cow) capture.',
    ],
    rulesSummary:
      'Features intermediate storehouse creation where players claim royal pits that generate continuous dividends during ongoing play.',
    historicalNotes:
      'Popularized in merchant households of Chettinad as a playful simulation of investment, storehouse accumulation, and compound returns.',
    references: [
      { title: 'Chettinad Heritage and Domestic Pastimes', author: 'Meenakshi Meyyappan', year: '2008' },
    ],
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Seed] Connected to MongoDB.');

    // Clear existing games and variants to avoid duplicate collisions
    await Game.deleteMany({});
    await GameVariant.deleteMany({});
    console.log('[Seed] Cleared existing Game and GameVariant collections.');

    // Insert Games
    const insertedGames = await Game.insertMany(gamesData);
    console.log(`[Seed] Successfully inserted ${insertedGames.length} games.`);

    // Map inserted games by slug to associate variants
    const gameMap = {};
    insertedGames.forEach((g) => {
      gameMap[g.slug] = g._id;
    });

    // Prepare and insert variants
    const preparedVariants = variantsData.map((v) => ({
      gameId: gameMap[v.gameSlug],
      variantName: v.variantName,
      slug: v.slug,
      region: v.region,
      differences: v.differences,
      rulesSummary: v.rulesSummary,
      historicalNotes: v.historicalNotes,
      references: v.references,
    }));

    const insertedVariants = await GameVariant.insertMany(preparedVariants);
    console.log(`[Seed] Successfully inserted ${insertedVariants.length} regional variants.`);

    await mongoose.connection.close();
    console.log('[Seed] Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
}

seedDatabase();

