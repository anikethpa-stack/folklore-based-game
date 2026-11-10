const { describe, it } = require('node:test');
const assert = require('node:assert');

const aadupuliEngine = require('../services/aadupuliEngine');
const pallanguzhiEngine = require('../services/pallanguzhiEngine');

describe('Aadu Puli Aatam & Pallanguzhi Engine Unit Tests', () => {
  describe('Aadu Puli Aatam Engine', () => {
    it('1. Initializes standard 23-vertex board with 3 tigers at [0, 1, 3] and 15 goats', () => {
      const state = aadupuliEngine.getInitialState();
      assert.strictEqual(state.nodes.length, 23);
      assert.strictEqual(state.nodes[0], 'tiger');
      assert.strictEqual(state.nodes[1], 'tiger');
      assert.strictEqual(state.nodes[3], 'tiger');
      assert.strictEqual(state.totalGoats, 15);
      assert.strictEqual(state.goatsPlaced, 0);
      assert.strictEqual(state.goatsCaptured, 0);
      assert.strictEqual(state.phase, 'placement');
      assert.strictEqual(state.turn, 'goats');
    });

    it('2. Generates 20 legal placement moves for first goat turn (23 nodes - 3 tigers)', () => {
      const state = aadupuliEngine.getInitialState();
      const moves = aadupuliEngine.getLegalMoves(state);
      assert.strictEqual(moves.length, 20);
      assert.ok(moves.every((m) => m.actionType === 'place'));
    });

    it('3. Rejects illegal moves: moving a goat during placement phase', () => {
      const state = aadupuliEngine.getInitialState();
      const val = aadupuliEngine.validateMove(state, { from: 2, to: 4, player: 'goats' });
      assert.strictEqual(val.isValid, false);
      assert.ok(val.reason.includes('Placement Phase'));
    });

    it('4. Tiger jump capture removes captured goat and increments goatsCaptured', () => {
      // Setup state where Tiger is at 0, Goat is at 1, node 4 is vacant
      const nodes = new Array(23).fill(null);
      nodes[0] = 'tiger';
      nodes[1] = 'goat';
      const state = {
        nodes,
        totalGoats: 15,
        goatsPlaced: 15,
        goatsCaptured: 0,
        phase: 'movement',
        turn: 'tigers',
      };

      const val = aadupuliEngine.validateMove(state, { from: 0, to: 4, player: 'tigers' });
      assert.strictEqual(val.isValid, true);
      assert.strictEqual(val.actionType, 'jump');
      assert.strictEqual(val.over, 1);

      const res = aadupuliEngine.applyMove(state, { from: 0, to: 4 }, val);
      assert.strictEqual(res.newState.nodes[0], null);
      assert.strictEqual(res.newState.nodes[1], null, 'Captured goat must be removed');
      assert.strictEqual(res.newState.nodes[4], 'tiger', 'Tiger lands at node 4');
      assert.strictEqual(res.newState.goatsCaptured, 1);
    });

    it('5. Declares Tiger Victory when 5 goats are captured', () => {
      const state = {
        nodes: new Array(23).fill(null),
        totalGoats: 15,
        goatsPlaced: 15,
        goatsCaptured: 5,
        phase: 'movement',
        turn: 'goats',
      };
      const outcome = aadupuliEngine.checkGameOver(state);
      assert.strictEqual(outcome.isGameOver, true);
      assert.strictEqual(outcome.winner, 'tigers');
    });

    it('6. Declares Goat Victory when all tigers have 0 legal moves', () => {
      // Surround tigers completely
      const nodes = new Array(23).fill('goat');
      // Place 3 tigers surrounded
      nodes[0] = 'tiger';
      nodes[1] = 'tiger';
      nodes[3] = 'tiger';

      const state = {
        nodes,
        totalGoats: 15,
        goatsPlaced: 15,
        goatsCaptured: 2,
        phase: 'movement',
        turn: 'goats',
      };

      const outcome = aadupuliEngine.checkGameOver(state);
      assert.strictEqual(outcome.isGameOver, true);
      assert.strictEqual(outcome.winner, 'goats');
    });
  });

  describe('Pallanguzhi Mancala Engine', () => {
    it('1. Initializes 14 pits with 5 shells each (70 shells total)', () => {
      const state = pallanguzhiEngine.getInitialState();
      assert.strictEqual(state.pits.length, 14);
      assert.ok(state.pits.every((seeds) => seeds === 5));
      assert.strictEqual(state.stores.player1, 0);
      assert.strictEqual(state.stores.player2, 0);
      assert.strictEqual(state.turn, 'player1');
    });

    it('2. Player 1 can only sow from their own pits (Pits 0..6)', () => {
      const state = pallanguzhiEngine.getInitialState();
      const p1Moves = pallanguzhiEngine.getLegalMoves(state);
      assert.strictEqual(p1Moves.length, 7);
      assert.ok(p1Moves.every((m) => m.from >= 0 && m.from <= 6));

      // Attempting to sow from Player 2 side (Pit 8 = index 7) is rejected
      const val = pallanguzhiEngine.validateMove(state, { from: 7, player: 'player1' });
      assert.strictEqual(val.isValid, false);
      assert.ok(val.reason.includes('Player 2'));
    });

    it('3. Multi-lap continuous sowing and empty-pit capture', () => {
      // Deterministic scenario: Pit 0 has 2 seeds, Pit 1 has 0 seeds, Pit 2 has 4 seeds
      const customPits = new Array(14).fill(0);
      customPits[0] = 2; // Sows into pit 1 and 2
      customPits[1] = 0;
      customPits[2] = 0;
      customPits[3] = 0; // Empty pit
      customPits[4] = 6; // Target capture pit

      const state = {
        pits: customPits,
        stores: { player1: 0, player2: 0 },
        turn: 'player1',
      };

      // Player 1 sows from Pit 0 (2 seeds):
      // Seed 1 lands in Pit 1 (1 seed)
      // Seed 2 lands in Pit 2 (1 seed -> previously empty, so lap ends)
      // Next pit is Pit 3 (empty -> triggers capture of Pit 4 which has 6 seeds!)
      const val = pallanguzhiEngine.validateMove(state, { from: 0, player: 'player1' });
      const res = pallanguzhiEngine.applyMove(state, { from: 0 }, val);

      assert.strictEqual(res.newState.stores.player1, 6, 'Must capture all 6 seeds from pit 4');
      assert.strictEqual(res.newState.pits[4], 0, 'Target pit must be emptied');
      assert.strictEqual(res.newState.turn, 'player2', 'Turn switches to Player 2');
    });
  });
});

