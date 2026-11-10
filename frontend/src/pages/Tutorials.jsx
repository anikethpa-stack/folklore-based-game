import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import AaduPuliBoard from '../games/aadupuli/AaduPuliBoard';
import PallanguzhiBoard from '../games/pallanguzhi/PallanguzhiBoard';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Lightbulb,
  CheckCircle,
  Play,
} from 'lucide-react';

export default function Tutorials() {
  const [tutorials, setTutorials] = useState([]);
  const [selectedGameSlug, setSelectedGameSlug] = useState('aadu-puli-aatam');
  const [currentTutorial, setCurrentTutorial] = useState(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch tutorial data
  useEffect(() => {
    let isMounted = true;
    const fetchTutorialData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/tutorials/${selectedGameSlug}`);
        if (isMounted) {
          setCurrentTutorial(res.data.data);
          setActiveStepIndex(0);
        }
      } catch (err) {
        console.error('Failed to load tutorial:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTutorialData();
    return () => {
      isMounted = false;
    };
  }, [selectedGameSlug]);

  const currentStep = currentTutorial?.steps?.[activeStepIndex];
  const totalSteps = currentTutorial?.steps?.length || 0;

  return (
    <div className="container page-wrapper">
      {/* Header Banner */}
      <div className="explore-header">
        <div className="badge badge-terracotta">
          <BookOpen size={14} /> Interactive Game Academy
        </div>
        <h1 className="explore-title">Learn Traditional Board Games</h1>
        <p className="explore-subtitle">
          Step-by-step interactive demonstrations designed for beginners. Understand the board geometry, piece movements, tactical captures, and winning conditions.
        </p>

        {/* Game Selector Tabs */}
        <div className="tutorial-game-selector">
          <button
            className={`btn ${
              selectedGameSlug === 'aadu-puli-aatam' ? 'btn-primary' : 'btn-outline'
            }`}
            onClick={() => setSelectedGameSlug('aadu-puli-aatam')}
          >
            Aadu Puli Aatam (Goats & Tigers)
          </button>
          <button
            className={`btn ${
              selectedGameSlug === 'pallanguzhi' ? 'btn-forest' : 'btn-outline'
            }`}
            onClick={() => setSelectedGameSlug('pallanguzhi')}
          >
            Pallanguzhi (14-Pit Mancala)
          </button>
        </div>
      </div>

      {loading ? (
        <div className="comic-panel" style={{ textAlign: 'center', padding: '3rem 0' }}>
          <h3>Unfolding Tutorial Scroll...</h3>
        </div>
      ) : !currentTutorial ? (
        <div className="comic-panel error-panel">
          <h3>Tutorial In Preparation</h3>
          <p>The interactive tutorial for this game is currently being inscribed.</p>
        </div>
      ) : (
        <div className="tutorial-workspace-grid">
          {/* Left Column: Interactive Demonstration Board Sandbox */}
          <div className="comic-panel tutorial-board-panel">
            <div className="tutorial-board-header">
              <span className="badge badge-ochre">Interactive Demonstration Sandbox</span>
              <span className="step-counter">
                Step {activeStepIndex + 1} of {totalSteps}
              </span>
            </div>

            <div className="tutorial-board-wrapper">
              {selectedGameSlug === 'aadu-puli-aatam' && (
                <AaduPuliBoard
                  boardState={currentStep?.boardSnapshot}
                  legalMoves={[]}
                  onMakeMove={() => {}}
                  disabled={true}
                />
              )}

              {selectedGameSlug === 'pallanguzhi' && (
                <PallanguzhiBoard
                  boardState={currentStep?.boardSnapshot}
                  legalMoves={[]}
                  onMakeMove={() => {}}
                  disabled={true}
                />
              )}
            </div>
          </div>

          {/* Right Column: Step Explanation & Guided Instructions */}
          <div className="tutorial-guide-column">
            <div className="comic-panel tutorial-instruction-card">
              <div className="step-badge-indicator">
                <Sparkles size={16} /> Step {currentStep?.stepNumber}
              </div>
              <h2 className="step-title">{currentStep?.title}</h2>

              <div className="step-instruction-box">
                <h4>Instruction</h4>
                <p>{currentStep?.instruction}</p>
              </div>

              <div className="step-explanation-box">
                <h4>Why This Rule Exists</h4>
                <p>{currentStep?.explanation}</p>
              </div>

              {currentStep?.hint && (
                <div className="step-hint-box">
                  <Lightbulb size={18} className="hint-bulb" />
                  <span><strong>Tactical Tip:</strong> {currentStep.hint}</span>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="step-nav-footer">
                <button
                  className="btn btn-outline btn-sm"
                  disabled={activeStepIndex === 0}
                  onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                >
                  <ChevronLeft size={16} /> Previous
                </button>

                {activeStepIndex < totalSteps - 1 ? (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setActiveStepIndex((prev) => prev + 1)}
                  >
                    Next Step <ChevronRight size={16} />
                  </button>
                ) : (
                  <Link to={`/play/${selectedGameSlug}`} className="btn btn-forest btn-sm">
                    <Play size={16} /> Start Practice Match
                  </Link>
                )}
              </div>
            </div>

            {/* Quick Rules Summary Callout */}
            <div className="comic-panel rules-callout-panel">
              <h4>Ready to Test Your Skills?</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-soft)', lineHeight: '1.5' }}>
                You have completed the guided overview. Play an authentic match against our rules engine or practice against the FolkBoard AI.
              </p>
              <Link
                to={`/play/${selectedGameSlug}`}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '0.75rem', width: '100%' }}
              >
                Play {currentTutorial.title}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
