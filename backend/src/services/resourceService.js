import { resourceRepository } from '../repositories/resourceRepository.js';
import { slotLockRepository } from '../repositories/slotLockRepository.js';
import { getAllDaySlots, createSlotLockKey, isWithinOperatingHours, isSlotInPast } from '../utils/timeSlots.js';
import { v4 as uuidv4 } from 'uuid';

export class ResourceService {
  async getAllResources(filters = {}) {
    return resourceRepository.findByFilters(filters);
  }

  async getResourceById(id) {
    const resource = await resourceRepository.getById(id);
    if (!resource) {
      const err = new Error('Resource not found');
      err.statusCode = 404;
      throw err;
    }
    return resource;
  }

  async createResource(data) {
    const now = new Date().toISOString();
    const resource = {
      id: `res-${uuidv4().slice(0, 8)}`,
      name: data.name,
      category: data.category,
      building: data.building,
      floor: Number(data.floor) || 1,
      roomNumber: data.roomNumber,
      capacity: Number(data.capacity),
      equipment: Array.isArray(data.equipment) ? data.equipment : [],
      status: data.status || 'ACTIVE',
      operatingHours: data.operatingHours || { start: '08:00', end: '22:00' },
      minBookingDuration: Number(data.minBookingDuration) || 30,
      maxBookingDuration: Number(data.maxBookingDuration) || 240,
      imageUrl: data.imageUrl || '',
      description: data.description || '',
      createdAt: now,
      updatedAt: now,
    };
    return resourceRepository.save(resource);
  }

  async updateResource(id, updates) {
    await this.getResourceById(id);
    return resourceRepository.update(id, updates);
  }

  async deleteResource(id) {
    await this.getResourceById(id);
    return resourceRepository.delete(id);
  }

  /**
   * Calculates slot-by-slot availability for a resource on a given date.
   */
  async getAvailability(resourceId, date) {
    const resource = await this.getResourceById(resourceId);
    const locks = await slotLockRepository.getLocksForResourceAndDate(resourceId, date);
    const lockedSlotTimes = new Set(locks.map((l) => l.timeSlot));

    const daySlots = getAllDaySlots(resource.operatingHours.start, resource.operatingHours.end);

    const slotDetails = daySlots.map((timeSlot) => {
      const isOccupied = lockedSlotTimes.has(timeSlot);
      const isPassed = isSlotInPast(date, timeSlot);

      let status = 'AVAILABLE';
      if (resource.status !== 'ACTIVE') {
        status = 'MAINTENANCE';
      } else if (isOccupied) {
        status = 'BOOKED';
      } else if (isPassed) {
        status = 'PASSED';
      }

      return {
        timeSlot,
        available: !isOccupied && !isPassed && resource.status === 'ACTIVE',
        isPassed,
        status,
      };
    });

    const totalSlots = slotDetails.length;
    const availableSlots = slotDetails.filter((s) => s.available).length;
    const passedSlots = slotDetails.filter((s) => s.isPassed).length;
    const bookedSlots = slotDetails.filter((s) => s.status === 'BOOKED').length;

    return {
      resource,
      date,
      operatingHours: resource.operatingHours,
      totalSlots,
      availableSlots,
      bookedSlots,
      passedSlots,
      utilizationRate: totalSlots > 0 ? Math.round(((bookedSlots) / totalSlots) * 100) : 0,
      slots: slotDetails,
    };
  }
}

export const resourceService = new ResourceService();
