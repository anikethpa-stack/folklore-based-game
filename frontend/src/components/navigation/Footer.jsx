import React from 'react';
import { Link } from 'react-router-dom';
import { Scroll, Compass, ShieldAlert, Award } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-container">
        <div className="footer-col brand-col">
          <div className="footer-brand">
            <span className="brand-title">FOLKBOARD</span>
            <p className="manifesto-quote">
              “Discover the games of our past. Learn their stories. Play their traditions.”
            </p>
          </div>
          <p className="footer-desc">
            A cultural preservation initiative dedicated to documenting, decoding, and digitally reviving forgotten and underrepresented traditional board games.
          </p>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Traditions Revived</h4>
          <ul className="footer-links">
            <li><Link to="/games/aadu-puli-aatam">Aadu Puli Aatam (Goats & Tigers)</Link></li>
            <li><Link to="/games/pallanguzhi">Pallanguzhi (Ali Guli Mane)</Link></li>
            <li><Link to="/explore">Chowka Bara (Coming Soon)</Link></li>
            <li><Link to="/explore">Royal Game of Ur (Archived)</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Knowledge & Rules</h4>
          <ul className="footer-links">
            <li><Link to="/tutorials">Step-by-Step Tutorials</Link></li>
            <li><Link to="/faqs">Gameplay FAQ & Clarifications</Link></li>
            <li><Link to="/preserve">Submit Regional Rule Variations</Link></li>
            <li><a href="#historical-methodology">Historical Accuracy Principles</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Ethics & Preservation</h4>
          <p className="footer-note">
            Documented historical rules are distinguished from modern reconstructions. All cultural accounts are attributed with verified references.
          </p>
          <div className="preservation-badge">
            <Award size={16} /> Verified Cultural Heritage
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-content">
          <p>© {new Date().getFullYear()} FolkBoard. MERN Cultural Preservation Platform.</p>
          <p className="footer-status">Authoritative Server-Validated Match Engine</p>
        </div>
      </div>
    </footer>
  );
}

