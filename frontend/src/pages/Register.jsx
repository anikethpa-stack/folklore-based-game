import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock, User, AlertCircle, Scroll } from 'lucide-react';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const { register, loading, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    clearAuthError();

    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      setValidationError('All fields are required.');
      return;
    }

    if (username.trim().length < 3) {
      setValidationError('Username must be at least 3 characters long.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match. Please verify both inputs.');
      return;
    }

    const result = await register(username.trim(), email.trim(), password);
    if (result.success) {
      navigate('/profile', { replace: true });
    }
  };

  return (
    <div className="container page-wrapper">
      <div className="auth-form-wrapper">
        <div className="comic-panel auth-panel">
          <div className="auth-panel-header">
            <div className="badge badge-terracotta">
              <Scroll size={14} /> Join The Revival
            </div>
            <h2 className="auth-title">Become a Preserver</h2>
            <p className="auth-subtitle">
              Create your FolkBoard identity to track match histories, participate in traditional game tournaments, and preserve regional folk rules.
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
              <label className="form-label" htmlFor="username">
                <User size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Desired Username
              </label>
              <input
                id="username"
                type="text"
                className="form-input"
                placeholder="e.g. vidyadhara_99"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                <Mail size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                <Lock size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Password (min 6 characters)
              </label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                <Lock size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-secondary auth-submit-btn"
              disabled={loading}
            >
              <UserPlus size={18} />
              {loading ? 'Creating Account...' : 'Register as Preserver'}
            </button>
          </form>

          <div className="auth-panel-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-switch-link">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
