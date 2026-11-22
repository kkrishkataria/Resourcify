import React, { useState, useEffect } from 'react';
import { Lock, Clock, CheckCircle2, LogOut } from 'lucide-react';

/**
 * Formats milliseconds into human-readable countdown string.
 * Examples:
 * - 2h 15m 30s
 * - 14m 22s
 * - 08s
 * - 2d 4h
 */
export function formatCountdown(diffMs) {
  if (diffMs <= 0) return '00:00';
  
  const totalSeconds = Math.floor(diffMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);

  const secs = totalSeconds % 60;
  const mins = totalMinutes % 60;
  const hrs = totalHours % 24;

  if (days > 0) {
    return `${days}d ${hrs}h ${mins}m`;
  }
  if (totalHours > 0) {
    return `${String(totalHours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function CheckInTimerButton({
  booking,
  onCheckIn,
  onCheckOut,
  actionLoading,
  showNotice = true,
  className = '',
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // 1-second interval live ticking timer
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!booking) return null;

  // Calculate session start timestamp in local time
  const [year, month, day] = (booking.date || '').split('-').map(Number);
  const [startH, startM] = (booking.startTime || '00:00').split(':').map(Number);
  const sessionStart = new Date(year, month - 1, day, startH, startM, 0);
  const diffStartMs = sessionStart.getTime() - now.getTime();
  const isLocked = diffStartMs > 0;

  const countdownText = formatCountdown(diffStartMs);

  return (
    <div className={`flex flex-col items-end gap-1.5 ${className}`}>
      <div className="flex items-center space-x-2">
        {booking.status === 'CONFIRMED' && (
          isLocked ? (
            <button
              type="button"
              disabled
              className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs flex items-center space-x-2 cursor-not-allowed shadow-2xs select-none"
              title={`Check-in unlocks exactly at ${booking.startTime} (${countdownText} remaining)`}
            >
              <Lock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>Opens in {countdownText}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onCheckIn(booking.id)}
              disabled={actionLoading === booking.id}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>{actionLoading === booking.id ? 'Verifying...' : 'Check In Now'}</span>
            </button>
          )
        )}

        {booking.status === 'CHECKED_IN' && onCheckOut && (
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
              Checked In at {new Date(booking.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <button
              type="button"
              onClick={() => onCheckOut(booking.id)}
              disabled={actionLoading === booking.id}
              style={{ backgroundColor: '#8B1E2D' }}
              className="px-4 py-2 rounded-xl bg-thapar-800 hover:bg-thapar-900 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5 text-white" />
              <span>{actionLoading === booking.id ? 'Checking Out...' : 'Check Out Now'}</span>
            </button>
          </div>
        )}
      </div>

      {showNotice && booking.status === 'CONFIRMED' && (
        <div className="pt-0.5">
          {isLocked ? (
            <div className="flex items-center space-x-1.5 text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                Live Timer: <strong className="font-mono font-bold text-amber-950">{countdownText}</strong> left until {booking.startTime}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-[11px] text-emerald-700 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Check-in is live & open now!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
