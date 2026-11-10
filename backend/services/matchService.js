const aadupuliEngine = require('./aadupuliEngine');
const pallanguzhiEngine = require('./pallanguzhiEngine');

/**
 * Match Service: Unified dispatcher for all registered traditional game engines
 */
const getEngine = (gameSlug) => {
  switch (gameSlug) {
    case 'aadu-puli-aatam':
      return aadupuliEngine;
    case 'pallanguzhi':
      return pallanguzhiEngine;
    default:
      throw new Error(`No rule engine registered for game slug: ${gameSlug}`);
  }
};

/**
 * Initialize new game state
 */
const createInitialState = (gameSlug, variantSlug = null) => {
  const engine = getEngine(gameSlug);
  return engine.getInitialState(variantSlug);
};

/**
 * Validate move and return outcome
 */
const processMove = (gameSlug, currentState, move) => {
  const engine = getEngine(gameSlug);

  // 1. Authoritative validation
  const validation = engine.validateMove(currentState, move);
  if (!validation.isValid) {
    return {
      success: false,
      rejectionReason: validation.reason,
    };
  }

  // 2. Authoritative state transition
  const result = engine.applyMove(currentState, move, validation);

  return {
    success: true,
    actionType: validation.actionType,
    captured: validation.captured,
    newState: result.newState,
    isGameOver: result.isGameOver,
    winner: result.winner,
    winReason: result.winReason,
  };
};

/**
 * Retrieve legal moves and contextual hint for the current turn
 */
const getLegalMovesAndHint = (gameSlug, state) => {
  const engine = getEngine(gameSlug);
  const legalMoves = engine.getLegalMoves(state);

  let contextualHint = '';

  if (gameSlug === 'aadu-puli-aatam') {
    if (state.turn === 'goats') {
      if (state.phase === 'placement') {
        const remaining = state.totalGoats - state.goatsPlaced;
        contextualHint = `Placement Phase: Select any open vertex to place a goat (${remaining} goat${remaining > 1 ? 's' : ''} remaining). Try placing goats to restrict tiger jump avenues.`;
      } else {
        contextualHint =
          'Movement Phase: Select one of your goats to step along a connected line. Coordinate your herd to encircle the 3 tigers.';
      }
    } else {
      const jumps = legalMoves.filter((m) => m.actionType === 'jump');
      if (jumps.length > 0) {
        contextualHint = `A Tiger has ${jumps.length} jump capture${jumps.length > 1 ? 's' : ''} available! Jumping over a goat is a tactical priority.`;
      } else {
        contextualHint =
          'Tigers: Move 1 step along a connected line to maintain territorial mobility or position yourself for future jumps.';
      }
    }
  } else if (gameSlug === 'pallanguzhi') {
    contextualHint =
      state.turn === 'player1'
        ? "Player 1's Turn: Choose a non-empty pit on your bottom row (Pits 1–7) to start sowing cowrie shells counter-clockwise."
        : "Player 2's Turn: Choose a non-empty pit on your top row (Pits 8–14) to begin your sowing distribution.";
  }

  return {
    legalMoves,
    contextualHint,
  };
};

/**
 * AI Move Generator for Solo Practice Mode
 */
const getAIMove = (gameSlug, state) => {
  const engine = getEngine(gameSlug);
  const legalMoves = engine.getLegalMoves(state);

  if (legalMoves.length === 0) return null;

  if (gameSlug === 'aadu-puli-aatam') {
    // Priority 1: Take any jump capture if playing as tigers
    const jumps = legalMoves.filter((m) => m.actionType === 'jump');
    if (jumps.length > 0) {
      return jumps[Math.floor(Math.random() * jumps.length)];
    }
    // Random safe legal move
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  } else if (gameSlug === 'pallanguzhi') {
    // Choose move with highest seed count to maximize cascading depth
    legalMoves.sort((a, b) => b.seeds - a.seeds);
    return legalMoves[0];
  }

  return legalMoves[0];
};

module.exports = {
  getEngine,
  createInitialState,
  processMove,
  getLegalMovesAndHint,
  getAIMove,
};

