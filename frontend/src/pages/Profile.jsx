import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Trophy,
  Bookmark,
  History,
  Shield,
  Edit3,
  Calendar,
  Sparkles,
  Play,
  Trash2,
} from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'bookmarks' | 'settings'

  // Bio edit state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchProfileAndBookmarks = async () => {
      setLoading(true);
      try {
        const [profRes, bmkRes] = await Promise.all([
          api.get('/users/profile'),
          api.get('/bookmarks'),
        ]);

        if (isMounted) {
          setProfileData(profRes.data.data);
          setBookmarks(bmkRes.data.data || []);
          setDisplayName(profRes.data.data.user?.profile?.displayName || user?.username || '');
          setBio(profRes.data.data.user?.profile?.bio || '');
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfileAndBookmarks();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleRemoveBookmark = async (gameId) => {
    try {
      await api.delete(`/bookmarks/${gameId}`);
      setBookmarks((prev) => prev.filter((b) => b.gameId._id !== gameId));
    } catch (err) {
      console.error('Failed to remove bookmark:', err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaveSuccess(false);
    try {
      await api.patch('/users/profile', { displayName, bio });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  if (loading) {
    return (
      <div className="container page-wrapper" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <div className="comic-panel" style={{ display: 'inline-block', padding: '2rem 3rem' }}>
          <h3>Retrieving Preserver Records...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-wrapper">
      {/* Profile Identity Hero */}
      <div className="comic-panel profile-hero-panel">
        <div className="profile-identity">
          <div className="profile-avatar-circle">
            <User size={40} color="var(--color-aged-paper)" />
          </div>
          <div className="profile-titles">
            <div className="profile-badge-row">
              <span className="badge badge-terracotta">
                {user?.role === 'admin' ? 'Archive Administrator' : 'Folk Preserver'}
              </span>
              <span className="badge badge-ochre">
                <Calendar size={12} /> Member Since{' '}
                {new Date(profileData?.user?.createdAt || Date.now()).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h1 className="profile-username">{displayName || user?.username}</h1>
            <p className="profile-handle">@{user?.username}</p>
            {bio && <p className="profile-bio-text">“{bio}”</p>}
          </div>
        </div>

        {/* Stats Row */}
        <div className="profile-stats-row">
          <div className="stat-badge-card">
            <Trophy size={20} color="var(--color-ochre)" />
            <div className="stat-number">{profileData?.stats?.totalMatches || 0}</div>
            <div className="stat-label">Matches Played</div>
          </div>
          <div className="stat-badge-card">
            <Bookmark size={20} color="var(--color-terracotta)" />
            <div className="stat-number">{bookmarks.length}</div>
            <div className="stat-label">Saved Traditions</div>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="details-tabs-bar" style={{ marginTop: '2rem' }}>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={18} /> Match History ({profileData?.recentMatches?.length || 0})
        </button>
        <button
          className={`tab-btn ${activeTab === 'bookmarks' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookmarks')}
        >
          <Bookmark size={18} /> Bookmarked Games ({bookmarks.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Edit3 size={18} /> Edit Profile
        </button>
      </div>

      {/* Tab 1: Match History */}
      {activeTab === 'history' && (
        <div className="comic-panel tab-panel">
          <h2 className="tab-section-heading">Recent Matches</h2>
          {profileData?.recentMatches?.length === 0 ? (
            <div className="empty-state">
              <p>No matches recorded yet. Start a match on any traditional board to begin your history!</p>
              <Link to="/explore" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
                Explore Games to Play
              </Link>
            </div>
          ) : (
            <div className="history-table-wrapper">
              <table className="comic-table">
                <thead>
                  <tr>
                    <th>Game Tradition</th>
                    <th>Mode</th>
                    <th>Outcome</th>
                    <th>Reason / Details</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {profileData?.recentMatches?.map((m) => (
                    <tr key={m._id}>
                      <td>
                        <strong>{m.gameId?.name || m.gameSlug}</strong>
                      </td>
                      <td>
                        <span className="badge badge-ochre">{m.mode}</span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            m.winner === 'draw'
                              ? 'badge-ochre'
                              : m.winner
                              ? 'badge-forest'
                              : 'badge-terracotta'
                          }`}
                        >
                          {m.winner ? `Winner: ${m.winner}` : m.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--color-ink-soft)' }}>
                        {m.winReason || 'Completed'}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <Link to={`/play/${m.gameSlug}`} className="btn btn-outline btn-sm">
                          <Play size={12} /> Rematch
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Bookmarks */}
      {activeTab === 'bookmarks' && (
        <div className="comic-panel tab-panel">
          <h2 className="tab-section-heading">Saved Traditional Games</h2>
          {bookmarks.length === 0 ? (
            <div className="empty-state">
              <p>You haven't bookmarked any games yet. Browse the catalogue and save your favorite traditions.</p>
              <Link to="/explore" className="btn btn-outline btn-sm" style={{ marginTop: '1rem' }}>
                Browse Archive
              </Link>
            </div>
          ) : (
            <div className="games-grid">
              {bookmarks.map((b) => (
                <div key={b._id} className="comic-panel game-card">
                  <div className={`game-card-banner banner-${b.gameId?.badgeTheme || 'terracotta'}`}>
                    <span className="badge badge-ochre">{b.gameId?.category}</span>
                    <button
                      className="btn-icon-clear"
                      onClick={() => handleRemoveBookmark(b.gameId?._id)}
                      title="Remove bookmark"
                    >
                      <Trash2 size={16} color="#FFFFFF" />
                    </button>
                  </div>
                  <div className="game-card-body">
                    <h3>{b.gameId?.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-soft)', margin: '0.5rem 0 1rem' }}>
                      {b.gameId?.description}
                    </p>
                    <div className="game-card-actions">
                      <Link to={`/play/${b.gameId?.slug}`} className="btn btn-primary btn-sm">
                        Play Match
                      </Link>
                      <Link to={`/games/${b.gameId?.slug}`} className="btn btn-outline btn-sm">
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Settings / Bio */}
      {activeTab === 'settings' && (
        <div className="comic-panel tab-panel" style={{ maxWidth: '600px' }}>
          <h2 className="tab-section-heading">Personalize Your Scroll</h2>
          {saveSuccess && (
            <div className="auth-error-banner" style={{ borderColor: 'var(--color-forest-green)', color: 'var(--color-forest-green)' }}>
              Profile details successfully inscribed!
            </div>
          )}

          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label className="form-label" htmlFor="displayName">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                className="form-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="bio">
                Cultural Bio / Player Motto
              </label>
              <textarea
                id="bio"
                rows="3"
                className="form-input"
                placeholder="Share your regional heritage or interest in traditional games..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              ></textarea>
            </div>

            <button type="submit" className="btn btn-primary">
              Save Inscription
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
