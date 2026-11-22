import { resourceRepository } from '../repositories/resourceRepository.js';
import { slotLockRepository } from '../repositories/slotLockRepository.js';
import { bookingService } from './bookingService.js';
import { suggestionService } from './suggestionService.js';
import {
  generateTimeSlots,
  minutesToTime,
  timeToMinutes,
  isWithinOperatingHours,
  isValid30MinBoundary,
  isSlotInPast,
} from '../utils/timeSlots.js';

export class AllocationService {
  /**
   * Computes suitability score for candidate resource matching requested requirements.
   * Higher score = better candidate.
   */
  calculateSuitabilityScore(resource, request) {
    let score = 100;
    const requestedCap = request.capacity || 1;

    // 1. Capacity penalty for unused capacity (avoid allocating large lecture halls for small groups)
    const excessCapacity = resource.capacity - requestedCap;
    if (excessCapacity < 0) {
      return 0; // Ineligible
    }
    // Deduct 1.5 points per excess capacity unit up to 45 points max penalty
    const capacityPenalty = Math.min(45, excessCapacity * 1.5);
    score -= capacityPenalty;

    // 2. Equipment match check
    if (request.equipmentRequirements && request.equipmentRequirements.length > 0) {
      const resourceEqLower = (resource.equipment || []).map((e) => e.toLowerCase());
      let matchedCount = 0;
      for (const reqEq of request.equipmentRequirements) {
        const has = resourceEqLower.some((e) => e.includes(reqEq.toLowerCase()));
        if (has) matchedCount++;
      }
      const matchRatio = matchedCount / request.equipmentRequirements.length;
      if (matchRatio < 1) {
        score -= (1 - matchRatio) * 40; // Heavy penalty if missing required equipment
      } else {
        score += 10; // Bonus for full match
      }
    }

    // 3. Round to 1 decimal place
    return Math.max(10, Math.round(score * 10) / 10);
  }

