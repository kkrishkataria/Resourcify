import { getDbAdapter } from './dbAdapter.js';
import { config } from '../config/aws.js';

export class BookingRepository {
  get db() {
    return getDbAdapter();
  }
  get tableName() {
    return config.aws.tables.bookings;
  }

  async getById(id) {
    return this.db.get(this.tableName, { id });
  }

  async getAll() {
    return this.db.scan(this.tableName);
  }

  async getByUserId(userId) {
    const all = await this.getAll();
    return all.filter((b) => b.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getByResourceId(resourceId) {
    const all = await this.getAll();
    return all.filter((b) => b.resourceId === resourceId);
  }

  async getByDate(date) {
    const all = await this.getAll();
    return all.filter((b) => b.date === date);
  }

  async getActiveBookingsForResourceAndDate(resourceId, date) {
    const all = await this.getAll();
    return all.filter(
      (b) =>
        b.resourceId === resourceId &&
        b.date === date &&
        (b.status === 'CONFIRMED' || b.status === 'CHECKED_IN')
    );
  }

  async save(booking) {
    await this.db.put(this.tableName, booking);
    return booking;
  }

  async updateStatus(id, status, metadata = {}) {
    const existing = await this.getById(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      status,
      ...metadata,
      updatedAt: new Date().toISOString(),
    };

    await this.db.put(this.tableName, updated);
    return updated;
  }
}

export const bookingRepository = new BookingRepository();
