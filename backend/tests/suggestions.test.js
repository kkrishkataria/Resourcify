import { describe, it, expect, beforeEach } from '@jest/globals';
import { suggestionService } from '../src/services/suggestionService.js';
import { bookingService } from '../src/services/bookingService.js';
import { resourceRepository } from '../src/repositories/resourceRepository.js';
import { getDbAdapter } from '../src/repositories/dbAdapter.js';

describe('Smart Suggestions Engine', () => {
  const user = { id: 'student-suggest', name: 'Dave', email: 'dave@campusslot.edu', role: 'STUDENT' };

  beforeEach(async () => {
    const db = getDbAdapter();
    if (db.clearAll) await db.clearAll();

    // Seed Study Pod A and Study Pod B
    await resourceRepository.save({
      id: 'res-study-pod-a',
      name: 'Study Pod A',
      category: 'STUDY_ROOM',
      building: 'Library',
      floor: 2,
      roomNumber: 'Pod A',
      capacity: 4,
      equipment: ['Display Screen'],
      status: 'ACTIVE',
      operatingHours: { start: '08:00', end: '22:00' },
      minBookingDuration: 30,
      maxBookingDuration: 180,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await resourceRepository.save({
      id: 'res-study-pod-b',
      name: 'Study Pod B',
      category: 'STUDY_ROOM',
      building: 'Library',
      floor: 2,
      roomNumber: 'Pod B',
      capacity: 4,
      equipment: ['Display Screen'],
      status: 'ACTIVE',
      operatingHours: { start: '08:00', end: '22:00' },
      minBookingDuration: 30,
      maxBookingDuration: 180,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Book Pod A from 14:00 to 15:00
    await bookingService.createBooking(
      {
        resourceId: 'res-study-pod-a',
        date: '2026-11-27',
        startTime: '14:00',
        endTime: '15:00',
        purpose: 'Study Group',
      },
      user
    );
  });

  it('should recommend nearby time slots for the same resource or peer resource at the same time', async () => {
    const alternatives = await suggestionService.findAlternatives({
      resourceId: 'res-study-pod-a',
      category: 'STUDY_ROOM',
      capacity: 4,
      durationMinutes: 60,
      date: '2026-11-27',
      preferredTime: '14:00',
    });

    expect(alternatives.length).toBeGreaterThan(0);
    // Peer resource Pod B is completely free at 14:00
    const hasPeerAtSameTime = alternatives.some(
      (alt) => alt.resource.id === 'res-study-pod-b' && alt.startTime === '14:00'
    );
    expect(hasPeerAtSameTime).toBe(true);

    // Pod A has available nearby slots (e.g. 15:00-16:00 or 13:00-14:00)
    const hasSameResourceShifted = alternatives.some((alt) => alt.resource.id === 'res-study-pod-a');
    expect(hasSameResourceShifted).toBe(true);
  });
});