  /**
   * Checks whether all 30-min slots for a resource are free on a given date and time window.
   */
  async isResourceAvailable(resourceId, date, startTime, endTime) {
    const requestedSlots = generateTimeSlots(startTime, endTime);
    const existingLocks = await slotLockRepository.getLocksForResourceAndDate(resourceId, date);
    const lockedTimes = new Set(existingLocks.map((l) => l.timeSlot));

    for (const slot of requestedSlots) {
      if (lockedTimes.has(slot)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Evaluates and returns all ranked candidates matching constraints WITHOUT immediately booking.
   * Allows the user to compare scores, capacities, and pick their preferred venue.
   */
  async findRankedCandidates(request) {
    const {
      category,
      capacity,
      durationMinutes,
      date,
      preferredTime,
      equipmentRequirements = [],
    } = request;

    if (isSlotInPast(date, preferredTime)) {
      const err = new Error(`Cannot search or allocate for a time slot that has already passed (${date} at ${preferredTime}). Please choose an upcoming time.`);
      err.statusCode = 400;
      err.errorCode = 'PAST_TIME_SLOT';
      throw err;
    }

    const duration = Number(durationMinutes) || 60;
    const startMin = timeToMinutes(preferredTime);
    const endMin = startMin + duration;
    const endTime = minutesToTime(endMin);

    const candidates = await resourceRepository.findByFilters({
      category,
      minCapacity: capacity,
      status: 'ACTIVE',
      equipment: equipmentRequirements,
    });

    const evaluated = [];
    for (const resource of candidates) {
      const withinHours = isWithinOperatingHours(preferredTime, endTime, resource.operatingHours);
      const suitabilityScore = this.calculateSuitabilityScore(resource, request);
      const isAvailable = withinHours ? await this.isResourceAvailable(resource.id, date, preferredTime, endTime) : false;

      evaluated.push({
        resource,
        suitabilityScore,
        isAvailable,
        withinHours,
        startTime: preferredTime,
        endTime,
        date,
        capacityMatch: `${capacity} requested / ${resource.capacity} seats`,
        excessCapacity: resource.capacity - capacity,
      });
    }

    evaluated.sort((a, b) => {
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;
      return b.suitabilityScore - a.suitabilityScore;
    });

    return evaluated;
  }

  /**
   * Auto-allocates the most suitable resource for the user request.
   * If the top candidate is contested/locked by a concurrent booking,
   * automatically falls back to the next ranked candidate.
   */
  async autoAllocate(request, user) {
    const {
      category,
      capacity,
      durationMinutes,
      date,
      preferredTime,
      equipmentRequirements = [],
      purpose = 'Auto-allocated Campus Reservation at TIET',
      attendeesCount,
    } = request;

    if (!isValid30MinBoundary(preferredTime)) {
      const err = new Error('Preferred time must be on a 30-minute boundary (e.g. 10:00, 10:30)');
      err.statusCode = 400;
      throw err;
    }

    if (isSlotInPast(date, preferredTime)) {
      const err = new Error(`Cannot auto-allocate a time slot that has already passed (${date} at ${preferredTime}). Please choose an upcoming time.`);
      err.statusCode = 400;
      err.errorCode = 'PAST_TIME_SLOT';
      throw err;
    }

    const duration = Number(durationMinutes) || 60;
    if (duration % 30 !== 0) {
      const err = new Error('Duration must be a multiple of 30 minutes (30, 60, 90, 120, etc.)');
      err.statusCode = 400;
      throw err;
    }

    const startMin = timeToMinutes(preferredTime);
    const endMin = startMin + duration;
    const endTime = minutesToTime(endMin);

    // 1. Fetch all ACTIVE resources in requested category with capacity >= requested
    const candidates = await resourceRepository.findByFilters({
      category,
      minCapacity: capacity,
      status: 'ACTIVE',
      equipment: equipmentRequirements,
    });

    if (candidates.length === 0) {
      const alternatives = await suggestionService.findAlternatives({
        category,
        capacity,
        durationMinutes: duration,
        date,
        preferredTime,
        equipmentRequirements,
      });

      return {
        allocated: false,
        message: 'No eligible Thapar facilities found matching all strict criteria.',
        alternatives,
      };
    }

    // 2. Score and rank candidates
    const scoredCandidates = candidates
      .filter((resource) => isWithinOperatingHours(preferredTime, endTime, resource.operatingHours))
      .map((resource) => ({
        resource,
        suitabilityScore: this.calculateSuitabilityScore(resource, request),
      }))
      .filter((item) => item.suitabilityScore > 0)
      .sort((a, b) => b.suitabilityScore - a.suitabilityScore);

    if (scoredCandidates.length === 0) {
      const alternatives = await suggestionService.findAlternatives({
        category,
        capacity,
        durationMinutes: duration,
        date,
        preferredTime,
        equipmentRequirements,
      });

      return {
        allocated: false,
        message: 'Resources match specifications but are outside operating hours.',
        alternatives,
      };
    }

    // 3. Iterate through ranked candidates and attempt atomic reservation
    const triedCandidates = [];
    for (const candidate of scoredCandidates) {
      const resource = candidate.resource;
      triedCandidates.push(resource.name);

      const available = await this.isResourceAvailable(resource.id, date, preferredTime, endTime);
      if (!available) {
        continue;
      }

      try {
        const booking = await bookingService.createBooking(
          {
            resourceId: resource.id,
            date,
            startTime: preferredTime,
            endTime,
            purpose: `[Auto-Allocated] ${purpose}`,
            attendeesCount: attendeesCount || capacity,
          },
          user
        );

        return {
          allocated: true,
          booking,
          resource,
          suitabilityScore: candidate.suitabilityScore,
          message: `Successfully allocated optimal resource: ${resource.name} (${resource.building}, Room ${resource.roomNumber})`,
          allCandidates: scoredCandidates,
          rankingInfo: {
            rank: 1,
            totalEvaluated: scoredCandidates.length,
            suitabilityScore: candidate.suitabilityScore,
          },
        };
      } catch (err) {
        if (err.code === 'SLOT_CONFLICT') {
          continue;
        }
        throw err;
      }
    }

    // 4. If all candidates are occupied at requested time, generate smart alternatives
    const alternatives = await suggestionService.findAlternatives({
      category,
      capacity,
      durationMinutes: duration,
      date,
      preferredTime,
      equipmentRequirements,
    });

    return {
      allocated: false,
      message: `All ${scoredCandidates.length} eligible facilities were occupied during ${preferredTime}-${endTime}.`,
      triedResources: triedCandidates,
      alternatives,
    };
  }
}

export const allocationService = new AllocationService();
