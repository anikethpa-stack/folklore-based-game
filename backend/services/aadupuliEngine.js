/**
 * Aadu Puli Aatam (Goats and Tigers) Official Game Engine
 * Authoritative Rule Validation, Jump Graph, State Management & Hint Generation
 */

// Adjacency connections across the 23 vertices of the traditional pyramid grid
// Nodes:
// 0: Apex
// 1, 2, 3: Tier 1
// 4, 5, 6, 7, 8: Tier 2
// 9, 10, 11, 12, 13, 14, 15: Tier 3 (Base of Triangle)
// 16, 17, 18, 19, 20, 21, 22: Tier 4 (Rectangular Box Extension)
const ADJACENCY = {
  0: [1, 2, 3],
  1: [0, 2, 4, 5],
  2: [0, 1, 3, 6],
  3: [0, 2, 7, 8],
  4: [1, 5, 9],
  5: [1, 4, 6, 10, 11],
  6: [2, 5, 7, 12],
  7: [3, 6, 8, 13, 14],
  8: [3, 7, 15],
  9: [4, 10, 16],
  10: [5, 9, 11, 17],
  11: [5, 10, 12, 17, 18],
  12: [6, 11, 13, 18, 19],
  13: [7, 12, 14, 19, 20],
  14: [7, 13, 15, 20],
  15: [8, 14, 21],
  16: [9, 17, 22],
  17: [10, 11, 16, 18, 22],
  18: [11, 12, 17, 19, 22],
  19: [12, 13, 18, 20, 22],
  20: [13, 14, 19, 21, 22],
  21: [15, 20, 22],
  22: [16, 17, 18, 19, 20, 21],
};

// Straight-line jump triplets for Tigers: [fromTiger, overGoat, toEmptyLanding]
const JUMP_TRIPLETS = [
  // Vertical/Radial lines descending from apex 0
  [0, 1, 4], [4, 1, 0],
  [0, 2, 6], [6, 2, 0],
  [0, 3, 8], [8, 3, 0],

  // Diagonal and vertical descending lines through Tier 1 & 2
  [1, 5, 10], [10, 5, 1],
  [2, 6, 12], [12, 6, 2],
  [3, 7, 14], [14, 7, 3],

  [4, 9, 16], [16, 9, 4],
  [5, 11, 17], [17, 11, 5],
  [6, 12, 18], [18, 12, 6],
  [7, 13, 19], [19, 13, 7],
  [8, 15, 21], [21, 15, 8],

  // Horizontal jumps along Tier 1
  [1, 2, 3], [3, 2, 1],

  // Horizontal jumps along Tier 2
  [4, 5, 6], [6, 5, 4],
  [5, 6, 7], [7, 6, 5],
  [6, 7, 8], [8, 7, 6],

  // Horizontal jumps along Tier 3 (Base of Triangle)
  [9, 10, 11], [11, 10, 9],
  [10, 11, 12], [12, 11, 10],
  [11, 12, 13], [13, 12, 11],
  [12, 13, 14], [14, 13, 12],
  [13, 14, 15], [15, 14, 13],

  // Lower rectangle jumps
  [16, 17, 18], [18, 17, 16],
  [17, 18, 19], [19, 18, 17],
  [18, 19, 20], [20, 19, 18],
  [19, 20, 21], [21, 20, 19],

  // Jumps through base node 22
  [9, 16, 22], [22, 16, 9],
  [12, 18, 22], [22, 18, 12],
  [15, 21, 22], [22, 21, 15],
];

/**
 * Generate initial clean state for Aadu Puli Aatam
 */
const getInitialState = () => {
  const nodes = new Array(23).fill(null);
  // Traditional opening: 3 tigers placed at Apex (0) and Top Wings (1 and 3)
  nodes[0] = 'tiger';
  nodes[1] = 'tiger';
  nodes[3] = 'tiger';

  return {
    nodes,
    totalGoats: 15,
    goatsPlaced: 0,
    goatsCaptured: 0,
    phase: 'placement', // 'placement' until 15 goats placed, then 'movement'
    turn: 'goats', // Goats always move first in traditional Indian rules
    lastMove: null,
  };
};

