import { describe, it, expect, beforeEach } from '@jest/globals';
import { bookingService } from '../src/services/bookingService.js';
import { checkInService } from '../src/services/checkinService.js';
import { resourceRepository } from '../src/repositories/resourceRepository.js';
import { bookingRepository } from '../src/repositories/bookingRepository.js';
import { slotLockRepository } from '../src/repositories/slotLockRepository.js';
import { getDbAdapter } from '../src/repositories/dbAdapter.js';

describe('Check-In and Auto-Release System', () => {
  const user = { id: 'checkin-user', name: 'Eva', email: 'eva@campusslot.edu', role: 'STUDENT' };

  beforeEach(async () => {
    const db = getDbAdapter();
    if (db.clearAll) await db.clearAll();

    await resourceRepository.save({
      id: 'res-checkin-test',
      name: 'Checkin Testing Pod',
      category: 'STUDY_ROOM',
      building: 'Library',
      floor: 1,
      roomNumber: 'Pod 1',
      capacity: 4,
      equipment: ['Whiteboard'],
      status: 'ACTIVE',
      operatingHours: { start: '08:00', end: '22:00' },
      minBookingDuration: 30,
      maxBookingDuration: 180,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  it('should successfully check in a confirmed booking before deadline', async () => {
    const booking = await bookingService.createBooking(
      {
        resourceId: 'res-checkin-test',
        date: '2026-11-29',
        startTime: '16:00',
        endTime: '17:00',
        purpose: 'Revision session',
      },
      user
    );

    // Active check-in window (session started, deadline in future)
    await bookingRepository.updateStatus(booking.id, 'CONFIRMED', {
      checkInOpensAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      checkInDeadline: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

    const result = await checkInService.checkIn(booking.id, user);
    expect(result.success).toBe(true);
    expect(result.booking.status).toBe('CHECKED_IN');
    expect(result.booking.checkedInAt).toBeDefined();
  });

  it('should reject check-in and remain locked if current time is before session start time', async () => {
    const booking = await bookingService.createBooking(
      {
        resourceId: 'res-checkin-test',
        date: '2026-11-29',
        startTime: '18:00',
        endTime: '19:00',
        purpose: 'Future locked session',
      },
      user
    );

    // Set checkInOpensAt in future
    await bookingRepository.updateStatus(booking.id, 'CONFIRMED', {
      checkInOpensAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

    await expect(checkInService.checkIn(booking.id, user)).rejects.toThrow(/locked until session start time/i);
  });

  it('should successfully check out a checked-in booking, mark it COMPLETED, and release slot locks', async () => {
    const booking = await bookingService.createBooking(
      {
        resourceId: 'res-checkin-test',
        date: '2026-11-29',
        startTime: '16:00',
        endTime: '17:00',
        purpose: 'Revision session before checkout',
      },
      user
    );

    // Check in first
    await bookingRepository.updateStatus(booking.id, 'CONFIRMED', {
      checkInOpensAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      checkInDeadline: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
    await checkInService.checkIn(booking.id, user);

    // Verify slots are occupied
    let locks = await slotLockRepository.getLocksForResourceAndDate('res-checkin-test', '2026-11-29');
    expect(locks.length).toBeGreaterThan(0);

    // Check out
    const outResult = await checkInService.checkOut(booking.id, user);
    expect(outResult.success).toBe(true);
    expect(outResult.booking.status).toBe('COMPLETED');
    expect(outResult.booking.checkedOutAt).toBeDefined();

    // Verify slot locks were released in database
    locks = await slotLockRepository.getLocksForResourceAndDate('res-checkin-test', '2026-11-29');
    expect(locks).toHaveLength(0);
  });

  it('should auto-release slot locks when scheduled process runs for expired bookings', async () => {
    const booking = await bookingService.createBooking(
      {
        resourceId: 'res-checkin-test',
        date: '2026-11-29',
        startTime: '10:00',
        endTime: '11:00',
        purpose: 'Expired session',
      },
      user
    );

    // Set deadline in the past to simulate missed check-in
    await bookingRepository.updateStatus(booking.id, 'CONFIRMED', {
      checkInDeadline: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    });

    // Run scheduled auto-release engine
    const releaseReport = await checkInService.processExpiredBookings();

    expect(releaseReport.processedCount).toBe(1);
    expect(releaseReport.releasedBookings[0].bookingId).toBe(booking.id);

    // Verify booking is now marked NO_SHOW
    const updated = await bookingRepository.getById(booking.id);
    expect(updated.status).toBe('NO_SHOW');

    // Verify slot locks were freed in DynamoDB / database
    const locks = await slotLockRepository.getLocksForResourceAndDate('res-checkin-test', '2026-11-29');
    expect(locks).toHaveLength(0);

    // Verify another user can now book that exact time slot!
    const newBooking = await bookingService.createBooking(
      {
        resourceId: 'res-checkin-test',
        date: '2026-11-29',
        startTime: '10:00',
        endTime: '11:00',
        purpose: 'Recovered Slot Booking',
      },
      { id: 'user-replacement', name: 'Frank', email: 'frank@campusslot.edu', role: 'STUDENT' }
    );
    expect(newBooking.status).toBe('CONFIRMED');
  });
});
