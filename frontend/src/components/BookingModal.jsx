import React, { useState, useEffect } from 'react';
import Modal from './Modal.jsx';
import api from '../services/api.js';
import { Clock, Calendar, Users, AlertCircle } from 'lucide-react';
import AlternativesModal from './AlternativesModal.jsx';

export default function BookingModal({
  isOpen,
  onClose,
  resource,
  initialDate,
  initialStartTime,
  onBookingSuccess,
}) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(initialDate || todayStr);
  const [startTime, setStartTime] = useState(initialStartTime || '09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [purpose, setPurpose] = useState('');
  const [attendeesCount, setAttendeesCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Conflict & Smart Alternatives state
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [alternatives, setAlternatives] = useState([]);
  const [conflictMessage, setConflictMessage] = useState('');

  const timeOptions = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00', '21:30', '22:00',
  ];

  // Synchronize when a slot is clicked on the availability calendar
  useEffect(() => {
    if (isOpen) {
      if (initialDate) {
        setDate(initialDate);
      }
      if (initialStartTime) {
        setStartTime(initialStartTime);
        // Automatically set default endTime to 60 minutes after selected slot
        const [h, m] = initialStartTime.split(':').map(Number);
        const endTotalMins = h * 60 + m + 60;
        const endH = Math.floor(endTotalMins / 60);
        const endM = endTotalMins % 60;
        const formattedEnd = `${String(Math.min(22, endH)).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
        setEndTime(formattedEnd);
      }
      setError('');
    }
  }, [isOpen, initialStartTime, initialDate]);

  const handleStartTimeChange = (newStart) => {
    setStartTime(newStart);
    // If current end time is equal or earlier than start, advance it automatically
    const [startH, startM] = newStart.split(':').map(Number);
    const startMins = startH * 60 + startM;

    const [endH, endM] = endTime.split(':').map(Number);
    const endMins = endH * 60 + endM;

    if (endMins <= startMins) {
      const nextMins = Math.min(22 * 60, startMins + 60);
      const nextH = Math.floor(nextMins / 60);
      const nextM = nextMins % 60;
      setEndTime(`${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/bookings', {
        resourceId: resource.id,
        date,
        startTime,
        endTime,
        purpose: purpose || 'Academic study session at TIET',
        attendeesCount: Number(attendeesCount) || 1,
      });

      if (res.data?.success) {
        onBookingSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      const errData = err.response?.data;
      const message = errData?.error || err.message || 'Booking failed';
      setError(message);

      // If slot conflict occurs, fetch smart suggestions automatically!
      if (err.response?.status === 409 || errData?.errorCode === 'SLOT_CONFLICT') {
        try {
          const sugRes = await api.get('/suggestions', {
            params: {
              resourceId: resource.id,
              category: resource.category,
              date,
              preferredTime: startTime,
              durationMinutes: 60,
            },
          });
          if (sugRes.data?.data && sugRes.data.data.length > 0) {
            setAlternatives(sugRes.data.data);
            setConflictMessage(message);
            setShowAlternatives(true);
          }
        } catch {
          // ignore suggestions error
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBookAlternative = async (alt) => {
    setLoading(true);
    try {
      const res = await api.post('/bookings', {
        resourceId: alt.resource.id,
        date: alt.date,
        startTime: alt.startTime,
        endTime: alt.endTime,
        purpose: purpose || 'Alternative Reservation at TIET',
        attendeesCount: Number(attendeesCount) || 1,
      });
      if (res.data?.success) {
        setShowAlternatives(false);
        onBookingSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      alert(`Booking alternative failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Reserve ${resource?.name || 'Venue'}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{error}</p>
                {alternatives.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAlternatives(true)}
                    className="mt-1 font-bold text-rose-900 underline text-xs block"
                  >
                    View {alternatives.length} Smart Alternatives & Nearby Slots
                  </button>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reservation Date</label>
            <input
              type="date"
              required
              min={todayStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-thapar-800/20 focus:border-thapar-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time (30m)</label>
              <select
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-thapar-800/20 focus:border-thapar-800 font-semibold text-slate-900"
              >
                {timeOptions.slice(0, -1).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Time (30m)</label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-thapar-800/20 focus:border-thapar-800 font-semibold text-slate-900"
              >
                {timeOptions.slice(1).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Attendees Count</label>
              <input
                type="number"
                min="1"
                max={resource?.capacity || 100}
                value={attendeesCount}
                onChange={(e) => setAttendeesCount(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-thapar-800/20 focus:border-thapar-800"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Max capacity: {resource?.capacity} seats</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Check-in Flexibility</label>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
                Advance check-in allowed anytime before session starts or up to 15m after.
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Session Purpose / Notes</label>
            <textarea
              rows="2"
              required
              placeholder="e.g. Capstone project sprint, Faculty committee, Study group..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-thapar-800/20 focus:border-thapar-800"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-thapar-800 hover:bg-thapar-900 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              {loading ? 'Acquiring DynamoDB Slot Locks...' : 'Confirm Atomic Reservation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Alternatives Modal */}
      <AlternativesModal
        isOpen={showAlternatives}
        onClose={() => setShowAlternatives(false)}
        alternatives={alternatives}
        conflictMessage={conflictMessage}
        onSelectAlternative={handleBookAlternative}
      />
    </>
  );
}
