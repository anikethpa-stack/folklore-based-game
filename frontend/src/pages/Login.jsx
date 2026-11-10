import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, KeyRound, User, AlertCircle, Sparkles } from 'lucide-react';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const { login, loading, authError, clearAuthError } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/profile';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    clearAuthError();

    if (!identifier.trim() || !password) {
      setValidationError('Please enter both your username/email and password.');
      return;
    }

    const result = await login(identifier.trim(), password);
    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="container page-wrapper">
      <div className="auth-form-wrapper">
        <div className="comic-panel auth-panel">
          <div className="auth-panel-header">
            <div className="badge badge-ochre">
              <Sparkles size={14} /> Heritage Gaming Access
            </div>
            <h2 className="auth-title">Return to the Board</h2>
            <p className="auth-subtitle">
              Sign in to resume saved matches, record your victories, and bookmark your favourite traditional games.
            </p>
          </div>

          {(validationError || authError) && (
            <div className="auth-error-banner">
              <AlertCircle size={20} />
              <span>{validationError || authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="identifier">
                <User size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Username or Email
              </label>
              <input
                id="identifier"
                type="text"
                className="form-input"
                placeholder="e.g. aryabhata or arun@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                <KeyRound size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Password
              </label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit-btn"
              disabled={loading}
            >
              <LogIn size={18} />
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-panel-footer">
            <p>
              New to FolkBoard?{' '}
              <Link to="/register" className="auth-switch-link">
                Create a free account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
