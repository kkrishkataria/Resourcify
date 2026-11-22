import { resourceRepository } from '../repositories/resourceRepository.js';
import { slotLockRepository } from '../repositories/slotLockRepository.js';
import {
  generateTimeSlots,
  minutesToTime,
  timeToMinutes,
  isWithinOperatingHours,
  isValid30MinBoundary,
} from '../utils/timeSlots.js';

export class SuggestionService {
  /**
   * Helper to check if a resource is free for a given time window.
   */
  async isFree(resourceId, date, startTime, endTime) {
    const requestedSlots = generateTimeSlots(startTime, endTime);
    const locks = await slotLockRepository.getLocksForResourceAndDate(resourceId, date);
    const lockedTimes = new Set(locks.map((l) => l.timeSlot));

    for (const slot of requestedSlots) {
      if (lockedTimes.has(slot)) return false;
    }
    return true;
  }

  /**
   * Generates intelligent alternatives when the primary requested slot or resource is unavailable.
   * 
   * Strategy:
   * 1. Same Resource, Nearby Time Slots (-60m, -30m, +30m, +60m, +90m, +120m)
   * 2. Similar Resources in same category at the requested time
   * 3. Similar Resources at nearby time slots
   * Ranks candidates by suitability and time proximity.
   */
  async findAlternatives(params) {
    const {
      resourceId,
      category,
      capacity = 1,
      durationMinutes = 60,
      date,
      preferredTime,
      equipmentRequirements = [],
    } = params;

    const alternatives = [];
    const preferredStartMin = timeToMinutes(preferredTime);
    const duration = Number(durationMinutes);

    // Nearby time offsets to check (in minutes)
    const timeOffsets = [30, -30, 60, -60, 90, 120, -120];

    // Case A: Specific resource was requested
    if (resourceId) {
      const primaryResource = await resourceRepository.getById(resourceId);
      if (primaryResource && primaryResource.status === 'ACTIVE') {
        for (const offset of timeOffsets) {
          const altStartMin = preferredStartMin + offset;
          const altEndMin = altStartMin + duration;
          if (altStartMin < 0 || altEndMin > 24 * 60) continue;

          const altStart = minutesToTime(altStartMin);
          const altEnd = minutesToTime(altEndMin);

          if (!isValid30MinBoundary(altStart) || !isValid30MinBoundary(altEnd)) continue;
          if (!isWithinOperatingHours(altStart, altEnd, primaryResource.operatingHours)) continue;

          const free = await this.isFree(primaryResource.id, date, altStart, altEnd);
          if (free) {
            const timeDiff = Math.abs(offset);
            const proximityScore = Math.max(10, 100 - timeDiff);

            alternatives.push({
              resource: primaryResource,
              date,
              startTime: altStart,
              endTime: altEnd,
              suitabilityScore: 90,
              timeProximityScore: proximityScore,
              alternativeType: 'SAME_RESOURCE_DIFFERENT_TIME',
              matchReasons: [
                `Same requested venue (${primaryResource.name})`,
                offset > 0 ? `${offset} minutes later` : `${Math.abs(offset)} minutes earlier`,
                `Full capacity match (${primaryResource.capacity} seats)`,
              ],
            });
            if (alternatives.length >= 3) break;
          }
        }
      }
    }

    // Case B: Search similar resources in the same category
    const targetCategory = category || (resourceId ? (await resourceRepository.getById(resourceId))?.category : null);
    if (targetCategory) {
      const peers = await resourceRepository.findByFilters({
        category: targetCategory,
        minCapacity: capacity,
        status: 'ACTIVE',
      });

      // Filter out the primary resource if already examined
      const candidatePeers = peers.filter((p) => p.id !== resourceId);

      for (const peer of candidatePeers) {
        const reqEnd = minutesToTime(preferredStartMin + duration);

        // Check if peer is free at the exact requested time!
        if (
          isWithinOperatingHours(preferredTime, reqEnd, peer.operatingHours) &&
          (await this.isFree(peer.id, date, preferredTime, reqEnd))
        ) {
          alternatives.push({
            resource: peer,
            date,
            startTime: preferredTime,
            endTime: reqEnd,
            suitabilityScore: 95,
            timeProximityScore: 100,
            alternativeType: 'SIMILAR_RESOURCE_SAME_TIME',
            matchReasons: [
              `Identical requested time (${preferredTime}-${reqEnd})`,
              `Similar venue: ${peer.name} (${peer.building})`,
              `Capacity: ${peer.capacity} seats`,
            ],
          });
        }

        // Also check close nearby time slots on peers if we need more options
        if (alternatives.length < 5) {
          for (const offset of [30, -30, 60]) {
            const altStartMin = preferredStartMin + offset;
            const altEndMin = altStartMin + duration;
            if (altStartMin < 0 || altEndMin > 24 * 60) continue;

            const altStart = minutesToTime(altStartMin);
            const altEnd = minutesToTime(altEndMin);

            if (!isValid30MinBoundary(altStart) || !isValid30MinBoundary(altEnd)) continue;
            if (!isWithinOperatingHours(altStart, altEnd, peer.operatingHours)) continue;

            if (await this.isFree(peer.id, date, altStart, altEnd)) {
              alternatives.push({
                resource: peer,
                date,
                startTime: altStart,
                endTime: altEnd,
                suitabilityScore: 85,
                timeProximityScore: 100 - Math.abs(offset),
                alternativeType: 'SIMILAR_RESOURCE_DIFFERENT_TIME',
                matchReasons: [
                  `Nearby venue: ${peer.name}`,
                  offset > 0 ? `${offset} mins later` : `${Math.abs(offset)} mins earlier`,
                  `Equipped with ${peer.equipment?.slice(0, 2).join(', ') || 'essential facilities'}`,
                ],
              });
              if (alternatives.length >= 6) break;
            }
          }
        }
      }
    }

    // Sort alternatives by combined score
    return alternatives
      .sort((a, b) => {
        const totalA = a.suitabilityScore * 0.5 + a.timeProximityScore * 0.5;
        const totalB = b.suitabilityScore * 0.5 + b.timeProximityScore * 0.5;
        return totalB - totalA;
      })
      .slice(0, 6);
  }
}

export const suggestionService = new SuggestionService();
