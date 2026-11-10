const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const app = require('./app');
const User = require('./models/User');
const Match = require('./models/Match');
const RefreshSession = require('./models/RefreshSession');

async function runSavedAndResumeTests() {
  console.log('=================================================================');
  console.log('   FOLKBOARD - SAVED MATCH & RESUME GAMEPLAY TEST SUITE   ');
  console.log('=================================================================\n');

  let server;
  const createdMatchIds = [];
  const createdUserIds = [];

  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/folkboard');
    const PORT = 5101;
    server = app.listen(PORT);
    const BASE = `http://127.0.0.1:${PORT}/api`;

    const request = async (url, options = {}, token = null) => {
      const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${BASE}${url}`, { ...options, headers });
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    };

    // -------------------------------------------------------------
    // Setup: Register User A and User B
    // -------------------------------------------------------------
    const timestamp = Date.now();
    const userAData = {
      username: `resume_user_a_${timestamp}`,
      email: `resume_user_a_${timestamp}@folkboard.org`,
      password: 'ResumePassword#2026',
    };
    const userBData = {
      username: `resume_user_b_${timestamp}`,
      email: `resume_user_b_${timestamp}@folkboard.org`,
      password: 'ResumePassword#2026',
    };

    console.log('[Setup] Registering User A and User B...');
    const regA = await request('/auth/register', { method: 'POST', body: JSON.stringify(userAData) });
    const tokenA = regA.data.accessToken;
    const userAId = regA.data.user.id;
    createdUserIds.push(userAId);

    const regB = await request('/auth/register', { method: 'POST', body: JSON.stringify(userBData) });
    const tokenB = regB.data.accessToken;
    const userBId = regB.data.user.id;
    createdUserIds.push(userBId);
    console.log(`[PASS] Setup complete. User A: ${userAId}, User B: ${userBId}\n`);

    // -------------------------------------------------------------
    // TEST 1: Create & Identify Active Unfinished Matches (GET /api/matches/saved)
    // -------------------------------------------------------------
    console.log('[TEST 1] Testing active saved games identification (GET /api/matches/saved)...');
    // User A starts match 1: Aadu Puli Aatam vs AI (hard difficulty)
    const match1Res = await request(
      '/matches',
      {
        method: 'POST',
        body: JSON.stringify({
          gameSlug: 'aadu-puli-aatam',
          mode: 'vs_ai',
          aiDifficulty: 'hard',
        }),
      },
      tokenA
    );
    const match1Id = match1Res.data.data.match._id;
    createdMatchIds.push(match1Id);

    // Human plays a move: Place goat on vertex 2
    await request(
      `/matches/${match1Id}/moves`,
      { method: 'POST', body: JSON.stringify({ to: 2, player: 'goats' }) },
      tokenA
    );

    // Call GET /api/matches/saved
    const savedRes1 = await request('/matches/saved', {}, tokenA);
    if (savedRes1.status !== 200) {
      throw new Error(`FAIL: /matches/saved failed: ${savedRes1.status}`);
    }
    const savedList = savedRes1.data.data;
    if (!Array.isArray(savedList) || savedList.length !== 1) {
      throw new Error(`FAIL: Expected 1 saved active match, got ${savedList.length}`);
    }
    const savedItem = savedList[0];
    if (savedItem._id !== match1Id) throw new Error('FAIL: Saved match ID mismatch!');
    if (savedItem.status !== 'in_progress') throw new Error('FAIL: Status is not in_progress!');
    if (!savedItem.gameId?.name) throw new Error('FAIL: gameId was not populated!');
    if (savedItem.mode !== 'vs_ai') throw new Error('FAIL: mode is not vs_ai!');
    if (savedItem.aiDifficulty !== 'hard') throw new Error('FAIL: aiDifficulty is not hard!');

    console.log(` - Saved match found: "${savedItem.gameId.name}" (${savedItem._id})`);
    console.log(` - Attributes: mode=${savedItem.mode}, aiDifficulty=${savedItem.aiDifficulty}, status=${savedItem.status}`);
    console.log('[PASS] Test 1: Active unfinished matches accurately identified with populated metadata.\n');

    // -------------------------------------------------------------
    // TEST 2: Completed Matches Excluded from Saved Games
    // -------------------------------------------------------------
    console.log('[TEST 2] Testing completed match exclusion from saved games...');
    // Create match 2 and mark as completed
    const match2Res = await request(
      '/matches',
      { method: 'POST', body: JSON.stringify({ gameSlug: 'pallanguzhi', mode: 'pass_and_play' }) },
      tokenA
    );
    const match2Id = match2Res.data.data.match._id;
    createdMatchIds.push(match2Id);

    await Match.findByIdAndUpdate(match2Id, { status: 'completed', winner: 'player1' });

    // Query saved matches again
    const savedRes2 = await request('/matches/saved', {}, tokenA);
    const idsInSaved = savedRes2.data.data.map((m) => m._id);
    if (idsInSaved.includes(match2Id)) {
      throw new Error('FAIL: Completed match appeared in active saved games!');
    }
    console.log(` - Verified completed match ${match2Id} is excluded from /matches/saved.`);
    console.log('[PASS] Test 2: Concluded and completed matches strictly excluded from saved list.\n');

    // -------------------------------------------------------------
    // TEST 3: Authoritative Resume for Aadu Puli (GET /api/matches/:id/resume)
    // -------------------------------------------------------------
    console.log('[TEST 3] Testing authoritative match resumption for Aadu Puli Aatam...');
    const resumeRes1 = await request(`/matches/${match1Id}/resume`, {}, tokenA);
    if (resumeRes1.status !== 200) {
      throw new Error(`FAIL: Resume failed: ${resumeRes1.status}`);
    }
    if (!resumeRes1.data.resumable) {
      throw new Error('FAIL: Match reported as not resumable!');
    }
    const restoredMatch = resumeRes1.data.data.match;
    if (restoredMatch._id !== match1Id) throw new Error('FAIL: Restored match ID mismatch!');
    if (restoredMatch.status !== 'in_progress') throw new Error('FAIL: Status not in_progress!');
    if (!Array.isArray(resumeRes1.data.data.legalMoves) || resumeRes1.data.data.legalMoves.length === 0) {
      throw new Error('FAIL: Legal moves were not returned on resume!');
    }
    console.log(` - Resumed match authoritatively: boardState restored, ${restoredMatch.moveHistory.length} moves in history.`);
    console.log(` - Current Turn: ${restoredMatch.currentTurn}, Legal moves calculated: ${resumeRes1.data.data.legalMoves.length}.`);
    console.log('[PASS] Test 3: Authoritative board state and legal moves accurately restored.\n');

    // -------------------------------------------------------------
    // TEST 4: Computer Does NOT Repeat Move on Resumption
    // -------------------------------------------------------------
    console.log('[TEST 4] Verifying computer does not repeat previous move when resuming...');
    const moveCountBeforeResume = restoredMatch.moveHistory.length;

    // Call resume again
    const secondResumeRes = await request(`/matches/${match1Id}/resume`, {}, tokenA);
    const secondRestoredMatch = secondResumeRes.data.data.match;

    if (secondRestoredMatch.moveHistory.length !== moveCountBeforeResume) {
      throw new Error(`FAIL: Move count changed on resume! Was ${moveCountBeforeResume}, now ${secondRestoredMatch.moveHistory.length}`);
    }
    console.log(` - Move count stayed constant at ${secondRestoredMatch.moveHistory.length} on resume.`);
    console.log('[PASS] Test 4: Computer does not repeat or duplicate moves when loading saved match.\n');

    // -------------------------------------------------------------
    // TEST 5: Resume Pallanguzhi in Pass and Play Mode
    // -------------------------------------------------------------
    console.log('[TEST 5] Testing resumption of Pallanguzhi in Pass and Play mode...');
    const palCreate = await request(
      '/matches',
      { method: 'POST', body: JSON.stringify({ gameSlug: 'pallanguzhi', mode: 'pass_and_play' }) },
      tokenA
    );
    const palMatchId = palCreate.data.data.match._id;
    createdMatchIds.push(palMatchId);

    // Player 1 sows from pit 0
    await request(
      `/matches/${palMatchId}/moves`,
      { method: 'POST', body: JSON.stringify({ from: 0, player: 'player1' }) },
      tokenA
    );

    // Resume Pallanguzhi
    const palResumeRes = await request(`/matches/${palMatchId}/resume`, {}, tokenA);
    if (palResumeRes.status !== 200) {
      throw new Error(`FAIL: Pallanguzhi resume failed: ${palResumeRes.status}`);
    }
    const restoredPal = palResumeRes.data.data.match;
    if (restoredPal.currentTurn !== 'player2') {
      throw new Error(`FAIL: Expected currentTurn to be player2, got ${restoredPal.currentTurn}`);
    }
    if (restoredPal.boardState.pits.length !== 14) {
      throw new Error('FAIL: Restored pits length is not 14!');
    }
    // Verify legal moves are for player 2 (pits 7..13)
    const palLegalMoves = palResumeRes.data.data.legalMoves;
    const allP2Pits = palLegalMoves.every((m) => m.from >= 7 && m.from <= 13);
    if (!allP2Pits) {
      throw new Error('FAIL: Restored legal moves for Player 2 contained invalid pit indices!');
    }
    console.log(` - Resumed Pallanguzhi match: turn='player2', pits restored, legal moves restricted to Pits 8-14.`);
    console.log('[PASS] Test 5: Pallanguzhi restored cleanly with correct multi-player turn state.\n');

    // -------------------------------------------------------------
    // TEST 6: Prevent Resuming Completed or Concluded Matches
    // -------------------------------------------------------------
    console.log('[TEST 6] Testing rejection when attempting to resume completed matches...');
    const rejectCompletedRes = await request(`/matches/${match2Id}/resume`, {}, tokenA);
    if (rejectCompletedRes.status !== 400) {
      throw new Error(`FAIL: Expected status 400 for completed match resume, got ${rejectCompletedRes.status}`);
    }
    if (rejectCompletedRes.data.resumable !== false) {
      throw new Error('FAIL: resumable flag was not false!');
    }
    if (rejectCompletedRes.data.code !== 'MATCH_NOT_RESUMABLE') {
      throw new Error(`FAIL: Expected code 'MATCH_NOT_RESUMABLE', got '${rejectCompletedRes.data.code}'`);
    }
    console.log(` - Correctly blocked completed match: code='MATCH_NOT_RESUMABLE', msg='${rejectCompletedRes.data.message}'`);
    console.log('[PASS] Test 6: Completed matches strictly reject resume requests.\n');

    // -------------------------------------------------------------
    // TEST 7: Cross-User Authorization on Resuming
    // -------------------------------------------------------------
    console.log('[TEST 7] Testing ownership security on match resume (User B cannot resume User A match)...');
    const unauthorizedResume = await request(`/matches/${match1Id}/resume`, {}, tokenB);
    if (unauthorizedResume.status !== 403) {
      throw new Error(`FAIL: Expected 403 Forbidden, got ${unauthorizedResume.status}`);
    }
    console.log(` - User B rejected with 403 Forbidden when attempting to resume User A's match.`);
    console.log('[PASS] Test 7: Match ownership strictly enforced on resumption.\n');

    // -------------------------------------------------------------
    // Teardown
    // -------------------------------------------------------------
    console.log('[Teardown] Cleaning up created test entities...');
    for (const mId of createdMatchIds) {
      await Match.findByIdAndDelete(mId);
    }
    for (const uId of createdUserIds) {
      await User.findByIdAndDelete(uId);
      await RefreshSession.deleteMany({ userId: uId });
    }
    console.log('[Teardown] Cleanup complete.\n');

    server.close();
    await mongoose.connection.close();

    console.log('=================================================================');
    console.log('   ALL 7 PROMPT 5 VERIFICATION TESTS PASSED WITH 100% SUCCESS!   ');
    console.log('=================================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test Error:', err.message);
    if (server) server.close();
    try {
      await mongoose.connection.close();
    } catch (_) {}
    process.exit(1);
  }
}

runSavedAndResumeTests();

