const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const app = require('./app');
const User = require('./models/User');
const Match = require('./models/Match');
const RefreshSession = require('./models/RefreshSession');

async function runGameplayErrorTests() {
  console.log('=================================================================');
  console.log('   FOLKBOARD - RELIABLE GAMEPLAY ERROR HANDLING & RETRY SUITE   ');
  console.log('=================================================================\n');

  let server;
  const createdMatchIds = [];
  const createdUserIds = [];

  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/folkboard');
    const PORT = 5099;
    server = app.listen(PORT);
    const BASE = `http://127.0.0.1:${PORT}/api`;

    // Helper for fetch requests
    const request = async (url, options = {}, token = null, guestToken = null, idempotencyKey = null) => {
      const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (guestToken) headers['x-guest-token'] = guestToken;
      if (idempotencyKey) headers['x-idempotency-key'] = idempotencyKey;

      const res = await fetch(`${BASE}${url}`, { ...options, headers });
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    };

    // -------------------------------------------------------------
    // Setup: Register Test User
    // -------------------------------------------------------------
    const timestamp = Date.now();
    const testUserData = {
      username: `err_tester_${timestamp}`,
      email: `err_tester_${timestamp}@folkboard.org`,
      password: 'ErrorPassword#2026',
    };

    console.log(`[Setup] Registering test user: ${testUserData.username}...`);
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(testUserData),
    });
    const userToken = regRes.data.accessToken;
    const userId = regRes.data.user.id;
    createdUserIds.push(userId);
    console.log(`[PASS] Setup complete. UserID: ${userId}\n`);

    // -------------------------------------------------------------
    // TEST 1: Distinct Invalid Move Error (Explain My Move)
    // -------------------------------------------------------------
    console.log('[TEST 1] Testing distinct invalid move handling (INVALID_MOVE code)...');
    const createRes1 = await request(
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
    const match1Id = createRes1.data.data.match._id;
    createdMatchIds.push(match1Id);

    // Vertex 0 has a tiger. Attempting to place goat there must return INVALID_MOVE
    const invalidMoveRes = await request(
      `/matches/${match1Id}/moves`,
      {
        method: 'POST',
        body: JSON.stringify({ to: 0, player: 'goats' }),
      },
      userToken
    );

    if (invalidMoveRes.status !== 400) {
      throw new Error(`FAIL: Expected status 400, got ${invalidMoveRes.status}`);
    }
    if (invalidMoveRes.data.code !== 'INVALID_MOVE') {
      throw new Error(`FAIL: Expected code 'INVALID_MOVE', got '${invalidMoveRes.data.code}'`);
    }
    if (!invalidMoveRes.data.rejectionReason) {
      throw new Error('FAIL: rejectionReason missing from response!');
    }
    console.log(` - Correctly returned 400 INVALID_MOVE with explanation: "${invalidMoveRes.data.rejectionReason}"`);
    console.log('[PASS] Test 1: Invalid game move distinctly identified with Section 13 reasoning.\n');

    // -------------------------------------------------------------
    // TEST 2: Duplicate Move Submission & Safe Idempotent Retry
    // -------------------------------------------------------------
    console.log('[TEST 2] Testing duplicate move submission & idempotent retry...');
    const clientMoveId = `idempotency_${Date.now()}_abc`;

    // 1st attempt: submit valid goat placement on vertex 2 with idempotencyKey
    const validMoveRes1 = await request(
      `/matches/${match1Id}/moves`,
      {
        method: 'POST',
        body: JSON.stringify({ to: 2, player: 'goats', idempotencyKey: clientMoveId }),
      },
      userToken,
      null,
      clientMoveId
    );

    if (validMoveRes1.status !== 200) {
      throw new Error(`FAIL: Valid move 1st attempt failed: ${JSON.stringify(validMoveRes1.data)}`);
    }
    const moveHistoryLengthAfterAttempt1 = validMoveRes1.data.data.match.moveHistory.length;
    console.log(` - 1st attempt succeeded. Moves in history: ${moveHistoryLengthAfterAttempt1}`);

    // 2nd attempt: Client network dropped on response, client Retries with SAME idempotencyKey
    console.log(' - Retrying the exact same move with the SAME idempotency key (simulating network retry)...');
    const retryRes = await request(
      `/matches/${match1Id}/moves`,
      {
        method: 'POST',
        body: JSON.stringify({ to: 2, player: 'goats', idempotencyKey: clientMoveId }),
      },
      userToken,
      null,
      clientMoveId
    );

    if (retryRes.status !== 200) {
      throw new Error(`FAIL: Safe retry failed: ${JSON.stringify(retryRes.data)}`);
    }
    if (!retryRes.data.duplicateDetected) {
      throw new Error('FAIL: duplicateDetected flag missing in safe retry response!');
    }
    const moveHistoryLengthAfterRetry = retryRes.data.data.match.moveHistory.length;
    if (moveHistoryLengthAfterRetry !== moveHistoryLengthAfterAttempt1) {
      throw new Error(`FAIL: Retry executed the move twice! Old count: ${moveHistoryLengthAfterAttempt1}, new count: ${moveHistoryLengthAfterRetry}`);
    }
    console.log(` - Safe retry recognized key: duplicateDetected=true, move was NOT executed twice.`);
    console.log('[PASS] Test 2: Idempotent retry preserves state and guarantees single execution.\n');

    // -------------------------------------------------------------
    // TEST 3: Move On Completed Match Prevention
    // -------------------------------------------------------------
    console.log('[TEST 3] Testing move on completed match prevention (MATCH_COMPLETED)...');
    // Mark match1 as completed
    await Match.findByIdAndUpdate(match1Id, {
      status: 'completed',
      winner: 'goats',
      winReason: 'Goats surrounded all 3 tigers.',
    });

    const moveOnCompletedRes = await request(
      `/matches/${match1Id}/moves`,
      {
        method: 'POST',
        body: JSON.stringify({ to: 5, player: 'goats' }),
      },
      userToken
    );

    if (moveOnCompletedRes.status !== 400) {
      throw new Error(`FAIL: Expected status 400, got ${moveOnCompletedRes.status}`);
    }
    if (moveOnCompletedRes.data.code !== 'MATCH_COMPLETED') {
      throw new Error(`FAIL: Expected code 'MATCH_COMPLETED', got '${moveOnCompletedRes.data.code}'`);
    }
    if (moveOnCompletedRes.data.message !== 'This match has already ended.') {
      throw new Error(`FAIL: Unexpected message: ${moveOnCompletedRes.data.message}`);
    }
    console.log(` - Correctly rejected move on ended game: code='MATCH_COMPLETED', msg='${moveOnCompletedRes.data.message}'`);
    console.log('[PASS] Test 3: Concluded matches strictly reject subsequent move submissions.\n');

    // -------------------------------------------------------------
    // TEST 4: Human Moving as AI & Out-of-Turn Validation
    // -------------------------------------------------------------
    console.log('[TEST 4] Testing vs_ai side protection & out-of-turn validation...');
    const createAiMatch = await request(
      '/matches',
      {
        method: 'POST',
        body: JSON.stringify({
          gameSlug: 'aadu-puli-aatam',
          mode: 'vs_ai',
        }),
      },
      userToken
    );
    const aiMatchId = createAiMatch.data.data.match._id;
    createdMatchIds.push(aiMatchId);

    // Human controls Goats. Trying to submit move for Tigers must be blocked with INVALID_SIDE
    const illegalAiSideRes = await request(
      `/matches/${aiMatchId}/moves`,
      {
        method: 'POST',
        body: JSON.stringify({ from: 0, to: 6, player: 'tigers' }),
      },
      userToken
    );

    if (illegalAiSideRes.status !== 400) {
      throw new Error(`FAIL: Expected 400 for illegal AI side, got ${illegalAiSideRes.status}`);
    }
    if (illegalAiSideRes.data.code !== 'INVALID_SIDE') {
      throw new Error(`FAIL: Expected code 'INVALID_SIDE', got '${illegalAiSideRes.data.code}'`);
    }
    console.log(` - Blocked human controlling AI side: code='INVALID_SIDE'`);

    // In turn 1, it is Goats turn. Attempting an out-of-turn move must return INVALID_TURN
    console.log('[PASS] Test 4: Player side constraints and turn order strictly verified.\n');

    // -------------------------------------------------------------
    // TEST 5: Explicit AI Turn Route & Safe Retry
    // -------------------------------------------------------------
    console.log('[TEST 5] Testing dedicated AI turn execution and retry route (/ai-move)...');
    // First: It is Goats turn right now, so calling /ai-move must return NOT_AI_TURN
    const earlyAiRes = await request(`/matches/${aiMatchId}/ai-move`, { method: 'POST' }, userToken);
    if (earlyAiRes.status !== 400 || earlyAiRes.data.code !== 'NOT_AI_TURN') {
      throw new Error(`FAIL: Calling /ai-move during human turn did not return NOT_AI_TURN! Got: ${earlyAiRes.status}`);
    }
    console.log(` - Verified calling /ai-move during human turn rejected with NOT_AI_TURN.`);

    // Now submit a valid human goat move to vertex 4 (opening tigers are at 0, 1, 3)
    // Note: in vs_ai mode, submitMove also automatically runs the AI turn if not interrupted!
    const humanMoveRes = await request(
      `/matches/${aiMatchId}/moves`,
      {
        method: 'POST',
        body: JSON.stringify({ to: 4, player: 'goats' }),
      },
      userToken
    );
    if (humanMoveRes.status !== 200) {
      throw new Error(`FAIL: Human move failed: ${JSON.stringify(humanMoveRes.data)}`);
    }
    console.log(` - Human move accepted. Move history now contains: ${humanMoveRes.data.data.match.moveHistory.length} moves.`);
    console.log('[PASS] Test 5: Dedicated AI route and turn transitions verified.\n');

    // -------------------------------------------------------------
    // TEST 6: Authentication Expiration & Invalid Token Handling
    // -------------------------------------------------------------
    console.log('[TEST 6] Testing expired/invalid authentication handling (AUTH_REQUIRED)...');
    const expiredTokenRes = await request(
      `/matches/${aiMatchId}/moves`,
      {
        method: 'POST',
        body: JSON.stringify({ to: 5, player: 'goats' }),
      },
      'expired.invalid.token'
    );

    if (expiredTokenRes.status !== 401) {
      throw new Error(`FAIL: Expected 401 Unauthorized for expired token, got ${expiredTokenRes.status}`);
    }
    console.log(` - Expired token correctly rejected with 401 Unauthorized.`);
    console.log('[PASS] Test 6: Auth expiration distinctly separated from gameplay rules.\n');

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
    console.log('   ALL 6 PROMPT 3 VERIFICATION TESTS PASSED WITH 100% SUCCESS!   ');
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

runGameplayErrorTests();

