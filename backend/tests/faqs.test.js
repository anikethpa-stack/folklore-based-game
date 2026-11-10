const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const {
  setupTestEnv,
  teardownTestEnv,
  request,
} = require('./test_helper');
const FAQ = require('../models/FAQ');

describe('Backend FAQ API & Contextual Search Tests', () => {
  before(async () => {
    await setupTestEnv();
  });

  after(async () => {
    await teardownTestEnv();
  });

  it('1. Retrieves list of all published FAQs', async () => {
    const res = await request('/faqs');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(Array.isArray(res.data.data), 'Expected data to be an array');
    assert.ok(res.data.data.length >= 4, 'Expected at least 4 seeded FAQs');
  });

  it('2. Filters FAQs accurately by category', async () => {
    const res = await request('/faqs?category=Game%20Rules');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.length >= 1);
    for (const faq of res.data.data) {
      assert.strictEqual(faq.category, 'Game Rules');
    }
  });

  it('3. Searches FAQs across questions and answers by keyword', async () => {
    const res = await request('/faqs?search=counters');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.length >= 1);
    assert.ok(
      res.data.data[0].question.toLowerCase().includes('counter') ||
      res.data.data[0].answer.toLowerCase().includes('counter')
    );
  });

  it('4. Retrieves contextual FAQs by game slug (/api/faqs/game/:gameSlug)', async () => {
    const res = await request('/faqs/game/aadu-puli-aatam');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.length >= 2, 'Expected Aadu Puli specific and relevant rule FAQs');
    for (const faq of res.data.data) {
      assert.strictEqual(faq.gameSlug, 'aadu-puli-aatam');
    }
  });

  it('5. Retrieves contextual FAQs via game endpoint alias (/api/games/:idOrSlug/faqs)', async () => {
    const res = await request('/games/aadu-puli-aatam/faqs');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.length >= 2);
    for (const faq of res.data.data) {
      assert.strictEqual(faq.gameSlug, 'aadu-puli-aatam');
    }
  });

  it('6. Retrieves single FAQ item by valid MongoDB ObjectId', async () => {
    const sample = await FAQ.findOne({ category: 'General' });
    assert.ok(sample, 'Expected sample FAQ');

    const res = await request(`/faqs/${sample._id}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data._id.toString(), sample._id.toString());
    assert.strictEqual(res.data.data.question, sample.question);
  });

  it('7. Returns 400 for invalid ID format and 404 for non-existent ID', async () => {
    const badFormatRes = await request('/faqs/not-a-valid-object-id');
    assert.strictEqual(badFormatRes.status, 400);
    assert.strictEqual(badFormatRes.data.code, 'INVALID_ID');

    const nonExistentRes = await request('/faqs/507f1f77bcf86cd799439011');
    assert.strictEqual(nonExistentRes.status, 404);
    assert.strictEqual(nonExistentRes.data.code, 'FAQ_NOT_FOUND');
  });
});
