import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Cpu, Ticket, ArrowRight, CheckCircle } from 'lucide-react';

export default function About() {
  return (
    <div className="page-wrapper">
      {/* Hero Header */}
      <section className="hero-section">
        <div className="container hero-inner">
          <div className="hero-badge">
            ENTERPRISE ARCHITECTURE
          </div>
          <h1 className="hero-title">
            ENGINEERED FOR <br />
            <span className="text-muted">PRECISION EXECUTION.</span>
          </h1>
          <p className="hero-desc">
            Peak1 is a single-organization event infrastructure designed to eliminate administrative friction, secure participant registrations, and power real-time event gate check-ins.
          </p>
        </div>
      </section>

      {/* Core Principles Grid */}
      <section className="container">
        <div className="section-header">
          <div>
            <span className="label-eyebrow">FOUNDATIONS</span>
            <h2 className="section-title">Platform Standards</h2>
          </div>
        </div>

        <div className="grid grid-3 gap-lg" style={{ marginTop: '1.5rem' }}>
          <div className="card-mono p-6 flex flex-col gap-md">
            <div className="feature-icon-box">
              <Cpu size={20} />
            </div>
            <h3 className="font-heading font-bold text-white uppercase" style={{ fontSize: '1.125rem' }}>
              Single-Owner Control
            </h3>
            <p className="text-muted leading-relaxed" style={{ fontSize: '0.8125rem' }}>
              Unlike generic multi-tenant marketplaces, Peak1 is built exclusively for one authoritative organizer. Every event, field schema, and pricing rule is centralized.
            </p>
          </div>

          <div className="card-mono p-6 flex flex-col gap-md">
            <div className="feature-icon-box">
              <Shield size={20} />
            </div>
            <h3 className="font-heading font-bold text-white uppercase" style={{ fontSize: '1.125rem' }}>
              Atomic Validation
            </h3>
            <p className="text-muted leading-relaxed" style={{ fontSize: '0.8125rem' }}>
              All registration fees and field configurations are dictated and enforced on the server. Client-side tampering or price overrides are strictly rejected.
            </p>
          </div>

          <div className="card-mono p-6 flex flex-col gap-md">
            <div className="feature-icon-box">
              <Ticket size={20} />
            </div>
            <h3 className="font-heading font-bold text-white uppercase" style={{ fontSize: '1.125rem' }}>
              Automated QR Credentials
            </h3>
            <p className="text-muted leading-relaxed" style={{ fontSize: '0.8125rem' }}>
              Upon successful registration, participants receive a cryptographically signed QR code ticket pass that staff can scan instantly at the event venue.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Roster */}
      <section className="container">
        <div className="card-mono" style={{ padding: '2.5rem' }}>
          <h3 className="font-heading font-bold text-white uppercase" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>
            Key Architecture Specifications
          </h3>
          <div className="grid grid-2 gap-lg" style={{ fontSize: '0.8125rem' }}>
            <div className="flex items-start gap-md">
              <CheckCircle size={20} className="text-white" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
              <div>
                <h4 className="font-heading font-bold text-white uppercase">Dynamic Field Form Engine</h4>
                <p className="text-muted leading-relaxed" style={{ marginTop: '0.25rem' }}>
                  Admin-defined custom fields (Text, Number, Phone, File Upload, Dropdown, Radio, Checkbox) dynamically render per event.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-md">
              <CheckCircle size={20} className="text-white" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
              <div>
                <h4 className="font-heading font-bold text-white uppercase">Razorpay Payment Integration</h4>
                <p className="text-muted leading-relaxed" style={{ marginTop: '0.25rem' }}>
                  Cryptographic HMAC-SHA256 signature verification and webhook idempotency for all paid event transactions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-md">
              <CheckCircle size={20} className="text-white" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
              <div>
                <h4 className="font-heading font-bold text-white uppercase">Live Attendance Gate Scanner</h4>
                <p className="text-muted leading-relaxed" style={{ marginTop: '0.25rem' }}>
                  Browser-based camera QR code reader allows event staff to check in attendees with real-time status updates.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-md">
              <CheckCircle size={20} className="text-white" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
              <div>
                <h4 className="font-heading font-bold text-white uppercase">Exportable Participant Data</h4>
                <p className="text-muted leading-relaxed" style={{ marginTop: '0.25rem' }}>
                  Full admin export capabilities for participant rosters, custom response fields, and check-in logs.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end" style={{ paddingTop: '1.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
            <Link to="/events" className="btn btn-primary btn-sm">
              View Published Schedule <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
