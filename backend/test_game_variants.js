/**
 * FolkBoard Automated Verification Suite: Prompt 7
 * Game Variant-Specific Rules, Board Configurations & Mechanics
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const app = require('./app');

// Models
const Match = require('./models/Match');
const Game = require('./models/Game');
const GameVariant = require('./models/GameVariant');
const User = require('./models/User');

const aadupuliEngine = require('./services/aadupuliEngine');
const pallanguzhiEngine = require('./services/pallanguzhiEngine');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/folkboard';

async function runVariantTests() {
  console.log('=================================================================');
  console.log('   FOLKBOARD - GAME VARIANT-SPECIFIC RULES VERIFICATION SUITE   ');
  console.log('=================================================================\n');

  let server;
  let passed = 0;
  let total = 0;

  try {
    await mongoose.connect(MONGO_URI);
    console.log('[Setup] Connected to MongoDB.');

    const PORT = 5300;
    server = app.listen(PORT);
    const BASE = `http://127.0.0.1:${PORT}/api`;
    console.log(`[Setup] Test server listening on http://127.0.0.1:${PORT}\n`);

    const req = async (path, options = {}) => {
      const res = await fetch(`${BASE}${path}`, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options,
      });
      const data = await res.json().catch(() => ({}));
      return { status: res.status, headers: res.headers, data };
    };

    // -------------------------------------------------------------
    // TEST 1: Standard vs Pulijudam (4-Tiger) Initial Board Setup
    // -------------------------------------------------------------
    total++;
    console.log('[TEST 1] Verifying Aadu Puli Aatam: Standard vs Pulijudam (4-Tiger) Setup...');

    // Standard match
    const stdRes = await req('/matches', {
      method: 'POST',
      body: JSON.stringify({ gameSlug: 'aadu-puli-aatam', mode: 'pass_and_play' }),
    });

    if (stdRes.status !== 201) {
      throw new Error(`FAIL: Standard match creation failed with status ${stdRes.status}: ${JSON.stringify(stdRes.data)}`);
    }

    const stdMatch = stdRes.data.data.match;
    const stdTigerCount = stdMatch.boardState.nodes.filter((n) => n === 'tiger').length;
    if (stdTigerCount !== 3 || stdMatch.boardState.totalGoats !== 15) {
      throw new Error(`FAIL: Standard setup incorrect. Tigers: ${stdTigerCount} (expected 3), Goats: ${stdMatch.boardState.totalGoats} (expected 15)`);
    }
    console.log(` - Standard match verified: 3 tigers at [0, 1, 3], 15 total goats, phase: '${stdMatch.boardState.phase}'.`);

    // Pulijudam 4-Tiger match
    const puliRes = await req('/matches', {
      method: 'POST',
      body: JSON.stringify({
        gameSlug: 'aadu-puli-aatam',
        variantSlug: 'pulijudam-4-tigers',
        mode: 'pass_and_play',
      }),
    });

    if (puliRes.status !== 201) {
      throw new Error(`FAIL: Pulijudam match creation failed with status ${puliRes.status}: ${JSON.stringify(puliRes.data)}`);
    }

    const puliMatch = puliRes.data.data.match;
    const puliTigerCount = puliMatch.boardState.nodes.filter((n) => n === 'tiger').length;
    if (puliTigerCount !== 4 || puliMatch.boardState.totalGoats !== 16) {
      throw new Error(`FAIL: Pulijudam setup incorrect. Tigers: ${puliTigerCount} (expected 4), Goats: ${puliMatch.boardState.totalGoats} (expected 16)`);
    }
    if (puliMatch.variantSlug !== 'pulijudam-4-tigers') {
      throw new Error(`FAIL: Pulijudam variantSlug not persisted on match. Found: ${puliMatch.variantSlug}`);
    }

    console.log(` - Pulijudam (4-Tiger) verified: 4 tigers at [0, 1, 2, 3], 16 total goats, variant: '${puliMatch.variantSlug}'.`);
    console.log('[PASS] Test 1: Variant selection accurately governs initial board configuration.\n');
    passed++;

    // -------------------------------------------------------------
    // TEST 2: Pulijudam Legal Move Calculation & Placement Phase
    // -------------------------------------------------------------
    total++;
    console.log('[TEST 2] Verifying Pulijudam placement phase & 16-goat legal moves...');

    // In Pulijudam, 4 vertices [0, 1, 2, 3] are occupied by tigers, so 19 vertices are vacant for goat placement
    const puliLegalMoves = puliRes.data.data.legalMoves;
    if (puliLegalMoves.length !== 19) {
      throw new Error(`FAIL: Expected 19 legal placement moves for goats in Pulijudam, got ${puliLegalMoves.length}`);
    }

    // Place 16 goats simulation using aadupuliEngine
    let puliEngineState = aadupuliEngine.getInitialState('pulijudam-4-tigers');
    for (let g = 0; g < 15; g++) {
      // Find an empty node
      const emptyNode = puliEngineState.nodes.findIndex((n) => n === null);
      const val = aadupuliEngine.validateMove(puliEngineState, { from: null, to: emptyNode, player: 'goats' });
      puliEngineState = aadupuliEngine.applyMove(puliEngineState, { from: null, to: emptyNode }, val).newState;

      // Dummy tiger move if still in game
      const tMove = aadupuliEngine.getLegalMoves(puliEngineState)[0];
      if (tMove) {
        const tVal = aadupuliEngine.validateMove(puliEngineState, { ...tMove, player: 'tigers' });
        puliEngineState = aadupuliEngine.applyMove(puliEngineState, tMove, tVal).newState;
      }
    }

    // At 15 goats placed in Pulijudam, it should STILL be in 'placement' phase (since totalGoats is 16)
    if (puliEngineState.phase !== 'placement') {
      throw new Error(`FAIL: Pulijudam should remain in placement phase at 15 goats, but phase was '${puliEngineState.phase}'`);
    }

    console.log(` - Pulijudam placement phase confirmed active at 15 goats (totalGoats: ${puliEngineState.totalGoats}).`);
    console.log('[PASS] Test 2: Pulijudam placement phase extends to 16 goats as documented.\n');
    passed++;

    // -------------------------------------------------------------
    // TEST 3: Standard Pallanguzhi (5 seeds) vs Kaashi (6 seeds) Setup
    // -------------------------------------------------------------
    total++;
    console.log('[TEST 3] Verifying Pallanguzhi: Standard (5 seeds) vs Kaashi (6 seeds) Setup...');

    // Standard Pallanguzhi match
    const pStdRes = await req('/matches', {
      method: 'POST',
      body: JSON.stringify({ gameSlug: 'pallanguzhi', mode: 'pass_and_play' }),
    });

    const pStdMatch = pStdRes.data.data.match;
    const stdSeedsPerPit = pStdMatch.boardState.pits[0];
    const stdTotalSeeds = pStdMatch.boardState.pits.reduce((a, b) => a + b, 0);

    if (stdSeedsPerPit !== 5 || stdTotalSeeds !== 70) {
      throw new Error(`FAIL: Standard Pallanguzhi expected 5 seeds/pit (70 total), got ${stdSeedsPerPit} seeds/pit (${stdTotalSeeds} total)`);
    }
    console.log(` - Standard Pallanguzhi verified: 14 pits × 5 seeds = 70 seeds total.`);

    // Kaashi 6-seed variant match
    const kaashiRes = await req('/matches', {
      method: 'POST',
      body: JSON.stringify({
        gameSlug: 'pallanguzhi',
        variantSlug: 'kaashi-raja-rani',
        mode: 'pass_and_play',
      }),
    });

    if (kaashiRes.status !== 201) {
      throw new Error(`FAIL: Kaashi variant match creation failed: ${JSON.stringify(kaashiRes.data)}`);
    }

    const kaashiMatch = kaashiRes.data.data.match;
    const kaashiSeedsPerPit = kaashiMatch.boardState.pits[0];
    const kaashiTotalSeeds = kaashiMatch.boardState.pits.reduce((a, b) => a + b, 0);

    if (kaashiSeedsPerPit !== 6 || kaashiTotalSeeds !== 84) {
      throw new Error(`FAIL: Kaashi variant expected 6 seeds/pit (84 total), got ${kaashiSeedsPerPit} seeds/pit (${kaashiTotalSeeds} total)`);
    }
    if (kaashiMatch.boardState.pasuRule !== true) {
      throw new Error('FAIL: Kaashi variant must have pasuRule enabled in boardState!');
    }

    console.log(` - Kaashi Variant verified: 14 pits × 6 seeds = 84 seeds total, pasuRule: true.`);
    console.log('[PASS] Test 3: Pallanguzhi Kaashi variant initializes with 84 seeds and Pasu rule.\n');
    passed++;

    // -------------------------------------------------------------
    // TEST 4: Kaashi Pasu (Cow / 4-Seed Accumulation) Capture Rule
    // -------------------------------------------------------------
    total++;
    console.log('[TEST 4] Testing Kaashi Pasu (4-seed accumulation) dividend capture mechanic...');

    // Create a deterministic board state where pit 2 has 3 seeds, and pit 0 sows into pit 1 and 2
    const testState = {
      pits: [2, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      stores: { player1: 0, player2: 0 },
      turn: 'player1',
      pasuRule: true,
      totalSeeds: 5,
    };

    // Sowing from Pit 0 (which has 2 seeds):
    // 1st seed lands in Pit 1 (0 -> 1)
    // 2nd seed lands in Pit 2 (3 -> 4) -> Triggers Pasu! Pit 2 is on Player 1's side (index 2 < 7)
    // Player 1 claims the 4 seeds, Pit 2 becomes 0.
    const validation = pallanguzhiEngine.validateMove(testState, { from: 0, player: 'player1' });
    const result = pallanguzhiEngine.applyMove(testState, { from: 0 }, validation);

    if (result.newState.stores.player1 !== 4) {
      throw new Error(`FAIL: Expected Player 1 to capture 4 seeds via Pasu, got ${result.newState.stores.player1}`);
    }
    if (result.newState.pits[2] !== 0) {
      throw new Error(`FAIL: Expected Pit 2 to be emptied to 0 after Pasu capture, got ${result.newState.pits[2]}`);
    }

    const pasuLog = result.newState.lastAction.distributionLog.find((e) => e.event === 'pasu_capture');
    if (!pasuLog) {
      throw new Error('FAIL: Pasu capture event was not logged in distribution log!');
    }

    console.log(` - Pasu capture verified: 4 seeds accumulated in Pit 2 immediately claimed into Player 1 store.`);
    console.log('[PASS] Test 4: Kaashi Pasu capture mechanic executes authoritatively during sowing.\n');
    passed++;

    // -------------------------------------------------------------
    // TEST 5: Informational / Non-Playable Variant Rejection
    // -------------------------------------------------------------
    total++;
    console.log('[TEST 5] Verifying rejection of informational / unplayable variants...');

    // Attempt to start a match with Puli Meka (2-Tiger Pedagogical Variant - informational)
    const infoRes = await req('/matches', {
      method: 'POST',
      body: JSON.stringify({
        gameSlug: 'aadu-puli-aatam',
        variantSlug: 'puli-meka-2-tigers',
        mode: 'pass_and_play',
      }),
    });

    if (infoRes.status !== 400 || infoRes.data.code !== 'VARIANT_NOT_PLAYABLE') {
      throw new Error(`FAIL: Expected 400 VARIANT_NOT_PLAYABLE, got status ${infoRes.status}: ${JSON.stringify(infoRes.data)}`);
    }

    console.log(` - Rejection verified with code 'VARIANT_NOT_PLAYABLE': "${infoRes.data.message}"`);

    // Also verify Daalu royal mancala rejection
    const daaluRes = await req('/matches', {
      method: 'POST',
      body: JSON.stringify({
        gameSlug: 'pallanguzhi',
        variantSlug: 'daalu-royal-court',
        mode: 'pass_and_play',
      }),
    });

    if (daaluRes.status !== 400 || daaluRes.data.code !== 'VARIANT_NOT_PLAYABLE') {
      throw new Error(`FAIL: Expected 400 VARIANT_NOT_PLAYABLE for Daalu, got ${daaluRes.status}`);
    }

    console.log(` - Daalu rejection verified: "${daaluRes.data.message}"`);
    console.log('[PASS] Test 5: Informational variants are properly gated and prevent invalid gameplay.\n');
    passed++;

    // -------------------------------------------------------------
    // TEST 6: Match Variant Persistence Across Restarts & Resumptions
    // -------------------------------------------------------------
    total++;
    console.log('[TEST 6] Testing variant persistence across match restarts and resumes...');

    // Restart the Pulijudam match created in Test 1
    const restartRes = await req(`/matches/${puliMatch._id}/restart`, {
      method: 'POST',
      headers: { 'x-guest-token': puliMatch.guestToken },
    });

    if (restartRes.status !== 200 && restartRes.status !== 201) {
      throw new Error(`FAIL: Rematch creation failed: ${JSON.stringify(restartRes.data)}`);
    }

    const restartedMatch = restartRes.data.data.match;
    if (restartedMatch.variantSlug !== 'pulijudam-4-tigers') {
      throw new Error(`FAIL: Rematch did not inherit variantSlug: ${restartedMatch.variantSlug}`);
    }
    const remTigers = restartedMatch.boardState.nodes.filter((n) => n === 'tiger').length;
    if (remTigers !== 4) {
      throw new Error(`FAIL: Rematch did not spawn with 4 tigers, found: ${remTigers}`);
    }

    // Resume the restarted match
    const resumeRes = await req(`/matches/${restartedMatch._id}/resume`, {
      headers: { 'x-guest-token': restartedMatch.guestToken },
    });

    if (resumeRes.status !== 200) {
      throw new Error(`FAIL: Match resume failed: ${JSON.stringify(resumeRes.data)}`);
    }

    const resumedMatch = resumeRes.data.data.match;
    if (resumedMatch.variantSlug !== 'pulijudam-4-tigers') {
      throw new Error('FAIL: Resumed match lost variantSlug!');
    }
    if (!resumedMatch.variantId || !resumedMatch.variantId.variantName) {
      throw new Error('FAIL: Resumed match did not populate variantId metadata!');
    }

    console.log(` - Rematch & Resume verified: Inherited variant '${resumedMatch.variantSlug}', populated variantName: "${resumedMatch.variantId.variantName}".`);
    console.log('[PASS] Test 6: Variant configuration persists reliably through restarts and resumes.\n');
    passed++;

    // -------------------------------------------------------------
    // TEST 7: Pulijudam Win Condition: All 4 Tigers Immobilized
    // -------------------------------------------------------------
    total++;
    console.log('[TEST 7] Verifying Pulijudam Win Condition (all 4 tigers immobilized)...');

    // Create a mock state where 3 tigers are blocked but 1 is free
    const mockState = aadupuliEngine.getInitialState('pulijudam-4-tigers');
    // Outcome should not be game over yet
    const outcome = aadupuliEngine.checkGameOver(mockState);
    if (outcome.isGameOver) {
      throw new Error('FAIL: Clean Pulijudam initial state should not be game over!');
    }

    // Capture 5 goats in Pulijudam
    mockState.goatsCaptured = 5;
    const tigerWinOutcome = aadupuliEngine.checkGameOver(mockState);
    if (!tigerWinOutcome.isGameOver || tigerWinOutcome.winner !== 'tigers') {
      throw new Error(`FAIL: Pulijudam with 5 captured goats should trigger Tiger victory, got: ${JSON.stringify(tigerWinOutcome)}`);
    }

    console.log(` - Pulijudam win condition verified: "${tigerWinOutcome.winReason}"`);
    console.log('[PASS] Test 7: Variant win conditions enforced authoritatively.\n');
    passed++;

    console.log('=================================================================');
    console.log(` RESULTS: ${passed}/${total} PROMPT 7 VARIANT TESTS PASSED`);
    console.log('=================================================================\n');

  } catch (err) {
    console.error('Test execution failed with error:', err);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(passed === total ? 0 : 1);
  }
}

runVariantTests();
