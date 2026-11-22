import { bookingService } from '../services/bookingService.js';
import { checkInService } from '../services/checkinService.js';

export class BookingController {
  async getAll(req, res, next) {
    try {
      const bookings = await bookingService.getBookings(req.user, req.query);
      res.json({ success: true, count: bookings.length, data: bookings });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const booking = await bookingService.getBookingById(req.params.id, req.user);
      res.json({ success: true, data: booking });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const { resourceId, date, startTime, endTime, purpose, attendeesCount } = req.body;
      if (!resourceId || !date || !startTime || !endTime) {
        return res.status(400).json({
          success: false,
          error: 'resourceId, date, startTime, and endTime are required fields',
        });
      }

      const booking = await bookingService.createBooking(
        { resourceId, date, startTime, endTime, purpose, attendeesCount },
        req.user
      );

      res.status(201).json({ success: true, data: booking });
    } catch (err) {
      next(err);
    }
  }

  async cancel(req, res, next) {
    try {
      const reason = req.body.reason || req.query.reason || 'Cancelled by user';
      const cancelled = await bookingService.cancelBooking(req.params.id, req.user, reason);
      res.json({ success: true, message: 'Booking cancelled successfully', data: cancelled });
    } catch (err) {
      next(err);
    }
  }

  async checkIn(req, res, next) {
    try {
      const result = await checkInService.checkIn(req.params.id, req.user);
      res.json({ success: true, data: result.booking, message: result.message });
    } catch (err) {
      next(err);
    }
  }

  async checkOut(req, res, next) {
    try {
      const result = await checkInService.checkOut(req.params.id, req.user);
      res.json({ success: true, data: result.booking, message: result.message });
    } catch (err) {
      next(err);
    }
  }
}

export const bookingController = new BookingController();
