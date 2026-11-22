import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { formatDate } from '../utils/formatters.js';
import { Calendar, Clock, Search, XCircle } from 'lucide-react';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchAllBookings = async () => {
    try {
      const res = await api.get('/bookings');
      if (res.data?.success) {
        setBookings(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load all bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBookings();
  }, []);

  const handleAdminCancel = async (bookingId) => {
    if (!window.confirm('Admin Action: Release slot locks and cancel this booking?')) return;
    setActionLoading(bookingId);
    try {
      await api.delete(`/bookings/${bookingId}`, {
        data: { reason: 'Administrative cancellation by campus operator' },
      });
      fetchAllBookings();
    } catch (err) {
      alert(`Cancel failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchVenue = b.resourceName?.toLowerCase().includes(q);
      const matchUser = b.userName?.toLowerCase().includes(q);
      const matchId = b.id?.toLowerCase().includes(q);
      if (!matchVenue && !matchUser && !matchId) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Master Booking Management
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Inspect all campus-wide reservations, verify DynamoDB slot locks, and administer cancellations.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search venue, user, or booking ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-campus-800/20 focus:border-campus-800"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-campus-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <LoadingSpinner message="Querying master bookings database..." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Venue & Slot Keys</th>
                  <th className="px-6 py-3.5">Booked By</th>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{b.resourceName}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {b.slotKeys?.length || 1} slots • Ref: {b.id.slice(0, 16)}...
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{b.userName}</p>
                      <p className="text-[11px] text-slate-400">{b.userRole} • {b.userEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <p className="font-medium">{formatDate(b.date)}</p>
                      <p className="text-slate-500 font-semibold">{b.startTime} - {b.endTime}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(b.status === 'CONFIRMED' || b.status === 'CHECKED_IN') && (
                        <button
                          onClick={() => handleAdminCancel(b.id)}
                          disabled={actionLoading === b.id}
                          className="px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 font-semibold text-xs transition-colors"
                        >
                          Force Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
