import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import { Calendar, ShieldCheck, Ticket, CheckCircle2, ArrowRight, Layers, Lock, Trophy } from 'lucide-react';
import peak11Banner from '../assets/peak11.jpeg';
import './Home.css';

export default function Home() {
  const { user } = useAuth();
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch event details & roster if user is logged in
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [eventsRes, categoriesRes] = await Promise.all([
          api.get('/events?limit=6&upcoming=true'),
          api.get('/events/meta/categories')
        ]);

        if (eventsRes.success && eventsRes.data?.events) {
          setFeaturedEvents(eventsRes.data.events);
        }

        if (categoriesRes.success && categoriesRes.data?.categories) {
          setCategories(categoriesRes.data.categories);
        }
      } catch (err) {
        console.error('Error loading homepage data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  return (
    <div className="page-wrapper">
      {/* Brand Hero Section */}
      <section className="hero-section">
        <div className="container hero-inner">
          <div className="hero-badge">
            OFFICIAL PLATFORM ENGINE
          </div>

          <h1 className="hero-title">
            WHERE EVENTS <br />
            <span className="text-muted">BECOME EXPERIENCES.</span>
          </h1>

          <p className="hero-desc">
            The official event management and registration engine. Engineered for precision execution, verified participant entry, and seamless attendance tracking.
          </p>

          <div className="hero-actions">
            {user ? (
              <Link to="/events" className="btn btn-primary btn-lg">
                Explore Available Events <ArrowRight size={16} />
              </Link>
            ) : (
              <Link to="/login" className="btn btn-primary btn-lg">
                Sign In to Access Schedule <ArrowRight size={16} />
              </Link>
            )}
            <Link to="/about" className="btn btn-secondary btn-lg">
              Platform Architecture
            </Link>
          </div>

          {/* Peak1 Club Showcase Banner */}
          <div 
            className="card-mono w-full overflow-hidden transition-all" 
            style={{ 
              marginTop: '2.5rem', 
              borderRadius: '16px', 
              border: '1px solid var(--border-subtle)', 
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              backgroundColor: 'var(--color-black)'
            }}
          >
            <div style={{ position: 'relative', width: '100%', maxHeight: '520px', overflow: 'hidden' }}>
              <img 
                src={peak11Banner} 
                alt="Peak1 Club Community" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div 
                style={{ 
                  position: 'absolute', 
                  bottom: '1.25rem', 
                  right: '1.25rem', 
                  backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                  backdropFilter: 'blur(10px)',
                  border: '1px solid var(--border-subtle)',
                  padding: '0.4rem 1rem',
                  borderRadius: '30px',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: 'var(--accent-cyan)',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <span>@peak1club</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONDITIONAL RENDER: Events & Categories ONLY Visible After Login */}
      {user ? (
        <>
          {/* Dynamic Categories Section */}
          {!loading && categories.length > 0 && (
            <section className="container">
              <div className="section-header">
                <div>
                  <span className="label-eyebrow">DISCIPLINES</span>
                  <h2 className="section-title">Active Categories</h2>
                </div>
                <Link to="/events" className="nav-link flex items-center gap-xs">
                  View All Disciplines <ArrowRight size={14} />
                </Link>
              </div>

              <div className="grid grid-6 gap-md" style={{ marginTop: '1.5rem' }}>
                {categories.map((cat, idx) => (
                  <Link
                    key={idx}
                    to={`/events?category=${encodeURIComponent(cat)}`}
                    className="card-mono category-card"
                  >
                    <Layers size={20} className="text-muted" />
                    <span className="category-title truncate">{cat}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Dynamic Events Roster Section */}
          <section className="container">
            <div className="section-header">
              <div>
                <span className="label-eyebrow">SCHEDULE</span>
                <h2 className="section-title">Official Roster</h2>
              </div>
              {featuredEvents.length > 0 && (
                <Link to="/events" className="btn btn-secondary btn-sm">
                  Browse All Events
                </Link>
              )}
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              {loading ? (
                <div className="grid grid-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="card-mono" style={{ height: '20rem', opacity: 0.5 }} />
                  ))}
                </div>
              ) : featuredEvents.length > 0 ? (
                <div className="grid grid-3 gap-lg">
                  {featuredEvents.map((event) => (
                    <EventCard key={event._id} event={event} />
                  ))}
                </div>
              ) : (
                /* Full-Width Elegant Centered Empty State */
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <Calendar size={24} />
                  </div>
                  <h3 className="empty-state-title">No Events Announced Yet</h3>
                  <p className="empty-state-desc">
                    Check back soon for upcoming schedule announcements, ticket releases, and entry registrations.
                  </p>
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        /* GUEST USER PROMPT: Event Details Restricted Banner */
        <section className="container">
          <div className="card-mono text-center flex flex-col items-center gap-md" style={{ padding: '3.5rem 1.5rem' }}>
            <div className="empty-state-icon" style={{ width: '3.5rem', height: '3.5rem' }}>
              <Lock size={28} />
            </div>
            <h3 className="section-title" style={{ fontSize: '1.5rem' }}>
              AUTHENTICATION REQUIRED TO VIEW EVENT SCHEDULE
            </h3>
            <p className="text-muted" style={{ maxWidth: '32rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Event schedule details, dates, venues, and registration forms are accessible exclusively to authenticated participants. Please sign in or create an account.
            </p>
            <div className="flex gap-md" style={{ marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
              <Link to="/login" className="btn btn-primary" style={{ flex: '1 1 auto', minWidth: '10rem', maxWidth: '16rem', textAlign: 'center', justifyContent: 'center' }}>
                Account Sign In
              </Link>
              <Link to="/register" className="btn btn-secondary" style={{ flex: '1 1 auto', minWidth: '10rem', maxWidth: '16rem', textAlign: 'center', justifyContent: 'center' }}>
                Register Participant Account
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Live Leaderboards Section */}
      {user && featuredEvents.some(e => e.hasLeaderboard) && (
        <section className="container" style={{ marginTop: '2.5rem', marginBottom: '2.5rem' }}>
          <div className="section-header">
            <div>
              <span className="label-eyebrow">LIVE STANDINGS</span>
              <h2 className="section-title">Public Leaderboards</h2>
            </div>
          </div>
          
          <div className="grid grid-3 gap-md" style={{ marginTop: '1.5rem' }}>
            {featuredEvents.filter(e => e.hasLeaderboard).map(event => (
              <Link 
                key={event._id} 
                to={`/events/${event.slug}?tab=leaderboard`} 
                className="card-mono" 
                style={{ padding: '1.5rem', border: '1px solid var(--accent-amber)', background: 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.05), transparent)' }}
              >
                <div className="flex items-center gap-sm" style={{ marginBottom: '1rem', color: 'var(--accent-amber)' }}>
                  <Trophy size={24} />
                  <span className="font-bold uppercase tracking-wider text-white" style={{ fontSize: '0.85rem' }}>{event.leaderboardTitle || 'Official Standings'}</span>
                </div>
                <h3 className="font-bold text-white mb-2" style={{ fontSize: '1.1rem' }}>{event.title}</h3>
                <p className="text-dim text-sm mb-4">Live timing, lap scores, and position rankings.</p>
                <span className="btn btn-secondary btn-sm w-full text-center flex items-center justify-center gap-xs" style={{ borderColor: 'rgba(245,158,11,0.3)', color: 'var(--accent-amber)' }}>
                  View Live Leaderboard <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Brand Pillars / Features Section */}
      <section className="container">
        <div className="section-header">
          <div>
            <span className="label-eyebrow">INFRASTRUCTURE</span>
            <h2 className="section-title">Engineered Capabilities</h2>
          </div>
        </div>

        <div className="grid grid-3 gap-lg" style={{ marginTop: '1.5rem' }}>
          <div className="card-mono feature-card">
            <div className="flex flex-col gap-md">
              <div className="feature-icon-box">
                <ShieldCheck size={20} />
              </div>
              <span className="label-eyebrow" style={{ fontSize: '0.65rem' }}>SYSTEM INTEGRITY</span>
              <h3 className="font-heading font-bold uppercase text-white" style={{ fontSize: '1.125rem' }}>
                Precision Execution
              </h3>
              <p className="text-muted leading-relaxed" style={{ fontSize: '0.8125rem' }}>
                Atomic duplicate entry protection, server-dictated price validation, and database safety guards guarantee registration integrity.
              </p>
            </div>
          </div>

          <div className="card-mono feature-card">
            <div className="flex flex-col gap-md">
              <div className="feature-icon-box">
                <Ticket size={20} />
              </div>
              <span className="label-eyebrow" style={{ fontSize: '0.65rem' }}>REGISTRATION ENGINE</span>
              <h3 className="font-heading font-bold uppercase text-white" style={{ fontSize: '1.125rem' }}>
                Verified Entries
              </h3>
              <p className="text-muted leading-relaxed" style={{ fontSize: '0.8125rem' }}>
                Customizable registration field requirements, automated ticket creation, and Razorpay checkout for paid event registrations.
              </p>
            </div>
          </div>

          <div className="card-mono feature-card">
            <div className="flex flex-col gap-md">
              <div className="feature-icon-box">
                <CheckCircle2 size={20} />
              </div>
              <span className="label-eyebrow" style={{ fontSize: '0.65rem' }}>GATE SECURITY</span>
              <h3 className="font-heading font-bold uppercase text-white" style={{ fontSize: '1.125rem' }}>
                QR Gate Scanning
              </h3>
              <p className="text-muted leading-relaxed" style={{ fontSize: '0.8125rem' }}>
                Automated QR ticket generation upon registration with staff gate camera scanning and real-time attendance status updates.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