/**
 * Compute all legal moves for the current player in the given state
 */
const getLegalMoves = (state) => {
  const legalMoves = [];
  const { nodes, phase, turn, goatsPlaced, totalGoats } = state;

  if (turn === 'goats') {
    if (phase === 'placement' && goatsPlaced < totalGoats) {
      // Phase 1: Goat placement on any empty vertex
      for (let i = 0; i < 23; i++) {
        if (nodes[i] === null) {
          legalMoves.push({
            actionType: 'place',
            from: null,
            to: i,
          });
        }
      }
    } else {
      // Phase 2: Movement of goats along connected lines
      for (let from = 0; from < 23; from++) {
        if (nodes[from] === 'goat') {
          const neighbors = ADJACENCY[from] || [];
          for (const to of neighbors) {
            if (nodes[to] === null) {
              legalMoves.push({
                actionType: 'move',
                from,
                to,
              });
            }
          }
        }
      }
    }
  } else if (turn === 'tigers') {
    // Tigers can move 1 step to an adjacent empty vertex OR jump over a goat
    for (let from = 0; from < 23; from++) {
      if (nodes[from] === 'tiger') {
        // 1-step moves
        const neighbors = ADJACENCY[from] || [];
        for (const to of neighbors) {
          if (nodes[to] === null) {
            legalMoves.push({
              actionType: 'move',
              from,
              to,
            });
          }
        }

        // Jumps over adjacent goats
        for (const [tFrom, over, landing] of JUMP_TRIPLETS) {
          if (tFrom === from && nodes[over] === 'goat' && nodes[landing] === null) {
            legalMoves.push({
              actionType: 'jump',
              from,
              over,
              to: landing,
            });
          }
        }
      }
    }
  }

  return legalMoves;
};

/**
 * Authoritative move validation with "Explain My Move" rejection analysis
 */
const validateMove = (state, move) => {
  const { from, to, player } = move;
  const { nodes, phase, turn, goatsPlaced, totalGoats, goatsCaptured } = state;

  // 1. Turn validation
  if (player && player !== turn) {
    return {
      isValid: false,
      reason: `It is currently the ${turn.toUpperCase()}' turn. Please wait for your turn.`,
    };
  }

  // Destination bounds check
  if (to < 0 || to >= 23) {
    return {
      isValid: false,
      reason: `Vertex position ${to} is outside the 23-point board boundary.`,
    };
  }

  // 2. Goat Turn Validation
  if (turn === 'goats') {
    if (phase === 'placement') {
      if (from !== null && from !== undefined) {
        return {
          isValid: false,
          reason:
            'You cannot move goats already on the board during the Placement Phase. You must place an unentered goat onto a vacant point.',
        };
      }
      if (nodes[to] !== null) {
        return {
          isValid: false,
          reason: `Vertex ${to} is already occupied by a ${nodes[to]}. Goats must be placed on empty vertices.`,
        };
      }

      // Valid Goat Placement
      return {
        isValid: true,
        actionType: 'place',
        captured: null,
      };
    } else {
      // Movement Phase
      if (from === null || from === undefined) {
        return {
          isValid: false,
          reason: 'All 15 goats have entered the board. You must select an existing goat to move.',
        };
      }
      if (nodes[from] !== 'goat') {
        return {
          isValid: false,
          reason: `No goat found at vertex ${from} to move.`,
        };
      }
      if (nodes[to] !== null) {
        return {
          isValid: false,
          reason: `Destination vertex ${to} is occupied. Goats can only move to vacant adjacent points.`,
        };
      }
      if (!ADJACENCY[from].includes(to)) {
        return {
          isValid: false,
          reason: `Point ${from} is not directly connected to point ${to} along the board lines.`,
        };
      }

      // Valid Goat Movement
      return {
        isValid: true,
        actionType: 'move',
        captured: null,
      };
    }
  }

  // 3. Tiger Turn Validation
  if (turn === 'tigers') {
    if (from === null || from === undefined) {
      return {
        isValid: false,
        reason: 'You must select one of the 3 tigers on the board to move or jump.',
      };
    }
    if (nodes[from] !== 'tiger') {
      return {
        isValid: false,
        reason: `Position ${from} does not contain a Tiger.`,
      };
    }
    if (nodes[to] !== null) {
      return {
        isValid: false,
        reason: `Target vertex ${to} is already occupied by a ${nodes[to]}.`,
      };
    }

    // Check if it's an ordinary 1-step move
    if (ADJACENCY[from].includes(to)) {
      return {
        isValid: true,
        actionType: 'move',
        captured: null,
      };
    }

    // Check if it's a legal straight-line jump
    const jump = JUMP_TRIPLETS.find(
      ([tFrom, over, landing]) => tFrom === from && landing === to
    );

    if (jump) {
      const [, over] = jump;
      if (nodes[over] === 'goat') {
        return {
          isValid: true,
          actionType: 'jump',
          over,
          captured: { position: over, piece: 'goat' },
        };
      } else if (nodes[over] === 'tiger') {
        return {
          isValid: false,
          reason: 'A Tiger cannot jump over another Tiger. Only single Goats can be jumped.',
        };
      } else {
        return {
          isValid: false,
          reason: 'A Tiger can only jump if there is a Goat directly between the two vertices along a straight line.',
        };
      }
    }

    return {
      isValid: false,
      reason:
        `Move from ${from} to ${to} is neither a direct 1-step line nor a legal straight-line jump over a goat.`,
    };
  }

  return { isValid: false, reason: 'Unrecognized move condition.' };
};

