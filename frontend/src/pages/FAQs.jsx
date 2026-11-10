import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  HeartHandshake,
} from 'lucide-react';

export default function FAQs() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  const categories = [
    'All',
    'General',
    'Aadu Puli Aatam',
    'Pallanguzhi',
    'Strategy',
    'Technical & Caching',
  ];

  useEffect(() => {
    let isMounted = true;
    const fetchFaqs = async () => {
      setLoading(true);
      try {
        const params = {};
        if (selectedCategory && selectedCategory !== 'All') {
          params.category = selectedCategory;
        }
        if (search.trim()) {
          params.search = search.trim();
        }

        const res = await api.get('/faqs', { params });
        if (isMounted) {
          setFaqs(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load FAQs:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = setTimeout(fetchFaqs, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [search, selectedCategory]);

  const toggleAccordion = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="container page-wrapper">
      {/* Header Banner */}
      <div className="explore-header">
        <div className="badge badge-ochre">
          <HelpCircle size={14} /> Knowledge Repository
        </div>
        <h1 className="explore-title">Frequently Asked Questions</h1>
        <p className="explore-subtitle">
          Explanations for game rules, historical methodologies, tactical dilemmas, and technical platform features.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="comic-panel filter-panel" style={{ marginBottom: '2rem' }}>
        <div className="search-bar-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search questions about tiger jumps, empty pit captures, or match caching..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="chips-container" style={{ marginTop: '0.75rem' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`chip-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Accordion List */}
      {loading ? (
        <div className="comic-panel" style={{ textAlign: 'center', padding: '3rem 0' }}>
          <h3>Searching the FAQ Scrolls...</h3>
        </div>
      ) : faqs.length === 0 ? (
        <div className="comic-panel empty-state">
          <h3>No Questions Found</h3>
          <p>We couldn't find any questions matching your query. Feel free to submit your rule query.</p>
          <Link to="/preserve" className="btn btn-outline btn-sm" style={{ marginTop: '1rem' }}>
            Submit a Question / Rule
          </Link>
        </div>
      ) : (
        <div className="faqs-accordion-list">
          {faqs.map((faq) => {
            const isExpanded = expandedId === faq._id;
            return (
              <div key={faq._id} className="comic-panel faq-accordion-item">
                <button
                  className="faq-question-btn"
                  onClick={() => toggleAccordion(faq._id)}
                  aria-expanded={isExpanded}
                >
                  <div className="faq-question-text">
                    <span className="badge badge-ochre faq-cat-badge">{faq.category}</span>
                    <span className="question-title">{faq.question}</span>
                  </div>
                  <div className="faq-toggle-icon">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="faq-answer-container">
                    <p className="faq-answer-text">{faq.answer}</p>
                    {faq.gameSlug && (
                      <div className="faq-game-link">
                        <Link to={`/games/${faq.gameSlug}`} className="btn btn-outline btn-sm">
                          <BookOpen size={14} /> View Related Game Guide
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Preservation Callout */}
      <div className="comic-panel faq-preserve-footer" style={{ marginTop: '3rem' }}>
        <HeartHandshake size={32} color="var(--color-terracotta)" />
        <div>
          <h3>Have a Regional Rule Variation to Share?</h3>
          <p style={{ color: 'var(--color-ink-soft)', marginTop: '0.25rem' }}>
            Traditional board games often feature rich oral variations across villages and families. Inscribe your local rules into our preservation archive.
          </p>
        </div>
        <Link to="/preserve" className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>
          Contribute Variant
        </Link>
      </div>
    </div>
  );
}
