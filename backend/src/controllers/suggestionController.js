import { suggestionService } from '../services/suggestionService.js';

export class SuggestionController {
  async getSuggestions(req, res, next) {
    try {
      const {
        resourceId,
        category,
        capacity,
        durationMinutes,
        date,
        preferredTime,
        equipment,
      } = req.query;

      if (!date || !preferredTime) {
        return res.status(400).json({
          success: false,
          error: 'date and preferredTime query parameters are required',
        });
      }

      const alternatives = await suggestionService.findAlternatives({
        resourceId,
        category,
        capacity: Number(capacity) || 1,
        durationMinutes: Number(durationMinutes) || 60,
        date,
        preferredTime,
        equipmentRequirements: equipment ? (Array.isArray(equipment) ? equipment : [equipment]) : [],
      });

      res.json({ success: true, count: alternatives.length, data: alternatives });
    } catch (err) {
      next(err);
    }
  }
}

export const suggestionController = new SuggestionController();
