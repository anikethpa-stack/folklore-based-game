import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, HelpCircle, Compass, Shield, User, Menu, X, HeartHandshake, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="site-header">
      <div className="container nav-container">
        {/* Brand Logo */}
        <Link to="/" className="brand-logo" onClick={() => setMobileMenuOpen(false)}>
          <div className="logo-emblem">FB</div>
          <div className="brand-text">
            <span className="brand-title">FOLKBOARD</span>
            <span className="brand-subtitle">Digital Revival of Forgotten Games</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav">
          <Link
            to="/explore"
            className={`nav-link ${isActive('/explore') ? 'active' : ''}`}
          >
            <Compass size={18} />
            <span>Explore Games</span>
          </Link>
          <Link
            to="/tutorials"
            className={`nav-link ${isActive('/tutorials') ? 'active' : ''}`}
          >
            <BookOpen size={18} />
            <span>Tutorials</span>
          </Link>
          <Link
            to="/faqs"
            className={`nav-link ${isActive('/faqs') ? 'active' : ''}`}
          >
            <HelpCircle size={18} />
            <span>FAQs & Help</span>
          </Link>
          <Link
            to="/preserve"
            className={`nav-link ${isActive('/preserve') ? 'active' : ''}`}
          >
            <HeartHandshake size={18} />
            <span>Preserve</span>
          </Link>
        </nav>

        {/* Auth CTA Actions */}
        <div className="nav-auth-actions">
          {user ? (
            <div className="user-profile-menu">
              <Link to="/profile" className="btn btn-outline btn-sm">
                <User size={16} />
                <span>{user.username}</span>
              </Link>
              {isAdmin && (
                <Link to="/admin" className="btn btn-secondary btn-sm">
                  <Shield size={16} />
                  <span>Admin</span>
                </Link>
              )}
              <button onClick={logout} className="btn btn-sm btn-danger" title="Sign Out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline btn-sm">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <Link
            to="/explore"
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Compass size={20} /> Explore Games
          </Link>
          <Link
            to="/tutorials"
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            <BookOpen size={20} /> Tutorials
          </Link>
          <Link
            to="/faqs"
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            <HelpCircle size={20} /> FAQs & Help
          </Link>
          <Link
            to="/preserve"
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            <HeartHandshake size={20} /> Preserve a Game
          </Link>

          {user ? (
            <div style={{ marginTop: '0.75rem', borderTop: 'var(--border-comic-subtle)', paddingTop: '0.75rem' }}>
              <Link
                to="/profile"
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User size={20} /> Profile ({user.username})
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="mobile-nav-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Shield size={20} /> Admin Dashboard
                </Link>
              )}
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="btn btn-sm btn-danger"
                style={{ marginTop: '0.5rem', width: '100%' }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <Link
                to="/login"
                className="btn btn-outline btn-sm"
                style={{ flex: 1 }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn btn-primary btn-sm"
                style={{ flex: 1 }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
