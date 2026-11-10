const Match = require('../models/Match');
const Game = require('../models/Game');
const matchService = require('../services/matchService');

/**
 * @desc    Start a new match
 * @route   POST /api/matches
 * @access  Public / Private (attaches user if authenticated)
 */
const createMatch = async (req, res) => {
  try {
    const { gameSlug, mode = 'pass_and_play', variantId = null, role = null } = req.body;

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

    // Generate initial board state via authoritative engine
    const boardState = matchService.createInitialState(game.slug);

    // Initial players setup
    const userId = req.user?._id || null;
    const isAIMode = mode === 'vs_ai';

    let player1Role = 'player1';
    let player2Role = 'player2';

    if (game.slug === 'aadu-puli-aatam') {
      player1Role = 'goats';
      player2Role = 'tigers';
    }

    const match = await Match.create({
      gameId: game._id,
      gameSlug: game.slug,
      variantId,
      mode,
      players: {
        player1: {
          userId,
          name: req.user?.username || 'Player 1',
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
 * @desc    Get match state by ID
 * @route   GET /api/matches/:id
 * @access  Public / Private
 */
const getMatchById = async (req, res) => {
  try {
    const { id } = req.params;
    const match = await Match.findById(id).populate('gameId', 'name slug badgeTheme');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match session not found.',
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
 * @desc    Submit a move for authoritative backend validation
 * @route   POST /api/matches/:id/moves
 * @access  Public / Private
 */
const submitMove = async (req, res) => {
  try {
    const { id } = req.params;
    const { from, to, player } = req.body;

    const match = await Match.findById(id);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match session not found.',
      });
    }

    if (match.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: `This match is already ${match.status}. No further moves can be submitted.`,
        isGameOver: true,
        winner: match.winner,
        winReason: match.winReason,
      });
    }

    // Authoritative Move Validation & Execution
    const movePayload = {
      from: from !== undefined && from !== null && from !== '' ? Number(from) : null,
      to: to !== undefined && to !== null && to !== '' ? Number(to) : null,
      player: player || match.currentTurn,
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
        rejectionReason: result.rejectionReason,
        code: 'INVALID_MOVE',
      });
    }

    // Append move to match history
    const moveNumber = match.moveHistory.length + 1;
    match.moveHistory.push({
      moveNumber,
      player: movePayload.player,
      actionType: result.actionType,
      from: movePayload.from,
      to: movePayload.to,
      captured: result.captured,
      timestamp: new Date(),
    });

    // Update match authoritative state
    match.boardState = result.newState;
    match.currentTurn = result.newState.turn;

    if (result.isGameOver) {
      match.status = 'completed';
      match.winner = result.winner;
      match.winReason = result.winReason;
      match.completedAt = new Date();
    } else if (match.mode === 'vs_ai' && match.players.player2.isAI) {
      // If AI turn, calculate and execute AI response
      const isAITurn =
        (match.gameSlug === 'aadu-puli-aatam' && result.newState.turn === 'tigers') ||
        (match.gameSlug === 'pallanguzhi' && result.newState.turn === 'player2');

      if (isAITurn) {
        const aiMove = matchService.getAIMove(match.gameSlug, result.newState);
        if (aiMove) {
          const aiResult = matchService.processMove(
            match.gameSlug,
            result.newState,
            { ...aiMove, player: result.newState.turn }
          );

          if (aiResult.success) {
            match.moveHistory.push({
              moveNumber: moveNumber + 1,
              player: result.newState.turn,
              actionType: aiResult.actionType,
              from: aiMove.from,
              to: aiMove.to,
              captured: aiResult.captured,
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
          }
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
      message: 'Failed to process move.',
      error: error.message,
    });
  }
};

/**
 * @desc    Restart a match
 * @route   POST /api/matches/:id/restart
 * @access  Public / Private
 */
const restartMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const match = await Match.findById(id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match session not found.',
      });
    }

    // Reset board state to fresh initial state
    const cleanState = matchService.createInitialState(match.gameSlug);
    match.boardState = cleanState;
    match.currentTurn = cleanState.turn;
    match.status = 'in_progress';
    match.winner = null;
    match.winReason = null;
    match.moveHistory = [];
    match.startedAt = new Date();
    match.completedAt = null;

    await match.save();

    const { legalMoves, contextualHint } = matchService.getLegalMovesAndHint(
      match.gameSlug,
      cleanState
    );

    return res.status(200).json({
      success: true,
      message: 'Match successfully restarted.',
      data: {
        match,
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
 * @desc    Get match history (for logged-in user or general matches)
 * @route   GET /api/matches/history
 * @access  Public / Private
 */
const getMatchHistory = async (req, res) => {
  try {
    const query = {};
    if (req.user?._id) {
      query['players.player1.userId'] = req.user._id;
    }

    const matches = await Match.find(query)
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('gameId', 'name slug badgeTheme');

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

module.exports = {
  createMatch,
  getMatchById,
  submitMove,
  restartMatch,
  getMatchHistory,
};
