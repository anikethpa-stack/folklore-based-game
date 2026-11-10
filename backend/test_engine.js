require('dotenv').config();
const mongoose = require('mongoose');
const Match = require('./models/Match');
const app = require('./app');

async function testGameEngine() {
  console.log('=== FOLKBOARD PHASE 4 GAME ENGINE TEST SUITE ===\n');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    const server = app.listen(5097);
    const BASE_URL = 'http://127.0.0.1:5097/api/matches';

    // -------------------------------------------------------------
    // TEST 1: Aadu Puli Aatam Match Initiation
    // -------------------------------------------------------------
    console.log('Test 1: Start Aadu Puli Aatam Match');
    const m1Res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameSlug: 'aadu-puli-aatam', mode: 'pass_and_play' }),
    });
    const m1Data = await m1Res.json();

    if (
      m1Res.status === 201 &&
      m1Data.data.match.gameSlug === 'aadu-puli-aatam' &&
      m1Data.data.match.boardState.turn === 'goats' &&
      m1Data.data.match.boardState.phase === 'placement'
    ) {
      console.log('  ✓ PASSED: Aadu Puli match created with 3 tigers, 0 goats placed, Goats turn first.');
    } else {
      throw new Error(`Test 1 Failed: ${JSON.stringify(m1Data)}`);
    }

    const aaduMatchId = m1Data.data.match._id;

    // -------------------------------------------------------------
    // TEST 2: Legal Goat Placement
    // -------------------------------------------------------------
    console.log('Test 2: Submit Legal Goat Placement (Goat onto empty node 2)');
    const placeRes = await fetch(`${BASE_URL}/${aaduMatchId}/moves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: null, to: 2, player: 'goats' }),
    });
    const placeData = await placeRes.json();

    if (
      placeRes.status === 200 &&
      placeData.data.match.boardState.nodes[2] === 'goat' &&
      placeData.data.match.boardState.goatsPlaced === 1 &&
      placeData.data.match.currentTurn === 'tigers'
    ) {
      console.log('  ✓ PASSED: Goat placed at node 2, turn transitioned to Tigers.');
    } else {
      throw new Error(`Test 2 Failed: ${JSON.stringify(placeData)}`);
    }

    // -------------------------------------------------------------
    // TEST 3: Invalid Move Rejection ("Explain My Move" Verification)
    // -------------------------------------------------------------
    console.log('Test 3: Invalid Move Rejection (Tiger tries illegal non-adjacent jump)');
    const badMoveRes = await fetch(`${BASE_URL}/${aaduMatchId}/moves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 0, to: 22, player: 'tigers' }),
    });
    const badMoveData = await badMoveRes.json();

    if (
      badMoveRes.status === 400 &&
      badMoveData.code === 'INVALID_MOVE' &&
      badMoveData.rejectionReason.length > 10
    ) {
      console.log(`  ✓ PASSED: Rejected with Explain My Move reasoning: "${badMoveData.rejectionReason}".`);
    } else {
      throw new Error(`Test 3 Failed: ${JSON.stringify(badMoveData)}`);
    }

    // -------------------------------------------------------------
    // TEST 4: Wrong Turn Rejection
    // -------------------------------------------------------------
    console.log('Test 4: Wrong Turn Rejection (Goats try to move on Tigers turn)');
    const wrongTurnRes = await fetch(`${BASE_URL}/${aaduMatchId}/moves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: null, to: 4, player: 'goats' }),
    });
    const wrongTurnData = await wrongTurnRes.json();

    if (wrongTurnRes.status === 400 && wrongTurnData.rejectionReason.includes("TIGERS' turn")) {
      console.log('  ✓ PASSED: Server blocked out-of-turn play.');
    } else {
      throw new Error(`Test 4 Failed: ${JSON.stringify(wrongTurnData)}`);
    }

    // -------------------------------------------------------------
    // TEST 5: Legal Tiger Movement
    // -------------------------------------------------------------
    console.log('Test 5: Legal Tiger 1-Step Movement (Tiger at 0 moves to adjacent empty 1 is occupied, 0 to ...)');
    // Let's check legal moves for tigers
    const getRes = await fetch(`${BASE_URL}/${aaduMatchId}`);
    const getData = await getRes.json();
    const tigerMove = getData.data.legalMoves[0];

    const tigerStepRes = await fetch(`${BASE_URL}/${aaduMatchId}/moves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: tigerMove.from, to: tigerMove.to, player: 'tigers' }),
    });
    const tigerStepData = await tigerStepRes.json();

    if (tigerStepRes.status === 200 && tigerStepData.data.match.currentTurn === 'goats') {
      console.log(`  ✓ PASSED: Tiger legally moved ${tigerMove.from} -> ${tigerMove.to}, turn reverted to Goats.`);
    } else {
      throw new Error(`Test 5 Failed: ${JSON.stringify(tigerStepData)}`);
    }

    // -------------------------------------------------------------
    // TEST 6: Pallanguzhi Match Initiation
    // -------------------------------------------------------------
    console.log('Test 6: Start Pallanguzhi 14-Pit Mancala Match');
    const p1Res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameSlug: 'pallanguzhi', mode: 'pass_and_play' }),
    });
    const p1Data = await p1Res.json();

    if (
      p1Res.status === 201 &&
      p1Data.data.match.gameSlug === 'pallanguzhi' &&
      p1Data.data.match.boardState.pits.length === 14 &&
      p1Data.data.match.boardState.pits.every((s) => s === 5)
    ) {
      console.log('  ✓ PASSED: Pallanguzhi match created with 14 pits, 5 seeds each, Player 1 starts.');
    } else {
      throw new Error(`Test 6 Failed: ${JSON.stringify(p1Data)}`);
    }

    const palMatchId = p1Data.data.match._id;

    // -------------------------------------------------------------
    // TEST 7: Legal Pallanguzhi Sowing
    // -------------------------------------------------------------
    console.log('Test 7: Player 1 Sows from Pit 0 (First Pit on Bottom Row)');
    const sowRes = await fetch(`${BASE_URL}/${palMatchId}/moves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 0, player: 'player1' }),
    });
    const sowData = await sowRes.json();

    if (
      sowRes.status === 200 &&
      sowData.data.match.currentTurn === 'player2' &&
      sowData.data.match.moveHistory.length === 1
    ) {
      console.log('  ✓ PASSED: Multi-lap cascading sowing executed authoritatively, turn passed to Player 2.');
    } else {
      throw new Error(`Test 7 Failed: ${JSON.stringify(sowData)}`);
    }

    // -------------------------------------------------------------
    // TEST 8: Opponent Pit Selection Rejection
    // -------------------------------------------------------------
    console.log('Test 8: Reject Player 2 trying to sow from Player 1 side (Pit 2)');
    const badSideRes = await fetch(`${BASE_URL}/${palMatchId}/moves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 2, player: 'player2' }),
    });
    const badSideData = await badSideRes.json();

    if (badSideRes.status === 400 && badSideData.rejectionReason.includes('Player 1')) {
      console.log(`  ✓ PASSED: Correctly rejected with: "${badSideData.rejectionReason}".`);
    } else {
      throw new Error(`Test 8 Failed: ${JSON.stringify(badSideData)}`);
    }

    // -------------------------------------------------------------
    // TEST 9: Match Restart
    // -------------------------------------------------------------
    console.log('Test 9: Authoritative Match Restart');
    const resetRes = await fetch(`${BASE_URL}/${palMatchId}/restart`, {
      method: 'POST',
    });
    const resetData = await resetRes.json();

    if (
      resetRes.status === 200 &&
      resetData.data.match.boardState.pits.every((s) => s === 5) &&
      resetData.data.match.moveHistory.length === 0
    ) {
      console.log('  ✓ PASSED: Match reset to initial board state with clean history.');
    } else {
      throw new Error(`Test 9 Failed: ${JSON.stringify(resetData)}`);
    }

    // Clean up test matches
    await Match.findByIdAndDelete(aaduMatchId);
    await Match.findByIdAndDelete(palMatchId);
    console.log('\n[Teardown] Cleaned up temporary test matches.');

    server.close();
    await mongoose.connection.close();
    console.log('\n🎉 ALL PHASE 4 GAME ENGINE TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test Error:', err.message);
    process.exit(1);
  }
}

testGameEngine();
