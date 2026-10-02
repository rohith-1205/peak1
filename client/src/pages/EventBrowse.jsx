import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import EventCard from '../components/EventCard';
import { Search, Filter, RefreshCw, Calendar } from 'lucide-react';

export default function EventBrowse() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Filters state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [isPaid, setIsPaid] = useState(searchParams.get('isPaid') || '');
  const [page, setPage] = useState(1);

  // Fetch dynamic categories
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await api.get('/events/meta/categories');
        if (res.success && res.data?.categories) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchMeta();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (city) params.append('city', city);
      if (isPaid) params.append('isPaid', isPaid);
      params.append('page', page);
      params.append('limit', '9');

      const res = await api.get(`/events?${params.toString()}`);
      if (res.success && res.data) {
        setEvents(res.data.events);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [searchParams, page]);

  const handleApplyFilter = (e) => {
    e?.preventDefault();
    setPage(1);
    const newParams = {};
    if (search) newParams.search = search;
    if (category) newParams.category = category;
    if (city) newParams.city = city;
    if (isPaid) newParams.isPaid = isPaid;
    setSearchParams(newParams);
  };

  const handleReset = () => {
    setSearch('');
    setCategory('');
    setCity('');
    setIsPaid('');
    setPage(1);
    setSearchParams({});
  };

  return (
    <div className="container page-wrapper" style={{ paddingTop: '2.5rem' }}>
      {/* Header */}
      <div>
        <span className="label-eyebrow">CATALOG</span>
        <h1 className="page-title" style={{ marginTop: '0.25rem' }}>
          EVENTS & SCHEDULE
        </h1>
        <p className="text-muted" style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
          Browse official scheduled events and register for active competitions.
        </p>
      </div>

      {/* Filter Toolbar */}
      <form onSubmit={handleApplyFilter} className="card-mono p-5 grid grid-4 gap-md items-center">
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={14} className="text-dim" style={{ position: 'absolute', left: '0.75rem', top: '0.75rem' }} />
          <input
            type="text"
            placeholder="Search title, venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>

        {/* Dynamic Category Filter */}
        <div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="form-select"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* City Filter */}
        <div>
          <input
            type="text"
            placeholder="City (e.g. Coimbatore, Ooty)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="form-input"
          />
        </div>

        {/* Pricing & Actions */}
        <div className="flex gap-xs">
          <select
            value={isPaid}
            onChange={(e) => setIsPaid(e.target.value)}
            className="form-select flex-1"
          >
            <option value="">All Prices</option>
            <option value="false">Free Entry</option>
            <option value="true">Paid Entry</option>
          </select>
          <button type="submit" className="btn btn-primary btn-sm">
            <Filter size={14} />
          </button>
          <button type="button" onClick={handleReset} className="btn btn-secondary btn-sm" title="Reset Filters">
            <RefreshCw size={14} />
          </button>
        </div>
      </form>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-3 gap-lg">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="card-mono" style={{ height: '20rem', opacity: 0.5 }} />
          ))}
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-3 gap-lg">
          {events.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      ) : (
        /* Full-Width Elegant Empty State */
        <div className="empty-state">
          <div className="empty-state-icon">
            <Calendar size={24} />
          </div>
          <h3 className="empty-state-title">No Matching Events</h3>
          <p className="empty-state-desc">
            There are no matching events for your query at this time.
          </p>
          <button onClick={handleReset} className="btn btn-secondary btn-sm">
            Reset Filters
          </button>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-md pt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="btn btn-secondary btn-sm"
          >
            Previous
          </button>
          <span className="label-eyebrow">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            disabled={page === pagination.pages}
            onClick={() => setPage(page + 1)}
            className="btn btn-secondary btn-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
