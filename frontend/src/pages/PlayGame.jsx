import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import matchApi from '../api/matchApi';
import gameApi from '../api/gameApi';
import AaduPuliBoard from '../games/aadupuli/AaduPuliBoard';
import PallanguzhiBoard from '../games/pallanguzhi/PallanguzhiBoard';
import {
  RotateCcw,
  HelpCircle,
  Sparkles,
  AlertCircle,
  Trophy,
  Bot,
  Users,
  Lightbulb,
  X,
  BookOpen,
} from 'lucide-react';

export default function PlayGame() {
  const { id: gameSlug } = useParams();

  const [match, setMatch] = useState(null);
  const [gameInfo, setGameInfo] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [contextualHint, setContextualHint] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState('pass_and_play'); // 'pass_and_play' | 'vs_ai'

  // Explain My Move rejection feedback
  const [invalidMoveExplanation, setInvalidMoveExplanation] = useState(null);

  // Modals
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);

  // Initialize or fetch match
  const startNewMatch = async (selectedMode = mode) => {
    setLoading(true);
    setInvalidMoveExplanation(null);
    try {
      // 1. Fetch game info if not already loaded
      if (!gameInfo) {
        const gRes = await gameApi.getGameById(gameSlug);
        setGameInfo(gRes.data);
      }

      // 2. Create authoritative match session on backend
      const res = await matchApi.createMatch({
        gameSlug,
        mode: selectedMode,
      });

      setMatch(res.data.match);
      setLegalMoves(res.data.legalMoves || []);
      setContextualHint(res.data.contextualHint || '');
      setShowVictoryModal(false);
    } catch (err) {
      console.error('Failed to start match:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startNewMatch(mode);
  }, [gameSlug]);

  // Handle move submission to backend
  const handleMakeMove = async (movePayload) => {
    if (!match || submitting || match.status !== 'in_progress') return;

    setSubmitting(true);
    setInvalidMoveExplanation(null);

    try {
      const res = await matchApi.submitMove(match._id, movePayload);
      setMatch(res.data.match);
      setLegalMoves(res.data.legalMoves || []);
      setContextualHint(res.data.contextualHint || '');

      if (res.data.match.status === 'completed') {
        setShowVictoryModal(true);
      }
    } catch (err) {
      // Catch "Explain My Move" rejection reason from backend
      const reason =
        err.response?.data?.rejectionReason ||
        err.response?.data?.message ||
        'This move is not permitted according to traditional rules.';
      setInvalidMoveExplanation(reason);
    } finally {
      setSubmitting(false);
    }
  };

  // Restart current match
  const handleConfirmRestart = async () => {
    setShowRestartConfirm(false);
    setLoading(true);
    try {
      const res = await matchApi.restartMatch(match._id);
      setMatch(res.data.match);
      setLegalMoves(res.data.legalMoves || []);
      setContextualHint(res.data.contextualHint || '');
      setInvalidMoveExplanation(null);
      setShowVictoryModal(false);
    } catch (err) {
      console.error('Failed to restart match:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    startNewMatch(newMode);
  };

  if (loading) {
    return (
      <div className="container page-wrapper" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <div className="comic-panel" style={{ display: 'inline-block', padding: '2rem 3rem' }}>
          <div className="badge badge-ochre" style={{ marginBottom: '1rem' }}>
            Authoritative Server Engine
          </div>
          <h3>Setting the Traditional Board...</h3>
          <p style={{ color: 'var(--color-ink-soft)', marginTop: '0.5rem' }}>
            Initializing piece layouts and verifying legal move tables in MongoDB.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-wrapper play-page-container">
      {/* Game Header Bar */}
      <div className="play-header-panel comic-panel">
        <div className="header-left">
          <div className="badge badge-terracotta">
            <Sparkles size={14} /> Server-Validated Match
          </div>
          <h1 className="game-match-title">{gameInfo?.name || gameSlug}</h1>
          <p className="game-match-subtitle">
            {gameSlug === 'aadu-puli-aatam'
              ? '3 Tigers vs 15 Goats • Asymmetric Strategy Hunt'
              : '14-Pit Sowing & Capture Mancala'}
          </p>
        </div>

        {/* Controls Toolbar */}
        <div className="header-controls">
          {/* Mode Switcher */}
          <div className="mode-toggle-group">
            <button
              className={`mode-btn ${mode === 'pass_and_play' ? 'active' : ''}`}
              onClick={() => handleModeChange('pass_and_play')}
              title="Two players on the same screen"
            >
              <Users size={16} /> Pass & Play
            </button>
            <button
              className={`mode-btn ${mode === 'vs_ai' ? 'active' : ''}`}
              onClick={() => handleModeChange('vs_ai')}
              title="Practice against FolkBoard AI"
            >
              <Bot size={16} /> vs AI
            </button>
          </div>

          <button
            className="btn btn-outline btn-sm"
            onClick={() => setShowRestartConfirm(true)}
            title="Restart the current match"
          >
            <RotateCcw size={16} /> Restart
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowRulesModal(true)}
            title="Quick rules reference"
          >
            <HelpCircle size={16} /> Rules
          </button>
        </div>
      </div>

      {/* Main Play Area with Scoreboard */}
      <div className="play-arena-grid">
        {/* Left / Center Board Area */}
        <div className="board-display-area">
          {/* Turn and Status Indicator */}
          <div className="turn-banner-card comic-panel">
            <div className="turn-indicator">
              <span className="turn-label">Current Turn:</span>
              <span
                className={`turn-value badge ${
                  match?.currentTurn === 'goats' || match?.currentTurn === 'player1'
                    ? 'badge-forest'
                    : 'badge-terracotta'
                }`}
              >
                {match?.gameSlug === 'aadu-puli-aatam'
                  ? match?.currentTurn === 'goats'
                    ? `Goats' Turn (${match?.boardState?.phase === 'placement' ? 'Placement Phase' : 'Movement Phase'})`
                    : "Tigers' Turn"
                  : match?.currentTurn === 'player1'
                  ? "Player 1's Turn (Bottom Row)"
                  : "Player 2's Turn (Top Row)"}
              </span>
            </div>

            {/* Aadu Puli Scoreboard counters */}
            {match?.gameSlug === 'aadu-puli-aatam' && (
              <div className="scoreboard-counters">
                <div className="score-stat">
                  <strong>Goats Placed:</strong>{' '}
                  {match?.boardState?.goatsPlaced || 0} / {match?.boardState?.totalGoats || 15}
                </div>
                <div className="score-stat" style={{ color: 'var(--color-terracotta)' }}>
                  <strong>Goats Captured:</strong>{' '}
                  {match?.boardState?.goatsCaptured || 0} / 5 (Victory at 5)
                </div>
              </div>
            )}
          </div>

          {/* Explain My Move Rejection Banner */}
          {invalidMoveExplanation && (
            <div className="comic-panel invalid-move-callout">
              <div className="callout-header">
                <AlertCircle size={22} color="var(--color-danger)" />
                <h4>Explain My Move — Invalid Action</h4>
                <button
                  className="close-callout"
                  onClick={() => setInvalidMoveExplanation(null)}
                >
                  <X size={18} />
                </button>
              </div>
              <p className="callout-body">{invalidMoveExplanation}</p>
              <div className="callout-actions">
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => setShowRulesModal(true)}
                >
                  <BookOpen size={14} /> Learn This Rule
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => setInvalidMoveExplanation(null)}
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Interactive Game Board */}
          <div className="comic-panel board-frame-panel">
            {match?.gameSlug === 'aadu-puli-aatam' && (
              <AaduPuliBoard
                boardState={match?.boardState}
                legalMoves={legalMoves}
                onMakeMove={handleMakeMove}
                disabled={submitting || match?.status !== 'in_progress'}
              />
            )}

            {match?.gameSlug === 'pallanguzhi' && (
              <PallanguzhiBoard
                boardState={match?.boardState}
                legalMoves={legalMoves}
                onMakeMove={handleMakeMove}
                disabled={submitting || match?.status !== 'in_progress'}
              />
            )}
          </div>

          {/* Contextual Hint Banner */}
          {contextualHint && (
            <div className="comic-panel contextual-hint-box">
              <Lightbulb size={20} className="hint-icon" />
              <div className="hint-text">
                <strong>Strategic Hint:</strong> {contextualHint}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Match History & Details */}
        <div className="play-sidebar">
          <div className="comic-panel sidebar-panel">
            <h3 className="sidebar-heading">Move Record</h3>
            <div className="move-history-scroll">
              {match?.moveHistory?.length === 0 ? (
                <p className="no-moves-msg">No moves yet. Make the first move on the board!</p>
              ) : (
                <ol className="moves-ordered-list">
                  {match?.moveHistory?.map((m) => (
                    <li key={m.moveNumber} className="move-history-item">
                      <span className="move-num">#{m.moveNumber}</span>
                      <span className="move-player">{m.player.toUpperCase()}</span>
                      <span className="move-desc">
                        {m.actionType === 'place' && `Placed goat at point ${m.to}`}
                        {m.actionType === 'move' && `Moved from ${m.from} → ${m.to}`}
                        {m.actionType === 'jump' && `Jumped ${m.from} → ${m.to} (Captured goat)`}
                        {m.actionType === 'sow' && `Sowed from Pit ${m.from + 1}`}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          {/* Quick Cultural Link */}
          <div className="comic-panel cultural-sidebar-panel">
            <h4>Preservation Notes</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-soft)', lineHeight: '1.5' }}>
              All move legality is confirmed by our authoritative MERN game engine, ensuring historical rule fidelity and preventing illegal client states.
            </p>
            <Link
              to={`/games/${gameSlug}`}
              className="btn btn-outline btn-sm"
              style={{ marginTop: '0.75rem', width: '100%' }}
            >
              View Full History
            </Link>
          </div>
        </div>
      </div>

      {/* Restart Confirmation Dialog */}
      {showRestartConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>Restart Current Match?</h3>
            <p style={{ color: 'var(--color-ink-soft)', marginBottom: '1.5rem' }}>
              Are you sure you want to reset the board to its initial setup? Your current match progress will be cleared.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-outline"
                onClick={() => setShowRestartConfirm(false)}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleConfirmRestart}>
                Yes, Restart Board
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Rules Modal */}
      {showRulesModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header-row">
              <h3>{gameInfo?.name || 'Game Rules'}</h3>
              <button
                className="close-callout"
                onClick={() => setShowRulesModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h4 style={{ color: 'var(--color-terracotta)' }}>Objective</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-soft)' }}>
                  {gameInfo?.rules?.objective}
                </p>
              </div>
              <div>
                <h4 style={{ color: 'var(--color-terracotta)' }}>Movement Rules</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-soft)', whiteSpace: 'pre-line' }}>
                  {gameInfo?.rules?.movement}
                </p>
              </div>
              <div>
                <h4 style={{ color: 'var(--color-terracotta)' }}>Capturing</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-soft)' }}>
                  {gameInfo?.rules?.capturing}
                </p>
              </div>
              <div>
                <h4 style={{ color: 'var(--color-terracotta)' }}>Winning Condition</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-soft)', whiteSpace: 'pre-line' }}>
                  {gameInfo?.rules?.winningCondition}
                </p>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowRulesModal(false)}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victory Celebration Modal */}
      {showVictoryModal && (
        <div className="modal-overlay">
          <div className="modal-content victory-modal-content">
            <div className="victory-icon-wrapper">
              <Trophy size={48} color="var(--color-ochre)" />
            </div>
            <h2 className="victory-title">Match Concluded!</h2>
            <div className="badge badge-ochre" style={{ fontSize: '1rem', padding: '0.4rem 1rem' }}>
              Winner: {match?.winner?.toUpperCase()}
            </div>
            <p className="victory-reason">{match?.winReason}</p>

            <div className="victory-actions">
              <button className="btn btn-primary" onClick={handleConfirmRestart}>
                <RotateCcw size={18} /> Play Rematch
              </button>
              <Link to="/explore" className="btn btn-outline">
                Explore Other Games
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