/**
 * Execute validated move and return new authoritative state
 */
const applyMove = (state, move, validationResult) => {
  const newNodes = [...state.nodes];
  let newGoatsPlaced = state.goatsPlaced;
  let newGoatsCaptured = state.goatsCaptured;
  let newPhase = state.phase;

  if (state.turn === 'goats') {
    if (validationResult.actionType === 'place') {
      newNodes[move.to] = 'goat';
      newGoatsPlaced += 1;
      if (newGoatsPlaced >= state.totalGoats) {
        newPhase = 'movement';
      }
    } else {
      newNodes[move.from] = null;
      newNodes[move.to] = 'goat';
    }
  } else if (state.turn === 'tigers') {
    newNodes[move.from] = null;
    newNodes[move.to] = 'tiger';

    if (validationResult.actionType === 'jump' && validationResult.over !== undefined) {
      newNodes[validationResult.over] = null;
      newGoatsCaptured += 1;
    }
  }

  const nextTurn = state.turn === 'goats' ? 'tigers' : 'goats';

  const newState = {
    ...state,
    nodes: newNodes,
    goatsPlaced: newGoatsPlaced,
    goatsCaptured: newGoatsCaptured,
    phase: newPhase,
    turn: nextTurn,
    lastMove: {
      from: move.from,
      to: move.to,
      actionType: validationResult.actionType,
      captured: validationResult.captured,
    },
  };

  // Check Game Over Conditions
  const outcome = checkGameOver(newState);

  return {
    newState,
    isGameOver: outcome.isGameOver,
    winner: outcome.winner,
    winReason: outcome.winReason,
  };
};

/**
 * Check if match has concluded
 */
const checkGameOver = (state) => {
  // 1. Tigers Win Condition: 5 or more goats captured
  if (state.goatsCaptured >= 5) {
    return {
      isGameOver: true,
      winner: 'tigers',
      winReason:
        'Tigers have captured 5 goats! The remaining goat herd can no longer encircle and trap the tigers.',
    };
  }

  // 2. Goats Win Condition: Check if all 3 tigers have 0 legal moves
  const tigerMoves = getLegalMoves({ ...state, turn: 'tigers' });
  if (tigerMoves.length === 0) {
    return {
      isGameOver: true,
      winner: 'goats',
      winReason:
        'Victory for the Goats! All three tigers have been completely encircled and immobilized with no legal moves available.',
    };
  }

  return { isGameOver: false, winner: null, winReason: null };
};

module.exports = {
  ADJACENCY,
  JUMP_TRIPLETS,
  getInitialState,
  getLegalMoves,
  validateMove,
  applyMove,
  checkGameOver,
};

