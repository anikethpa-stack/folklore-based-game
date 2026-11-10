const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const app = require('./app');
const User = require('./models/User');
const Match = require('./models/Match');
const RefreshSession = require('./models/RefreshSession');

async function runMatchRestartTests() {
  console.log('=================================================================');
  console.log('   FOLKBOARD - MATCH RESTART & HISTORY VERIFICATION SUITE   ');
  console.log('=================================================================\n');

  let server;
  const createdMatchIds = [];
  const createdUserIds = [];

  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/folkboard');
    const PORT = 5096;
    server = app.listen(PORT);
    const BASE = `http://127.0.0.1:${PORT}/api`;

    // Helper for fetch
    const request = async (url, options = {}, token = null, guestToken = null) => {
      const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      if (guestToken) {
        headers['x-guest-token'] = guestToken;
      }
      const res = await fetch(`${BASE}${url}`, { ...options, headers });
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    };

    // -------------------------------------------------------------
    // Setup: Register test user
    // -------------------------------------------------------------
    const timestamp = Date.now();
    const testUserData = {
      username: `restart_user_${timestamp}`,
      email: `restart_user_${timestamp}@folkboard.org`,
      password: 'RestartPassword#2026',
    };

    console.log(`[Setup] Registering test user: ${testUserData.username}...`);
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(testUserData),
    });
    if (regRes.status !== 201) {
      throw new Error(`Failed to register test user: ${JSON.stringify(regRes.data)}`);
    }
    const userToken = regRes.data.accessToken;
    const userId = regRes.data.user.id;
    createdUserIds.push(userId);
    console.log(`[PASS] Setup: Test user created (ID: ${userId}).\n`);

    // -------------------------------------------------------------
    // TEST 1: Restart Aadu Puli Match (In-Progress)
    // -------------------------------------------------------------
    console.log('[TEST 1] Restarting in-progress Aadu Puli Aatam match...');
    const createRes1 = await request(
      '/matches',
      {
        method: 'POST',
        body: JSON.stringify({
          gameSlug: 'aadu-puli-aatam',
          mode: 'vs_ai',
          aiDifficulty: 'hard',
          playerRole: 'goats',
        }),
      },
      userToken
    );

    if (createRes1.status !== 201) {
      throw new Error(`Failed to create match1: ${JSON.stringify(createRes1.data)}`);
    }
    const match1Id = createRes1.data.data.match._id;
    createdMatchIds.push(match1Id);
    console.log(` - Created initial match: ${match1Id}`);

    // Play a move: Place goat on vertex 2 (vertex 0, 1, 3 are opening tiger positions)
    const moveRes1 = await request(
      `/matches/${match1Id}/moves`,
      {
        method: 'POST',
        body: JSON.stringify({ to: 2, player: 'goats' }),
      },
      userToken
    );
    if (moveRes1.status !== 200) {
      throw new Error(`Failed to play move: ${JSON.stringify(moveRes1.data)}`);
    }
    const afterMoveMatch1 = moveRes1.data.data.match;
    console.log(` - Move executed. Move count: ${afterMoveMatch1.moveHistory.length}`);
    if (afterMoveMatch1.moveHistory.length < 1) {
      throw new Error('Move was not saved to moveHistory!');
    }

    // Call restart
    const restartRes1 = await request(
      `/matches/${match1Id}/restart`,
      { method: 'POST' },
      userToken
    );
    if (restartRes1.status !== 200) {
      throw new Error(`Failed to restart match: ${JSON.stringify(restartRes1.data)}`);
    }
    const newMatch1 = restartRes1.data.data.match;
    const newMatch1Id = newMatch1._id;
    createdMatchIds.push(newMatch1Id);

    // Assertions for Test 1
    if (newMatch1Id === match1Id) throw new Error('FAIL: New match ID matches old match ID!');
    if (newMatch1.status !== 'in_progress') throw new Error(`FAIL: Status is ${newMatch1.status}`);
    if (newMatch1.moveHistory.length !== 0) throw new Error('FAIL: New match moveHistory is not empty!');
    if (newMatch1.boardState.goatsPlaced !== 0) throw new Error('FAIL: New match goatsPlaced != 0');
    if (newMatch1.gameSlug !== 'aadu-puli-aatam') throw new Error('FAIL: Game slug changed!');
    if (newMatch1.mode !== 'vs_ai') throw new Error('FAIL: Mode not preserved!');
    if (newMatch1.aiDifficulty !== 'hard') throw new Error('FAIL: AI difficulty not preserved!');
    if (newMatch1.players.player2.isAI !== true) throw new Error('FAIL: AI config not preserved!');
    if (newMatch1.previousMatchId !== match1Id) throw new Error('FAIL: previousMatchId link missing!');

    // Check previous match in database
    const oldMatch = await Match.findById(match1Id);
    if (oldMatch.status !== 'restarted') throw new Error(`FAIL: Old match status is ${oldMatch.status}`);
    if (oldMatch.moveHistory.length !== afterMoveMatch1.moveHistory.length) {
      throw new Error('FAIL: Old match moveHistory was altered or erased!');
    }
    if (oldMatch.restartedMatchId.toString() !== newMatch1Id.toString()) {
      throw new Error('FAIL: Old match restartedMatchId link missing!');
    }
    console.log(` - Original match ${match1Id} marked 'restarted' with ${oldMatch.moveHistory.length} moves intact.`);
    console.log(` - Clean rematch ${newMatch1Id} spawned with initial board state and preserved AI settings.`);
    console.log('[PASS] Test 1: In-progress match restart preserves history and spawns clean session.\n');

    // -------------------------------------------------------------
    // TEST 2: Duplicate Restart Prevention (Idempotency)
    // -------------------------------------------------------------
    console.log('[TEST 2] Testing duplicate restart prevention...');
    const duplicateRestartRes = await request(
      `/matches/${match1Id}/restart`,
      { method: 'POST' },
      userToken
    );
    if (duplicateRestartRes.status !== 200) {
      throw new Error(`Duplicate restart failed: ${JSON.stringify(duplicateRestartRes.data)}`);
    }
    const duplicateMatch = duplicateRestartRes.data.data.match;
    if (duplicateMatch._id.toString() !== newMatch1Id.toString()) {
      throw new Error('FAIL: Calling restart again created a third match instead of returning existing rematch!');
    }
    console.log(` - Returned existing rematch session ${duplicateMatch._id} without creating duplicate documents.`);
    console.log('[PASS] Test 2: Duplicate restart requests safely return existing rematch session.\n');

    // -------------------------------------------------------------
    // TEST 3: Completed Match Restart (Do NOT Overwrite Completed Status)
    // -------------------------------------------------------------
    console.log('[TEST 3] Testing restart on an already completed match...');
    const createRes3 = await request(
      '/matches',
      {
        method: 'POST',
        body: JSON.stringify({
          gameSlug: 'aadu-puli-aatam',
          mode: 'pass_and_play',
        }),
      },
      userToken
    );
    const match3Id = createRes3.data.data.match._id;
    createdMatchIds.push(match3Id);

    // Mark match3 as completed in MongoDB
    await Match.findByIdAndUpdate(match3Id, {
      status: 'completed',
      winner: 'tigers',
      winReason: 'Tigers captured 5 goats according to traditional rules.',
      completedAt: new Date(),
    });

    // Request restart on the completed match
    const restartCompletedRes = await request(
      `/matches/${match3Id}/restart`,
      { method: 'POST' },
      userToken
    );
    if (restartCompletedRes.status !== 200) {
      throw new Error(`Restart completed match failed: ${JSON.stringify(restartCompletedRes.data)}`);
    }
    const completedRematch = restartCompletedRes.data.data.match;
    createdMatchIds.push(completedRematch._id);

    // Verify completed match was not modified to 'restarted'
    const checkCompleted = await Match.findById(match3Id);
    if (checkCompleted.status !== 'completed') {
      throw new Error(`FAIL: Completed match status was overwritten to: ${checkCompleted.status}!`);
    }
    if (checkCompleted.winner !== 'tigers') {
      throw new Error(`FAIL: Completed match winner was overwritten: ${checkCompleted.winner}!`);
    }
    if (completedRematch.status !== 'in_progress') {
      throw new Error(`FAIL: New rematch is not in_progress: ${completedRematch.status}!`);
    }
    console.log(` - Completed match status intact: status='${checkCompleted.status}', winner='${checkCompleted.winner}'`);
    console.log(` - Rematch session spawned cleanly: ${completedRematch._id}`);
    console.log('[PASS] Test 3: Completed match was not overwritten and fresh session was generated.\n');

    // -------------------------------------------------------------
    // TEST 4: Pallanguzhi Restart
    // -------------------------------------------------------------
    console.log('[TEST 4] Testing Pallanguzhi restart...');
    const createPalRes = await request(
      '/matches',
      {
        method: 'POST',
        body: JSON.stringify({
          gameSlug: 'pallanguzhi',
          mode: 'pass_and_play',
        }),
      },
      userToken
    );
    const palMatchId = createPalRes.data.data.match._id;
    createdMatchIds.push(palMatchId);

    // Play a sow move from pit 0
    const movePalRes = await request(
      `/matches/${palMatchId}/moves`,
      {
        method: 'POST',
        body: JSON.stringify({ from: 0, player: 'player1' }),
      },
      userToken
    );
    if (movePalRes.status !== 200) {
      throw new Error(`Failed to play Pallanguzhi move: ${JSON.stringify(movePalRes.data)}`);
    }

    // Call restart
    const palRestartRes = await request(
      `/matches/${palMatchId}/restart`,
      { method: 'POST' },
      userToken
    );
    if (palRestartRes.status !== 200) {
      throw new Error(`Pallanguzhi restart failed: ${JSON.stringify(palRestartRes.data)}`);
    }
    const palNewMatch = palRestartRes.data.data.match;
    createdMatchIds.push(palNewMatch._id);

    if (palNewMatch._id === palMatchId) throw new Error('FAIL: Pallanguzhi restart ID matches old match ID!');
    if (palNewMatch.boardState.pits.length !== 14) throw new Error('FAIL: Pallanguzhi pits != 14');
    const allPitsHave5 = palNewMatch.boardState.pits.every((s) => s === 5);
    if (!allPitsHave5) throw new Error('FAIL: Pallanguzhi pits did not reset to 5 seeds!');
    if (palNewMatch.boardState.stores.player1 !== 0 || palNewMatch.boardState.stores.player2 !== 0) {
      throw new Error('FAIL: Pallanguzhi stores were not reset to 0!');
    }

    const checkPalOld = await Match.findById(palMatchId);
    if (checkPalOld.status !== 'restarted') throw new Error(`FAIL: Previous Pallanguzhi status is ${checkPalOld.status}`);
    if (checkPalOld.moveHistory.length !== 1) throw new Error('FAIL: Previous Pallanguzhi moveHistory was lost!');
    console.log(` - Pallanguzhi previous match preserved with moveHistory intact.`);
    console.log(` - Fresh 14-pit board with 5 seeds per pit initialized for rematch.`);
    console.log('[PASS] Test 4: Pallanguzhi restart preserved previous history and reset 14 pits.\n');

    // -------------------------------------------------------------
    // TEST 5: Match History Display & Statuses
    // -------------------------------------------------------------
    console.log('[TEST 5] Testing Match History retrieval...');
    const historyRes = await request('/matches/history', {}, userToken);
    if (historyRes.status !== 200) {
      throw new Error(`Failed to retrieve history: ${JSON.stringify(historyRes.data)}`);
    }
    const history = historyRes.data.data;
    console.log(` - Retrieved ${history.length} matches for user.`);

    const foundRestarted = history.find((m) => m._id.toString() === match1Id.toString());
    const foundCompleted = history.find((m) => m._id.toString() === match3Id.toString());
    const foundNewRematch = history.find((m) => m._id.toString() === newMatch1Id.toString());

    if (!foundRestarted || foundRestarted.status !== 'restarted') {
      throw new Error('FAIL: History missing preserved "restarted" match!');
    }
    if (!foundCompleted || foundCompleted.status !== 'completed') {
      throw new Error('FAIL: History missing "completed" match!');
    }
    if (!foundNewRematch || foundNewRematch.status !== 'in_progress') {
      throw new Error('FAIL: History missing "in_progress" match!');
    }
    console.log(` - Verified match statuses in history:`);
    console.log(`   * ${foundRestarted._id} -> Status: '${foundRestarted.status}' (Moves preserved: ${foundRestarted.moveHistory?.length})`);
    console.log(`   * ${foundCompleted._id} -> Status: '${foundCompleted.status}' (Winner: ${foundCompleted.winner})`);
    console.log(`   * ${foundNewRematch._id} -> Status: '${foundNewRematch.status}' (Clean board)`);
    console.log('[PASS] Test 5: Match history correctly surfaces all preserved matches and statuses.\n');

    // -------------------------------------------------------------
    // TEST 6: Guest Match Restart
    // -------------------------------------------------------------
    console.log('[TEST 6] Testing Guest Match restart...');
    const guestCreate = await request('/matches', {
      method: 'POST',
      body: JSON.stringify({
        gameSlug: 'aadu-puli-aatam',
        mode: 'pass_and_play',
      }),
    });
    const guestMatchId = guestCreate.data.data.match._id;
    const guestToken = guestCreate.data.data.guestToken;
    createdMatchIds.push(guestMatchId);

    // Submit move as guest
    await request(
      `/matches/${guestMatchId}/moves`,
      {
        method: 'POST',
        body: JSON.stringify({ to: 2, player: 'goats' }),
      },
      null,
      guestToken
    );

    // Restart guest match
    const guestRestartRes = await request(
      `/matches/${guestMatchId}/restart`,
      { method: 'POST' },
      null,
      guestToken
    );
    if (guestRestartRes.status !== 200) {
      throw new Error(`Guest restart failed: ${JSON.stringify(guestRestartRes.data)}`);
    }
    const newGuestMatch = guestRestartRes.data.data.match;
    createdMatchIds.push(newGuestMatch._id);

    if (newGuestMatch._id === guestMatchId) throw new Error('FAIL: Guest restart ID matches old ID!');
    if (newGuestMatch.isGuest !== true) throw new Error('FAIL: Guest match isGuest is false!');
    if (newGuestMatch.guestToken !== guestToken) throw new Error('FAIL: Guest token not preserved!');

    // Test unauthorized request without guest token
    const unauthorizedRes = await request(`/matches/${guestMatchId}/restart`, { method: 'POST' });
    if (unauthorizedRes.status !== 401 && unauthorizedRes.status !== 403) {
      throw new Error(`FAIL: Expected 401 or 403 for unauthorized guest restart, got ${unauthorizedRes.status}`);
    }
    console.log(` - Guest match restarted cleanly; guestToken preserved.`);
    console.log(` - Unauthenticated request without token rejected with ${unauthorizedRes.status} Forbidden/Unauthorized.`);
    console.log('[PASS] Test 6: Guest restart works cleanly and preserves guestToken authorization.\n');

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
    console.log('   ALL 6 PROMPT 2 VERIFICATION TESTS PASSED WITH 100% SUCCESS!   ');
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

runMatchRestartTests();
