import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-col">
            <Link to="/" className="brand-logo" style={{ marginBottom: '0.25rem' }}>
              <div className="brand-badge" style={{ width: '1.75rem', height: '1.75rem', fontSize: '0.75rem' }}>
                P1
              </div>
              <span className="brand-name" style={{ fontSize: '1.125rem' }}>
                PEAK<span className="brand-accent">1</span>
              </span>
            </Link>
            <p className="text-muted leading-relaxed" style={{ fontSize: '0.75rem' }}>
              Official event registration and management platform. Engineered for precision execution, verified participant entry, and seamless attendance.
            </p>
            <div className="flex items-center gap-xs text-dim pt-1" style={{ fontSize: '0.7rem' }}>
              <ShieldCheck size={14} className="text-white" />
              <span>SSL Secured Platform Engine</span>
            </div>
          </div>

          {/* Catalog */}
          <div className="footer-col">
            <h4 className="footer-title">Public Navigation</h4>
            <ul className="footer-links">
              <li><Link to="/" className="footer-link">Home Page</Link></li>
              <li><Link to="/events" className="footer-link">Explore All Events</Link></li>
              <li><Link to="/about" className="footer-link">Platform Architecture</Link></li>
            </ul>
          </div>

          {/* Participant Passes */}
          <div className="footer-col">
            <h4 className="footer-title">Participants</h4>
            <ul className="footer-links">
              <li><Link to="/dashboard" className="footer-link">My Event Passes</Link></li>
              <li><Link to="/login" className="footer-link">Account Login</Link></li>
              <li><Link to="/register" className="footer-link">Register Account</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="footer-col">
            <h4 className="footer-title">Support & Console</h4>
            <p className="text-muted leading-relaxed" style={{ fontSize: '0.75rem' }}>
              Official queries regarding registrations or platform administration?
            </p>
            <a
              href="mailto:support@peak1.app"
              className="btn btn-secondary btn-sm"
              style={{ width: 'fit-content', marginTop: '0.5rem' }}
            >
              Contact Platform Admin
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Peak1 Event Platform. All rights reserved.</p>
          <div className="flex gap-md">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
