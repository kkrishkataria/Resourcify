import { allocationService } from '../services/allocationService.js';

export class AllocationController {
  async allocate(req, res, next) {
    try {
      const { category, capacity, durationMinutes, date, preferredTime, equipmentRequirements, purpose, attendeesCount } = req.body;

      if (!category || !capacity || !date || !preferredTime) {
        return res.status(400).json({
          success: false,
          error: 'category, capacity, date, and preferredTime are required for auto-allocation',
        });
      }

      const result = await allocationService.autoAllocate(
        {
          category,
          capacity: Number(capacity),
          durationMinutes: Number(durationMinutes) || 60,
          date,
          preferredTime,
          equipmentRequirements: equipmentRequirements || [],
          purpose,
          attendeesCount: Number(attendeesCount) || Number(capacity),
        },
        req.user
      );

      if (result.allocated) {
        res.status(201).json({ success: true, data: result });
      } else {
        // Return 200 with alternatives payload so user can pick recommendations
        res.status(200).json({ success: false, data: result });
      }
    } catch (err) {
      next(err);
    }
  }
}

export const allocationController = new AllocationController();
