import serverlessExpress from '@vendia/serverless-express';
import { createApp } from './app.js';
import { checkInService } from './services/checkinService.js';

const app = createApp();
const serverlessHandler = serverlessExpress({ app });

/**
 * AWS Lambda handler for API Gateway REST API requests.
 */
export const handler = async (event, context, callback) => {
  return serverlessHandler(event, context, callback);
};

/**
 * AWS Lambda handler triggered by Amazon EventBridge for scheduled auto-release
 * of no-show reservations.
 */
export const scheduledAutoReleaseHandler = async (event, context) => {
  console.log('[Scheduled Event]: Checking for expired unconfirmed check-ins...');
  const result = await checkInService.processExpiredBookings();
  console.log('[Scheduled Event Result]:', JSON.stringify(result));
  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};
