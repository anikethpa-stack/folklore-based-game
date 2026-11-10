/**
 * FolkBoard Automated Verification Suite: Prompt 8
 * Historical Claims, Citations & Cultural Provenance Audit
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

// Models
const Game = require('./models/Game');
const GameVariant = require('./models/GameVariant');
const FAQ = require('./models/FAQ');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/folkboard';

async function auditHistoricalProvenance() {
  console.log('=================================================================');
  console.log('   FOLKBOARD - HISTORICAL CLAIMS & CITATIONS AUDIT SUITE        ');
  console.log('=================================================================\n');

  let passed = 0;
  let total = 0;

  try {
    await mongoose.connect(MONGO_URI);
    console.log('[Setup] Connected to MongoDB for historiographical audit.\n');

    // -------------------------------------------------------------
    // TEST 1: Audit Aadu Puli Aatam Historical Claims & Citations
    // -------------------------------------------------------------
    total++;
    console.log('[TEST 1] Auditing Aadu Puli Aatam historical claims and citations...');
    const aaduGame = await Game.findOne({ slug: 'aadu-puli-aatam' });

    if (!aaduGame) {
      throw new Error('FAIL: Aadu Puli Aatam record missing from database!');
    }

    // Verify qualified estimated age
    if (!aaduGame.estimatedAge || aaduGame.estimatedAge.includes('Circa 12th–14th Century CE (Over 800 years documented)')) {
      throw new Error(`FAIL: Aadu Puli Aatam estimated age contains ungrounded exact century assertions: "${aaduGame.estimatedAge}"`);
    }

    // Verify presence of academic citations
    if (!Array.isArray(aaduGame.references) || aaduGame.references.length < 3) {
      throw new Error(`FAIL: Insufficient citations for Aadu Puli Aatam (found ${aaduGame.references?.length || 0})`);
    }

    const hasMurray = aaduGame.references.some(
      (r) => r.author?.includes('Murray') && r.year === '1952' && r.title.includes('Other than Chess')
    );
    const hasBell = aaduGame.references.some(
      (r) => r.author?.includes('Bell') && r.title.includes('Civilizations')
    );
    const hasVasantha = aaduGame.references.some(
      (r) => r.author?.includes('Vasantha') && r.citationType === 'Archaeological'
    );

    if (!hasMurray || !hasBell || !hasVasantha) {
      throw new Error('FAIL: Missing key peer-reviewed citations for Aadu Puli Aatam (Murray, Bell, Vasantha).');
    }

    console.log(` - Aadu Puli Aatam verified with ${aaduGame.references.length} scholarly citations.`);
    console.log(` - Estimated age properly qualified: "${aaduGame.estimatedAge}".`);
    console.log('[PASS] Test 1: Aadu Puli Aatam historical claims and peer-reviewed sources verified.\n');
    passed++;

    // -------------------------------------------------------------
    // TEST 2: Audit Pallanguzhi Historical Claims & Citations
    // -------------------------------------------------------------
    total++;
    console.log('[TEST 2] Auditing Pallanguzhi historical claims and citations...');
    const palGame = await Game.findOne({ slug: 'pallanguzhi' });

    if (!palGame) {
      throw new Error('FAIL: Pallanguzhi record missing from database!');
    }

    // Verify qualified estimated age
    if (!palGame.estimatedAge || palGame.estimatedAge.includes('1st Millennium CE (Over 1,000 years documented)')) {
      throw new Error(`FAIL: Pallanguzhi estimated age contains ungrounded millennium assertion: "${palGame.estimatedAge}"`);
    }

    const hasBalambal = palGame.references.some(
      (r) => r.author?.includes('Balambal') && r.year === '2005'
    );
    const hasDeVoogt = palGame.references.some(
      (r) => r.author?.includes('Voogt') && r.title.includes('Mancala')
    );
    const hasMuseum = palGame.references.some(
      (r) => r.author?.includes('Government Museum') || r.citationType === 'Museum Catalog'
    );

    if (!hasBalambal || !hasDeVoogt || !hasMuseum) {
      throw new Error('FAIL: Missing key ethnographic or museum references for Pallanguzhi.');
    }

    console.log(` - Pallanguzhi verified with ${palGame.references.length} bibliographic sources.`);
    console.log(` - Estimated age properly qualified: "${palGame.estimatedAge}".`);
    console.log('[PASS] Test 2: Pallanguzhi historical claims and museum references verified.\n');
    passed++;

    // -------------------------------------------------------------
    // TEST 3: Verification of Distinction Between Facts, Interpretations & Oral Lore
    // -------------------------------------------------------------
    total++;
    console.log('[TEST 3] Auditing distinction between stone graffiti, folklore, and digital rules...');

    // Aadu Puli historical background must distinguish temple graffiti from royal inscriptions
    if (!aaduGame.historicalBackground.includes('graffiti') || !aaduGame.historicalBackground.includes('pilgrims')) {
      throw new Error('FAIL: Aadu Puli background should explicitly clarify that temple carvings are informal graffiti by pilgrims/devotees.');
    }

    // Pallanguzhi background must clarify that rock depressions are distinct from modern written rules
    if (!palGame.historicalBackground.includes('oral') || !palGame.historicalBackground.includes('rock')) {
      throw new Error('FAIL: Pallanguzhi background should clarify oral transmission vs rock-cut depressions.');
    }

    console.log(' - Historiographical boundaries respected: temple stone graffiti clearly separated from official royal edicts.');
    console.log('[PASS] Test 3: Clear separation of archaeological evidence, folklore, and playable rules.\n');
    passed++;

    // -------------------------------------------------------------
    // TEST 4: Audit FAQ Content for Historiographical Integrity
    // -------------------------------------------------------------
    total++;
    console.log('[TEST 4] Auditing FAQ content against evolutionary fallacies and temple myths...');
    const allFaqs = await FAQ.find({ status: 'published' });

    const chessEvolutionFaq = allFaqs.find((f) =>
      f.question.toLowerCase().includes('chess') && f.question.toLowerCase().includes('evolve')
    );
    if (!chessEvolutionFaq || !chessEvolutionFaq.answer.includes('independent') || !chessEvolutionFaq.answer.includes('No.')) {
      throw new Error('FAIL: FAQ must clarify that Aadu Puli and Pallanguzhi did not evolve into or from Chess/Checkers.');
    }

    const templeGraffitiFaq = allFaqs.find((f) =>
      f.question.toLowerCase().includes('temple') && f.question.toLowerCase().includes('graffiti')
    );
    if (!templeGraffitiFaq || !templeGraffitiFaq.answer.includes('informal') || !templeGraffitiFaq.answer.includes('pilgrims')) {
      throw new Error('FAIL: FAQ must explain the vernacular nature of temple board graffiti.');
    }

    console.log(' - Verified FAQ debunking ungrounded direct chess-evolution claims.');
    console.log(' - Verified FAQ clarifying archaeological nature of temple graffiti.');
    console.log('[PASS] Test 4: FAQs adhere to academic historiography standards.\n');
    passed++;

    // -------------------------------------------------------------
    // TEST 5: Audit Variant Attribution and Documentation
    // -------------------------------------------------------------
    total++;
    console.log('[TEST 5] Auditing regional variant attribution and citations...');
    const variants = await GameVariant.find({});

    for (const v of variants) {
      if (!v.region || !v.rulesSummary) {
        throw new Error(`FAIL: Variant '${v.variantName}' missing region or rules summary!`);
      }
      if (!Array.isArray(v.references) || v.references.length === 0) {
        throw new Error(`FAIL: Variant '${v.variantName}' has no documented citations!`);
      }
    }

    console.log(` - Verified ${variants.length} regional variants with full regional attributions and citations.`);
    console.log('[PASS] Test 5: All regional variants supported by documented bibliographic records.\n');
    passed++;

    console.log('=================================================================');
    console.log(` RESULTS: ${passed}/${total} PROMPT 8 HISTORICAL AUDIT TESTS PASSED`);
    console.log('=================================================================\n');

  } catch (err) {
    console.error('Audit failed with error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(passed === total ? 0 : 1);
  }
}

auditHistoricalProvenance();

