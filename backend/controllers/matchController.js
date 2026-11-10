const crypto = require('crypto');
const mongoose = require('mongoose');
const Match = require('../models/Match');
const Game = require('../models/Game');
const GameVariant = require('../models/GameVariant');
const matchService = require('../services/matchService');

/**
 * Helper to extract guest session token from headers, body, or query
 */
const getGuestTokenFromRequest = (req) => {
  return (
    req.headers['x-guest-token'] ||
    req.body?.guestToken ||
    req.query?.guestToken ||
    null
  );
};

/**
 * @desc    Start a new match (Supports both authenticated users and guests)
 * @route   POST /api/matches
 * @access  Public / Authenticated
 */
const createMatch = async (req, res) => {
  try {
    const { gameSlug, mode = 'pass_and_play', variantId = null, variantSlug = null, aiDifficulty = 'medium' } = req.body;

    if (!gameSlug) {
      return res.status(400).json({
        success: false,
        message: 'Game slug is required to initiate a match.',
      });
    }

    const game = await Game.findOne({ slug: gameSlug.toLowerCase() });
    if (!game) {
      return res.status(404).json({
        success: false,
        message: `Traditional game '${gameSlug}' not found in catalogue.`,
      });
    }

    // 1. Resolve and validate game variant if requested
    let variant = null;
    if (variantId) {
      if (mongoose.Types.ObjectId.isValid(variantId)) {
        variant = await GameVariant.findById(variantId);
      } else {
        variant = await GameVariant.findOne({ slug: variantId.toString().toLowerCase(), gameId: game._id });
      }
    } else if (variantSlug) {
      variant = await GameVariant.findOne({ slug: variantSlug.toLowerCase(), gameId: game._id });
    }

    if ((variantId || variantSlug) && !variant) {
      return res.status(404).json({
        success: false,
        code: 'VARIANT_NOT_FOUND',
        message: 'Selected game variant was not found in catalogue.',
      });
    }

    // Verify variant belongs to the selected game
    if (variant && variant.gameId.toString() !== game._id.toString()) {
      return res.status(400).json({
        success: false,
        code: 'VARIANT_MISMATCH',
        message: `Variant '${variant.variantName}' does not belong to '${game.name}'.`,
      });
    }

    // Reject informational / non-playable variants from gameplay
    if (variant && (!variant.isPlayable || variant.status === 'informational')) {
      return res.status(400).json({
        success: false,
        code: 'VARIANT_NOT_PLAYABLE',
        message: `The '${variant.variantName}' variant is documented for historical reference only and cannot be played in the digital engine.`,
      });
    }

    // Generate initial board state via authoritative engine using variant rules
    const boardState = matchService.createInitialState(
      game.slug,
      variant ? variant.slug : null,
      variant ? variant.ruleOverrides : null
    );

    // Initial players setup
    const isAuthenticated = !!req.user;
    const userId = req.user?._id || null;
    const isAIMode = mode === 'vs_ai';

    let player1Role = 'player1';
    let player2Role = 'player2';

    if (game.slug === 'aadu-puli-aatam') {
      player1Role = 'goats';
      player2Role = 'tigers';
    }

    // Generate guest token if unauthenticated
    let guestToken = null;
    if (!isAuthenticated) {
      guestToken = crypto.randomBytes(24).toString('hex');
    }

    const match = await Match.create({
      gameId: game._id,
      gameSlug: game.slug,
      variantId: variant ? variant._id : null,
      variantSlug: variant ? variant.slug : null,
      variantName: variant ? variant.variantName : null,
      variantRules: variant ? variant.ruleOverrides : null,
      ownerId: userId,
      isGuest: !isAuthenticated,
      guestToken,
      mode,
      aiDifficulty: ['easy', 'medium', 'hard'].includes(aiDifficulty) ? aiDifficulty : 'medium',
      players: {
        player1: {
          userId,
          name: req.user?.username || 'Guest Preserver',
          role: player1Role,
        },
        player2: {
          userId: null,
          name: isAIMode ? 'FolkBoard AI' : 'Player 2',
          role: player2Role,
          isAI: isAIMode,
        },
      },
      boardState,
      currentTurn: boardState.turn,
      moveHistory: [],
      status: 'in_progress',
    });

    const { legalMoves, contextualHint } = matchService.getLegalMovesAndHint(
      game.slug,
      boardState
    );

    return res.status(201).json({
      success: true,
      data: {
        match,
        guestToken,
        legalMoves,
        contextualHint,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create match session.',
      error: error.message,
    });
  }
};

/**
 * @desc    Get match state by ID (with ownership verification)
 * @route   GET /api/matches/:id
 * @access  Protected / Guest Authorized
 */
const getMatchById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid match ID format.',
      });
    }

    const match = await Match.findById(id)
      .populate('gameId', 'name slug badgeTheme rules')
      .populate('variantId', 'variantName slug region isPlayable status rulesSummary differences');
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match session not found.',
      });
    }

    // Match Ownership Verification
    const guestToken = getGuestTokenFromRequest(req);
    const accessCheck = matchService.verifyMatchAccess(match, req.user, guestToken);

    if (!accessCheck.authorized) {
      return res.status(accessCheck.statusCode).json({
        success: false,
        message: accessCheck.message,
      });
    }

    const { legalMoves, contextualHint } = matchService.getLegalMovesAndHint(
      match.gameSlug,
      match.boardState
    );

    return res.status(200).json({
      success: true,
      data: {
        match,
        legalMoves,
        contextualHint,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve match state.',
      error: error.message,
    });
  }
};

