import { analyticsService } from '../services/analyticsService.js';

export class AnalyticsController {
  async getAnalytics(req, res, next) {
    try {
      const analytics = await analyticsService.getDashboardAnalytics();
      res.json({ success: true, data: analytics });
    } catch (err) {
      next(err);
    }
  }
}

export const analyticsController = new AnalyticsController();
