import { getDbAdapter } from './dbAdapter.js';
import { config } from '../config/aws.js';

export class ResourceRepository {
  get db() {
    return getDbAdapter();
  }
  get tableName() {
    return config.aws.tables.resources;
  }

  async getById(id) {
    return this.db.get(this.tableName, { id });
  }

  async getAll() {
    return this.db.scan(this.tableName);
  }

  async findByFilters(filters = {}) {
    const all = await this.getAll();
    return all.filter((r) => {
      if (filters.category && r.category !== filters.category) return false;
      if (filters.minCapacity && r.capacity < filters.minCapacity) return false;
      if (filters.status && r.status !== filters.status) return false;
      if (filters.equipment && filters.equipment.length > 0) {
        const hasAllReq = filters.equipment.every((eq) =>
          r.equipment && r.equipment.some((item) => item.toLowerCase().includes(eq.toLowerCase()))
        );
        if (!hasAllReq) return false;
      }
      return true;
    });
  }

  async save(resource) {
    await this.db.put(this.tableName, resource);
    return resource;
  }

  async update(id, updates) {
    const existing = await this.getById(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await this.db.put(this.tableName, updated);
    return updated;
  }

  async delete(id) {
    await this.db.delete(this.tableName, { id });
  }
}

export const resourceRepository = new ResourceRepository();
