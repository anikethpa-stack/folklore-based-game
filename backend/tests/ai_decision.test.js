const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const {
  setupTestEnv,
  teardownTestEnv,
  cleanUserAndMatchData,
  request,
} = require('./test_helper');
const matchService = require('../services/matchService');
const aadupuliEngine = require('../services/aadupuliEngine');
const Match = require('../models/Match');

describe('Backend AI Decision-Making & Difficulty Tests', () => {
  before(async () => {
    await setupTestEnv();
  });

  after(async () => {
    await teardownTestEnv();
  });

  beforeEach(async () => {
    await cleanUserAndMatchData();
  });

  it('1. Generates valid moves across easy, medium, and hard difficulty tiers for both games', async () => {
    // Aadu Puli Aatam - Tigers Turn
    const aaduState = aadupuliEngine.getInitialState();
    aaduState.turn = 'tigers';

    for (const diff of ['easy', 'medium', 'hard']) {
      const move = matchService.getAIMove('aadu-puli-aatam', aaduState, diff);
      assert.ok(move, `AI should return a move for Aadu Puli on ${diff}`);
      assert.equal(typeof move.from, 'number');
      assert.equal(typeof move.to, 'number');
      const val = aadupuliEngine.validateMove(aaduState, { ...move, player: 'tigers' });
      assert.equal(val.isValid, true, `AI move for ${diff} must be strictly valid`);
    }

    // Pallanguzhi - Player 2 Turn
    const pallanState = {
      pits: {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0,
        8: 5, 9: 6, 10: 2, 11: 4, 12: 5, 13: 3, 14: 5,
      },
      stores: { player1: 0, player2: 0 },
      captured: { player1: 0, player2: 0 },
      turn: 'player2',
      round: 1,
      gameVariant: 'standard',
    };

    for (const diff of ['easy', 'medium', 'hard']) {
      const move = matchService.getAIMove('pallanguzhi', pallanState, diff);
      assert.ok(move, `AI should return a move for Pallanguzhi on ${diff}`);
      assert.ok(move.from >= 8 && move.from <= 14, `P2 AI move must select pits 8-14`);
      assert.ok(pallanState.pits[move.from] > 0, `P2 AI move must select a non-empty pit`);
    }
  });

  it('2. Prioritizes jump capture when tiger has tactical capture opportunity', async () => {
    // Custom board: Tiger at vertex 0, Goat at vertex 1, Vertex 4 is empty
    // 0 - 1 - 4 is a straight-line jump triplet
    const nodes = new Array(23).fill(null);
    nodes[0] = 'tiger';
    nodes[1] = 'goat';
    nodes[4] = null;

    const jumpState = {
      nodes,
      phase: 'movement',
      turn: 'tigers',
      goatsPlaced: 15,
      goatsCaptured: 0,
      tigerCount: 1,
      totalGoats: 15,
      targetCaptures: 5,
    };

    const mediumMove = matchService.getAIMove('aadu-puli-aatam', jumpState, 'medium');
    assert.equal(mediumMove.actionType, 'jump', 'Medium AI should prioritize jump capture');
    assert.equal(mediumMove.from, 0);
    assert.equal(mediumMove.to, 4);

    const hardMove = matchService.getAIMove('aadu-puli-aatam', jumpState, 'hard');
    assert.equal(hardMove.actionType, 'jump', 'Hard AI should prioritize jump capture');
    assert.equal(hardMove.from, 0);
    assert.equal(hardMove.to, 4);
  });

  it('3. Dedicated /api/matches/:id/ai-move endpoint executes AI turn when pending', async () => {
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: 'aitester',
        email: 'aitester@folkboard.org',
        password: 'AiPass123!',
      }),
    });
    const token = regRes.data.accessToken || regRes.data.token;

    // Create match vs AI where user is goats and AI is tigers
    const matchRes = await request('/matches', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        gameSlug: 'aadu-puli-aatam',
        mode: 'vs_ai',
        playerRole: 'goats',
        aiDifficulty: 'medium',
      }),
    });
    const matchId = matchRes.data.data.match._id;

    // Turn is goats (human) initially. Calling ai-move now should be rejected with 400 NOT_AI_TURN
    const prematureRes = await request(`/matches/${matchId}/ai-move`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(prematureRes.status, 400);
    assert.equal(prematureRes.data.code, 'NOT_AI_TURN');

    // Submit human move: place a goat at vertex 5
    const moveRes = await request(`/matches/${matchId}/moves`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        from: null,
        to: 5,
        player: 'goats',
      }),
    });
    assert.equal(moveRes.status, 200);

    // Verify move history recorded both the human move and AI response
    const updatedMatch = await Match.findById(matchId);
    assert.ok(updatedMatch.moveHistory.length >= 2, 'Move history should record both player and AI move');
    assert.equal(updatedMatch.moveHistory[0].player, 'goats');
    assert.equal(updatedMatch.moveHistory[1].player, 'tigers');
    assert.equal(updatedMatch.currentTurn, 'goats', 'Turn should return to human player after AI moves');
  });

  it('4. Rejects cross-user AI trigger with 403 Forbidden', async () => {
    const regOwner = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username: 'aiowner', email: 'aiowner@folkboard.org', password: 'OwnerPass123!' }),
    });
    const regIntruder = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username: 'aiintruder', email: 'aiintruder@folkboard.org', password: 'IntruderPass123!' }),
    });
    const ownerToken = regOwner.data.accessToken || regOwner.data.token;
    const intruderToken = regIntruder.data.accessToken || regIntruder.data.token;

    const matchRes = await request('/matches', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        gameSlug: 'aadu-puli-aatam',
        mode: 'vs_ai',
        playerRole: 'goats',
      }),
    });
    const matchId = matchRes.data.data.match._id;

    const intruderRes = await request(`/matches/${matchId}/ai-move`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${intruderToken}` },
    });
    assert.equal(intruderRes.status, 403);
    assert.equal(intruderRes.data.code, 'ACCESS_DENIED');
  });
});