/**
 * Helper to execute an authoritative AI turn on a match
 */
const executeAITurn = async (match) => {
  const currentState = match.boardState;
  const aiMove = matchService.getAIMove(match.gameSlug, currentState, match.aiDifficulty);
  if (!aiMove) {
    throw new Error('AI could not determine a valid move for this board configuration.');
  }

  const aiResult = matchService.processMove(
    match.gameSlug,
    currentState,
    { ...aiMove, player: currentState.turn }
  );

  if (!aiResult.success) {
    throw new Error(aiResult.rejectionReason || 'AI calculated an invalid move.');
  }

  const moveNumber = match.moveHistory.length + 1;
  match.moveHistory.push({
    moveNumber,
    player: currentState.turn,
    actionType: aiResult.actionType,
    from: aiMove.from,
    to: aiMove.to,
    captured: aiResult.captured,
    idempotencyKey: null,
    timestamp: new Date(),
  });

  match.boardState = aiResult.newState;
  match.currentTurn = aiResult.newState.turn;

  if (aiResult.isGameOver) {
    match.status = 'completed';
    match.winner = aiResult.winner;
    match.winReason = aiResult.winReason;
    match.completedAt = new Date();
  }
};

/**
 * @desc    Submit a move for authoritative backend validation (with ownership, idempotency & safe retry)
 * @route   POST /api/matches/:id/moves
 * @access  Protected / Guest Authorized
 */
