import { allocationService } from '../services/allocationService.js';

export class AllocationController {
  async allocate(req, res, next) {
    try {
      const {
        category,
        capacity,
        durationMinutes,
        date,
        preferredTime,
        equipmentRequirements,
        purpose,
        attendeesCount,
        previewOnly, // Optional flag: if true, returns ranked comparisons without booking
      } = req.body;

      if (!category || !capacity || !date || !preferredTime) {
        return res.status(400).json({
          success: false,
          error: 'category, capacity, date, and preferredTime are required for auto-allocation',
        });
      }

      const requestPayload = {
        category,
        capacity: Number(capacity),
        durationMinutes: Number(durationMinutes) || 60,
        date,
        preferredTime,
        equipmentRequirements: equipmentRequirements || [],
        purpose,
        attendeesCount: Number(attendeesCount) || Number(capacity),
      };

      // Mode 1: Preview and compare all ranked matches
      if (previewOnly) {
        const candidates = await allocationService.findRankedCandidates(requestPayload);
        return res.json({
          success: true,
          previewOnly: true,
          count: candidates.length,
          data: candidates,
        });
      }

      // Mode 2: Instant Auto-Allocate & Book
      const result = await allocationService.autoAllocate(requestPayload, req.user);

      if (result.allocated) {
        res.status(201).json({ success: true, data: result });
      } else {
        res.status(200).json({ success: false, data: result });
      }
    } catch (err) {
      next(err);
    }
  }
}

export const allocationController = new AllocationController();
