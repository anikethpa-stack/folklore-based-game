/**
 * Pallanguzhi (Traditional South Indian 14-Pit Mancala) Game Engine
 * Authoritative Rule Validation, Sowing Simulation, Cascading Captures & Win Detection
 */

const PIT_COUNT = 14;
const INITIAL_SEEDS_PER_PIT = 5;

/**
 * Generate initial clean state for Pallanguzhi
 */
const getInitialState = () => {
  // 14 pits, each seeded with 5 cowrie shells (70 shells total)
  const pits = new Array(PIT_COUNT).fill(INITIAL_SEEDS_PER_PIT);

  return {
    pits,
    stores: {
      player1: 0,
      player2: 0,
    },
    turn: 'player1', // Player 1 starts
    lastAction: null,
  };
};

/**
 * Determine which pits belong to which player
 * Player 1: indices 0..6
 * Player 2: indices 7..13
 */
const getPlayerPits = (player) => {
  return player === 'player1' ? [0, 1, 2, 3, 4, 5, 6] : [7, 8, 9, 10, 11, 12, 13];
};

/**
 * Get all legal starting pits for current turn
 */
const getLegalMoves = (state) => {
  const allowedIndices = getPlayerPits(state.turn);
  const legalMoves = [];

  for (const pitIndex of allowedIndices) {
    if (state.pits[pitIndex] > 0) {
      legalMoves.push({
        actionType: 'sow',
        from: pitIndex,
        seeds: state.pits[pitIndex],
      });
    }
  }

  return legalMoves;
};

/**
 * Validate selected pit for sowing
 */
const validateMove = (state, move) => {
  const { from, player } = move;
  const { pits, turn } = state;

  if (player && player !== turn) {
    return {
      isValid: false,
      reason: `It is currently ${turn === 'player1' ? 'Player 1' : 'Player 2'}'s turn to sow.`,
    };
  }

  if (from === null || from === undefined || from < 0 || from >= PIT_COUNT) {
    return {
      isValid: false,
      reason: `Invalid pit index ${from}. Pits range from 0 to 13.`,
    };
  }

  const allowedPits = getPlayerPits(turn);
  if (!allowedPits.includes(from)) {
    return {
      isValid: false,
      reason:
        turn === 'player1'
          ? `Pit ${from + 1} belongs to Player 2. You can only choose pits on your own side (Pits 1–7).`
          : `Pit ${from + 1} belongs to Player 1. You can only choose pits on your own side (Pits 8–14).`,
    };
  }

  if (pits[from] === 0) {
    return {
      isValid: false,
      reason: `Pit ${from + 1} is empty. You cannot sow from an empty pit. Please select a pit with cowrie shells.`,
    };
  }

  return {
    isValid: true,
    actionType: 'sow',
    from,
  };
};

/**
 * Execute continuous multi-lap sowing and capture logic
 */
const applyMove = (state, move, validationResult) => {
  const newPits = [...state.pits];
  const newStores = { ...state.stores };
  const player = state.turn;

  let currentPit = move.from;
  let inHand = newPits[currentPit];
  newPits[currentPit] = 0;

  const distributionLog = [];
  let capturedTotal = 0;

  // Multi-lap sowing loop
  while (inHand > 0) {
    currentPit = (currentPit + 1) % PIT_COUNT;
    newPits[currentPit] += 1;
    inHand -= 1;

    // When all shells in hand are placed:
    if (inHand === 0) {
      // If the pit we just dropped into now has MORE than 1 shell (i.e. was not empty before)
      if (newPits[currentPit] > 1) {
        // Multi-lap cascade: scoop up all shells in this pit and continue sowing
        inHand = newPits[currentPit];
        newPits[currentPit] = 0;
        distributionLog.push({ event: 'cascade_pickup', pit: currentPit, count: inHand });
      } else {
        // Last shell landed in a previously EMPTY pit (now contains exactly 1 shell)
        // Check next pit for capture
        const nextPit = (currentPit + 1) % PIT_COUNT;

        if (newPits[nextPit] === 0) {
          // The next pit is empty -> Capture all shells in the pit immediately following!
          const targetPit = (nextPit + 1) % PIT_COUNT;
          const capturedSeeds = newPits[targetPit];

          if (capturedSeeds > 0) {
            newStores[player] += capturedSeeds;
            capturedTotal += capturedSeeds;
            newPits[targetPit] = 0;
            distributionLog.push({
              event: 'capture',
              fromEmpty: nextPit,
              capturedFrom: targetPit,
              seeds: capturedSeeds,
            });

            // Double empty cascade check: if the pit after target is also empty, capture the subsequent pit
            const subsequentEmpty = (targetPit + 1) % PIT_COUNT;
            if (newPits[subsequentEmpty] === 0) {
              const secondTarget = (subsequentEmpty + 1) % PIT_COUNT;
              if (newPits[secondTarget] > 0) {
                const bonusSeeds = newPits[secondTarget];
                newStores[player] += bonusSeeds;
                capturedTotal += bonusSeeds;
                newPits[secondTarget] = 0;
                distributionLog.push({
                  event: 'double_capture',
                  capturedFrom: secondTarget,
                  seeds: bonusSeeds,
                });
              }
            }
          }
        }
        // Turn ends
        break;
      }
    }
  }

  // Switch turns
  const nextPlayer = player === 'player1' ? 'player2' : 'player1';

  const newState = {
    pits: newPits,
    stores: newStores,
    turn: nextPlayer,
    lastAction: {
      from: move.from,
      captured: capturedTotal,
      distributionLog,
    },
  };

  const outcome = checkGameOver(newState);

  return {
    newState,
    isGameOver: outcome.isGameOver,
    winner: outcome.winner,
    winReason: outcome.winReason,
  };
};

/**
 * Check if the game has ended (either player has no legal moves)
 */
const checkGameOver = (state) => {
  const p1Moves = getLegalMoves({ ...state, turn: 'player1' });
  const p2Moves = getLegalMoves({ ...state, turn: 'player2' });

  // If the active player has no moves, or both have no moves
  const currentMoves = state.turn === 'player1' ? p1Moves : p2Moves;

  if (currentMoves.length === 0) {
    // If the other player also has no moves, game over
    const otherMoves = state.turn === 'player1' ? p2Moves : p1Moves;

    if (otherMoves.length === 0 || p1Moves.length === 0 || p2Moves.length === 0) {
      // Award any leftover shells to the player who owns those pits
      const finalStores = { ...state.stores };
      for (let i = 0; i < 7; i++) {
        finalStores.player1 += state.pits[i];
      }
      for (let i = 7; i < 14; i++) {
        finalStores.player2 += state.pits[i];
      }

      let winner = 'draw';
      let winReason = `The match ended in a draw! Both players collected exactly ${finalStores.player1} shells.`;

      if (finalStores.player1 > finalStores.player2) {
        winner = 'player1';
        winReason = `Player 1 wins with ${finalStores.player1} shells against Player 2's ${finalStores.player2} shells!`;
      } else if (finalStores.player2 > finalStores.player1) {
        winner = 'player2';
        winReason = `Player 2 wins with ${finalStores.player2} shells against Player 1's ${finalStores.player1} shells!`;
      }

      return {
        isGameOver: true,
        winner,
        winReason,
        finalStores,
      };
    }
  }

  return { isGameOver: false, winner: null, winReason: null };
};

module.exports = {
  PIT_COUNT,
  INITIAL_SEEDS_PER_PIT,
  getInitialState,
  getLegalMoves,
  validateMove,
  applyMove,
  checkGameOver,
};