const submitMove = async (req, res) => {
  try {
    const { id } = req.params;
    const { from, to, player } = req.body;
    const idempotencyKey = req.headers['x-idempotency-key'] || req.body.idempotencyKey || null;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ID',
        message: 'Invalid match ID format.',
      });
    }

    const match = await Match.findById(id);
    if (!match) {
      return res.status(404).json({
        success: false,
        code: 'MATCH_NOT_FOUND',
        message: 'Match session not found.',
      });
    }

    // 1. Match Ownership Verification
    const guestToken = getGuestTokenFromRequest(req);
    const accessCheck = matchService.verifyMatchAccess(match, req.user, guestToken);

    if (!accessCheck.authorized) {
      return res.status(accessCheck.statusCode).json({
        success: false,
        code: accessCheck.statusCode === 401 ? 'AUTH_REQUIRED' : 'ACCESS_DENIED',
        message: accessCheck.message,
      });
    }

    // 2. Safe Retry / Idempotency Check
    // If this move request was ALREADY processed with the same idempotency key, return state without re-executing
    if (idempotencyKey) {
      const alreadyProcessed =
        match.lastProcessedIdempotencyKey === idempotencyKey ||
        match.moveHistory.some((m) => m.idempotencyKey === idempotencyKey);

      if (alreadyProcessed) {
        // If an AI turn was stalled/failed during the previous attempt, complete it now
        const isAITurnPending =
          match.status === 'in_progress' &&
          match.mode === 'vs_ai' &&
          match.players?.player2?.isAI &&
          ((match.gameSlug === 'aadu-puli-aatam' && match.currentTurn === 'tigers') ||
           (match.gameSlug === 'pallanguzhi' && match.currentTurn === 'player2'));

        if (isAITurnPending) {
          try {
            await executeAITurn(match);
            await match.save();
          } catch (aiErr) {
            return res.status(500).json({
              success: false,
              code: 'AI_CALCULATION_FAILED',
              message: 'The computer could not complete its turn. Please retry.',
              error: aiErr.message,
              data: { match },
            });
          }
        }

        const { legalMoves, contextualHint } = matchService.getLegalMovesAndHint(
          match.gameSlug,
          match.boardState
        );

        return res.status(200).json({
          success: true,
          duplicateDetected: true,
          message: 'Move already processed authoritatively.',
          data: {
            match,
            legalMoves,
            contextualHint,
          },
        });
      }
    }

    // 3. Player Identity, Selected Side, and Turn Validation
    const playerRole = player || match.currentTurn;
    const sideTurnCheck = matchService.validatePlayerTurnAndSide(
      match,
      req.user,
      playerRole
    );

    if (!sideTurnCheck.valid) {
      return res.status(sideTurnCheck.statusCode).json({
        success: false,
        code: sideTurnCheck.code || 'INVALID_TURN',
        message: sideTurnCheck.message,
      });
    }

    // 4. Authoritative Move Validation & Execution
    const movePayload = {
      from: from !== undefined && from !== null && from !== '' ? Number(from) : null,
      to: to !== undefined && to !== null && to !== '' ? Number(to) : null,
      player: playerRole,
    };

    const result = matchService.processMove(
      match.gameSlug,
      match.boardState,
      movePayload
    );

    if (!result.success) {
      // Return Section 13 "Explain My Move" rejection details
      return res.status(400).json({
        success: false,
        code: 'INVALID_MOVE',
        rejectionReason: result.rejectionReason,
        message: `Your move is invalid: ${result.rejectionReason} Please select a legal move.`,
      });
    }

    // Append human move to match history
    const moveNumber = match.moveHistory.length + 1;
    match.moveHistory.push({
      moveNumber,
      player: movePayload.player,
      actionType: result.actionType,
      from: movePayload.from,
      to: movePayload.to,
      captured: result.captured,
      idempotencyKey,
      timestamp: new Date(),
    });

    if (idempotencyKey) {
      match.lastProcessedIdempotencyKey = idempotencyKey;
    }

    // Update match authoritative state
    match.boardState = result.newState;
    match.currentTurn = result.newState.turn;

    if (result.isGameOver) {
      match.status = 'completed';
      match.winner = result.winner;
      match.winReason = result.winReason;
      match.completedAt = new Date();
    } else if (match.mode === 'vs_ai' && match.players.player2.isAI) {
      // If AI turn, calculate and execute AI response ONLY for authorized match
      const isAITurn =
        (match.gameSlug === 'aadu-puli-aatam' && result.newState.turn === 'tigers') ||
        (match.gameSlug === 'pallanguzhi' && result.newState.turn === 'player2');

      if (isAITurn) {
        try {
          await executeAITurn(match);
        } catch (aiErr) {
          // Save human move so far, but report AI failure so user can retry the turn
          await match.save();
          return res.status(500).json({
            success: false,
            code: 'AI_CALCULATION_FAILED',
            message: 'The computer could not complete its turn. Please retry.',
            error: aiErr.message,
            data: { match },
          });
        }
      }
    }

    await match.save();

    const { legalMoves, contextualHint } = matchService.getLegalMovesAndHint(
      match.gameSlug,
      match.boardState
    );

    return res.status(200).json({
      success: true,
      data: {
        match,
        legalMoves,
        contextualHint,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: 'Failed to process move due to internal server error.',
      error: error.message,
    });
  }
};

/**
 * @desc    Explicitly trigger/retry a pending AI turn
 * @route   POST /api/matches/:id/ai-move
 * @access  Protected / Guest Authorized
 */
