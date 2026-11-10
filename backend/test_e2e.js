const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');
const RefreshSession = require('./models/RefreshSession');
const Bookmark = require('./models/Bookmark');
const Match = require('./models/Match');
const Contribution = require('./models/Contribution');
const app = require('./app');

async function runE2ETests() {
  console.log('=== FOLKBOARD FULL END-TO-END SYSTEM TEST SUITE ===\n');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    const server = app.listen(5094);
    const BASE = 'http://127.0.0.1:5094/api';

    let accessToken = null;
    let refreshCookie = null;
    const testUsername = `preserver_e2e_${Date.now()}`;

    const apiCall = async (url, options = {}) => {
      const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
      if (accessToken && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      if (refreshCookie) {
        headers['Cookie'] = refreshCookie;
      }
      const res = await fetch(`${BASE}${url}`, { ...options, headers });
      const setCookie = res.headers.get('set-cookie');
      if (setCookie && setCookie.includes('refreshToken=')) {
        const match = setCookie.match(/refreshToken=([^;]+)/);
        if (match) refreshCookie = `refreshToken=${match[1]}`;
      }
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data, headers: res.headers };
    };

    // 1. Register
    console.log('1. User Registration (Phase 2 Auth)');
    const regRes = await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: testUsername,
        email: `${testUsername}@folkboard.org`,
        password: 'TraditionalPassword#2026',
      }),
    });
    if (regRes.status === 201 && regRes.data.accessToken) {
      accessToken = regRes.data.accessToken;
      console.log('  ✓ Registered user with memory access token & HttpOnly cookie.');
    } else {
      throw new Error(`Step 1 Failed: ${JSON.stringify(regRes)}`);
    }

    // 2. Explore Catalogue
    console.log('2. Explore Catalogue (Phase 3 Game Archive)');
    const catRes = await apiCall('/games');
    if (catRes.status === 200 && catRes.data.count >= 2) {
      console.log(`  ✓ Retrieved catalogue with ${catRes.data.count} traditional games.`);
    } else {
      throw new Error(`Step 2 Failed: ${JSON.stringify(catRes)}`);
    }

    // 3. Game Details
    console.log('3. Game Details & Regional Variants (Phase 3)');
    const detRes = await apiCall('/games/aadu-puli-aatam');
    if (detRes.status === 200 && detRes.data.data.variants.length > 0) {
      console.log(`  ✓ Retrieved Aadu Puli Aatam details with ${detRes.data.data.variants.length} regional variant(s).`);
    } else {
      throw new Error(`Step 3 Failed: ${JSON.stringify(detRes)}`);
    }

    // 4. Bookmark Game
    console.log('4. Bookmark Game (Phase 6 User Features)');
    const bmkRes = await apiCall('/bookmarks/aadu-puli-aatam', { method: 'POST' });
    if (bmkRes.status === 201) {
      console.log('  ✓ Game successfully bookmarked.');
    } else {
      throw new Error(`Step 4 Failed: ${JSON.stringify(bmkRes)}`);
    }

    // 5. Check User Bookmarks
    console.log('5. Retrieve User Bookmarks (Phase 6)');
    const listBmkRes = await apiCall('/bookmarks');
    if (listBmkRes.status === 200 && listBmkRes.data.count === 1) {
      console.log('  ✓ Bookmarks retrieved: 1 saved game.');
    } else {
      throw new Error(`Step 5 Failed: ${JSON.stringify(listBmkRes)}`);
    }

    // 6. Start Match
    console.log('6. Start Authoritative Match (Phase 4 Game Engine)');
    const startMatchRes = await apiCall('/matches', {
      method: 'POST',
      body: JSON.stringify({ gameSlug: 'aadu-puli-aatam', mode: 'pass_and_play' }),
    });
    let matchId = null;
    if (startMatchRes.status === 201) {
      matchId = startMatchRes.data.data.match._id;
      console.log(`  ✓ Match initiated: ID ${matchId}`);
    } else {
      throw new Error(`Step 6 Failed: ${JSON.stringify(startMatchRes)}`);
    }

    // 7. Legal Move
    console.log('7. Submit Legal Move (Phase 4 Engine)');
    const moveRes = await apiCall(`/matches/${matchId}/moves`, {
      method: 'POST',
      body: JSON.stringify({ from: null, to: 4, player: 'goats' }),
    });
    if (moveRes.status === 200 && moveRes.data.data.match.currentTurn === 'tigers') {
      console.log('  ✓ Legal move accepted authoritatively, turn passed to Tigers.');
    } else {
      throw new Error(`Step 7 Failed: ${JSON.stringify(moveRes)}`);
    }

    // 8. Explain My Move Rejection
    console.log('8. "Explain My Move" Invalid Move Rejection (Phase 4 / Section 13)');
    const badMoveRes = await apiCall(`/matches/${matchId}/moves`, {
      method: 'POST',
      body: JSON.stringify({ from: 1, to: 22, player: 'tigers' }),
    });
    if (badMoveRes.status === 400 && badMoveRes.data.rejectionReason) {
      console.log(`  ✓ Rejected with clear explanation: "${badMoveRes.data.rejectionReason}".`);
    } else {
      throw new Error(`Step 8 Failed: ${JSON.stringify(badMoveRes)}`);
    }

    // 9. Community Preservation Submission
    console.log('9. Submit Regional Preservation Variant (Phase 7 Preservation)');
    const contribRes = await apiCall('/contributions', {
      method: 'POST',
      body: JSON.stringify({
        contributorName: testUsername,
        contributorEmail: `${testUsername}@folkboard.org`,
        gameSlug: 'aadu-puli-aatam',
        submissionType: 'oral_rule',
        title: 'Village Thinnai Rule: 3-Goat Defense',
        region: 'Coimbatore District, Tamil Nadu',
        content: 'When 3 goats align along a triangle ray, the tiger cannot approach within 1 vertex.',
      }),
    });
    if (contribRes.status === 201) {
      console.log('  ✓ Preservation contribution submitted for curation.');
    } else {
      throw new Error(`Step 9 Failed: ${JSON.stringify(contribRes)}`);
    }

    // 10. Tutorial Step Retrieval
    console.log('10. Interactive Tutorial Steps (Phase 5 Learning)');
    const tutRes = await apiCall('/tutorials/aadu-puli-aatam');
    if (tutRes.status === 200 && tutRes.data.data.steps.length >= 3) {
      console.log(`  ✓ Tutorial steps retrieved: ${tutRes.data.data.steps.length} guided steps.`);
    } else {
      throw new Error(`Step 10 Failed: ${JSON.stringify(tutRes)}`);
    }

    // 11. FAQ Knowledge Search
    console.log('11. FAQ Knowledge Base (Phase 5 Learning)');
    const faqRes = await apiCall('/faqs?category=General');
    if (faqRes.status === 200 && faqRes.data.count >= 2) {
      console.log(`  ✓ FAQs retrieved: ${faqRes.data.count} general questions.`);
    } else {
      throw new Error(`Step 11 Failed: ${JSON.stringify(faqRes)}`);
    }

    // 12. User Profile Verification
    console.log('12. User Profile & Stats (Phase 6 User Features)');
    const profRes = await apiCall('/users/profile');
    if (profRes.status === 200 && profRes.data.data.stats.bookmarks === 1) {
      console.log('  ✓ User profile stats verified.');
    } else {
      throw new Error(`Step 12 Failed: ${JSON.stringify(profRes)}`);
    }

    // Teardown
    console.log('\n[Teardown] Cleaning up test records...');
    const userDoc = await User.findOneAndDelete({ username: testUsername });
    if (userDoc) {
      await RefreshSession.deleteMany({ userId: userDoc._id });
      await Bookmark.deleteMany({ userId: userDoc._id });
      await Contribution.deleteMany({ userId: userDoc._id });
      if (matchId) await Match.findByIdAndDelete(matchId);
    }
    console.log('[Teardown] Cleanup complete.');

    server.close();
    await mongoose.connection.close();
    console.log('\n🌟 ALL 12 END-TO-END TESTS PASSED WITH 100% SUCCESS!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ E2E Test Suite Error:', err.message);
    process.exit(1);
  }
}

runE2ETests();

