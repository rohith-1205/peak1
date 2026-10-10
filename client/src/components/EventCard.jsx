import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { getImageUrl } from '../utils/imageUrl';
import { useAuth } from '../context/AuthContext';
import './EventCard.css';

export default function EventCard({ event }) {
  const { isRegisteredForEvent } = useAuth();
  const isRegistered = isRegisteredForEvent(event._id);

  const defaultPoster = 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800';

  const formattedDate = new Date(event.eventDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="event-card">
      {/* Poster Image & Badges */}
      <div className="event-poster-wrapper">
        <img
          src={getImageUrl(event.posterUrl) || defaultPoster}
          alt={event.title}
          className="event-poster-img"
        />
        <div className="event-poster-overlay" />
        
        {/* Category Badge */}
        <div className="poster-tag-left">
          <span className="badge">
            {event.category}
          </span>
        </div>

        <div className="poster-tag-right">
          {isRegistered ? (
            <span className="badge badge-emerald flex items-center gap-xs">
              <CheckCircle2 size={12} /> REGISTERED
            </span>
          ) : (
            <StatusBadge status={event.status} />
          )}
        </div>

        {/* Pricing Badge */}
        <div className="poster-tag-price">
          {event.isPaid ? (
            <span className="badge badge-white">
              ₹{event.price?.toLocaleString('en-IN')}
            </span>
          ) : (
            <span className="badge">
              FREE ENTRY
            </span>
          )}
        </div>
      </div>

      {/* Content Body */}
      <div className="event-card-body">
        <div>
          <h3 className="event-card-title truncate">
            {event.title}
          </h3>
          <p className="event-card-desc">
            {event.shortDescription}
          </p>
        </div>

        {/* Info Rows */}
        <div className="event-card-meta">
          <div className="meta-row">
            <Calendar size={14} className="text-dim" />
            <span>{formattedDate} • {event.startTime}</span>
          </div>
          <div className="meta-row">
            <MapPin size={14} className="text-dim" />
            <span className="truncate">{event.venue}, {event.city}</span>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ paddingTop: '0.25rem' }}>
          {isRegistered ? (
            <Link
              to="/dashboard"
              className="btn btn-secondary btn-sm w-full flex-between"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'var(--accent-emerald)', color: '#34d399' }}
            >
              <span className="flex items-center gap-xs font-bold">
                <CheckCircle2 size={14} /> Registered • View Pass
              </span>
              <ArrowRight size={14} />
            </Link>
          ) : (
            <Link
              to={`/events/${event.slug}`}
              className="btn btn-secondary btn-sm w-full flex-between"
            >
              <span>{event.status === 'PUBLISHED' ? 'View Details & Register' : 'View Details'}</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
