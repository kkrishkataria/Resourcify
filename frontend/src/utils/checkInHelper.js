/**
 * Calculates whether check-in is currently open or locked for a given booking.
 * 
 * Rules:
 * 1. Check-in is ONLY allowed on the scheduled date of the booking.
 * 2. On that day, check-in is strictly LOCKED before the scheduled startTime.
 * 3. Check-in unlocks at startTime and remains open until check-in deadline or session end.
 */
export function getCheckInLockState(booking) {
  if (!booking) return { isLocked: true, canCheckIn: false, label: 'Locked' };
  
  if (booking.status !== 'CONFIRMED') {
    return {
      isLocked: false,
      canCheckIn: false,
      label: booking.status,
      status: booking.status,
    };
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentDate = String(now.getDate()).padStart(2, '0');
  const todayStr = `${currentYear}-${currentMonth}-${currentDate}`;

  // 1. Future day check: locked until reservation day
  if (booking.date > todayStr) {
    return {
      isLocked: true,
      canCheckIn: false,
      reason: `Check-in is locked until reservation date (${booking.date})`,
      badgeLabel: `🔒 Locked until ${booking.date}`,
      buttonLabel: `Locked (Opens ${booking.date})`,
      isFutureDay: true,
    };
  }

  // 2. Past day check
  if (booking.date < todayStr) {
    return {
      isLocked: true,
      canCheckIn: false,
      reason: 'Reservation date has passed',
      badgeLabel: '🔒 Expired',
      buttonLabel: 'Expired',
      isPastDay: true,
    };
  }

  // 3. Same day: compare current wall-clock minutes against session start time
  const [startH, startM] = (booking.startTime || '00:00').split(':').map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;

  if (currentMinutes < startMinutes) {
    const minsRemaining = startMinutes - currentMinutes;
    return {
      isLocked: true,
      canCheckIn: false,
      reason: `Check-in is locked until session start time (${booking.startTime})`,
      badgeLabel: `🔒 Locked until ${booking.startTime}`,
      buttonLabel: `Locked (Opens at ${booking.startTime})`,
      minutesRemaining: minsRemaining,
      isBeforeStart: true,
    };
  }

  // 4. Current time has reached or passed start time: UNLOCKED!
  return {
    isLocked: false,
    canCheckIn: true,
    reason: `Check-in is currently open (started at ${booking.startTime})`,
    badgeLabel: '✓ Open for Check-In',
    buttonLabel: 'Check In',
    isBeforeStart: false,
  };
}
