const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const app = require('./app');

async function testGameEndpoints() {
  console.log('=== FOLKBOARD PHASE 3 GAME CATALOGUE API TEST ===\n');
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const server = app.listen(5098);
    const BASE_URL = 'http://127.0.0.1:5098/api/games';

    // Test 1: GET /api/games (List all games)
    console.log('Test 1: GET /api/games (List Catalogue)');
    const listRes = await fetch(BASE_URL);
    const listData = await listRes.json();
    const cacheHeader = listRes.headers.get('cache-control');

    if (listRes.status === 200 && listData.count >= 2 && cacheHeader.includes('stale-while-revalidate')) {
      console.log(`  ✓ PASSED: Returned ${listData.count} games with Stale-While-Revalidate caching.`);
    } else {
      throw new Error(`Test 1 Failed: ${JSON.stringify(listData)}`);
    }

    // Test 2: GET /api/games/aadu-puli-aatam (Get by Slug)
    console.log('Test 2: GET /api/games/aadu-puli-aatam (Game Details with Variants)');
    const aaduRes = await fetch(`${BASE_URL}/aadu-puli-aatam`);
    const aaduData = await aaduRes.json();

    if (aaduRes.status === 200 && aaduData.data.name === 'Aadu Puli Aatam' && aaduData.data.variants?.length > 0) {
      console.log(`  ✓ PASSED: Retrieved Aadu Puli Aatam with ${aaduData.data.variants.length} regional variant(s).`);
    } else {
      throw new Error(`Test 2 Failed: ${JSON.stringify(aaduData)}`);
    }

    // Test 3: GET /api/games/pallanguzhi (Get Pallanguzhi by Slug)
    console.log('Test 3: GET /api/games/pallanguzhi (Pallanguzhi Details)');
    const palRes = await fetch(`${BASE_URL}/pallanguzhi`);
    const palData = await palRes.json();

    if (palRes.status === 200 && palData.data.name === 'Pallanguzhi' && palData.data.boardConfiguration.pitCount === 14) {
      console.log('  ✓ PASSED: Retrieved Pallanguzhi with 14-pit mancala board configuration.');
    } else {
      throw new Error(`Test 3 Failed: ${JSON.stringify(palData)}`);
    }

    // Test 4: Search filter
    console.log('Test 4: GET /api/games?search=Tigers (Search query)');
    const searchRes = await fetch(`${BASE_URL}?search=Tigers`);
    const searchData = await searchRes.json();

    if (searchRes.status === 200 && searchData.count >= 1) {
      console.log(`  ✓ PASSED: Search query matched ${searchData.count} game(s).`);
    } else {
      throw new Error(`Test 4 Failed: ${JSON.stringify(searchData)}`);
    }

    server.close();
    await mongoose.connection.close();
    console.log('\n🎉 ALL PHASE 3 GAME CATALOGUE TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test Error:', err.message);
    process.exit(1);
  }
}

testGameEndpoints();

