import { getDbAdapter } from './dbAdapter.js';
import { config } from '../config/aws.js';

export class UserRepository {
  get db() {
    return getDbAdapter();
  }
  get tableName() {
    return config.aws.tables.users;
  }

  async getById(id) {
    return this.db.get(this.tableName, { id });
  }

  async getByEmail(email) {
    const all = await this.db.scan(this.tableName);
    return all.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async getAll() {
    return this.db.scan(this.tableName);
  }

  async save(user) {
    await this.db.put(this.tableName, user);
    return user;
  }
}

export const userRepository = new UserRepository();
