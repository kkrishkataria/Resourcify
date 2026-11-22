import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { formatCategory, formatDate } from '../utils/formatters.js';
import {
  Sparkles,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Building,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function AutoAllocatePage() {
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().split('T')[0];

  const [category, setCategory] = useState('COMPUTER_LAB');
  const [capacity, setCapacity] = useState(25);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [date, setDate] = useState(todayStr);
  const [preferredTime, setPreferredTime] = useState('14:00');
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [purpose, setPurpose] = useState('');

  const [loading, setLoading] = useState(false);
  const [allocationResult, setAllocationResult] = useState(null);
  const [error, setError] = useState('');

  const equipmentCatalog = [
    'Workstations',
    'GPUs',
    'Projector',
    'Whiteboard',
    'Sound System',
    'Video Conferencing',
  ];

  const toggleEquipment = (eq) => {
    setSelectedEquipment((prev) =>
      prev.includes(eq) ? prev.filter((i) => i !== eq) : [...prev, eq]
    );
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAllocationResult(null);

    try {
      const res = await api.post('/allocate', {
        category,
        capacity: Number(capacity),
        durationMinutes: Number(durationMinutes),
        date,
        preferredTime,
        equipmentRequirements: selectedEquipment,
        purpose: purpose || 'Intelligent Auto-Allocated Reservation',
        attendeesCount: Number(capacity),
      });

      if (res.data) {
        setAllocationResult(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Auto-allocation failed');
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
        purpose: purpose || 'Auto-allocation Alternative Reservation',
        attendeesCount: Number(capacity),
      });

      if (res.data?.success) {
        navigate('/my-bookings');
      }
    } catch (err) {
      alert(`Booking alternative failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-campus-50 text-campus-800 border border-campus-200 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-campus-600" />
          <span>Algorithmic Optimization Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Intelligent Resource Auto-Allocation
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Specify your constraints. CampusSlot evaluates candidate facilities, scores capacity fit and amenities, and atomically acquires slot locks for the optimal venue.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleAllocate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Resource Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-campus-800/20 focus:border-campus-800"
              >
                <option value="COMPUTER_LAB">Computer Lab</option>
                <option value="SEMINAR_ROOM">Seminar Room</option>
                <option value="STUDY_ROOM">Study Room</option>
                <option value="SPORTS_COURT">Sports Court</option>
                <option value="CONFERENCE_HALL">Conference Hall</option>
              </select>
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Required Capacity (Seats)</label>
              <input
                type="number"
                min="1"
                max="200"
                required
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-campus-800/20 focus:border-campus-800"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Reservation Date</label>
              <input
                type="date"
                min={todayStr}
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-campus-800/20 focus:border-campus-800"
              />
            </div>

            {/* Preferred Start Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Preferred Start Time</label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-campus-800/20 focus:border-campus-800"
              >
                {['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Session Duration</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-campus-800/20 focus:border-campus-800"
              >
                <option value={30}>30 Minutes (1 Slot)</option>
                <option value={60}>60 Minutes (2 Slots)</option>
                <option value={90}>90 Minutes (3 Slots)</option>
                <option value={120}>120 Minutes (4 Slots)</option>
                <option value={180}>180 Minutes (6 Slots)</option>
              </select>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Reservation Purpose</label>
              <input
                type="text"
                placeholder="e.g. Capstone project sprint, Faculty committee"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-campus-800/20 focus:border-campus-800"
              />
            </div>
          </div>

          {/* Equipment checkboxes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Required Equipment / Facilities</label>
            <div className="flex flex-wrap gap-2">
              {equipmentCatalog.map((eq) => {
                const active = selectedEquipment.includes(eq);
                return (
                  <button
                    key={eq}
                    type="button"
                    onClick={() => toggleEquipment(eq)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      active
                        ? 'bg-campus-800 text-white border-campus-800 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}{eq}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-campus-800 hover:bg-campus-900 text-white font-semibold text-sm shadow-xs transition-colors flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Evaluating Suitability & Reserving...' : 'Find & Allocate Best Resource'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Result Section */}
      {allocationResult && (
        <div className="space-y-6">
          {allocationResult.allocated ? (
            /* Successful Allocation Card */
            <div className="bg-white rounded-2xl border-2 border-emerald-500/40 p-6 sm:p-8 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-700">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="font-bold text-sm uppercase tracking-wider">Optimal Resource Confirmed</span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Suitability Score: {allocationResult.suitabilityScore}/100
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">{allocationResult.resource?.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {allocationResult.resource?.building}, Floor {allocationResult.resource?.floor}, Room {allocationResult.resource?.roomNumber}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block">Date</span>
                  <span className="font-semibold text-slate-800">{formatDate(allocationResult.booking?.date)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Allocated Time</span>
                  <span className="font-semibold text-slate-800">
                    {allocationResult.booking?.startTime} - {allocationResult.booking?.endTime}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Venue Capacity</span>
                  <span className="font-semibold text-slate-800">{allocationResult.resource?.capacity} seats</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Booking Status</span>
                  <span className="font-semibold text-emerald-600">CONFIRMED (Locks Acquired)</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {allocationResult.message}
              </p>

              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  to="/my-bookings"
                  className="px-5 py-2.5 rounded-xl bg-campus-800 hover:bg-campus-900 text-white font-semibold text-xs transition-colors"
                >
                  View in My Bookings
                </Link>
                <button
                  onClick={() => setAllocationResult(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50"
                >
                  Allocate Another
                </button>
              </div>
            </div>
          ) : (
            /* Unallocated: Show Smart Suggestions */
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                <p className="font-bold text-sm">Requested Slot Unavailable</p>
                <p>{allocationResult.message}</p>
                <p className="text-amber-700">
                  Below are recommended available alternatives ranked by time proximity and facility match:
                </p>
              </div>

              {allocationResult.alternatives?.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Recommended Available Alternatives
                  </h3>
                  {allocationResult.alternatives.map((alt, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 hover:border-campus-400 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-campus-50 text-campus-800 border border-campus-200">
                            Score: {Math.round(alt.suitabilityScore * 0.5 + alt.timeProximityScore * 0.5)}/100
                          </span>
                          <span className="text-xs font-bold text-slate-900">{alt.resource.name}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-600">
                          <span className="font-semibold text-slate-800 flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-campus-600" />
                            <span>{alt.startTime} - {alt.endTime}</span>
                          </span>
                          <span>• {alt.resource.building} (Cap: {alt.resource.capacity})</span>
                        </div>

                        <div className="flex flex-wrap gap-1 text-[11px] text-slate-500 pt-0.5">
                          {alt.matchReasons?.map((reason, rIdx) => (
                            <span key={rIdx} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              ✓ {reason}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleBookAlternative(alt)}
                        className="px-4 py-2 rounded-lg bg-campus-800 hover:bg-campus-900 text-white font-semibold text-xs shadow-xs transition-colors shrink-0 flex items-center justify-center space-x-1.5"
                      >
                        <span>Confirm This Option</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">
                  No direct alternatives found. Try widening your duration or time constraints.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
