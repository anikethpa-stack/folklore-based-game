require('dotenv').config();
const mongoose = require('mongoose');
const Game = require('./models/Game');
const GameVariant = require('./models/GameVariant');

const gamesData = [
  {
    name: 'Aadu Puli Aatam',
    slug: 'aadu-puli-aatam',
    alternateNames: [
      'Goats and Tigers',
      'Pulijudam (Telugu)',
      'Puli Meka (Andhra Pradesh & Karnataka)',
      'Adu Huli (Kannada)',
      'Huli Ghaata',
    ],
    category: 'Hunt & Strategy',
    origin: 'Southern India (Tamil Nadu, Karnataka, Andhra Pradesh, Telangana)',
    estimatedAge:
      'Medieval to Early Modern Southern India (game boards preserved as graffiti on medieval and post-medieval temple pavements; living oral rules recorded 19th–20th century)',
    players: { min: 2, max: 2, recommended: 2 },
    difficulty: 'Intermediate',
    description:
      'A traditional South Indian asymmetric hunt game pitting three predatory tigers against a collective herd of fifteen agile goats on an interconnected 23-vertex triangular grid.',
    historicalBackground:
      'Aadu Puli Aatam belongs to the indigenous South Asian hunt game family (tiger and goat games). Game diagrams matching the 23-vertex triangular layout are preserved as vernacular graffiti incised into granite flagstones, plinths, and steps of several South Indian temple and pilgrimage sites, including Chamundi Hill in Mysore, monuments across Hampi (Vijayanagara), and various Chola and Nayaka period temple courtyards.\n\nBoard game historians—notably H. J. R. Murray (1952) and Dr. Irving Finkel (2007)—distinguish between the age of the temple architecture and the age of the game incisions: the boards were carved informally over centuries by pilgrims, resting devotees, soldiers, and temple guards. Historically, the game served as a popular village pastime played on verandahs (thinnai) and open ground, serving as a tactical allegory for collective defence against individual predatory power.',
    culturalSignificance:
      'Traditionally played using pebbles, tamarind seeds (puliyankottai), or broken pottery shards. Folklorists note that elders used the game to demonstrate tactical principles of coordination, positional patience, and mutual protection, contrasting with the symmetrical warfare of chess-like games.',
    isReconstruction: false,
    reconstructionNotes:
      'The 3-Tiger, 15-Goat rule set represents a living, unbroken oral and ethnographic tradition cross-referenced across Tamil Nadu and Karnataka, matching documentation in Murray (1952) and Bell (1979).',
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
        publisher: 'Clarendon Press / Oxford University Press',
        notes: 'Authoritative comparative survey of Asian hunt games (pp. 98–112), cataloging Indian tiger and goat game layouts and capture rules.',
        citationType: 'Academic Publication',
        url: 'https://archive.org/details/AHistoryOfBoardGamesOtherThanChess',
      },
      {
        title: 'Board and Table Games from Many Civilizations',
        author: 'R. C. Bell',
        year: '1979',
        publisher: 'Dover Publications (Original Oxford Univ. Press 1960)',
        notes: 'Classifies Aadu Puli Aatam among asymmetrical hunt games with mathematical analysis of tiger capture avenues (Vol. 1, pp. 78–82).',
        citationType: 'Academic Publication',
      },
      {
        title: 'Board Games in the Art and Archaeology of South India',
        author: 'R. Vasantha',
        year: '2003',
        publisher: 'Journal of the Oriental Institute, M.S. University of Baroda',
        notes: 'Detailed archaeological documentation of game graffiti carved on temple pavements and rock faces in Karnataka and Tamil Nadu, analyzing pilgrim graffiti practices.',
        citationType: 'Archaeological',
      },
      {
        title: 'Ancient Board Games in Perspective',
        author: 'Irving L. Finkel (Editor)',
        year: '2007',
        publisher: 'British Museum Press, London',
        notes: 'Examines South Asian traditional board game lineages, cautioning against over-dating graffiti boards relative to parent temple structures.',
        citationType: 'Academic Publication',
        url: 'https://www.britishmuseum.org/collection',
      },
    ],
    status: 'active',
    badgeTheme: 'terracotta',
  },
  {
    name: 'Pallanguzhi',
    slug: 'pallanguzhi',
    alternateNames: [
      'Ali Guli Mane (Karnataka)',
      'Vamana Guntalu (Andhra Pradesh & Telangana)',
      'Kuzhipara (Kerala)',
      'Pallankuzhi (Tamil Nadu)',
      'Olinda Keliya (Sri Lanka)',
    ],
    category: 'Mancala & Sowing',
    origin: 'Southern India & Sri Lanka (Tamil Nadu, Karnataka, Kerala, Northern Sri Lanka)',
    estimatedAge:
      'Pre-modern Southern Asia (2×7 pit wooden mancala documented widely in pre-colonial folklore and museum collections; living multi-lap sowing tradition)',
    players: { min: 2, max: 2, recommended: 2 },
    difficulty: 'Beginner',
    description:
      'A classical South Indian 14-pit mancala sowing game played on a carved two-row wooden board using cowrie shells or tamarind seeds, featuring multi-lap continuous distribution and tactical empty-pit captures.',
    historicalBackground:
      'Pallanguzhi (from Tamil "pal" meaning many, and "kuzhi" meaning pits) is the premier South Indian representative of the global Mancala family. The game is traditionally played on a carved wooden board featuring two parallel rows of seven pits each, often crafted from teak, rosewood, or brass in the ornamental shape of a fish, boat, or folding chest.\n\nRows of 14 cup-marks matching Pallanguzhi boards are frequently documented on rock surfaces, temple verandas, and rock-cut cave monuments across Tamil Nadu, Karnataka, and Kerala. However, board game scholars (Alexander de Voogt, 1997) emphasize that while rock-cut hollows indicate long-standing regional familiarity with counting and sowing games, the specific multi-lap rules and capture conventions are preserved primarily through rich domestic oral and folkloric transmission rather than epigraphical rule texts.',
    culturalSignificance:
      'Celebrated as a domestic social game played predominantly by women and children, Pallanguzhi was culturally renowned for developing rapid mental arithmetic, memory, and estimation without formal written calculation. It was traditionally played during auspicious evenings and festivals such as Vaikunta Ekadasi to encourage communal wakefulness. Cowrie shells (chozhi) were valued as auspicious symbols of maritime trade, fertility, and prosperity.',
    isReconstruction: false,
    reconstructionNotes:
      'The 5-seed-per-pit rules (Ainthu Kaa) and 6-seed rules (Aaru Kaa / Kaashi) represent living oral traditions verified by contemporary folkloric field studies in Tamil Nadu and Karnataka.',
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
        publisher: 'New Century Book House, Chennai (ISBN: 978-8123409191)',
        notes: 'Comprehensive ethnographical study of traditional Tamil folk games, detailing rules for Ainthu Kaa (5-seed), Kaashi (6-seed), and Pasu accumulation captures.',
        citationType: 'Academic Publication',
      },
      {
        title: 'Mancala Board Games',
        author: 'Alexander J. de Voogt',
        year: '1997',
        publisher: 'British Museum Press / Research School CNWS, Leiden (ISBN: 978-9073782709)',
        notes: 'Scholarly comparative analysis of Asian and African mancala games, detailing 14-pit multi-lap distribution mechanics in Southern India and Sri Lanka.',
        citationType: 'Academic Publication',
      },
      {
        title: 'Traditional Board Games of Karnataka',
        author: 'Mysore Heritage Trust',
        year: '2012',
        publisher: 'Regional Cultural Research Centre, Mysore',
        notes: 'Field survey of Ali Guli Mane variations across Karnataka households, documenting tamarind seed play conventions and pit terminology.',
        citationType: 'Ethnographic',
      },
      {
        title: 'Ethnography and Decorative Arts Collection (Traditional Wooden & Brass Mancala Boards)',
        author: 'Government Museum, Chennai',
        year: '1999',
        publisher: 'Department of Museums, Government of Tamil Nadu',
        notes: 'Catalog of 18th- and 19th-century carved fish-shaped and folding wooden Pallanguzhi boards from Thanjavur and Chettinad.',
        citationType: 'Museum Catalog',
        url: 'https://www.chennaimuseum.org',
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
    isPlayable: true,
    status: 'playable',
    ruleOverrides: {
      tigerCount: 4,
      goatCount: 16,
      initialTigerNodes: [0, 1, 2, 3],
      winCaptureThreshold: 5,
    },
    differences: [
      'Starts with 4 Tigers instead of 3 (initial setup at vertices 0, 1, 2, 3 across apex and Tier 1).',
      'Goat herd expanded from 15 to 16 agile goats.',
      'Goats must completely encircle and immobilize all 4 tigers to claim victory.',
      'Tigers win if they capture 5 or more goats.',
    ],
    rulesSummary:
      'Played on the 23-point pyramid grid with 4 apex tigers and 16 goats. The additional tiger tightens spatial margins, creating an aggressive, high-pressure opening.',
    historicalNotes:
      'Documented by H. J. R. Murray (1952) and R. C. Bell (1979) in Rayalaseema and Deccan villages as a faster, high-stakes tactical hunt.',
    references: [
      { title: 'Deccan Folk Traditions and Pastimes', author: 'S. Ramana Rao', year: '1989' },
      { title: 'A History of Board-Games Other than Chess', author: 'H. J. R. Murray', year: '1952' },
    ],
  },
  {
    gameSlug: 'aadu-puli-aatam',
    variantName: 'Puli Meka (2-Tiger Pedagogical Variant)',
    slug: 'puli-meka-2-tigers',
    region: 'Karnataka & Rayalaseema',
    isPlayable: false,
    status: 'informational',
    ruleOverrides: {},
    differences: [
      'Uses only 2 tigers and 8 goats for introductory tutorial play.',
      'Played on a simplified 13-point triangular grid.',
      'Historically used to instruct novice players before advancing to 3-tiger games.',
    ],
    rulesSummary:
      'A transitional beginner variation designed for teaching children positional trapping fundamentals.',
    historicalNotes:
      'Observed in village courtyards as an instructional stepping stone; preserved here for historical documentation only.',
    references: [
      { title: 'Traditional Board Games of Karnataka', author: 'Mysore Heritage Trust', year: '2012' },
    ],
  },
  {
    gameSlug: 'pallanguzhi',
    variantName: 'Kaashi (Raja-Rani 6-Seed Variant)',
    slug: 'kaashi-raja-rani',
    region: 'Chettinad & Central Tamil Nadu',
    isPlayable: true,
    status: 'playable',
    ruleOverrides: {
      seedsPerPit: 6,
      totalSeeds: 84,
      pasuRule: true,
    },
    differences: [
      'Each of the 14 pits begins with 6 cowrie shells instead of 5 (84 seeds total on board).',
      'Pasu (Cow) Capture Rule: Whenever any pit accumulates exactly 4 seeds during multi-lap sowing, the pit owner immediately captures those 4 seeds into their store.',
      'Empty-pit cascading capture remains active when the final seed lands and next pit is empty.',
      'Player with the highest shell tally out of 84 wins the match.',
    ],
    rulesSummary:
      'Features 6 initial seeds per pit and the classical Pasu (4-seed accumulation) dividend capture mechanic, simulating mercantile capital accumulation.',
    historicalNotes:
      'Popularized in merchant households of Chettinad; documented by Dr. V. Balambal (2005) and Meenakshi Meyyappan (2008).',
    references: [
      { title: 'Folk Games of Tamil Nadu', author: 'Dr. V. Balambal', year: '2005' },
      { title: 'Chettinad Heritage and Domestic Pastimes', author: 'Meenakshi Meyyappan', year: '2008' },
    ],
  },
  {
    gameSlug: 'pallanguzhi',
    variantName: 'Daalu (Sinhalese Royal 36-Pit Mancala)',
    slug: 'daalu-royal-court',
    region: 'Kandy, Sri Lanka',
    isPlayable: false,
    status: 'informational',
    ruleOverrides: {},
    differences: [
      'Played on an expansive 3-row, 36-pit ceremonial carved wooden table.',
      'Played by 4 royal participants in cross-table teams.',
      'Complex multi-directional sowing rituals documented in courtly chronicles.',
    ],
    rulesSummary:
      'Large-format royal court mancala played by Kandyan nobility with complex 4-player team sowing.',
    historicalNotes:
      'Recorded in royal archives and preserved in the Colombo National Museum; documented for historical scholarship.',
    references: [
      { title: 'Mancala Board Games', author: 'Alexander J. de Voogt', year: '1997' },
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
      isPlayable: v.isPlayable !== undefined ? v.isPlayable : true,
      status: v.status || 'playable',
      ruleOverrides: v.ruleOverrides || {},
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

