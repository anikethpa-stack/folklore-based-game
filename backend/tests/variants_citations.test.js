const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const {
  setupTestEnv,
  teardownTestEnv,
  request,
} = require('./test_helper');
const aadupuliEngine = require('../services/aadupuliEngine');
const pallanguzhiEngine = require('../services/pallanguzhiEngine');
const Game = require('../models/Game');
const GameVariant = require('../models/GameVariant');

describe('Backend Game Variants & Bibliographic Citations Tests', () => {
  before(async () => {
    await setupTestEnv();
  });

  after(async () => {
    await teardownTestEnv();
  });

  it('1. Initializes Pulijudam 4-tiger variant with 4 apex tigers and 16-goat capacity', async () => {
    const pulijudamVariant = await GameVariant.findOne({ slug: 'pulijudam-4-tigers' });
    assert.ok(pulijudamVariant, 'Expected Pulijudam variant in database');

    const initialState = aadupuliEngine.getInitialState(
      pulijudamVariant.slug,
      pulijudamVariant.ruleOverrides
    );

    assert.strictEqual(initialState.tigerCount, 4);
    assert.strictEqual(initialState.totalGoats, 16);
    assert.strictEqual(initialState.winCaptureThreshold, 5);
    assert.strictEqual(initialState.variant, 'pulijudam-4-tigers');

    // Verify tigers at vertices 0, 1, 2, 3
    assert.strictEqual(initialState.nodes[0], 'tiger');
    assert.strictEqual(initialState.nodes[1], 'tiger');
    assert.strictEqual(initialState.nodes[2], 'tiger');
    assert.strictEqual(initialState.nodes[3], 'tiger');
    assert.strictEqual(initialState.turn, 'goats');
    assert.strictEqual(initialState.phase, 'placement');
  });

  it('2. Initializes Kaashi variant with 6 seeds per pit (84 total) and Pasu dividend rule', async () => {
    const kaashiVariant = await GameVariant.findOne({ slug: 'kaashi-raja-rani' });
    assert.ok(kaashiVariant, 'Expected Kaashi variant in database');

    const initialState = pallanguzhiEngine.getInitialState(
      kaashiVariant.slug,
      kaashiVariant.ruleOverrides
    );

    assert.strictEqual(initialState.variant, 'kaashi-raja-rani');
    assert.strictEqual(initialState.pasuRule, true);

    let total = 0;
    for (let p = 0; p < 14; p++) {
      assert.strictEqual(initialState.pits[p], 6, `Pit index ${p} must hold 6 counters`);
      total += initialState.pits[p];
    }
    assert.strictEqual(total, 84, 'Total seed count must be 84');
  });

  it('3. Gates informational variants from match creation with VARIANT_NOT_PLAYABLE code', async () => {
    const unplayable = await GameVariant.findOne({ slug: 'puli-meka-2-tigers' });
    assert.ok(unplayable, 'Expected unplayable variant');
    assert.strictEqual(unplayable.isPlayable, false);

    const res = await request('/matches', {
      method: 'POST',
      body: JSON.stringify({
        gameSlug: 'aadu-puli-aatam',
        variantSlug: 'puli-meka-2-tigers',
      }),
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.code, 'VARIANT_NOT_PLAYABLE');
    assert.ok(
      res.data.message.includes('historical reference') ||
      res.data.message.includes('cannot be played')
    );
  });

  it('4. Persists and returns scholarly citations in Game and GameVariant documents', async () => {
    // 1. Verify Game catalog has bibliographic citations
    const game = await Game.findOne({ slug: 'aadu-puli-aatam' });
    assert.ok(game);
    assert.ok(game.historicalBackground, 'Must have historical background documentation');

    // 2. Verify GameVariant has references array with titles and authors
    const variant = await GameVariant.findOne({ slug: 'pulijudam-4-tigers' });
    assert.ok(variant);
    assert.ok(Array.isArray(variant.references));
    assert.ok(variant.references.length > 0);
    assert.ok(variant.references[0].title);
    assert.ok(variant.references[0].author);

    // 3. Verify public game details API includes variant references and rule differences
    const res = await request('/games/aadu-puli-aatam');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.slug, 'aadu-puli-aatam');
    assert.ok(Array.isArray(res.data.data.variants));
    assert.ok(res.data.data.variants.length > 0);
    assert.ok(res.data.data.variants[0].references.length > 0);
  });
});
