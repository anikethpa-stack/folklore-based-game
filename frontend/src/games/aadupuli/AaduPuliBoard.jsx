import React, { useState } from 'react';

// Exact coordinate layout for the 23 points on a 500x650 SVG canvas
const NODE_COORDINATES = {
  0: { x: 250, y: 50 },

  // Tier 1
  1: { x: 170, y: 160 },
  2: { x: 250, y: 160 },
  3: { x: 330, y: 160 },

  // Tier 2
  4: { x: 90, y: 270 },
  5: { x: 170, y: 270 },
  6: { x: 250, y: 270 },
  7: { x: 330, y: 270 },
  8: { x: 410, y: 270 },

  // Tier 3 (Triangle base)
  9: { x: 50, y: 390 },
  10: { x: 115, y: 390 },
  11: { x: 180, y: 390 },
  12: { x: 250, y: 390 },
  13: { x: 320, y: 390 },
  14: { x: 385, y: 390 },
  15: { x: 450, y: 390 },

  // Tier 4 (Lower rectangle box)
  16: { x: 50, y: 520 },
  17: { x: 115, y: 520 },
  18: { x: 180, y: 520 },
  19: { x: 320, y: 520 },
  20: { x: 385, y: 520 },
  21: { x: 450, y: 520 },
  22: { x: 250, y: 590 },
};

// Lines to draw on the board
const BOARD_LINES = [
  // Triangle outer perimeter
  [0, 9], [0, 15], [9, 15],

  // Central vertical spine
  [0, 22],

  // Internal descending radial lines
  [0, 16], [0, 21],

  // Horizontal Cross Tier 1
  [1, 3],

  // Horizontal Cross Tier 2
  [4, 8],

  // Diagonal cross braces Tier 1 to Tier 2
  [1, 6], [3, 6], [2, 5], [2, 7],

  // Diagonal braces Tier 2 to Tier 3
  [5, 12], [7, 12], [6, 11], [6, 13],

  // Lower box outer lines
  [9, 16], [15, 21], [16, 21],
  [10, 17], [11, 18], [13, 19], [14, 20],

  // Radial connectors to anchor vertex 22
  [16, 22], [17, 22], [18, 22], [19, 22], [20, 22], [21, 22],
];

export default function AaduPuliBoard({
  boardState,
  legalMoves = [],
  onMakeMove,
  disabled = false,
}) {
  const [selectedNode, setSelectedNode] = useState(null);

  const { nodes = [], phase, turn, goatsPlaced, totalGoats } = boardState || {};

  // Find destinations available for currently selected node
  const availableDestinations = selectedNode !== null
    ? legalMoves
        .filter((m) => m.from === selectedNode)
        .map((m) => m.to)
    : [];

  const handleNodeClick = (nodeIndex) => {
    if (disabled) return;

    const piece = nodes[nodeIndex];

    // Case 1: Goat placement phase
    if (turn === 'goats' && phase === 'placement' && goatsPlaced < totalGoats) {
      if (piece === null) {
        onMakeMove({ from: null, to: nodeIndex, player: 'goats' });
        setSelectedNode(null);
      }
      return;
    }

    // Case 2: Selecting own piece to move
    if (piece === turn.slice(0, -1)) {
      // 'goats' -> 'goat', 'tigers' -> 'tiger'
      if (selectedNode === nodeIndex) {
        setSelectedNode(null); // Toggle unselect
      } else {
        setSelectedNode(nodeIndex);
      }
      return;
    }

    // Case 3: Clicking destination vertex while a piece is selected
    if (selectedNode !== null) {
      if (availableDestinations.includes(nodeIndex)) {
        onMakeMove({ from: selectedNode, to: nodeIndex, player: turn });
        setSelectedNode(null);
      } else if (piece === null) {
        // Attempt move even if client doesn't see it in precomputed list
        // (Lets server validate and return "Explain My Move" rejection reason!)
        onMakeMove({ from: selectedNode, to: nodeIndex, player: turn });
        setSelectedNode(null);
      }
    }
  };

  return (
    <div className="board-svg-wrapper">
      <svg
        viewBox="0 0 500 650"
        className="aadupuli-svg-board"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Subtle drop shadow for pieces */}
          <filter id="piece-shadow" x="-20%" y="-20%" width="150%" height="150%">
            <feDropShadow dx="2" dy="3" stdDeviation="2" floodColor="#25221E" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Board Background Parchment Plate */}
        <polygon
          points="250,20 480,390 480,550 250,620 20,550 20,390"
          fill="#F3E6C8"
          stroke="#25221E"
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* Board Lines */}
        {BOARD_LINES.map(([from, to], idx) => {
          const p1 = NODE_COORDINATES[from];
          const p2 = NODE_COORDINATES[to];
          if (!p1 || !p2) return null;
          return (
            <line
              key={idx}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#25221E"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          );
        })}

        {/* Vertex Nodes and Interactive Pieces */}
        {Object.entries(NODE_COORDINATES).map(([indexStr, pos]) => {
          const idx = parseInt(indexStr, 10);
          const piece = nodes[idx];
          const isSelected = selectedNode === idx;
          const isLegalDestination = availableDestinations.includes(idx);
          const isPlacementHover =
            turn === 'goats' && phase === 'placement' && piece === null && !disabled;

          return (
            <g
              key={idx}
              className={`board-node-group ${piece ? 'has-piece' : 'empty-node'} ${
                isSelected ? 'selected' : ''
              } ${isLegalDestination ? 'legal-target' : ''}`}
              onClick={() => handleNodeClick(idx)}
              style={{ cursor: disabled ? 'default' : 'pointer' }}
            >
              {/* Vertex Base Anchor Point */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r="7"
                fill="#25221E"
              />

              {/* Legal Move Destination Target Pulse */}
              {isLegalDestination && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="18"
                  fill="none"
                  stroke="#304C3A"
                  strokeWidth="3.5"
                  strokeDasharray="4 2"
                  className="pulsing-ring"
                />
              )}

              {/* Selected Piece Highlight Ring */}
              {isSelected && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="23"
                  fill="none"
                  stroke="#D9A441"
                  strokeWidth="4"
                  className="selected-ring"
                />
              )}

              {/* Tiger Piece */}
              {piece === 'tiger' && (
                <g filter="url(#piece-shadow)">
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="18"
                    fill="#8B3A2E"
                    stroke="#25221E"
                    strokeWidth="3"
                  />
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="10"
                    fill="#D9A441"
                    stroke="#25221E"
                    strokeWidth="1.5"
                  />
                  <circle cx={pos.x} cy={pos.y} r="3" fill="#25221E" />
                </g>
              )}

              {/* Goat Piece */}
              {piece === 'goat' && (
                <g filter="url(#piece-shadow)">
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="15"
                    fill="#FAF4E8"
                    stroke="#25221E"
                    strokeWidth="3"
                  />
                  <circle cx={pos.x} cy={pos.y} r="6" fill="#304C3A" />
                </g>
              )}

              {/* Placement Phase Empty Indicator Hover */}
              {isPlacementHover && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="12"
                  fill="none"
                  stroke="#8B3A2E"
                  strokeWidth="2"
                  strokeDasharray="2 2"
                  opacity="0.6"
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

