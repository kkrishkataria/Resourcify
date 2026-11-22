import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { formatDate } from '../utils/formatters.js';
import {
  CheckCircle2,
  Clock,
  Calendar,
  Building,
  QrCode,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export default function CheckInPage() {
  const { user } = useAuth();
  const [confirmedBookings, setConfirmedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState('');

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings');
      if (res.data?.success) {
        const confirmed = (res.data.data || []).filter((b) => b.status === 'CONFIRMED');
        setConfirmedBookings(confirmed);
      }
    } catch (err) {
      console.error('Failed to load check-in list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const handleCheckIn = async (bookingId) => {
    setActionLoading(bookingId);
    setMessage('');
    try {
      const res = await api.post(`/bookings/${bookingId}/checkin`);
      if (res.data?.success) {
        setMessage('Check-in confirmed! Your attendance has been logged.');
        fetchBookings();
      }
    } catch (err) {
      setMessage(`Check-in failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Check-In Interface</h1>
        <p className="text-sm text-slate-500 mt-1">
          Verify your on-campus presence within the 15-minute grace period to prevent automated no-show slot release.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="font-bold text-xs text-blue-600">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Scanning pending check-in reservations..." />
      ) : confirmedBookings.length === 0 ? (
        <EmptyState
          title="No pending check-ins"
          description="You do not have any active bookings waiting for check-in verification."
          actionText="Browse Campus Facilities"
          onAction={() => (window.location.href = '/resources')}
        />
      ) : (
        <div className="space-y-4">
          {confirmedBookings.map((b) => {
            const deadline = new Date(b.checkInDeadline);
            const isNearExpiry = deadline.getTime() - Date.now() < 10 * 60 * 1000;

            return (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      Pending Verification
                    </span>
                    <span className="text-[11px] text-slate-400">Ref: {b.id.slice(0, 12)}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{b.resourceName}</h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(b.date)}</span>
                    </span>
                    <span className="flex items-center space-x-1 font-semibold text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{b.startTime} - {b.endTime}</span>
                    </span>
                    <span>• {b.purpose}</span>
                  </div>

                  <div className="flex items-center space-x-2 pt-1 text-xs">
                    <AlertTriangle className={`w-4 h-4 ${isNearExpiry ? 'text-rose-500' : 'text-amber-500'}`} />
                    <span className="text-slate-600">
                      Check-in Deadline:{' '}
                      <strong className="text-slate-900">
                        {deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="p-2 border border-slate-200 rounded-xl bg-slate-50 text-center">
                    <QrCode className="w-10 h-10 text-slate-700 mx-auto" />
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mt-0.5">Campus QR</span>
                  </div>

                  <button
                    onClick={() => handleCheckIn(b.id)}
                    disabled={actionLoading === b.id}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{actionLoading === b.id ? 'Verifying...' : 'One-Click Check In'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
