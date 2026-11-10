const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const app = require('./app');
const FAQ = require('./models/FAQ');
const Game = require('./models/Game');

async function runFaqTests() {
  console.log('=================================================================');
  console.log('   FOLKBOARD - COMPREHENSIVE FAQ API & INTEGRATION TEST SUITE   ');
  console.log('=================================================================\n');

  let server;

  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/folkboard');
    const PORT = 5100;
    server = app.listen(PORT);
    const BASE = `http://127.0.0.1:${PORT}/api`;

    const request = async (url) => {
      const res = await fetch(`${BASE}${url}`);
      const data = await res.json().catch(() => ({}));
      const cacheControl = res.headers.get('cache-control');
      return { status: res.status, data, cacheControl };
    };

    // -------------------------------------------------------------
    // TEST 1: Retrieve All Published FAQs (GET /api/faqs)
    // -------------------------------------------------------------
    console.log('[TEST 1] Testing all published FAQs retrieval (GET /api/faqs)...');
    const allRes = await request('/faqs');
    if (allRes.status !== 200) {
      throw new Error(`FAIL: Expected status 200, got ${allRes.status}`);
    }
    if (!Array.isArray(allRes.data.data) || allRes.data.data.length === 0) {
      throw new Error('FAIL: No FAQs returned in data array!');
    }
    if (!allRes.cacheControl?.includes('stale-while-revalidate')) {
      throw new Error(`FAIL: Expected stale-while-revalidate cache header, got: ${allRes.cacheControl}`);
    }
    console.log(` - Retrieved ${allRes.data.count} published FAQs.`);
    console.log(` - Cache-Control header: ${allRes.cacheControl}`);
    console.log('[PASS] Test 1: All published FAQs retrieved with HTTP caching headers.\n');

    // -------------------------------------------------------------
    // TEST 2: Category Filtering (GET /api/faqs?category=...)
    // -------------------------------------------------------------
    console.log('[TEST 2] Testing category filtering on FAQs...');
    const catRes = await request('/faqs?category=General');
    if (catRes.status !== 200) {
      throw new Error(`FAIL: Category query failed: ${catRes.status}`);
    }
    const allGeneral = catRes.data.data.every((f) => f.category === 'General');
    if (!allGeneral) {
      throw new Error('FAIL: Not all returned FAQs have category=General!');
    }
    console.log(` - Filter category=General returned ${catRes.data.count} items, all verified as 'General'.`);

    const aaduCatRes = await request('/faqs?category=Aadu%20Puli%20Aatam');
    if (aaduCatRes.data.count === 0) {
      throw new Error('FAIL: Expected Aadu Puli Aatam category FAQs, got 0!');
    }
    console.log(` - Filter category=Aadu Puli Aatam returned ${aaduCatRes.data.count} items.`);
    console.log('[PASS] Test 2: Category filtering verified.\n');

    // -------------------------------------------------------------
    // TEST 3: FAQ Search Functionality (GET /api/faqs?search=...)
    // -------------------------------------------------------------
    console.log('[TEST 3] Testing FAQ search functionality...');
    const searchRes = await request('/faqs?search=tiger');
    if (searchRes.status !== 200) {
      throw new Error(`FAIL: Search request failed: ${searchRes.status}`);
    }
    if (searchRes.data.count === 0) {
      throw new Error('FAIL: Search for "tiger" returned 0 matches!');
    }
    const matchesKeyword = searchRes.data.data.some(
      (f) => f.question.toLowerCase().includes('tiger') || f.answer.toLowerCase().includes('tiger')
    );
    if (!matchesKeyword) {
      throw new Error('FAIL: Search results did not contain the search keyword!');
    }
    console.log(` - Search for "tiger" matched ${searchRes.data.count} FAQs.`);
    console.log(` - Example match: "${searchRes.data.data[0].question}"`);
    console.log('[PASS] Test 3: FAQ search returns relevant keyword matches.\n');

    // -------------------------------------------------------------
    // TEST 4: Game-Specific FAQs by Slug (GET /api/faqs/game/:slug)
    // -------------------------------------------------------------
    console.log('[TEST 4] Testing game-specific FAQ endpoint (GET /api/faqs/game/:gameSlug)...');
    const aaduGameFaqs = await request('/faqs/game/aadu-puli-aatam');
    if (aaduGameFaqs.status !== 200) {
      throw new Error(`FAIL: Game FAQs failed: ${aaduGameFaqs.status}`);
    }
    if (aaduGameFaqs.data.count === 0) {
      throw new Error('FAIL: No FAQs found for Aadu Puli Aatam!');
    }
    console.log(` - GET /api/faqs/game/aadu-puli-aatam returned ${aaduGameFaqs.data.count} contextual FAQs.`);

    const palGameFaqs = await request('/faqs/game/pallanguzhi');
    if (palGameFaqs.status !== 200) {
      throw new Error(`FAIL: Pallanguzhi FAQs failed: ${palGameFaqs.status}`);
    }
    if (palGameFaqs.data.count === 0) {
      throw new Error('FAIL: No FAQs found for Pallanguzhi!');
    }
    console.log(` - GET /api/faqs/game/pallanguzhi returned ${palGameFaqs.data.count} contextual FAQs.`);
    console.log('[PASS] Test 4: Game-specific FAQs by slug work for both Aadu Puli and Pallanguzhi.\n');

    // -------------------------------------------------------------
    // TEST 5: Alternate Game Route Compatibility (GET /api/games/:idOrSlug/faqs)
    // -------------------------------------------------------------
    console.log('[TEST 5] Testing alternate frontend route (GET /api/games/:idOrSlug/faqs)...');
    const gameRouteRes = await request('/games/aadu-puli-aatam/faqs');
    if (gameRouteRes.status !== 200) {
      throw new Error(`FAIL: /games/aadu-puli-aatam/faqs failed: ${gameRouteRes.status}`);
    }
    if (gameRouteRes.data.count !== aaduGameFaqs.data.count) {
      throw new Error('FAIL: Count mismatch between /faqs/game and /games/:slug/faqs!');
    }
    console.log(` - GET /api/games/aadu-puli-aatam/faqs returned identical ${gameRouteRes.data.count} FAQs.`);

    // Test with MongoDB Game ObjectId
    const aaduGameDoc = await Game.findOne({ slug: 'aadu-puli-aatam' });
    if (aaduGameDoc) {
      const objectIdFaqs = await request(`/games/${aaduGameDoc._id}/faqs`);
      if (objectIdFaqs.status !== 200 || objectIdFaqs.data.count === 0) {
        throw new Error('FAIL: Lookup by Game ObjectId failed!');
      }
      console.log(` - GET /api/games/${aaduGameDoc._id}/faqs (by ObjectId) returned ${objectIdFaqs.data.count} FAQs.`);
    }
    console.log('[PASS] Test 5: Route compatibility verified for both slug and Game ObjectId.\n');

    // -------------------------------------------------------------
    // TEST 6: Individual FAQ Retrieval by ID (GET /api/faqs/:id)
    // -------------------------------------------------------------
    console.log('[TEST 6] Testing individual FAQ item retrieval (GET /api/faqs/:id)...');
    const firstFaq = allRes.data.data[0];
    const faqIdRes = await request(`/faqs/${firstFaq._id}`);
    if (faqIdRes.status !== 200) {
      throw new Error(`FAIL: Expected status 200, got ${faqIdRes.status}`);
    }
    if (faqIdRes.data.data._id !== firstFaq._id) {
      throw new Error('FAIL: ID mismatch in single FAQ retrieval!');
    }
    if (faqIdRes.data.data.question !== firstFaq.question) {
      throw new Error('FAIL: Question content mismatch!');
    }
    console.log(` - Retrieved single FAQ: "${faqIdRes.data.data.question}" (ID: ${firstFaq._id})`);

    // Test non-existent ID
    const fakeId = new mongoose.Types.ObjectId();
    const notFoundRes = await request(`/faqs/${fakeId}`);
    if (notFoundRes.status !== 404) {
      throw new Error(`FAIL: Expected 404 for non-existent FAQ, got ${notFoundRes.status}`);
    }
    console.log(` - Non-existent ID correctly returned 404 Not Found.`);

    // Test malformed ID
    const malformedRes = await request('/faqs/invalid-not-an-id');
    if (malformedRes.status !== 400) {
      throw new Error(`FAIL: Expected 400 for malformed FAQ ID, got ${malformedRes.status}`);
    }
    console.log(` - Malformed ID correctly returned 400 Bad Request.`);
    console.log('[PASS] Test 6: Individual FAQ item retrieval and error bounds verified.\n');

    // -------------------------------------------------------------
    // TEST 7: Single Authoritative Collection Verification
    // -------------------------------------------------------------
    console.log('[TEST 7] Verifying single authoritative FAQ collection in MongoDB...');
    const mongoCount = await FAQ.countDocuments({ status: 'published' });
    if (mongoCount !== allRes.data.count) {
      throw new Error(`FAIL: Collection count (${mongoCount}) != API count (${allRes.data.count})`);
    }
    console.log(` - Authoritative MongoDB FAQ collection count: ${mongoCount}`);
    console.log(` - API published count matches database count exactly.`);
    console.log('[PASS] Test 7: Single authoritative MongoDB collection confirmed.\n');

    server.close();
    await mongoose.connection.close();

    console.log('=================================================================');
    console.log('   ALL 7 PROMPT 4 VERIFICATION TESTS PASSED WITH 100% SUCCESS!   ');
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

runFaqTests();

