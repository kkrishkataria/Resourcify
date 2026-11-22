import { getDbAdapter } from './dbAdapter.js';
import { config } from '../config/aws.js';

export class SlotLockRepository {
  get db() {
    return getDbAdapter();
  }
  get tableName() {
    return config.aws.tables.slotLocks;
  }

  async getByLockKey(lockKey) {
    return this.db.get(this.tableName, { lockKey });
  }

  async getLocksForResourceAndDate(resourceId, date) {
    const allLocks = await this.db.scan(this.tableName);
    return allLocks.filter((l) => l.resourceId === resourceId && l.date === date);
  }

  async getLocksForDate(date) {
    const allLocks = await this.db.scan(this.tableName);
    return allLocks.filter((l) => l.date === date);
  }

  async getAllLocks() {
    return this.db.scan(this.tableName);
  }

  async deleteByLockKey(lockKey) {
    await this.db.delete(this.tableName, { lockKey });
  }
}

export const slotLockRepository = new SlotLockRepository();
