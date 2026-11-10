const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');
const Match = require('./models/Match');
const RefreshSession = require('./models/RefreshSession');
const app = require('./app');

async function runMatchSecurityTests() {
  console.log('=== FOLKBOARD MATCH SECURITY & OWNERSHIP TEST SUITE ===\n');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    const server = app.listen(5095);
    const BASE = 'http://127.0.0.1:5095/api';

    const timestamp = Date.now();
    const userAData = {
      username: `user_a_${timestamp}`,
      email: `user_a_${timestamp}@folkboard.org`,
      password: 'UserAPassword#2026',
    };
    const userBData = {
      username: `user_b_${timestamp}`,
      email: `user_b_${timestamp}@folkboard.org`,
      password: 'UserBPassword#2026',
    };

    let tokenA = null;
    let tokenB = null;

    // Helper for fetch
    const request = async (url, options = {}, token = null) => {
      const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${BASE}${url}`, { ...options, headers });
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    };

    // 1. Setup: Register User A and User B
    console.log('[Setup] Registering User A and User B...');
    const regARes = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userAData),
    });
    tokenA = regARes.data.accessToken;

    const regBRes = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userBData),
    });
    tokenB = regBRes.data.accessToken;
    console.log('[Setup] User A and User B registered successfully.\n');

    // 2. User A creates Match A (vs AI)
    console.log('[Setup] User A creates Match A (Aadu Puli Aatam vs AI)...');
    const matchARes = await request(
      '/matches',
      {
        method: 'POST',
        body: JSON.stringify({ gameSlug: 'aadu-puli-aatam', mode: 'vs_ai' }),
      },
      tokenA
    );
    const matchAId = matchARes.data.data.match._id;
    console.log(`[Setup] Match A created: ${matchAId} (Owned by User A)\n`);

    // 3. User B creates Match B (Pallanguzhi Pass & Play)
    console.log('[Setup] User B creates Match B (Pallanguzhi Pass & Play)...');
    const matchBRes = await request(
      '/matches',
      {
        method: 'POST',
        body: JSON.stringify({ gameSlug: 'pallanguzhi', mode: 'pass_and_play' }),
      },
      tokenB
    );
    const matchBId = matchBRes.data.data.match._id;
    console.log(`[Setup] Match B created: ${matchBId} (Owned by User B)\n`);

    // =========================================================================
    // TEST 1: User A CANNOT read User B's match (403 Forbidden)
    // =========================================================================
    console.log('TEST 1: User A attempts to READ User B\'s match (Expect 403 Forbidden)');
    const readBByA = await request(`/matches/${matchBId}`, { method: 'GET' }, tokenA);
    if (readBByA.status === 403) {
      console.log(`  ✓ PASSED: Blocked with 403 Forbidden: "${readBByA.data.message}"`);
    } else {
      throw new Error(`TEST 1 Failed: Expected 403, got ${readBByA.status} - ${JSON.stringify(readBByA.data)}`);
    }

    // =========================================================================
    // TEST 2: User A CANNOT modify (submit move to) User B's match (403 Forbidden)
    // =========================================================================
    console.log('TEST 2: User A attempts to SUBMIT A MOVE to User B\'s match (Expect 403 Forbidden)');
    const moveBByA = await request(
      `/matches/${matchBId}/moves`,
      {
        method: 'POST',
        body: JSON.stringify({ from: 0, player: 'player1' }),
      },
      tokenA
    );
    if (moveBByA.status === 403) {
      console.log(`  ✓ PASSED: Blocked with 403 Forbidden: "${moveBByA.data.message}"`);
    } else {
      throw new Error(`TEST 2 Failed: Expected 403, got ${moveBByA.status} - ${JSON.stringify(moveBByA.data)}`);
    }

    // =========================================================================
    // TEST 3: User A CANNOT restart User B's match (403 Forbidden)
    // =========================================================================
    console.log('TEST 3: User A attempts to RESTART User B\'s match (Expect 403 Forbidden)');
    const restartBByA = await request(
      `/matches/${matchBId}/restart`,
      { method: 'POST' },
      tokenA
    );
    if (restartBByA.status === 403) {
      console.log(`  ✓ PASSED: Blocked with 403 Forbidden: "${restartBByA.data.message}"`);
    } else {
      throw new Error(`TEST 3 Failed: Expected 403, got ${restartBByA.status} - ${JSON.stringify(restartBByA.data)}`);
    }

    // =========================================================================
    // TEST 4: Guest User CANNOT access User A's match (401 Unauthorized)
    // =========================================================================
    console.log('TEST 4: Unauthenticated Guest attempts to READ User A\'s match (Expect 401 Unauthorized)');
    const readAByGuest = await request(`/matches/${matchAId}`, { method: 'GET' }, null);
    if (readAByGuest.status === 401) {
      console.log(`  ✓ PASSED: Blocked with 401 Unauthorized: "${readAByGuest.data.message}"`);
    } else {
      throw new Error(`TEST 4 Failed: Expected 401, got ${readAByGuest.status} - ${JSON.stringify(readAByGuest.data)}`);
    }

    console.log('TEST 4b: Unauthenticated Guest attempts to MODIFY User A\'s match (Expect 401 Unauthorized)');
    const moveAByGuest = await request(
      `/matches/${matchAId}/moves`,
      {
        method: 'POST',
        body: JSON.stringify({ from: null, to: 4, player: 'goats' }),
      },
      null
    );
    if (moveAByGuest.status === 401) {
      console.log(`  ✓ PASSED: Blocked with 401 Unauthorized: "${moveAByGuest.data.message}"`);
    } else {
      throw new Error(`TEST 4b Failed: Expected 401, got ${moveAByGuest.status} - ${JSON.stringify(moveAByGuest.data)}`);
    }

    // =========================================================================
    // TEST 5: Match History Strictly Filtered by Authenticated User
    // =========================================================================
    console.log('TEST 5: Match History Access & Filtering');
    // 5a: Unauthenticated caller cannot view history
    const guestHistory = await request('/matches/history', { method: 'GET' }, null);
    if (guestHistory.status === 401) {
      console.log('  ✓ PASSED: Unauthenticated match history request rejected with 401.');
    } else {
      throw new Error(`TEST 5a Failed: Expected 401, got ${guestHistory.status}`);
    }

    // 5b: User A views history -> gets only Match A
    const historyA = await request('/matches/history', { method: 'GET' }, tokenA);
    const matchAFound = historyA.data.data.some((m) => m._id === matchAId);
    const matchBFoundInA = historyA.data.data.some((m) => m._id === matchBId);
    if (historyA.status === 200 && matchAFound && !matchBFoundInA) {
      console.log('  ✓ PASSED: User A history contains Match A and ZERO matches from User B.');
    } else {
      throw new Error(`TEST 5b Failed: User A history leaked other matches! ${JSON.stringify(historyA.data)}`);
    }

    // 5c: User B views history -> gets only Match B
    const historyB = await request('/matches/history', { method: 'GET' }, tokenB);
    const matchBFound = historyB.data.data.some((m) => m._id === matchBId);
    const matchAFoundInB = historyB.data.data.some((m) => m._id === matchAId);
    if (historyB.status === 200 && matchBFound && !matchAFoundInB) {
      console.log('  ✓ PASSED: User B history contains Match B and ZERO matches from User A.');
    } else {
      throw new Error(`TEST 5c Failed: User B history leaked other matches! ${JSON.stringify(historyB.data)}`);
    }

    // =========================================================================
    // TEST 6: User A CANNOT submit move as the AI player (400 Bad Request)
    // =========================================================================
    console.log('TEST 6: Human player in vs_ai mode tries to move as AI (Tigers)');
    const fakeAIMove = await request(
      `/matches/${matchAId}/moves`,
      {
        method: 'POST',
        body: JSON.stringify({ from: 0, to: 6, player: 'tigers' }),
      },
      tokenA
    );
    if (fakeAIMove.status === 400 && fakeAIMove.data.message.includes('AI')) {
      console.log(`  ✓ PASSED: Server rejected human moving as AI: "${fakeAIMove.data.message}"`);
    } else {
      throw new Error(`TEST 6 Failed: Expected 400, got ${fakeAIMove.status} - ${JSON.stringify(fakeAIMove.data)}`);
    }

    // =========================================================================
    // TEST 7: Owner can legally move on their own match
    // =========================================================================
    console.log('TEST 7: User A submits legal move on their own match');
    const legalMoveRes = await request(
      `/matches/${matchAId}/moves`,
      {
        method: 'POST',
        body: JSON.stringify({ from: null, to: 4, player: 'goats' }),
      },
      tokenA
    );
    if (legalMoveRes.status === 200 && legalMoveRes.data.data.match) {
      console.log('  ✓ PASSED: User A successfully moved on their own match.');
    } else {
      throw new Error(`TEST 7 Failed: Expected 200, got ${legalMoveRes.status}`);
    }

    // =========================================================================
    // TEST 8: Prevent moves after match is completed
    // =========================================================================
    console.log('TEST 8: Prevent move after match has completed');
    // Set match A to completed
    await Match.findByIdAndUpdate(matchAId, { status: 'completed', winner: 'goats' });
    const postCompleteMove = await request(
      `/matches/${matchAId}/moves`,
      {
        method: 'POST',
        body: JSON.stringify({ from: null, to: 5, player: 'goats' }),
      },
      tokenA
    );
    if (postCompleteMove.status === 400 && (postCompleteMove.data.message.includes('completed') || postCompleteMove.data.message.includes('already ended'))) {
      console.log(`  ✓ PASSED: Correctly blocked move on completed match: "${postCompleteMove.data.message}"`);
    } else {
      throw new Error(`TEST 8 Failed: Expected 400, got ${postCompleteMove.status}`);
    }

    // =========================================================================
    // TEARDOWN
    // =========================================================================
    console.log('\n[Teardown] Cleaning up test records from database...');
    const delA = await User.findOneAndDelete({ username: userAData.username });
    const delB = await User.findOneAndDelete({ username: userBData.username });
    if (delA) await RefreshSession.deleteMany({ userId: delA._id });
    if (delB) await RefreshSession.deleteMany({ userId: delB._id });
    await Match.findByIdAndDelete(matchAId);
    await Match.findByIdAndDelete(matchBId);
    console.log('[Teardown] Cleanup complete.');

    server.close();
    await mongoose.connection.close();
    console.log('\n🛡️ ALL 8 MATCH SECURITY & OWNERSHIP TESTS PASSED WITH 100% SUCCESS!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test Error:', err.message);
    process.exit(1);
  }
}

runMatchSecurityTests();

