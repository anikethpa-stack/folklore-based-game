import React, { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  HeartHandshake,
  Scroll,
  Send,
  CheckCircle,
  AlertCircle,
  MapPin,
  Sparkles,
} from 'lucide-react';

export default function Preserve() {
  const { user } = useAuth();

  const [contributorName, setContributorName] = useState(user?.username || '');
  const [contributorEmail, setContributorEmail] = useState(user?.email || '');
  const [gameSlug, setGameSlug] = useState('aadu-puli-aatam');
  const [submissionType, setSubmissionType] = useState('regional_variant');
  const [title, setTitle] = useState('');
  const [region, setRegion] = useState('');
  const [content, setContent] = useState('');
  const [references, setReferences] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!contributorName.trim() || !contributorEmail.trim() || !title.trim() || !region.trim() || !content.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/contributions', {
        contributorName: contributorName.trim(),
        contributorEmail: contributorEmail.trim(),
        gameSlug,
        submissionType,
        title: title.trim(),
        region: region.trim(),
        content: content.trim(),
        references: references.trim(),
      });

      setSubmittedSuccess(true);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to submit contribution. Please check your inputs.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container page-wrapper">
      {/* Header Banner */}
      <div className="explore-header">
        <div className="badge badge-ochre">
          <HeartHandshake size={14} /> Living Oral Archive
        </div>
        <h1 className="explore-title">Preserve a Traditional Game</h1>
        <p className="explore-subtitle">
          Did your grandparents play with a unique regional rule? Inscribe your local variations, folk memories, or temple courtyard discoveries to protect our shared heritage.
        </p>
      </div>

      <div className="auth-form-wrapper" style={{ maxWidth: '680px' }}>
        <div className="comic-panel auth-panel">
          {submittedSuccess ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div className="victory-icon-wrapper">
                <CheckCircle size={44} color="var(--color-forest-green)" />
              </div>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>
                Contribution Inscribed!
              </h2>
              <p style={{ color: 'var(--color-ink-soft)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                Thank you for contributing to the digital preservation of traditional games. Our moderation team will review your submission and cross-reference it with the historical archive.
              </p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setSubmittedSuccess(false);
                  setTitle('');
                  setContent('');
                  setRegion('');
                  setReferences('');
                }}
              >
                Inscribe Another Variation
              </button>
            </div>
          ) : (
            <>
              <div className="auth-panel-header">
                <div className="badge badge-terracotta">
                  <Scroll size={14} /> Submission Form
                </div>
                <h2 className="auth-title">Inscribe Oral Tradition</h2>
              </div>

              {errorMessage && (
                <div className="auth-error-banner">
                  <AlertCircle size={20} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="name">
                      Your Name *
                    </label>
                    <input
                      id="name"
                      type="text"
                      className="form-input"
                      value={contributorName}
                      onChange={(e) => setContributorName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="email">
                      Email Address *
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="form-input"
                      value={contributorEmail}
                      onChange={(e) => setContributorEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="game">
                      Associated Game *
                    </label>
                    <select
                      id="game"
                      className="form-select"
                      value={gameSlug}
                      onChange={(e) => setGameSlug(e.target.value)}
                    >
                      <option value="aadu-puli-aatam">Aadu Puli Aatam (Goats and Tigers)</option>
                      <option value="pallanguzhi">Pallanguzhi (14-Pit Mancala)</option>
                      <option value="chowka-bara">Chowka Bara (Courtyard Classic)</option>
                      <option value="other">Other Traditional Indian Game</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="type">
                      Submission Type *
                    </label>
                    <select
                      id="type"
                      className="form-select"
                      value={submissionType}
                      onChange={(e) => setSubmissionType(e.target.value)}
                    >
                      <option value="regional_variant">Regional Rule Variant</option>
                      <option value="historical_reference">Historical / Epigraphical Reference</option>
                      <option value="oral_rule">Oral Family / Community Rule</option>
                      <option value="cultural_lore">Cultural Lore & Folklore</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="title">
                    Variation Title *
                  </label>
                  <input
                    id="title"
                    type="text"
                    className="form-input"
                    placeholder="e.g. 4-Tiger Pulijudam of Rayalaseema"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="region">
                    Geographic Region / Community Origin *
                  </label>
                  <input
                    id="region"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Thanjavur District, Tamil Nadu or North Karnataka"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="content">
                    Rule Details or Oral Description *
                  </label>
                  <textarea
                    id="content"
                    rows="5"
                    className="form-input"
                    placeholder="Explain the specific rule deviation, piece changes, or cultural memories associated with this variation..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                  ></textarea>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="references">
                    Oral Attributions or Historical Citations (Optional)
                  </label>
                  <input
                    id="references"
                    type="text"
                    className="form-input"
                    placeholder="e.g. As recounted by elder players in Madurai village gathering, 2024"
                    value={references}
                    onChange={(e) => setReferences(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary auth-submit-btn"
                  disabled={submitting}
                >
                  <Send size={18} />
                  {submitting ? 'Submitting to Archive...' : 'Submit for Preservation'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
