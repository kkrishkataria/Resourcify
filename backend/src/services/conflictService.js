import { getDbAdapter } from '../repositories/dbAdapter.js';
import { config } from '../config/aws.js';
import { createSlotLockKey, generateTimeSlots } from '../utils/timeSlots.js';

export class ConflictService {
  get db() {
    return getDbAdapter();
  }

  /**
   * Atomically acquires slot locks and creates the booking in a single TransactWriteItems call.
   * If any slot lock already exists, DynamoDB cancels the entire transaction.
   * 
   * @param {Object} booking - Booking payload
   * @returns {Promise<Object>} Created booking
   */
  async createBookingWithAtomicLocks(booking) {
    const timeSlots = generateTimeSlots(booking.startTime, booking.endTime);
    const lockKeys = timeSlots.map((slot) => createSlotLockKey(booking.resourceId, booking.date, slot));

    const ttlTimestamp = Math.floor(new Date(`${booking.date}T${booking.endTime}:00Z`).getTime() / 1000) + 86400; // +24h TTL
    const nowIso = new Date().toISOString();

    // Prepare TransactWrite actions
    const actions = [];

    // 1. Conditional Put for each 30-min slot lock
    for (const slot of timeSlots) {
      const lockKey = createSlotLockKey(booking.resourceId, booking.date, slot);
      actions.push({
        Put: {
          TableName: config.aws.tables.slotLocks,
          Item: {
            lockKey,
            bookingId: booking.id,
            resourceId: booking.resourceId,
            date: booking.date,
            timeSlot: slot,
            userId: booking.userId,
            expiresAt: ttlTimestamp,
            createdAt: nowIso,
          },
          ConditionExpression: 'attribute_not_exists(lockKey)',
        },
      });
    }

    // 2. Put the Booking item in the same atomic transaction
    const bookingItem = {
      ...booking,
      slotKeys: lockKeys,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    actions.push({
      Put: {
        TableName: config.aws.tables.bookings,
        Item: bookingItem,
        ConditionExpression: 'attribute_not_exists(id)',
      },
    });

    try {
      await this.db.transactWrite(actions);
      return bookingItem;
    } catch (err) {
      if (
        err.name === 'TransactionCanceledException' ||
        err.name === 'ConditionalCheckFailedException' ||
        (err.message && err.message.includes('ConditionalCheckFailed'))
      ) {
        const conflictErr = new Error('One or more requested time slots are already booked. Please choose another time or resource.');
        conflictErr.code = 'SLOT_CONFLICT';
        conflictErr.statusCode = 409;
        conflictErr.conflictedSlots = timeSlots;
        throw conflictErr;
      }
      throw err;
    }
  }

  /**
   * Atomically releases slot locks and updates/cancels the booking.
   * 
   * @param {Object} booking - Existing booking
   * @param {string} newStatus - New status ('CANCELLED' or 'NO_SHOW')
   * @param {Object} metadata - Optional extra fields (cancelledAt, cancellationReason, etc.)
   */
  async releaseBookingSlotLocks(booking, newStatus, metadata = {}) {
    const actions = [];
    const nowIso = new Date().toISOString();

    // Delete all slot locks
    for (const lockKey of (booking.slotKeys || [])) {
      actions.push({
        Delete: {
          TableName: config.aws.tables.slotLocks,
          Key: { lockKey },
        },
      });
    }

    // Update the booking status
    const updatedBooking = {
      ...booking,
      status: newStatus,
      ...metadata,
      updatedAt: nowIso,
    };

    actions.push({
      Put: {
        TableName: config.aws.tables.bookings,
        Item: updatedBooking,
      },
    });

    await this.db.transactWrite(actions);
    return updatedBooking;
  }
}

export const conflictService = new ConflictService();
