import { bookingRepository } from '../repositories/bookingRepository.js';
import { conflictService } from './conflictService.js';
import { notificationService } from './notificationService.js';

export class CheckInService {
  /**
   * Checks in a user for their confirmed booking.
   * Can be performed up until checkInDeadline.
   */
  async checkIn(bookingId, user) {
    const booking = await bookingRepository.getById(bookingId);
    if (!booking) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      throw err;
    }

    const userRole = (user.role || '').toUpperCase();
    if (userRole !== 'ADMIN' && booking.userId !== user.id) {
      const err = new Error('Access denied: You can only check in to your own booking');
      err.statusCode = 403;
      throw err;
    }

    if (booking.status === 'CHECKED_IN') {
      return {
        alreadyCheckedIn: true,
        booking,
        message: 'Booking is already checked in.',
      };
    }

    if (booking.status !== 'CONFIRMED') {
      const err = new Error(`Cannot check in for a booking with status '${booking.status}'`);
      err.statusCode = 400;
      throw err;
    }

    const now = new Date();

    // Check if session start time has arrived (check-in is locked before start time)
    let opensAt;
    if (booking.checkInOpensAt) {
      opensAt = new Date(booking.checkInOpensAt);
    } else {
      const [year, month, day] = booking.date.split('-').map(Number);
      const [hours, minutes] = booking.startTime.split(':').map(Number);
      opensAt = new Date(year, month - 1, day, hours, minutes, 0);
    }

    // Exact second comparison (with 1s margin for network latency)
    if (now.getTime() < opensAt.getTime() - 1000) {
      const err = new Error(`Check-in is locked until session start time (${booking.startTime}). Please check in when your reservation begins.`);
      err.statusCode = 400;
      err.code = 'CHECKIN_LOCKED_BEFORE_START';
      throw err;
    }

    const deadline = new Date(booking.checkInDeadline);

    if (now.getTime() > deadline.getTime()) {
      // Grace period expired: auto-release
      const released = await conflictService.releaseBookingSlotLocks(booking, 'NO_SHOW', {
        cancellationReason: 'Missed check-in grace period deadline',
      });
      notificationService.notifyBookingEvent('BOOKING_NO_SHOW', released).catch(() => {});

      const err = new Error('Check-in window has expired. The reservation has been released for other users.');
      err.statusCode = 400;
      err.code = 'CHECKIN_EXPIRED';
      throw err;
    }

    const checkedInBooking = await bookingRepository.updateStatus(bookingId, 'CHECKED_IN', {
      checkedInAt: now.toISOString(),
    });

    notificationService.notifyBookingEvent('BOOKING_CHECKED_IN', checkedInBooking).catch(() => {});

    return {
      success: true,
      booking: checkedInBooking,
      message: `Successfully checked in for ${booking.resourceName}!`,
    };
  }

  /**
   * Checks out a user from their active checked-in booking.
   * Marks the booking as COMPLETED and atomically releases all associated slot locks
   * so remaining time slots become immediately available for other campus members.
   */
  async checkOut(bookingId, user) {
    const booking = await bookingRepository.getById(bookingId);
    if (!booking) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      throw err;
    }

    const userRole = (user.role || '').toUpperCase();
    if (userRole !== 'ADMIN' && booking.userId !== user.id) {
      const err = new Error('Access denied: You can only check out of your own booking');
      err.statusCode = 403;
      throw err;
    }

    if (booking.status === 'COMPLETED') {
      return {
        alreadyCheckedOut: true,
        booking,
        message: 'Booking is already completed and checked out.',
      };
    }

    if (booking.status !== 'CHECKED_IN') {
      const err = new Error(`Cannot check out for a booking with status '${booking.status}'. Only active checked-in bookings can be checked out.`);
      err.statusCode = 400;
      throw err;
    }

    const now = new Date();
    // Atomically release DynamoDB slot locks and update status to COMPLETED
    const completedBooking = await conflictService.releaseBookingSlotLocks(booking, 'COMPLETED', {
      checkedOutAt: now.toISOString(),
    });

    notificationService.notifyBookingEvent('BOOKING_CHECKED_OUT', completedBooking).catch(() => {});

    return {
      success: true,
      booking: completedBooking,
      message: `Checked out successfully from ${booking.resourceName}! Remaining slots are now available for other students.`,
    };
  }

  /**
   * Background scheduled auto-release engine.
   * Triggered by Amazon EventBridge or scheduled cron.
   * Finds all CONFIRMED bookings whose checkInDeadline has passed,
   * atomically marks them NO_SHOW and releases their DynamoDB slot locks.
   */
  async processExpiredBookings() {
    const allBookings = await bookingRepository.getAll();
    const now = new Date();

    const expired = allBookings.filter((b) => {
      if (b.status !== 'CONFIRMED') return false;
      const deadline = new Date(b.checkInDeadline);
      return now.getTime() > deadline.getTime();
    });

    const results = [];
    for (const booking of expired) {
      try {
        const released = await conflictService.releaseBookingSlotLocks(booking, 'NO_SHOW', {
          cancellationReason: 'Auto-released by CampusSlot schedule: Check-in deadline exceeded',
        });
        notificationService.notifyBookingEvent('BOOKING_NO_SHOW_AUTO_RELEASED', released).catch(() => {});
        results.push({
          bookingId: booking.id,
          resourceId: booking.resourceId,
          releasedSlots: booking.slotKeys?.length || 0,
          status: 'SUCCESS',
        });
      } catch (err) {
        console.error(`[AutoRelease Error] Failed to release booking ${booking.id}:`, err);
        results.push({
          bookingId: booking.id,
          status: 'FAILED',
          error: err.message,
        });
      }
    }

    return {
      processedCount: expired.length,
      releasedBookings: results,
      timestamp: now.toISOString(),
    };
  }
}

export const checkInService = new CheckInService();
