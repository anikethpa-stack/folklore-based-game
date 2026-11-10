const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const { setupTestEnv, teardownTestEnv, cleanUserAndMatchData, request } = require('./test_helper');

describe('Backend Match Ownership & Authorization Tests', () => {
  let userAToken, userBToken, matchAId, matchBId;

  before(async () => {
    await setupTestEnv();
  });

  after(async () => {
    await teardownTestEnv();
  });

  beforeEach(async () => {
    await cleanUserAndMatchData();

    // Register User A
    const uARes = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username: 'usera', email: 'usera@folkboard.org', password: 'Password123!' }),
    });
    userAToken = uARes.data.accessToken || uARes.data.token;

    // Register User B
    const uBRes = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username: 'userb', email: 'userb@folkboard.org', password: 'Password123!' }),
    });
    userBToken = uBRes.data.accessToken || uBRes.data.token;

    // User A creates Match A
    const mA = await request('/matches', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({ gameSlug: 'aadu-puli-aatam', mode: 'vs_ai' }),
    });
    matchAId = mA.data.data.match._id;

    // User B creates Match B
    const mB = await request('/matches', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userBToken}` },
      body: JSON.stringify({ gameSlug: 'pallanguzhi', mode: 'pass_and_play' }),
    });
    matchBId = mB.data.data.match._id;
  });

  it('1. User A is blocked from reading User B match (403 Forbidden)', async () => {
    const res = await request(`/matches/${matchBId}`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    assert.strictEqual(res.status, 403);
    assert.ok(res.data.message.includes('permission') || res.data.message.includes('denied'));
  });

  it('2. User A is blocked from submitting a move to User B match (403 Forbidden)', async () => {
    const res = await request(`/matches/${matchBId}/moves`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({ from: 0 }),
    });
    assert.strictEqual(res.status, 403);
  });

  it('3. User A is blocked from restarting User B match (403 Forbidden)', async () => {
    const res = await request(`/matches/${matchBId}/restart`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    assert.strictEqual(res.status, 403);
  });

  it('4. Unauthenticated visitor cannot access or modify private match without guest token', async () => {
    const readRes = await request(`/matches/${matchAId}`);
    assert.strictEqual(readRes.status, 401);

    const moveRes = await request(`/matches/${matchAId}/moves`, {
      method: 'POST',
      body: JSON.stringify({ from: null, to: 4 }),
    });
    assert.strictEqual(moveRes.status, 401);
  });

  it('5. Match history strictly filters by authenticated user ID (zero leakage)', async () => {
    // User A history
    const hA = await request('/matches/history', {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    assert.strictEqual(hA.status, 200);
    assert.strictEqual(hA.data.count, 1);
    assert.strictEqual(hA.data.data[0]._id, matchAId);

    // User B history
    const hB = await request('/matches/history', {
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    assert.strictEqual(hB.status, 200);
    assert.strictEqual(hB.data.count, 1);
    assert.strictEqual(hB.data.data[0]._id, matchBId);

    // Unauthenticated history request rejected with 401
    const unauthHistory = await request('/matches/history');
    assert.strictEqual(unauthHistory.status, 401);
  });
});
