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
const createInitialState = (gameSlug, variantSlug = null, variantConfig = null) => {
  const engine = getEngine(gameSlug);
  return engine.getInitialState(variantSlug, variantConfig);
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
    const tigerCount = state.tigerCount || 3;
    const totalGoats = state.totalGoats || 15;

    if (state.turn === 'goats') {
      if (state.phase === 'placement') {
        const remaining = totalGoats - state.goatsPlaced;
        contextualHint = `Placement Phase: Select any open vertex to place a goat (${remaining} goat${remaining > 1 ? 's' : ''} remaining of ${totalGoats}). Position goats to restrict tiger jump avenues.`;
      } else {
        contextualHint = `Movement Phase: Select one of your goats to step along a connected line. Coordinate your herd to encircle the ${tigerCount} tigers.`;
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
    const pasuNote = state.pasuRule
      ? ' (Pasu 4-seed capture rule active: 4 accumulated seeds in any pit go to the pit owner).'
      : '';

    contextualHint =
      state.turn === 'player1'
        ? `Player 1's Turn: Choose a non-empty pit on your bottom row (Pits 1–7) to start sowing counter-clockwise${pasuNote}.`
        : `Player 2's Turn: Choose a non-empty pit on your top row (Pits 8–14) to begin your sowing distribution${pasuNote}.`;
  }

  return {
    legalMoves,
    contextualHint,
  };
};

/**
 * AI Move Generator for Solo Practice Mode supporting difficulty tiers (easy, medium, hard)
 */
const getAIMove = (gameSlug, state, difficulty = 'medium') => {
  const engine = getEngine(gameSlug);
  const legalMoves = engine.getLegalMoves(state);

  if (legalMoves.length === 0) return null;

  if (gameSlug === 'aadu-puli-aatam') {
    const jumps = legalMoves.filter((m) => m.actionType === 'jump');

    if (difficulty === 'easy') {
      // In easy mode, AI plays casually and may miss jumps
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }

    if (difficulty === 'hard') {
      // Hard mode: Always take jump capture first
      if (jumps.length > 0) {
        return jumps[0];
      }
      // For movement, evaluate mobility: prefer moving to vertices with more free connections
      if (state.turn === 'tigers') {
        const board = state.board || {};
        const scoredMoves = legalMoves.map((m) => {
          let score = 0;
          // Count empty neighbors at destination 'to'
          const neighbors = engine.ADJACENCY ? engine.ADJACENCY[m.to] || [] : [];
          const freeNeighbors = neighbors.filter((n) => board[n] === null).length;
          score += freeNeighbors * 2;
          return { move: m, score };
        });
        scoredMoves.sort((a, b) => b.score - a.score);
        return scoredMoves[0].move;
      }
      return legalMoves[0];
    }

    // Default 'medium' difficulty: Prioritize jump captures, else random safe move
    if (jumps.length > 0) {
      return jumps[Math.floor(Math.random() * jumps.length)];
    }
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  } else if (gameSlug === 'pallanguzhi') {
    if (difficulty === 'easy') {
      // Easy mode: random playable pit
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }

    if (difficulty === 'hard') {
      // Hard mode: evaluate simulate outcome for maximum capture
      const evaluated = legalMoves.map((m) => {
        try {
          const sim = engine.applyMove(state, m, { isValid: true });
          const capturedSeeds = (sim.newState?.captured?.[state.turn] || 0) - (state.captured?.[state.turn] || 0);
          return { move: m, score: capturedSeeds * 10 + m.seeds };
        } catch {
          return { move: m, score: m.seeds };
        }
      });
      evaluated.sort((a, b) => b.score - a.score);
      return evaluated[0].move;
    }

    // Default 'medium': Sort by seed count
    legalMoves.sort((a, b) => b.seeds - a.seeds);
    return legalMoves[0];
  }

  return legalMoves[0];
};

/**
 * Verify if the requesting user or guest has access to this match
 * @param {Object} match - The Mongoose Match document
 * @param {Object} user - The authenticated user (or null/undefined)
 * @param {string} guestToken - The optional guest token from header/body/query
 * @returns {Object} { authorized: boolean, statusCode?: number, message?: string }
 */
const verifyMatchAccess = (match, user, guestToken = null) => {
  // Case 1: Match is owned by an authenticated user
  const matchOwnerId = match.ownerId || match.players?.player1?.userId;

  if (matchOwnerId) {
    if (!user) {
      return {
        authorized: false,
        statusCode: 401,
        message: 'Authentication required to access this match.',
      };
    }

    const userIdStr = user._id ? user._id.toString() : user.id?.toString();
    const isOwner = matchOwnerId.toString() === userIdStr;
    const isPlayer2 =
      match.players?.player2?.userId &&
      match.players.player2.userId.toString() === userIdStr;

    if (!isOwner && !isPlayer2) {
      return {
        authorized: false,
        statusCode: 403,
        message: 'Access denied: You do not have permission to access or modify this match.',
      };
    }

    return { authorized: true };
  }

  // Case 2: Match was created by a guest
  if (match.isGuest || !matchOwnerId) {
    // If the match has a guestToken set, verify it
    if (match.guestToken) {
      if (!guestToken || guestToken !== match.guestToken) {
        return {
          authorized: false,
          statusCode: 403,
          message: 'Access denied: Missing or invalid guest session token.',
        };
      }
    }
    return { authorized: true };
  }

  return { authorized: true };
};

/**
 * Validate that the requester is authorized to submit a move for the specified side and turn
 * @param {Object} match - The match document
 * @param {Object} user - The requesting user (or null)
 * @param {string} playerRole - The role/side attempting the move
 * @returns {Object} { valid: boolean, statusCode?: number, message?: string }
 */
const validatePlayerTurnAndSide = (match, user, playerRole) => {
  // 1. Check match status (cannot move after game ended)
  if (match.status !== 'in_progress') {
    return {
      valid: false,
      statusCode: 400,
      code: 'MATCH_COMPLETED',
      message: 'This match has already ended.',
    };
  }

  // 2. Validate side in vs_ai mode (human cannot move as the AI)
  if (match.mode === 'vs_ai') {
    const aiRole = match.players.player2.role;
    const humanRole = match.players.player1.role;

    if (playerRole === aiRole) {
      return {
        valid: false,
        statusCode: 400,
        code: 'INVALID_SIDE',
        message: `Cannot submit moves for the AI player (${aiRole}). You control ${humanRole}.`,
      };
    }
  }

  // 3. Validate turn
  if (playerRole && playerRole !== match.currentTurn) {
    return {
      valid: false,
      statusCode: 400,
      code: 'INVALID_TURN',
      message: `It is currently the ${match.currentTurn.toUpperCase()}' turn. Please wait for your turn.`,
    };
  }

  // 4. In online 2-player mode (if two separate registered users)
  if (user && match.players.player1.userId && match.players.player2.userId) {
    const userIdStr = user._id.toString();
    const p1Id = match.players.player1.userId.toString();
    const p2Id = match.players.player2.userId.toString();

    if (userIdStr === p1Id && playerRole !== match.players.player1.role) {
      return {
        valid: false,
        statusCode: 403,
        message: `You are assigned as ${match.players.player1.role} and cannot move for your opponent.`,
      };
    }

    if (userIdStr === p2Id && playerRole !== match.players.player2.role) {
      return {
        valid: false,
        statusCode: 403,
        message: `You are assigned as ${match.players.player2.role} and cannot move for your opponent.`,
      };
    }
  }

  return { valid: true };
};

module.exports = {
  getEngine,
  createInitialState,
  processMove,
  getLegalMovesAndHint,
  getAIMove,
  verifyMatchAccess,
  validatePlayerTurnAndSide,
};
