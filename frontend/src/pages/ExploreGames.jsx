import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import gameApi from '../api/gameApi';
import { Search, Compass, BookOpen, Users, Sparkles, Filter, AlertTriangle } from 'lucide-react';

export default function ExploreGames() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  const categories = ['All', 'Hunt & Strategy', 'Mancala & Sowing'];
  const difficulties = ['All', 'Beginner', 'Intermediate'];

  useEffect(() => {
    let isMounted = true;
    const fetchGames = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {};
        if (search.trim()) params.search = search.trim();
        if (selectedCategory && selectedCategory !== 'All') params.category = selectedCategory;
        if (selectedDifficulty && selectedDifficulty !== 'All') params.difficulty = selectedDifficulty;

        const res = await gameApi.getGames(params);
        if (isMounted) {
          setGames(res.data || []);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load games catalogue. Please verify backend connection.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const debounceTimer = setTimeout(fetchGames, 250);
    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
    };
  }, [search, selectedCategory, selectedDifficulty]);

  return (
    <div className="container page-wrapper">
      {/* Header Banner */}
      <div className="explore-header">
        <div className="badge badge-ochre">
          <Sparkles size={14} /> The Traditional Game Archive
        </div>
        <h1 className="explore-title">Explore Revived Classics</h1>
        <p className="explore-subtitle">
          Search and discover ancient board games preserved with authentic historical rules, cultural backgrounds, and digital play interfaces.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="comic-panel filter-panel">
        <div className="search-bar-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search by game name, origin, or regional alternate names..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-chips-row">
          <div className="filter-group">
            <span className="filter-label">
              <Filter size={14} /> Category:
            </span>
            <div className="chips-container">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`chip-btn ${
                    (selectedCategory === cat || (!selectedCategory && cat === 'All'))
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => setSelectedCategory(cat === 'All' ? '' : cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">Difficulty:</span>
            <div className="chips-container">
              {difficulties.map((diff) => (
                <button
                  key={diff}
                  className={`chip-btn ${
                    (selectedDifficulty === diff || (!selectedDifficulty && diff === 'All'))
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => setSelectedDifficulty(diff === 'All' ? '' : diff)}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="comic-panel error-panel" style={{ marginTop: '2rem' }}>
          <AlertTriangle size={24} color="var(--color-danger)" />
          <div>
            <h3>Failed to Connect</h3>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !error && (
        <div className="games-grid" style={{ marginTop: '2rem' }}>
          {[1, 2].map((n) => (
            <div key={n} className="comic-panel skeleton-card">
              <div className="skeleton-bar" style={{ height: '32px', width: '60%' }}></div>
              <div className="skeleton-bar" style={{ height: '18px', width: '40%', marginTop: '8px' }}></div>
              <div className="skeleton-bar" style={{ height: '70px', width: '100%', marginTop: '16px' }}></div>
            </div>
          ))}
        </div>
      )}

      {/* Games Catalogue Grid */}
      {!loading && !error && (
        <>
          {games.length === 0 ? (
            <div className="comic-panel empty-state" style={{ marginTop: '2rem' }}>
              <h3>No Traditions Found</h3>
              <p>We couldn't find any games matching your current search or category filters.</p>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('');
                  setSelectedDifficulty('');
                }}
                style={{ marginTop: '1rem' }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="games-grid" style={{ marginTop: '2rem' }}>
              {games.map((game) => (
                <div key={game._id} className="comic-panel game-card">
                  <div className={`game-card-banner banner-${game.badgeTheme || 'terracotta'}`}>
                    <span className="badge badge-ochre">{game.category}</span>
                    <span className="game-origin">{game.origin}</span>
                  </div>

                  <div className="game-card-body">
                    <h2 className="game-card-title">{game.name}</h2>
                    {game.alternateNames?.length > 0 && (
                      <p className="game-card-aliases">
                        Also known as: <em>{game.alternateNames.join(', ')}</em>
                      </p>
                    )}
                    <p className="game-card-description">{game.description}</p>

                    <div className="game-spec-box">
                      <div className="spec-item">
                        <Users size={16} />
                        <span><strong>Players:</strong> {game.players?.recommended || 2}</span>
                      </div>
                      <div className="spec-item">
                        <Compass size={16} />
                        <span><strong>Difficulty:</strong> {game.difficulty}</span>
                      </div>
                      <div className="spec-item">
                        <BookOpen size={16} />
                        <span><strong>Estimated Age:</strong> {game.estimatedAge}</span>
                      </div>
                    </div>

                    <div className="game-card-actions">
                      <Link to={`/play/${game.slug}`} className="btn btn-primary btn-sm">
                        Play Match
                      </Link>
                      <Link to={`/games/${game.slug}`} className="btn btn-outline btn-sm">
                        History & Rules
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