const triggerAIMove = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ID',
        message: 'Invalid match ID format.',
      });
    }

    const match = await Match.findById(id);
    if (!match) {
      return res.status(404).json({
        success: false,
        code: 'MATCH_NOT_FOUND',
        message: 'Match session not found.',
      });
    }

    const guestToken = getGuestTokenFromRequest(req);
    const accessCheck = matchService.verifyMatchAccess(match, req.user, guestToken);

    if (!accessCheck.authorized) {
      return res.status(accessCheck.statusCode).json({
        success: false,
        code: accessCheck.statusCode === 401 ? 'AUTH_REQUIRED' : 'ACCESS_DENIED',
        message: accessCheck.message,
      });
    }

    if (match.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        code: 'MATCH_COMPLETED',
        message: 'This match has already ended.',
      });
    }

    const isAITurn =
      match.mode === 'vs_ai' &&
      match.players.player2.isAI &&
      ((match.gameSlug === 'aadu-puli-aatam' && match.currentTurn === 'tigers') ||
       (match.gameSlug === 'pallanguzhi' && match.currentTurn === 'player2'));

    if (!isAITurn) {
      return res.status(400).json({
        success: false,
        code: 'NOT_AI_TURN',
        message: 'It is not the computer\'s turn to move.',
      });
    }

    await executeAITurn(match);
    await match.save();

    const { legalMoves, contextualHint } = matchService.getLegalMovesAndHint(
      match.gameSlug,
      match.boardState
    );

    return res.status(200).json({
      success: true,
      data: {
        match,
        legalMoves,
        contextualHint,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: 'AI_CALCULATION_FAILED',
      message: 'The computer could not complete its turn. Please retry.',
      error: error.message,
    });
  }
};

/**
 * @desc    Restart a match by preserving the existing match and spawning a new one
 * @route   POST /api/matches/:id/restart
 * @access  Protected / Guest Authorized
 */
const restartMatch = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid match ID format.',
      });
    }

    const previousMatch = await Match.findById(id);
    if (!previousMatch) {
      return res.status(404).json({
        success: false,
        message: 'Match session not found.',
      });
    }

    // 1. Match Ownership Verification
    const guestToken = getGuestTokenFromRequest(req);
    const accessCheck = matchService.verifyMatchAccess(previousMatch, req.user, guestToken);

    if (!accessCheck.authorized) {
      return res.status(accessCheck.statusCode).json({
        success: false,
        message: accessCheck.message,
      });
    }

    // 2. Prevent duplicate restart requests from creating multiple matches
    if (previousMatch.restartedMatchId) {
      const existingRematch = await Match.findById(previousMatch.restartedMatchId);
      if (existingRematch) {
        const { legalMoves, contextualHint } = matchService.getLegalMovesAndHint(
          existingRematch.gameSlug,
          existingRematch.boardState
        );
        return res.status(200).json({
          success: true,
          message: 'Match was already restarted. Returning active rematch session.',
          data: {
            match: existingRematch,
            previousMatchId: previousMatch._id,
            guestToken: existingRematch.guestToken,
            legalMoves,
            contextualHint,
          },
        });
      }
    }

    // 3. Preserve original match and its complete move history
    // Do NOT overwrite completed matches!
    if (previousMatch.status === 'in_progress') {
      previousMatch.status = 'restarted';
      previousMatch.completedAt = new Date();
      previousMatch.winReason = 'Match concluded by player to initiate a restart.';
    }

    // 4. Create fresh board state for the same game and variant
    const cleanState = matchService.createInitialState(
      previousMatch.gameSlug,
      previousMatch.variantSlug || null,
      previousMatch.variantRules || null
    );

    // 5. Create new match document retaining all player and game settings
    const newMatch = await Match.create({
      gameId: previousMatch.gameId,
      gameSlug: previousMatch.gameSlug,
      variantId: previousMatch.variantId,
      variantSlug: previousMatch.variantSlug,
      variantName: previousMatch.variantName,
      variantRules: previousMatch.variantRules,
      ownerId: previousMatch.ownerId,
      isGuest: previousMatch.isGuest,
      guestToken: previousMatch.guestToken,
      mode: previousMatch.mode,
      aiDifficulty: previousMatch.aiDifficulty || 'medium',
      previousMatchId: previousMatch._id,
      players: {
        player1: {
          userId: previousMatch.players.player1.userId,
          name: previousMatch.players.player1.name,
          role: previousMatch.players.player1.role,
        },
        player2: {
          userId: previousMatch.players.player2.userId,
          name: previousMatch.players.player2.name,
          role: previousMatch.players.player2.role,
          isAI: previousMatch.players.player2.isAI,
        },
      },
      boardState: cleanState,
      currentTurn: cleanState.turn,
      moveHistory: [],
      status: 'in_progress',
      startedAt: new Date(),
    });

    // Link previous match to the newly spawned match
    previousMatch.restartedMatchId = newMatch._id;
    await previousMatch.save();

    const { legalMoves, contextualHint } = matchService.getLegalMovesAndHint(
      newMatch.gameSlug,
      cleanState
    );

    return res.status(200).json({
      success: true,
      message: 'Match successfully restarted as a new session.',
      data: {
        match: newMatch,
        previousMatchId: previousMatch._id,
        guestToken: newMatch.guestToken,
        legalMoves,
        contextualHint,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to restart match.',
      error: error.message,
    });
  }
};

