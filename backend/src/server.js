import { createApp } from './app.js';
import { config } from './config/aws.js';
import { seedDatabase } from './seeds/seed.js';

const app = createApp();

async function startServer() {
  // Automatically populate seed data for frictionless local development
  try {
    await seedDatabase();
    console.log('[CampusSlot]: Seed data loaded into memory/database.');
  } catch (err) {
    console.warn('[CampusSlot]: Seeding note:', err.message);
  }

  const server = app.listen(config.port, () => {
    console.log(`=======================================================`);
    console.log(` CampusSlot / ResourSync API running on port ${config.port}`);
    console.log(` Mode: ${config.dbMode} | Environment: ${config.nodeEnv}`);
    console.log(` Health check: http://localhost:${config.port}/health`);
    console.log(` API Base:     http://localhost:${config.port}/api`);
    console.log(`=======================================================`);
  });

  return server;
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
