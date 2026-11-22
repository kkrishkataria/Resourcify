import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import { errorHandler } from './middlewares/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'UP',
      service: 'CampusSlot API',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API routes under /api
  app.use('/api', apiRoutes);

  // Error handling middleware
  app.use(errorHandler);

  return app;
}
