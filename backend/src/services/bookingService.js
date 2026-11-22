import { v4 as uuidv4 } from 'uuid';
import { bookingRepository } from '../repositories/bookingRepository.js';
import { resourceService } from './resourceService.js';
import { conflictService } from './conflictService.js';
import { notificationService } from './notificationService.js';
import {
  isValid30MinBoundary,
  timeToMinutes,
  isWithinOperatingHours,
  calculateCheckInDeadline,
} from '../utils/timeSlots.js';
import { config } from '../config/aws.js';

export class BookingService {
  async getBookings(user, query = {}) {
    const userRole = (user.role || '').toUpperCase();
    if (userRole === 'ADMIN') {
      if (query.userId) {
        return bookingRepository.getByUserId(query.userId);
      }
      if (query.resourceId) {
        return bookingRepository.getByResourceId(query.resourceId);
      }
      if (query.date) {
        return bookingRepository.getByDate(query.date);
      }
      return bookingRepository.getAll();
    }
    // Students and faculty see their own bookings
    return bookingRepository.getByUserId(user.id);
  }

  async getBookingById(id, user) {
    const booking = await bookingRepository.getById(id);
    if (!booking) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      throw err;
    }

    const userRole = (user.role || '').toUpperCase();
    if (userRole !== 'ADMIN' && booking.userId !== user.id) {
      const err = new Error('Access denied: You can only view your own bookings');
      err.statusCode = 403;
      throw err;
    }

    return booking;
  }

  async createBooking(data, user) {
    const { resourceId, date, startTime, endTime, purpose, attendeesCount } = data;

    // 1. Time validations
    if (!isValid30MinBoundary(startTime) || !isValid30MinBoundary(endTime)) {
      const err = new Error('Start and end times must be on 30-minute intervals (e.g. 09:00, 09:30)');
      err.statusCode = 400;
      throw err;
    }

    const durationMin = timeToMinutes(endTime) - timeToMinutes(startTime);
    if (durationMin <= 0) {
      const err = new Error('End time must be after start time');
      err.statusCode = 400;
      throw err;
    }

    // 2. Resource validation
    const resource = await resourceService.getResourceById(resourceId);
    if (resource.status !== 'ACTIVE') {
      const err = new Error(`Resource '${resource.name}' is currently unavailable (${resource.status})`);
      err.statusCode = 400;
      throw err;
    }

    if (!isWithinOperatingHours(startTime, endTime, resource.operatingHours)) {
      const err = new Error(
        `Requested booking (${startTime}-${endTime}) is outside resource operating hours (${resource.operatingHours.start}-${resource.operatingHours.end})`
      );
      err.statusCode = 400;
      throw err;
    }

    if (durationMin < resource.minBookingDuration) {
      const err = new Error(`Minimum booking duration for this resource is ${resource.minBookingDuration} minutes`);
      err.statusCode = 400;
      throw err;
    }

    if (durationMin > resource.maxBookingDuration) {
      const err = new Error(`Maximum booking duration for this resource is ${resource.maxBookingDuration} minutes`);
      err.statusCode = 400;
      throw err;
    }

    const attendees = Number(attendeesCount) || 1;
    if (attendees > resource.capacity) {
      const err = new Error(`Attendees (${attendees}) exceed resource capacity (${resource.capacity})`);
      err.statusCode = 400;
      throw err;
    }

    // 3. Prepare Booking Item
    const bookingId = `book-${uuidv4()}`;
    const checkInDeadline = calculateCheckInDeadline(date, startTime, config.booking.checkInGracePeriodMinutes);

    const bookingPayload = {
      id: bookingId,
      resourceId: resource.id,
      resourceName: resource.name,
      resourceCategory: resource.category,
      userId: user.id,
      userName: user.name || 'Campus Member',
      userEmail: user.email || `${user.id}@campusslot.edu`,
      userRole: (user.role || 'STUDENT').toUpperCase(),
      date,
      startTime,
      endTime,
      purpose: purpose || 'Academic study session',
      attendeesCount: attendees,
      status: 'CONFIRMED',
      checkInDeadline,
    };

    // 4. Atomically acquire slot locks and save booking in DynamoDB TransactWriteItems
    const createdBooking = await conflictService.createBookingWithAtomicLocks(bookingPayload);

    // 5. Notify via SNS
    notificationService.notifyBookingEvent('BOOKING_CONFIRMED', createdBooking).catch(() => {});

    return createdBooking;
  }

  async cancelBooking(id, user, reason = 'Cancelled by user') {
    const booking = await bookingRepository.getById(id);
    if (!booking) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      throw err;
    }

    const userRole = (user.role || '').toUpperCase();
    if (userRole !== 'ADMIN' && booking.userId !== user.id) {
      const err = new Error('Access denied: You can only cancel your own bookings');
      err.statusCode = 403;
      throw err;
    }

    if (booking.status === 'CANCELLED') {
      const err = new Error('Booking is already cancelled');
      err.statusCode = 400;
      throw err;
    }

    if (booking.status === 'COMPLETED' || booking.status === 'NO_SHOW') {
      const err = new Error(`Cannot cancel a booking with status ${booking.status}`);
      err.statusCode = 400;
      throw err;
    }

    // Atomically delete slot locks and mark CANCELLED
    const cancelledBooking = await conflictService.releaseBookingSlotLocks(booking, 'CANCELLED', {
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason,
    });

    notificationService.notifyBookingEvent('BOOKING_CANCELLED', cancelledBooking).catch(() => {});

    return cancelledBooking;
  }
}

export const bookingService = new BookingService();
