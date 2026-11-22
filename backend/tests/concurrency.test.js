import { describe, it, expect, beforeEach } from '@jest/globals';
import { bookingService } from '../src/services/bookingService.js';
import { resourceRepository } from '../src/repositories/resourceRepository.js';
import { getDbAdapter } from '../src/repositories/dbAdapter.js';

describe('Concurrent Booking Stress Test', () => {
  beforeEach(async () => {
    const db = getDbAdapter();
    if (db.clearAll) await db.clearAll();

    await resourceRepository.save({
      id: 'res-concurrent-room',
      name: 'High Contention Lab',
      category: 'COMPUTER_LAB',
      building: 'Tech Tower',
      floor: 1,
      roomNumber: '101',
      capacity: 30,
      equipment: ['Computers'],
      status: 'ACTIVE',
      operatingHours: { start: '08:00', end: '22:00' },
      minBookingDuration: 30,
      maxBookingDuration: 180,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  it('should handle multiple simultaneous booking requests for the exact same slot with exactly one winner', async () => {
    const numUsers = 10;
    const users = Array.from({ length: numUsers }, (_, i) => ({
      id: `user-concurrent-${i}`,
      name: `User ${i}`,
      email: `user${i}@campusslot.edu`,
      role: 'STUDENT',
    }));

    // Fire 10 concurrent requests at the exact same millisecond for slot 15:00 - 16:00
    const bookingPromises = users.map((user) =>
      bookingService
        .createBooking(
          {
            resourceId: 'res-concurrent-room',
            date: '2026-11-28',
            startTime: '15:00',
            endTime: '16:00',
            purpose: `Contention request from ${user.name}`,
          },
          user
        )
        .then((res) => ({ success: true, user: user.id, booking: res }))
        .catch((err) => ({ success: false, user: user.id, error: err.message }))
    );

    const results = await Promise.all(bookingPromises);

    const successfulBookings = results.filter((r) => r.success);
    const failedBookings = results.filter((r) => !r.success);

    // Exactly one user must win the atomic transaction lock
    expect(successfulBookings).toHaveLength(1);
    // All other 9 attempts must fail gracefully due to slot conflict
    expect(failedBookings).toHaveLength(numUsers - 1);

    for (const fail of failedBookings) {
      expect(fail.error).toMatch(/already booked/);
    }
  });
});
