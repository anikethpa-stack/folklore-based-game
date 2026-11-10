import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, BookOpen, Scroll, ShieldCheck, Sparkles, Flame } from 'lucide-react';

export default function Home() {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-badge">
            <Sparkles size={16} /> Heritage Gaming Initiative
          </div>
          <h1 className="hero-title">
            Discover the games of our past. <br />
            <span className="hero-highlight">Learn their stories.</span> <br />
            Play their traditions.
          </h1>
          <p className="hero-lead">
            FolkBoard is a digital revival sanctuary for ancient, forgotten, and underrepresented traditional board games. Documented with rigorous historical accuracy, step-by-step interactive tutorials, and authentic server-validated gameplay.
          </p>

          <div className="hero-cta-group">
            <Link to="/explore" className="btn btn-primary">
              <Compass size={18} /> Explore Games
            </Link>
            <Link to="/tutorials" className="btn btn-secondary">
              <BookOpen size={18} /> Learn to Play
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Games Spotlight */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Flagship Traditions</div>
            <h2 className="section-title">The Initial Revival Collection</h2>
            <p className="section-subtitle">
              Carefully researched, rule-verified, and digitally reconstructed from historical texts and temple courtyard carvings.
            </p>
          </div>

          <div className="featured-grid">
            {/* Game 1: Aadu Puli Aatam */}
            <div className="comic-panel game-spotlight-card">
              <div className="game-card-banner banner-terracotta">
                <span className="badge badge-ochre">Strategic Hunt</span>
                <span className="game-origin">Southern India (Tamil Nadu / Karnataka)</span>
              </div>
              <div className="game-card-content">
                <h3 className="game-card-title">Aadu Puli Aatam</h3>
                <h4 className="game-card-subtitle">(Goats and Tigers / Pulijudam)</h4>
                <p className="game-card-desc">
                  An asymmetric tactical war between 3 cunning tigers and 15 united goats played on a 23-point pyramid grid. Tigers jump and capture; goats coordinate to encircle and immobilize the predators.
                </p>
                <div className="game-card-meta">
                  <div className="meta-item"><strong>Players:</strong> 2 (or vs AI)</div>
                  <div className="meta-item"><strong>Complexity:</strong> Medium</div>
                  <div className="meta-item"><strong>Historical Age:</strong> 800+ Years</div>
                </div>
                <div className="card-actions">
                  <Link to="/play/aadu-puli-aatam" className="btn btn-primary btn-sm">
                    Play Now
                  </Link>
                  <Link to="/games/aadu-puli-aatam" className="btn btn-outline btn-sm">
                    Read History & Rules
                  </Link>
                </div>
              </div>
            </div>

            {/* Game 2: Pallanguzhi */}
            <div className="comic-panel game-spotlight-card">
              <div className="game-card-banner banner-forest">
                <span className="badge badge-ochre">Mancala Sowing</span>
                <span className="game-origin">South India & Sri Lanka</span>
              </div>
              <div className="game-card-content">
                <h3 className="game-card-title">Pallanguzhi</h3>
                <h4 className="game-card-subtitle">(Ali Guli Mane / 14-Pit Mancala)</h4>
                <p className="game-card-desc">
                  A classic distribution and capture game played on a 14-pit wooden board using cowrie shells or tamarind seeds. Fosters mental calculation, cascading multi-lap sowing, and storehouse management.
                </p>
                <div className="game-card-meta">
                  <div className="meta-item"><strong>Players:</strong> 2</div>
                  <div className="meta-item"><strong>Complexity:</strong> Easy-Medium</div>
                  <div className="meta-item"><strong>Historical Age:</strong> 1000+ Years</div>
                </div>
                <div className="card-actions">
                  <Link to="/play/pallanguzhi" className="btn btn-forest btn-sm">
                    Play Now
                  </Link>
                  <Link to="/games/pallanguzhi" className="btn btn-outline btn-sm">
                    Read History & Rules
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Preservation Philosophy Section */}
      <section className="philosophy-section">
        <div className="container">
          <div className="philosophy-panel comic-panel">
            <h3 className="philosophy-title">Our Cultural Preservation Promise</h3>
            <div className="philosophy-grid">
              <div className="philosophy-item">
                <Scroll className="phil-icon" size={28} />
                <h4>Historical Rigour</h4>
                <p>We cite primary historical sources and distinguish documented facts from reconstructed rule variants.</p>
              </div>
              <div className="philosophy-item">
                <ShieldCheck className="phil-icon" size={28} />
                <h4>Authoritative Validation</h4>
                <p>Moves are validated by a verified rules engine on the backend — never relying on unverified client state.</p>
              </div>
              <div className="philosophy-item">
                <BookOpen className="phil-icon" size={28} />
                <h4>Beginner Accessibility</h4>
                <p>Every rule includes guided interactive step-by-step tutorials and contextual hints right when you need them.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

