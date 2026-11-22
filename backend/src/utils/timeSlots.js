export const SLOT_DURATION_MINUTES = 30;

/**
 * Validates whether a time string is formatted as HH:MM on 30-min boundaries.
 */
export function isValid30MinBoundary(time) {
  if (!time || typeof time !== 'string') return false;
  return /^([0-1][0-9]|2[0-3]):(00|30)$/.test(time);
}

/**
 * Converts "HH:MM" into total minutes from midnight.
 */
export function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Converts total minutes from midnight to "HH:MM".
 */
export function minutesToTime(totalMinutes) {
  const normalized = Math.max(0, Math.min(24 * 60 - 1, totalMinutes));
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Generates an array of 30-minute slot strings between startTime and endTime.
 * Example: ("09:00", "10:30") -> ["09:00", "09:30", "10:00"]
 */
export function generateTimeSlots(startTime, endTime) {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  if (startMin >= endMin) {
    throw new Error('Start time must be strictly before end time');
  }

  const slots = [];
  for (let m = startMin; m < endMin; m += SLOT_DURATION_MINUTES) {
    slots.push(minutesToTime(m));
  }
  return slots;
}

/**
 * Creates a unique slot lock key for DynamoDB.
 * Format: "${resourceId}#${date}#${timeSlot}"
 */
export function createSlotLockKey(resourceId, date, timeSlot) {
  return `${resourceId}#${date}#${timeSlot}`;
}

/**
 * Checks if a booking time window falls completely within operating hours.
 */
export function isWithinOperatingHours(startTime, endTime, operatingHours) {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const opStartMin = timeToMinutes(operatingHours.start);
  const opEndMin = timeToMinutes(operatingHours.end);

  return startMin >= opStartMin && endMin <= opEndMin;
}

/**
 * Computes the session start time ISO string for a booking date and startTime.
 */
export function calculateSessionStartTime(date, startTime) {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = startTime.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0).toISOString();
}

/**
 * Computes the check-in deadline ISO string:
 * Starts at the booking start time on the given date + gracePeriodMinutes.
 */
export function calculateCheckInDeadline(date, startTime, gracePeriodMinutes = 15) {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = startTime.split(':').map(Number);
  
  const startDateTime = new Date(year, month - 1, day, hours, minutes, 0);
  const deadlineDateTime = new Date(startDateTime.getTime() + gracePeriodMinutes * 60 * 1000);
  return deadlineDateTime.toISOString();
}

/**
 * Returns all standard 30-minute slots in an operating window.
 */
export function getAllDaySlots(start = '08:00', end = '22:00') {
  return generateTimeSlots(start, end);
}
