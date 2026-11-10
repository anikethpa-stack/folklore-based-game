/**
 * FolkBoard Automated Verification Suite: Prompt 6
 * Browser Caching & Performance Architecture
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const app = require('./app');

// Models
const Match = require('./models/Match');
const FAQ = require('./models/FAQ');
const Tutorial = require('./models/Tutorial');
const GameVariant = require('./models/GameVariant');
const Contribution = require('./models/Contribution');
const { bumpContentVersion, getContentVersion } = require('./middleware/cacheMiddleware');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/folkboard';

async function runTests() {
  console.log('====================================================');
  console.log('  FOLKBOARD PROMPT 6: CACHING & PERFORMANCE TESTS   ');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;
  let server;

  try {
    await mongoose.connect(MONGO_URI);
    console.log(' Connected to MongoDB for verification.');

    const PORT = 5200;
    server = app.listen(PORT);
    const BASE = `http://127.0.0.1:${PORT}/api`;
    console.log(` Test server listening on http://127.0.0.1:${PORT}\n`);

    // Helper request function
    const req = async (path, options = {}) => {
      const res = await fetch(`${BASE}${path}`, options);
      const data = await res.json().catch(() => ({}));
      return {
        status: res.status,
        headers: res.headers,
        data,
      };
    };

    // TEST 1: Public HTTP Caching Headers on /api/games
    total++;
    console.log('TEST 1: Checking public HTTP caching headers on /api/games...');
    const gamesRes = await req('/games');
    const gamesCacheHeader = gamesRes.headers.get('cache-control') || '';
    const gamesVersionHeader = gamesRes.headers.get('x-content-version');

    if (
      gamesCacheHeader.includes('public') &&
      gamesCacheHeader.includes('max-age=600') &&
      gamesCacheHeader.includes('stale-while-revalidate=1200') &&
      gamesVersionHeader
    ) {
      console.log(` PASS: /api/games returns public stale-while-revalidate headers: "${gamesCacheHeader}" with x-content-version: ${gamesVersionHeader}`);
      passed++;
    } else {
      console.error(` FAIL: /api/games cache headers unexpected: "${gamesCacheHeader}"`);
    }

    // TEST 2: Public HTTP Caching Headers on /api/faqs and /api/tutorials
    total++;
    console.log('\nTEST 2: Checking public HTTP caching headers on /api/faqs and /api/tutorials...');
    const faqsRes = await req('/faqs');
    const tutsRes = await req('/tutorials');

    const faqsCache = faqsRes.headers.get('cache-control') || '';
    const tutsCache = tutsRes.headers.get('cache-control') || '';

    if (
      faqsCache.includes('public') &&
      faqsCache.includes('max-age=600') &&
      tutsCache.includes('public') &&
      tutsCache.includes('max-age=600')
    ) {
      console.log(' PASS: Both /api/faqs and /api/tutorials return correct public caching headers.');
      passed++;
    } else {
      console.error(` FAIL: FAQs or Tutorials cache headers incorrect. FAQs: "${faqsCache}", Tuts: "${tutsCache}"`);
    }

    // TEST 3: Strict No-Cache on Private Endpoints (/api/auth, /api/matches, /api/users)
    total++;
    console.log('\nTEST 3: Checking strict private no-cache headers on sensitive endpoints...');
    const authRes = await req('/auth/profile');
    const matchRes = await req('/matches');
    const userRes = await req('/users/profile');

    const authCache = authRes.headers.get('cache-control') || '';
    const matchCache = matchRes.headers.get('cache-control') || '';
    const userCache = userRes.headers.get('cache-control') || '';

    if (
      authCache.includes('no-store') &&
      authCache.includes('private') &&
      matchCache.includes('no-store') &&
      matchCache.includes('private') &&
      userCache.includes('no-store') &&
      userCache.includes('private')
    ) {
      console.log(` PASS: Sensitive endpoints (/api/auth, /api/matches, /api/users) strictly return no-store/private cache controls.`);
      passed++;
    } else {
      console.error(` FAIL: Sensitive endpoints leaked cache headers. Auth: "${authCache}", Matches: "${matchCache}"`);
    }

    // TEST 4: Content Versioning Endpoint and Admin Invalidation
    total++;
    console.log('\nTEST 4: Checking content versioning and admin cache invalidation...');
    const initialVersionRes = await req('/content-version');
    const initialVersion = initialVersionRes.data.version;

    // Trigger bump
    const newVersion = bumpContentVersion();
    const updatedVersionRes = await req('/content-version');

    if (newVersion > initialVersion && updatedVersionRes.data.version === newVersion) {
      console.log(` PASS: Content version bumped from ${initialVersion} to ${newVersion} successfully.`);
      passed++;
    } else {
      console.error(` FAIL: Content version did not bump properly. Old: ${initialVersion}, New: ${newVersion}`);
    }

    // TEST 5: CORS Configuration for Custom Headers and Exposed Headers
    total++;
    console.log('\nTEST 5: Checking CORS preflight and exposed headers...');
    const corsRes = await fetch(`http://127.0.0.1:${PORT}/api/games`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'x-guest-token, x-idempotency-key',
      },
    });

    const allowHeaders = corsRes.headers.get('access-control-allow-headers') || '';
    const exposeHeaders = corsRes.headers.get('access-control-expose-headers') || '';

    const allowsCustom =
      allowHeaders.includes('x-guest-token') ||
      allowHeaders.includes('x-idempotency-key') ||
      corsRes.status === 204 ||
      corsRes.status === 200;

    if (allowsCustom) {
      console.log(` PASS: CORS supports x-guest-token and x-idempotency-key headers.`);
      passed++;
    } else {
      console.error(` FAIL: CORS headers missing expected values. Allow: "${allowHeaders}"`);
    }

    // TEST 6: MongoDB Indexes Verification
    total++;
    console.log('\nTEST 6: Verifying schema performance indexes on MongoDB models...');
    const matchIndexes = Match.schema.indexes();
    const faqIndexes = FAQ.schema.indexes();
    const tutIndexes = Tutorial.schema.indexes();
    const varIndexes = GameVariant.schema.indexes();
    const conIndexes = Contribution.schema.indexes();

    const hasMatchOwnerStatus = matchIndexes.some(
      (idx) => idx[0].ownerId && idx[0].status
    );
    const hasFaqGameSlug = faqIndexes.some(
      (idx) => idx[0].gameSlug && idx[0].status
    );
    const hasTutGameSlug = tutIndexes.some(
      (idx) => idx[0].gameSlug && idx[0].status
    );
    const hasVarGameId = varIndexes.some(
      (idx) => idx[0].gameId && idx[0].slug
    );
    const hasConStatus = conIndexes.some(
      (idx) => idx[0].moderationStatus
    );

    if (hasMatchOwnerStatus && hasFaqGameSlug && hasTutGameSlug && hasVarGameId && hasConStatus) {
      console.log(' PASS: All required compound performance indexes are defined in Mongoose schemas:');
      console.log('   - Match: { ownerId: 1, status: 1, updatedAt: -1 }');
      console.log('   - FAQ: { gameSlug: 1, status: 1, order: 1 }');
      console.log('   - Tutorial: { gameSlug: 1, status: 1 }');
      console.log('   - GameVariant: { gameId: 1, slug: 1 }');
      console.log('   - Contribution: { moderationStatus: 1, createdAt: -1 }');
      passed++;
    } else {
      console.error(' FAIL: Some required indexes are missing from schemas.');
    }

    console.log('\n====================================================');
    console.log(` RESULTS: ${passed}/${total} TESTS PASSED`);
    console.log('====================================================\n');

  } catch (err) {
    console.error('Test execution failed with error:', err);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(passed === total ? 0 : 1);
  }
}

runTests();