/**
 * @desc    Get match history strictly for the authenticated user
 * @route   GET /api/matches/history
 * @access  Private (Authentication strictly required)
 */
const getMatchHistory = async (req, res) => {
  try {
    // Enforce authentication
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to view match history.',
      });
    }

    const userId = req.user._id;

    // Filter strictly by the authenticated user's ID
    const matches = await Match.find({
      $or: [
        { ownerId: userId },
        { 'players.player1.userId': userId },
        { 'players.player2.userId': userId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('gameId', 'name slug badgeTheme')
      .populate('variantId', 'variantName slug region isPlayable status rulesSummary differences');

    return res.status(200).json({
      success: true,
      count: matches.length,
      data: matches,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch match history.',
      error: error.message,
    });
  }
};

/**
 * @desc    Get active, unfinished matches belonging to the authenticated user
 * @route   GET /api/matches/saved
 * @access  Private (Authentication strictly required)
 */
const getSavedMatches = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to view saved matches.',
      });
    }

    const userId = req.user._id;

    // Retrieve active, in-progress matches
    const activeMatches = await Match.find({
      $or: [
        { ownerId: userId },
        { 'players.player1.userId': userId },
      ],
      status: 'in_progress',
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .populate('gameId', 'name slug badgeTheme description rules')
      .populate('variantId', 'variantName slug region isPlayable status rulesSummary differences');

    return res.status(200).json({
      success: true,
      count: activeMatches.length,
      data: activeMatches,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve saved matches.',
      error: error.message,
    });
  }
};

/**
 * @desc    Authoritatively resume an active match session
 * @route   GET /api/matches/:id/resume
 * @access  Protected / Guest Authorized
 */
const resumeMatch = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ID',
        message: 'Invalid match ID format.',
      });
    }

    const match = await Match.findById(id)
      .populate('gameId', 'name slug badgeTheme rules')
      .populate('variantId', 'variantName slug region isPlayable status rulesSummary differences');

    if (!match) {
      return res.status(404).json({
        success: false,
        code: 'MATCH_NOT_FOUND',
        message: 'Saved match session not found.',
      });
    }

    // 1. Verify match ownership / guest access
    const guestToken = getGuestTokenFromRequest(req);
    const accessCheck = matchService.verifyMatchAccess(match, req.user, guestToken);

    if (!accessCheck.authorized) {
      return res.status(accessCheck.statusCode).json({
        success: false,
        code: accessCheck.statusCode === 401 ? 'AUTH_REQUIRED' : 'ACCESS_DENIED',
        message: accessCheck.message,
      });
    }

    // 2. Prevent resuming completed, abandoned, or restarted matches
    if (match.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        resumable: false,
        code: 'MATCH_NOT_RESUMABLE',
        message: `This match is already ${match.status} and cannot be resumed. Please start a fresh match.`,
        data: {
          match,
        },
      });
    }

    // 3. Compute legal moves for the restored state WITHOUT executing any AI moves
    const { legalMoves, contextualHint } = matchService.getLegalMovesAndHint(
      match.gameSlug,
      match.boardState
    );

    return res.status(200).json({
      success: true,
      resumable: true,
      data: {
        match,
        legalMoves,
        contextualHint,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to resume match.',
      error: error.message,
    });
  }
};

module.exports = {
  createMatch,
  getMatchById,
  resumeMatch,
  getSavedMatches,
  submitMove,
  triggerAIMove,
  restartMatch,
  getMatchHistory,
};
