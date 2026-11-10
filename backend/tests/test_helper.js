/**
 * FolkBoard Test Helper & Environment Harness
 * Provides isolated MongoDB test database connection, ephemeral server, and clean teardown.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const app = require('../app');

// Models
const Game = require('../models/Game');
const GameVariant = require('../models/GameVariant');
const FAQ = require('../models/FAQ');
const User = require('../models/User');
const Match = require('../models/Match');

// ISOLATED Test Database: Never touches 'folkboard' development database
const TEST_MONGO_URI =
  process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/folkboard_test';

let server = null;
let serverPort = null;
let serverBaseUrl = null;

/**
 * Seed initial games & variants into the isolated test database
 */
const seedTestCatalog = async () => {
  await Game.deleteMany({});
  await GameVariant.deleteMany({});

  const games = await Game.insertMany([
    {
      name: 'Aadu Puli Aatam',
      slug: 'aadu-puli-aatam',
      category: 'Hunt & Strategy',
      origin: 'Southern India',
      difficulty: 'Intermediate',
      description: 'Asymmetric 3-tiger 15-goat hunt game on 23-vertex grid.',
      historicalBackground: 'Graffiti game boards incised on temple stone by pilgrims and devotees.',
      rules: {
        objective: 'Tigers capture 5 goats; Goats immobilize all tigers.',
        setup: 'Board starts with tigers on apex/wings.',
        turnStructure: 'Goats move first, strict alternating turns.',
        movement: 'Placement of 15 goats, then movement along lines.',
        capturing: 'Tigers jump over goats into empty adjacent vertices.',
        winningCondition: 'Tigers win at 5 captures; Goats win when tigers have 0 moves.',
      },
      boardConfiguration: {
        boardType: 'Inverted Triangular Grid',
        pointCount: 23,
      },
      status: 'active',
      badgeTheme: 'terracotta',
    },
    {
      name: 'Pallanguzhi',
      slug: 'pallanguzhi',
      category: 'Mancala & Sowing',
      origin: 'Southern India & Sri Lanka',
      difficulty: 'Beginner',
      description: '14-pit wooden mancala with multi-lap cascading distribution.',
      historicalBackground: 'Classical counting and sowing game with domestic oral transmission.',
      rules: {
        objective: 'Capture the highest tally of cowrie shells.',
        setup: '5 shells per pit in 14 pits.',
        turnStructure: 'Alternating turns.',
        movement: 'Counter-clockwise multi-lap sowing.',
        capturing: 'Empty pit capture.',
        winningCondition: 'Highest shell tally wins.',
      },
      boardConfiguration: {
        boardType: 'Two-Row Wooden Trough',
        pitCount: 14,
      },
      status: 'active',
      badgeTheme: 'forest',
    },
  ]);

  const gameMap = {
    'aadu-puli-aatam': games[0]._id,
    'pallanguzhi': games[1]._id,
  };

  await GameVariant.insertMany([
    {
      gameId: gameMap['aadu-puli-aatam'],
      variantName: 'Pulijudam (4-Tiger Deccan Variant)',
      slug: 'pulijudam-4-tigers',
      region: 'Andhra Pradesh & Telangana',
      isPlayable: true,
      status: 'playable',
      ruleOverrides: { tigerCount: 4, goatCount: 16, initialTigerNodes: [0, 1, 2, 3], winCaptureThreshold: 5 },
      differences: ['4 tigers at 0, 1, 2, 3', '16 goats'],
      rulesSummary: 'Aggressive 4-tiger Deccan variant.',
      references: [{ title: 'Deccan Folk Traditions', author: 'S. Ramana Rao', year: '1989' }],
    },
    {
      gameId: gameMap['aadu-puli-aatam'],
      variantName: 'Puli Meka (2-Tiger Pedagogical Variant)',
      slug: 'puli-meka-2-tigers',
      region: 'Karnataka',
      isPlayable: false,
      status: 'informational',
      differences: ['2 tigers, 8 goats for beginners'],
      rulesSummary: 'Introductory children stepping-stone variation.',
      references: [{ title: 'Games of Karnataka', author: 'Mysore Heritage Trust', year: '2012' }],
    },
    {
      gameId: gameMap['pallanguzhi'],
      variantName: 'Kaashi (Raja-Rani 6-Seed Variant)',
      slug: 'kaashi-raja-rani',
      region: 'Chettinad',
      isPlayable: true,
      status: 'playable',
      ruleOverrides: { seedsPerPit: 6, totalSeeds: 84, pasuRule: true },
      differences: ['6 seeds per pit', 'Pasu 4-seed accumulation capture'],
      rulesSummary: '6-seed Chettinad variant with Pasu dividend capture.',
      references: [{ title: 'Folk Games of Tamil Nadu', author: 'Dr. V. Balambal', year: '2005' }],
    },
  ]);

  // Seed baseline FAQs
  await FAQ.deleteMany({});
  await FAQ.insertMany([
    {
      question: 'How does FolkBoard preserve traditional Indian games?',
      answer: 'By combining authoritative mathematical game engines, verified historical citations, and responsive interactive boards.',
      category: 'General',
      difficulty: 'All',
      order: 1,
      status: 'published',
    },
    {
      question: 'How many goats must tigers capture to win in Aadu Puli Aatam?',
      answer: 'In the standard 3-tiger game, tigers achieve victory by capturing 5 goats.',
      category: 'Aadu Puli Aatam',
      gameSlug: 'aadu-puli-aatam',
      difficulty: 'Beginner',
      order: 2,
      status: 'published',
    },
    {
      question: 'Can a tiger jump over two goats in a single move?',
      answer: 'No, a tiger may only jump over a single adjacent goat along a straight connecting line into an empty vertex.',
      category: 'Game Rules',
      gameSlug: 'aadu-puli-aatam',
      difficulty: 'Intermediate',
      order: 3,
      status: 'published',
    },
    {
      question: 'What happens when you drop the last counter into an empty pit in Pallanguzhi?',
      answer: 'If the pit immediately following that empty pit contains counters, you capture all counters in that pit and the pit directly opposite it.',
      category: 'Pallanguzhi',
      gameSlug: 'pallanguzhi',
      difficulty: 'Intermediate',
      order: 4,
      status: 'published',
    },
  ]);
};

/**
 * Setup isolated test environment
 */
const setupTestEnv = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_MONGO_URI);
  }

  // Seed baseline catalogue
  await seedTestCatalog();

  // Start ephemeral server on random available port
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      serverPort = server.address().port;
      serverBaseUrl = `http://127.0.0.1:${serverPort}/api`;
      resolve();
    });
  });

  return { server, serverPort, serverBaseUrl };
};

/**
 * Clean teardown of isolated test environment
 */
const teardownTestEnv = async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
    server = null;
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

/**
 * Clean all user & match data between tests
 */
const cleanUserAndMatchData = async () => {
  await User.deleteMany({});
  await Match.deleteMany({});
};

/**
 * Perform a test HTTP request
 */
const request = async (endpoint, options = {}) => {
  const url = `${serverBaseUrl}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  return {
    status: res.status,
    headers: res.headers,
    data,
  };
};

module.exports = {
  TEST_MONGO_URI,
  setupTestEnv,
  teardownTestEnv,
  cleanUserAndMatchData,
  request,
  getBaseUrl: () => serverBaseUrl,
};
