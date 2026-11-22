import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { config } from '../config/aws.js';

let snsClient = null;
if (config.aws.sns.notificationsTopicArn && config.dbMode === 'dynamodb') {
  snsClient = new SNSClient({ region: config.aws.region });
}

export class NotificationService {
  /**
   * Dispatches a notification for booking confirmation, cancellation or auto-release.
   */
  async notifyBookingEvent(event, booking) {
    const message = `[CampusSlot Alert] ${event}: Booking #${booking.id.slice(0, 8)} for ${booking.resourceName} on ${booking.date} (${booking.startTime}-${booking.endTime}) by ${booking.userName}. Status: ${booking.status}`;
    console.log(`[Notification Dispatch - ${event}]:`, message);

    if (snsClient && config.aws.sns.notificationsTopicArn) {
      try {
        await snsClient.send(
          new PublishCommand({
            TopicArn: config.aws.sns.notificationsTopicArn,
            Subject: `CampusSlot: ${event}`,
            Message: message,
          })
        );
      } catch (err) {
        console.warn('[Notification Warning] Failed to publish SNS message:', err.message);
      }
    }
  }
}

export const notificationService = new NotificationService();
