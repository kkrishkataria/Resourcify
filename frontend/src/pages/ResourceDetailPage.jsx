import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import BookingModal from '../components/BookingModal.jsx';
import { formatCategory, formatDate } from '../utils/formatters.js';
import {
  Building2,
  Users,
  Clock,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';

export default function ResourceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const [resource, setResource] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedSlotTime, setSelectedSlotTime] = useState('09:00');
  const [successBanner, setSuccessBanner] = useState('');

  const fetchResourceAndAvailability = async () => {
    setLoading(true);
    try {
      const [resData, availData] = await Promise.all([
        api.get(`/resources/${id}`),
        api.get(`/availability`, { params: { resourceId: id, date } }),
      ]);

      if (resData.data?.success) setResource(resData.data.data);
      if (availData.data?.success) setAvailability(availData.data.data);
    } catch (err) {
      console.error('Failed to load resource schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResourceAndAvailability();
  }, [id, date]);

  const handleSlotClick = (slot) => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: location,
          message: 'Please sign in with your Thapar roll number or email to book this time slot.',
        },
      });
      return;
    }
    if (slot.available) {
      setSelectedSlotTime(slot.timeSlot);
      setBookingModalOpen(true);
    }
  };

  if (loading && !resource) {
    return <LoadingSpinner message="Loading venue availability..." />;
  }

  if (!resource) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-slate-600">Resource not found.</p>
        <Link to="/resources" className="text-campus-800 font-semibold text-sm mt-2 inline-block">
          ← Return to Resources
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      <Link
        to="/resources"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Facilities</span>
      </Link>

      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <span>{successBanner}</span>
          <button onClick={() => setSuccessBanner('')} className="font-bold text-xs text-emerald-600">
            Dismiss
          </button>
        </div>
      )}

      {/* Resource Overview Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col md:flex-row">
        <div className="md:w-1/3 h-56 md:h-auto bg-slate-100 relative">
          <img
            src={resource.imageUrl || 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80'}
            alt={resource.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-900/80 text-white backdrop-blur-xs">
              {formatCategory(resource.category)}
            </span>
          </div>
        </div>

        <div className="p-6 md:w-2/3 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{resource.name}</h1>
              <StatusBadge status={resource.status} />
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500 mt-2">
              <span className="flex items-center space-x-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{resource.building}, Floor {resource.floor}, Rm {resource.roomNumber}</span>
              </span>
              <span className="flex items-center space-x-1 font-semibold text-slate-800">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>{resource.capacity} Maximum Capacity</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{resource.operatingHours?.start} - {resource.operatingHours?.end}</span>
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              {resource.description || 'Equipped with campus standard network, air-conditioning, and digital presentation capabilities.'}
            </p>

            {/* Equipment chips */}
            {resource.equipment && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {resource.equipment.map((eq, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 font-medium">
                    ✓ {eq}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div className="text-xs text-slate-500">
              Booking Limits: <span className="font-semibold text-slate-700">{resource.minBookingDuration}m min</span> - <span className="font-semibold text-slate-700">{resource.maxBookingDuration}m max</span>
            </div>

            <button
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/login', {
                    state: {
                      from: location,
                      message: 'Please sign in with your Thapar roll number or email to book this venue.',
                    },
                  });
                  return;
                }
                setSelectedSlotTime('09:00');
                setBookingModalOpen(true);
              }}
              style={{ backgroundColor: '#8B1E2D' }}
              className="px-5 py-2.5 rounded-xl bg-thapar-800 hover:bg-thapar-900 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-white" />
              <span>Book This Venue</span>
            </button>
          </div>
        </div>
      </div>

      {/* 30-Minute Visual Availability Calendar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">30-Minute Real-Time Availability Grid</h2>
            <p className="text-xs text-slate-500">
              DynamoDB atomic slot locks prevent overlapping bookings. Click any available slot to reserve.
            </p>
          </div>

          {/* Date Selector */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-campus-800/20 focus:border-campus-800"
            />
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium pt-1">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-500"></span>
            <span className="text-slate-600">Available ({availability?.availableSlots || 0})</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-xs bg-slate-300"></span>
            <span className="text-slate-600">Occupied ({availability?.bookedSlots || 0})</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-xs bg-slate-200 border border-slate-300"></span>
            <span className="text-slate-400">Passed ({availability?.passedSlots || 0})</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-xs bg-amber-300"></span>
            <span className="text-slate-600">Maintenance</span>
          </div>
        </div>

        {/* Interactive Slots Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 pt-2">
          {availability?.slots?.map((slot) => {
            const isAvail = slot.available;
            const isPassed = slot.isPassed || slot.status === 'PASSED';
            return (
              <button
                key={slot.timeSlot}
                disabled={!isAvail}
                onClick={() => handleSlotClick(slot)}
                title={isPassed ? `${slot.timeSlot} has already passed` : isAvail ? `Click to reserve ${slot.timeSlot}` : undefined}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isAvail
                    ? 'border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 hover:border-emerald-300 text-emerald-900 cursor-pointer shadow-2xs'
                    : isPassed
                    ? 'border-slate-200 bg-slate-100/60 text-slate-400 cursor-not-allowed opacity-50'
                    : slot.status === 'MAINTENANCE'
                    ? 'border-amber-200 bg-amber-50 text-amber-800 cursor-not-allowed opacity-60'
                    : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span className={`block text-xs font-bold ${isPassed ? 'line-through text-slate-400' : ''}`}>{slot.timeSlot}</span>
                <span className="block text-[10px] mt-0.5 font-medium uppercase tracking-wider">
                  {slot.status}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        resource={resource}
        initialDate={date}
        initialStartTime={selectedSlotTime}
        onBookingSuccess={(booking) => {
          setSuccessBanner(`Reservation confirmed for ${booking.resourceName} (${booking.startTime}-${booking.endTime})!`);
          fetchResourceAndAvailability();
        }}
      />
    </div>
  );
}
