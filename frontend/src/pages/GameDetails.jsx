import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import gameApi from '../api/gameApi';
import {
  Compass,
  BookOpen,
  Scroll,
  Users,
  ShieldAlert,
  Play,
  Award,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export default function GameDetails() {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('history');

  useEffect(() => {
    let isMounted = true;
    const fetchGame = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await gameApi.getGameById(id);
        if (isMounted) {
          setGame(res.data);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load game information. Please check if the game exists.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchGame();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="container page-wrapper" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <div className="comic-panel" style={{ display: 'inline-block', padding: '2rem 3rem' }}>
          <h3>Unrolling Ancient Scrolls...</h3>
          <p style={{ color: 'var(--color-ink-soft)', marginTop: '0.5rem' }}>
            Fetching verified historical accounts and rulebooks from the archives.
          </p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="container page-wrapper">
        <div className="comic-panel error-panel">
          <h2>Archive Not Found</h2>
          <p>{error || 'The requested game could not be retrieved from the archives.'}</p>
          <Link to="/explore" className="btn btn-outline btn-sm" style={{ marginTop: '1rem' }}>
            Return to Catalogue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-wrapper">
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb-nav">
        <Link to="/explore">Explore Games</Link>
        <ChevronRight size={16} />
        <span>{game.name}</span>
      </div>

      {/* Hero Header Panel */}
      <div className="comic-panel details-hero-panel">
        <div className="details-header-top">
          <div className="badge-row">
            <span className={`badge badge-${game.badgeTheme || 'terracotta'}`}>
              {game.category}
            </span>
            <span className="badge badge-ochre">{game.origin}</span>
            <span className="badge badge-forest">{game.estimatedAge}</span>
          </div>

          <div className="hero-action-buttons">
            <Link to={`/play/${game.slug}`} className="btn btn-primary">
              <Play size={18} /> Play Match
            </Link>
            <Link to={`/tutorials`} className="btn btn-secondary">
              <BookOpen size={18} /> Interactive Tutorial
            </Link>
          </div>
        </div>

        <h1 className="details-title">{game.name}</h1>
        {game.alternateNames?.length > 0 && (
          <p className="details-aliases">
            Regional designations: <strong>{game.alternateNames.join(' • ')}</strong>
          </p>
        )}
        <p className="details-lead">{game.description}</p>
      </div>

      {/* Tabs Navigation */}
      <div className="details-tabs-bar">
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <Scroll size={18} /> Historical Heritage
        </button>
        <button
          className={`tab-btn ${activeTab === 'board' ? 'active' : ''}`}
          onClick={() => setActiveTab('board')}
        >
          <Layers size={18} /> Board & Pieces
        </button>
        <button
          className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          <BookOpen size={18} /> Authentic Rules
        </button>
        <button
          className={`tab-btn ${activeTab === 'variants' ? 'active' : ''}`}
          onClick={() => setActiveTab('variants')}
        >
          <Compass size={18} /> Regional Variants ({game.variants?.length || 0})
        </button>
        <button
          className={`tab-btn ${activeTab === 'references' ? 'active' : ''}`}
          onClick={() => setActiveTab('references')}
        >
          <Award size={18} /> Citations & References
        </button>
      </div>

      {/* Tab Content Display */}
      <div className="tab-content-wrapper">
        {/* Tab 1: History */}
        {activeTab === 'history' && (
          <div className="comic-panel tab-panel">
            <h2 className="tab-section-heading">Historical Documentation</h2>
            <div className="text-body-formatted">
              {game.historicalBackground.split('\n\n').map((paragraph, idx) => (
                <p key={idx} style={{ marginBottom: '1rem', lineHeight: '1.7' }}>
                  {paragraph}
                </p>
              ))}
            </div>

            {game.culturalSignificance && (
              <div className="cultural-significance-box" style={{ marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-terracotta)' }}>
                  Cultural Significance & Folk Lore
                </h3>
                <p style={{ lineHeight: '1.6', color: 'var(--color-ink-soft)' }}>
                  {game.culturalSignificance}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Board & Pieces */}
        {activeTab === 'board' && (
          <div className="comic-panel tab-panel">
            <h2 className="tab-section-heading">Board Geometry & Playing Pieces</h2>
            <div className="board-spec-grid">
              <div className="spec-card">
                <h4>Board Type</h4>
                <p>{game.boardConfiguration?.boardType}</p>
              </div>
              <div className="spec-card">
                <h4>Grid Points / Pits</h4>
                <p>
                  {game.boardConfiguration?.pointCount > 0
                    ? `${game.boardConfiguration.pointCount} Point Vertices`
                    : `${game.boardConfiguration?.pitCount} Pits (Two Rows of 7)`}
                </p>
              </div>
              <div className="spec-card">
                <h4>Counters & Playing Pieces</h4>
                <p>{game.boardConfiguration?.counterType}</p>
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Layout Description</h3>
              <p style={{ lineHeight: '1.6', color: 'var(--color-ink-soft)' }}>
                {game.boardConfiguration?.layoutDescription}
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Rules */}
        {activeTab === 'rules' && (
          <div className="comic-panel tab-panel">
            <h2 className="tab-section-heading">Official Master Rules</h2>
            <div className="rules-breakdown-list">
              <div className="rule-entry">
                <h3 className="rule-title">1. Objective</h3>
                <p>{game.rules?.objective}</p>
              </div>
              <div className="rule-entry">
                <h3 className="rule-title">2. Initial Setup</h3>
                <p>{game.rules?.setup}</p>
              </div>
              <div className="rule-entry">
                <h3 className="rule-title">3. Turn Structure</h3>
                <p>{game.rules?.turnStructure}</p>
              </div>
              <div className="rule-entry">
                <h3 className="rule-title">4. Movement Rules</h3>
                <div style={{ whiteSpace: 'pre-line' }}>{game.rules?.movement}</div>
              </div>
              <div className="rule-entry">
                <h3 className="rule-title">5. Capturing Mechanics</h3>
                <p>{game.rules?.capturing}</p>
              </div>
              <div className="rule-entry">
                <h3 className="rule-title">6. Winning Conditions</h3>
                <div style={{ whiteSpace: 'pre-line' }}>{game.rules?.winningCondition}</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Variants */}
        {activeTab === 'variants' && (
          <div className="comic-panel tab-panel">
            <h2 className="tab-section-heading">Documented Regional Variations</h2>
            {game.variants?.length === 0 ? (
              <p>No regional variations recorded yet for this game.</p>
            ) : (
              <div className="variants-list">
                {game.variants.map((v) => (
                  <div key={v._id} className="comic-panel variant-card">
                    <div className="variant-header">
                      <h3>{v.variantName}</h3>
                      <span className="badge badge-ochre">{v.region}</span>
                    </div>
                    <p style={{ margin: '0.75rem 0', color: 'var(--color-ink-soft)' }}>
                      {v.rulesSummary}
                    </p>
                    <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>Key Rule Differences:</h4>
                    <ul style={{ paddingLeft: '1.25rem', marginBottom: '1rem', color: 'var(--color-ink-soft)' }}>
                      {v.differences.map((diff, i) => (
                        <li key={i}>{diff}</li>
                      ))}
                    </ul>
                    {v.historicalNotes && (
                      <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--color-ink-soft)' }}>
                        <strong>Historical note:</strong> {v.historicalNotes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: References */}
        {activeTab === 'references' && (
          <div className="comic-panel tab-panel">
            <h2 className="tab-section-heading">Historical Citations & Epigraphical Sources</h2>
            <p style={{ color: 'var(--color-ink-soft)', marginBottom: '1.5rem' }}>
              In accordance with our Historical Accuracy Principles, all claims, rules, and timelines are substantiated with verifiable archaeological surveys or academic literature:
            </p>
            <div className="references-list">
              {game.references?.map((ref, idx) => (
                <div key={idx} className="reference-item">
                  <div className="ref-badge-type">{ref.citationType}</div>
                  <div className="ref-body">
                    <h4 className="ref-title">
                      {ref.title} {ref.year && `(${ref.year})`}
                    </h4>
                    {ref.author && <p className="ref-author">By: {ref.author}</p>}
                    {ref.url && (
                      <a href={ref.url} target="_blank" rel="noopener noreferrer" className="ref-link">
                        Access Source Record <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
