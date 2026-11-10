import React from 'react';

export default function PallanguzhiBoard({
  boardState,
  legalMoves = [],
  onMakeMove,
  disabled = false,
}) {
  const { pits = [], stores = { player1: 0, player2: 0 }, turn } = boardState || {};

  // Player 1 owns bottom row: pits 0, 1, 2, 3, 4, 5, 6
  const bottomRowPits = [0, 1, 2, 3, 4, 5, 6];

  // Player 2 owns top row: pits 13, 12, 11, 10, 9, 8, 7 (reversed for intuitive counter-clockwise alignment)
  const topRowPits = [13, 12, 11, 10, 9, 8, 7];

  const handlePitClick = (pitIndex) => {
    if (disabled) return;
    onMakeMove({ from: pitIndex, player: turn });
  };

  const isLegalPit = (pitIndex) => {
    return legalMoves.some((m) => m.from === pitIndex);
  };

  return (
    <div className="pallanguzhi-board-container">
      {/* Outer Wooden Trough Board */}
      <div className="wooden-trough-board">
        {/* Left Storehouse (Player 2 Captured Shells) */}
        <div className={`storehouse player2-store ${turn === 'player2' ? 'active-store' : ''}`}>
          <div className="store-label">Player 2 Bank</div>
          <div className="store-shell-count">{stores.player2 || 0}</div>
          <div className="store-shell-badge">🐚 Shells</div>
        </div>

        {/* Center 14-Pit Play Area */}
        <div className="pits-matrix">
          {/* Top Row (Player 2: Pits 13 down to 7) */}
          <div className="pits-row top-row">
            {topRowPits.map((pitIdx) => {
              const seedCount = pits[pitIdx] || 0;
              const isPlayable = isLegalPit(pitIdx) && !disabled;
              return (
                <div
                  key={pitIdx}
                  className={`pit-bowl ${isPlayable ? 'playable-pit' : ''} ${
                    turn === 'player2' ? 'current-player-side' : ''
                  }`}
                  onClick={() => handlePitClick(pitIdx)}
                >
                  <span className="pit-index-label">Pit {pitIdx + 1}</span>
                  <div className="shells-cluster">
                    <span className="seed-number">{seedCount}</span>
                    <div className="shell-dots-visual">
                      {Array.from({ min: 0, length: Math.min(seedCount, 8) }).map((_, i) => (
                        <span key={i} className="cowrie-dot"></span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="trough-divider-crease"></div>

          {/* Bottom Row (Player 1: Pits 0 up to 6) */}
          <div className="pits-row bottom-row">
            {bottomRowPits.map((pitIdx) => {
              const seedCount = pits[pitIdx] || 0;
              const isPlayable = isLegalPit(pitIdx) && !disabled;
              return (
                <div
                  key={pitIdx}
                  className={`pit-bowl ${isPlayable ? 'playable-pit' : ''} ${
                    turn === 'player1' ? 'current-player-side' : ''
                  }`}
                  onClick={() => handlePitClick(pitIdx)}
                >
                  <span className="pit-index-label">Pit {pitIdx + 1}</span>
                  <div className="shells-cluster">
                    <span className="seed-number">{seedCount}</span>
                    <div className="shell-dots-visual">
                      {Array.from({ min: 0, length: Math.min(seedCount, 8) }).map((_, i) => (
                        <span key={i} className="cowrie-dot"></span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Storehouse (Player 1 Captured Shells) */}
        <div className={`storehouse player1-store ${turn === 'player1' ? 'active-store' : ''}`}>
          <div className="store-label">Player 1 Bank</div>
          <div className="store-shell-count">{stores.player1 || 0}</div>
          <div className="store-shell-badge">🐚 Shells</div>
        </div>
      </div>
    </div>
  );
}

