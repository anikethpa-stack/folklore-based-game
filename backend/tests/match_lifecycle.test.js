const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const { setupTestEnv, teardownTestEnv, cleanUserAndMatchData, request } = require('./test_helper');

describe('Backend Match Lifecycle & Gameplay State Tests', () => {
  let userToken, matchId;

  before(async () => {
    await setupTestEnv();
  });

  after(async () => {
    await teardownTestEnv();
  });

  beforeEach(async () => {
    await cleanUserAndMatchData();

    const u = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username: 'lifecycleuser', email: 'life@folkboard.org', password: 'Password123!' }),
    });
    userToken = u.data.accessToken || u.data.token;

    const m = await request('/matches', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ gameSlug: 'aadu-puli-aatam', mode: 'pass_and_play' }),
    });
    matchId = m.data.data.match._id;
  });

  it('1. Execute valid goat placement move and transition turn', async () => {
    const moveRes = await request(`/matches/${matchId}/moves`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ from: null, to: 2, player: 'goats' }),
    });

    assert.strictEqual(moveRes.status, 200);
    assert.strictEqual(moveRes.data.data.match.boardState.nodes[2], 'goat');
    assert.strictEqual(moveRes.data.data.match.currentTurn, 'tigers');
    assert.strictEqual(moveRes.data.data.match.moveHistory.length, 1);
  });

  it('2. Idempotent move submission: duplicate request does not repeat move', async () => {
    const key = 'idem-unique-key-101';

    // First attempt
    const move1 = await request(`/matches/${matchId}/moves`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}`, 'x-idempotency-key': key },
      body: JSON.stringify({ from: null, to: 2, player: 'goats' }),
    });
    assert.strictEqual(move1.status, 200);
    assert.strictEqual(move1.data.data.match.moveHistory.length, 1);

    // Duplicate attempt with exact same idempotency key
    const move2 = await request(`/matches/${matchId}/moves`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}`, 'x-idempotency-key': key },
      body: JSON.stringify({ from: null, to: 2, player: 'goats' }),
    });
    assert.strictEqual(move2.status, 200);
    assert.strictEqual(move2.data.duplicateDetected, true);
    assert.strictEqual(move2.data.data.match.moveHistory.length, 1, 'Must NOT execute move twice');
  });

  it('3. Match restart preserves previous move history and spawns fresh match', async () => {
    // Execute a move first
    await request(`/matches/${matchId}/moves`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ from: null, to: 2, player: 'goats' }),
    });

    // Restart
    const restartRes = await request(`/matches/${matchId}/restart`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
    });

    assert.strictEqual(restartRes.status, 200);
    const newMatch = restartRes.data.data.match;
    assert.notStrictEqual(newMatch._id, matchId, 'Rematch must receive a unique ID');
    assert.strictEqual(newMatch.moveHistory.length, 0, 'New match must have clean move history');
    assert.strictEqual(newMatch.status, 'in_progress');

    // Verify previous match was preserved with status 'restarted'
    const prevMatchRes = await request(`/matches/${matchId}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(prevMatchRes.data.data.match.status, 'restarted');
    assert.strictEqual(prevMatchRes.data.data.match.moveHistory.length, 1, 'Previous moves must be intact');
  });

  it('4. Authoritatively resume active match and recalculate legal moves', async () => {
    // Execute move
    await request(`/matches/${matchId}/moves`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ from: null, to: 2, player: 'goats' }),
    });

    // Resume match
    const resumeRes = await request(`/matches/${matchId}/resume`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });

    assert.strictEqual(resumeRes.status, 200);
    assert.strictEqual(resumeRes.data.resumable, true);
    assert.strictEqual(resumeRes.data.data.match.currentTurn, 'tigers');
    assert.strictEqual(resumeRes.data.data.match.moveHistory.length, 1);
    assert.ok(resumeRes.data.data.legalMoves.length > 0, 'Must calculate legal moves on resume');
  });
});
