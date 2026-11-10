import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  Shield,
  Check,
  X,
  Clock,
  Layers,
  Users,
  Trophy,
  AlertTriangle,
} from 'lucide-react';

export default function AdminDashboard() {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [actionMessage, setActionMessage] = useState('');

  const fetchContributions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/contributions/all', {
        params: { status: filterStatus !== 'all' ? filterStatus : undefined },
      });
      setContributions(res.data.data || []);
    } catch (err) {
      console.error('Failed to load contributions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContributions();
  }, [filterStatus]);

  const handleModerate = async (id, status) => {
    try {
      await api.patch(`/contributions/${id}/moderate`, {
        status,
        moderatorNotes: `Reviewed and ${status} by Administrator.`,
      });
      setActionMessage(`Contribution successfully ${status}.`);
      fetchContributions();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      console.error('Failed to moderate submission:', err);
    }
  };

  return (
    <div className="container page-wrapper">
      <div className="comic-panel admin-header-panel">
        <div className="badge badge-secondary">
          <Shield size={16} /> Archive Moderation Console
        </div>
        <h1 className="admin-title">FolkBoard Curator Dashboard</h1>
        <p className="admin-subtitle">
          Moderate community preservation submissions, verify oral rule variants, and oversee the traditional gaming archive.
        </p>
      </div>

      {actionMessage && (
        <div className="auth-error-banner" style={{ borderColor: 'var(--color-forest-green)', color: 'var(--color-forest-green)', margin: '1.5rem 0' }}>
          {actionMessage}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="details-tabs-bar" style={{ marginTop: '2rem' }}>
        <button
          className={`tab-btn ${filterStatus === 'pending' ? 'active' : ''}`}
          onClick={() => setFilterStatus('pending')}
        >
          <Clock size={16} /> Pending Review
        </button>
        <button
          className={`tab-btn ${filterStatus === 'approved' ? 'active' : ''}`}
          onClick={() => setFilterStatus('approved')}
        >
          <Check size={16} /> Approved Archives
        </button>
        <button
          className={`tab-btn ${filterStatus === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilterStatus('rejected')}
        >
          <X size={16} /> Rejected
        </button>
        <button
          className={`tab-btn ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          All Submissions
        </button>
      </div>

      {/* Submissions List */}
      <div className="comic-panel tab-panel">
        <h2 className="tab-section-heading">Preservation Submissions</h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Loading submissions...</p>
          </div>
        ) : contributions.length === 0 ? (
          <div className="empty-state">
            <p>No submissions found under the selected '{filterStatus}' status.</p>
          </div>
        ) : (
          <div className="admin-contributions-list">
            {contributions.map((c) => (
              <div key={c._id} className="comic-panel submission-card">
                <div className="submission-card-header">
                  <div>
                    <span className="badge badge-ochre">{c.submissionType}</span>
                    <span className="badge badge-terracotta" style={{ marginLeft: '6px' }}>
                      {c.gameSlug}
                    </span>
                    <h3 style={{ fontSize: '1.3rem', margin: '0.4rem 0' }}>{c.title}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-ink-soft)' }}>
                      Submitted by <strong>{c.contributorName}</strong> ({c.contributorEmail}) • Region: <strong>{c.region}</strong>
                    </div>
                  </div>

                  <div className="submission-actions">
                    {c.moderationStatus === 'pending' ? (
                      <>
                        <button
                          className="btn btn-forest btn-sm"
                          onClick={() => handleModerate(c._id, 'approved')}
                        >
                          <Check size={16} /> Approve
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleModerate(c._id, 'rejected')}
                        >
                          <X size={16} /> Reject
                        </button>
                      </>
                    ) : (
                      <span
                        className={`badge ${
                          c.moderationStatus === 'approved' ? 'badge-forest' : 'badge-terracotta'
                        }`}
                      >
                        {c.moderationStatus.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="submission-content-box">
                  <p>{c.content}</p>
                  {c.references && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--color-ink-soft)' }}>
                      Attribution: {c.references}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
