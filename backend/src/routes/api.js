import { Router } from 'express';
import { resourceController } from '../controllers/resourceController.js';
import { bookingController } from '../controllers/bookingController.js';
import { allocationController } from '../controllers/allocationController.js';
import { suggestionController } from '../controllers/suggestionController.js';
import { analyticsController } from '../controllers/analyticsController.js';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import { checkInService } from '../services/checkinService.js';
import { seedDatabase } from '../seeds/seed.js';

const router = Router();

// Cloud DynamoDB Seeding endpoint
router.all('/seed', async (req, res, next) => {
  try {
    await seedDatabase();
    res.json({ success: true, message: 'Thapar campus facilities and default accounts seeded successfully into DynamoDB.' });
  } catch (err) {
    next(err);
  }
});

// Real Authentication routes
router.post('/auth/register', (req, res, next) => authController.register(req, res, next));
router.post('/auth/login', (req, res, next) => authController.login(req, res, next));
router.get('/auth/me', authenticate, (req, res, next) => authController.getCurrentUser(req, res, next));
router.get('/users', authenticate, requireRole(['ADMIN']), (req, res, next) => authController.getAllUsers(req, res, next));

// Resources routes
router.get('/resources', authenticate, (req, res, next) => resourceController.getAll(req, res, next));
router.get('/resources/:id', authenticate, (req, res, next) => resourceController.getById(req, res, next));
router.post('/resources', authenticate, requireRole(['ADMIN']), (req, res, next) => resourceController.create(req, res, next));
router.put('/resources/:id', authenticate, requireRole(['ADMIN']), (req, res, next) => resourceController.update(req, res, next));
router.delete('/resources/:id', authenticate, requireRole(['ADMIN']), (req, res, next) => resourceController.delete(req, res, next));

// Availability route
router.get('/availability', authenticate, (req, res, next) => resourceController.getAvailability(req, res, next));

// Bookings routes
router.get('/bookings', authenticate, (req, res, next) => bookingController.getAll(req, res, next));
router.post('/bookings', authenticate, (req, res, next) => bookingController.create(req, res, next));
router.get('/bookings/:id', authenticate, (req, res, next) => bookingController.getById(req, res, next));
router.delete('/bookings/:id', authenticate, (req, res, next) => bookingController.cancel(req, res, next));
router.post('/bookings/:id/checkin', authenticate, (req, res, next) => bookingController.checkIn(req, res, next));
router.post('/bookings/:id/checkout', authenticate, (req, res, next) => bookingController.checkOut(req, res, next));

// Intelligent Auto-Allocation
router.post('/allocate', authenticate, (req, res, next) => allocationController.allocate(req, res, next));

// Smart Suggestions
router.get('/suggestions', authenticate, (req, res, next) => suggestionController.getSuggestions(req, res, next));

// Admin Analytics
router.get('/admin/analytics', authenticate, requireRole(['ADMIN']), (req, res, next) => analyticsController.getAnalytics(req, res, next));

// Scheduled job trigger (EventBridge / cron / manual test)
router.post('/jobs/auto-release', async (req, res, next) => {
  try {
    const result = await checkInService.processExpiredBookings();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
