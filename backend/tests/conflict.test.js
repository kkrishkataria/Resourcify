import { describe, it, expect, beforeEach } from '@jest/globals';
import { bookingService } from '../src/services/bookingService.js';
import { resourceRepository } from '../src/repositories/resourceRepository.js';
import { getDbAdapter } from '../src/repositories/dbAdapter.js';

describe('Conflict Detection & Atomic Slot Lock Transactions', () => {
  const testUser1 = { id: 'user-01', name: 'Alice Student', email: 'alice@campusslot.edu', role: 'STUDENT' };
  const testUser2 = { id: 'user-02', name: 'Bob Faculty', email: 'bob@campusslot.edu', role: 'FACULTY' };

  beforeEach(async () => {
    const db = getDbAdapter();
    if (db.clearAll) await db.clearAll();

    // Create a test resource
    await resourceRepository.save({
      id: 'res-test-conflict',
      name: 'Conflict Test Lab',
      category: 'COMPUTER_LAB',
      building: 'Engineering Hall',
      floor: 1,
      roomNumber: '101',
      capacity: 30,
      equipment: ['Computers'],
      status: 'ACTIVE',
      operatingHours: { start: '08:00', end: '20:00' },
      minBookingDuration: 30,
      maxBookingDuration: 180,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  it('should successfully book a non-conflicting time slot', async () => {
    const booking = await bookingService.createBooking(
      {
        resourceId: 'res-test-conflict',
        date: '2026-11-25',
        startTime: '09:00',
        endTime: '10:30',
        purpose: 'Project Work',
      },
      testUser1
    );

    expect(booking).toBeDefined();
    expect(booking.id).toBeDefined();
    expect(booking.status).toBe('CONFIRMED');
    expect(booking.slotKeys).toHaveLength(3); // 09:00, 09:30, 10:00
  });

  it('should fail with SLOT_CONFLICT when another user requests an overlapping slot', async () => {
    // First booking: 09:00 to 10:30
    await bookingService.createBooking(
      {
        resourceId: 'res-test-conflict',
        date: '2026-11-25',
        startTime: '09:00',
        endTime: '10:30',
        purpose: 'First Session',
      },
      testUser1
    );

    // Second booking: 10:00 to 11:00 (overlaps on 10:00-10:30)
    await expect(
      bookingService.createBooking(
        {
          resourceId: 'res-test-conflict',
          date: '2026-11-25',
          startTime: '10:00',
          endTime: '11:00',
          purpose: 'Overlapping Session',
        },
        testUser2
      )
    ).rejects.toThrow(/already booked/);
  });

  it('should allow adjacent bookings that touch boundary (e.g. 09:00-10:00 and 10:00-11:00)', async () => {
    const b1 = await bookingService.createBooking(
      {
        resourceId: 'res-test-conflict',
        date: '2026-11-25',
        startTime: '09:00',
        endTime: '10:00',
        purpose: 'Morning session',
      },
      testUser1
    );

    const b2 = await bookingService.createBooking(
      {
        resourceId: 'res-test-conflict',
        date: '2026-11-25',
        startTime: '10:00',
        endTime: '11:00',
        purpose: 'Next session',
      },
      testUser2
    );

    expect(b1.status).toBe('CONFIRMED');
    expect(b2.status).toBe('CONFIRMED');
  });

  it('should reject bookings outside operating hours', async () => {
    await expect(
      bookingService.createBooking(
        {
          resourceId: 'res-test-conflict',
          date: '2026-11-25',
          startTime: '07:00', // Operating starts at 08:00
          endTime: '08:30',
          purpose: 'Early test',
        },
        testUser1
      )
    ).rejects.toThrow(/outside resource operating hours/);
  });
});
