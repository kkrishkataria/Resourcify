import { describe, it, expect, beforeEach } from '@jest/globals';
import { allocationService } from '../src/services/allocationService.js';
import { resourceRepository } from '../src/repositories/resourceRepository.js';
import { getDbAdapter } from '../src/repositories/dbAdapter.js';

describe('Intelligent Auto-Allocation Service', () => {
  const user = { id: 'student-alloc', name: 'Charlie', email: 'charlie@campusslot.edu', role: 'STUDENT' };

  beforeEach(async () => {
    const db = getDbAdapter();
    if (db.clearAll) await db.clearAll();

    // Seed 3 seminar rooms with different capacities and equipment
    await resourceRepository.save({
      id: 'res-seminar-small',
      name: 'Small Seminar Room',
      category: 'SEMINAR_ROOM',
      building: 'Building A',
      floor: 1,
      roomNumber: '101',
      capacity: 20,
      equipment: ['Projector', 'Whiteboard'],
      status: 'ACTIVE',
      operatingHours: { start: '08:00', end: '22:00' },
      minBookingDuration: 30,
      maxBookingDuration: 240,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await resourceRepository.save({
      id: 'res-seminar-large',
      name: 'Huge Auditorium',
      category: 'SEMINAR_ROOM',
      building: 'Building A',
      floor: 1,
      roomNumber: 'Auditorium',
      capacity: 150,
      equipment: ['Projector', 'Whiteboard', 'Sound System'],
      status: 'ACTIVE',
      operatingHours: { start: '08:00', end: '22:00' },
      minBookingDuration: 30,
      maxBookingDuration: 240,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  it('should allocate the most capacity-optimal room instead of wasting large auditoriums', async () => {
    // Request for 18 people
    const result = await allocationService.autoAllocate(
      {
        category: 'SEMINAR_ROOM',
        capacity: 18,
        durationMinutes: 60,
        date: '2026-11-26',
        preferredTime: '11:00',
        equipmentRequirements: ['Projector'],
      },
      user
    );

    expect(result.allocated).toBe(true);
    // Small seminar room (20 cap) should be picked over Huge Auditorium (150 cap)
    expect(result.resource.id).toBe('res-seminar-small');
    expect(result.suitabilityScore).toBeGreaterThan(80);
  });

  it('should allocate the larger room if requested capacity exceeds small room', async () => {
    // Request for 60 people
    const result = await allocationService.autoAllocate(
      {
        category: 'SEMINAR_ROOM',
        capacity: 60,
        durationMinutes: 60,
        date: '2026-11-26',
        preferredTime: '14:00',
        equipmentRequirements: ['Projector'],
      },
      user
    );

    expect(result.allocated).toBe(true);
    expect(result.resource.id).toBe('res-seminar-large');
  });
});
