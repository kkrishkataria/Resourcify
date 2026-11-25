import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  dbMode: process.env.DB_MODE || 'local-memory', // 'dynamodb' or 'local-memory'

  aws: {
    region: process.env.AWS_REGION || 'ap-southeast-2',
    dynamodbEndpoint: process.env.AWS_DYNAMODB_ENDPOINT || undefined,
    tables: {
      resources: process.env.DYNAMODB_TABLE_RESOURCES || 'CampusSlot-Resources',
      bookings: process.env.DYNAMODB_TABLE_BOOKINGS || 'CampusSlot-Bookings',
      slotLocks: process.env.DYNAMODB_TABLE_SLOT_LOCKS || 'CampusSlot-SlotLocks',
      users: process.env.DYNAMODB_TABLE_USERS || 'CampusSlot-Users',
    },
    sns: {
      notificationsTopicArn: process.env.SNS_BOOKING_NOTIFICATIONS_TOPIC_ARN || '',
    },
    cognito: {
      userPoolId: process.env.COGNITO_USER_POOL_ID || '',
      clientId: process.env.COGNITO_CLIENT_ID || '',
      region: process.env.COGNITO_REGION || 'ap-southeast-2',
    },
  },

  booking: {
    slotDurationMinutes: parseInt(process.env.SLOT_DURATION_MINUTES || '30', 10),
    checkInGracePeriodMinutes: parseInt(process.env.CHECKIN_GRACE_PERIOD_MINUTES || '15', 10),
    operatingHoursDefault: {
      start: '08:00',
      end: '22:00',
    },
  },
};
