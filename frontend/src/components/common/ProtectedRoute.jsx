import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container page-wrapper" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <div className="comic-panel" style={{ display: 'inline-block', padding: '2rem 3rem' }}>
          <div className="badge badge-ochre" style={{ marginBottom: '1rem' }}>
            Restoring Session...
          </div>
          <h3>Consulting the Scrolls</h3>
          <p style={{ color: 'var(--color-ink-soft)', marginTop: '0.5rem' }}>
            Validating your authentication tokens with the server.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

