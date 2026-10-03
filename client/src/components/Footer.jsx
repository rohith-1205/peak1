import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Instagram } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  const instagramUrl = "https://www.instagram.com/peak1club?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==";

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

          {/* Support & Community */}
          <div className="footer-col">
            <h4 className="footer-title">Community & Support</h4>
            <p className="text-muted leading-relaxed" style={{ fontSize: '0.75rem' }}>
              Connect with our official community channel or contact administration:
            </p>
            <div className="flex flex-col gap-xs" style={{ marginTop: '0.5rem' }}>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm flex items-center gap-xs"
                style={{ 
                  width: 'fit-content',
                  borderColor: 'rgba(225, 48, 108, 0.4)',
                  color: '#E1306C',
                  backgroundColor: 'rgba(225, 48, 108, 0.08)'
                }}
              >
                <Instagram size={14} /> @peak1club Instagram
              </a>
              <a
                href="mailto:peak1clubb@gmail.com"
                className="btn btn-ghost btn-sm text-dim flex items-center gap-xs"
                style={{ width: 'fit-content', fontSize: '0.75rem' }}
              >
                Contact Platform Admin
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Peak1 Event Platform. All rights reserved.</p>
          <div className="flex items-center gap-md">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-xs text-dim hover:text-white transition-all"
              style={{ fontSize: '0.75rem', textDecoration: 'none' }}
            >
              <Instagram size={14} style={{ color: '#E1306C' }} /> Instagram
            </a>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
