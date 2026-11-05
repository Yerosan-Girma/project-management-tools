import { sendEmail, SendEmailOptions } from '../config/email';
import { logger } from '../utils/logger';

export class EmailJob {
  private static queue: SendEmailOptions[] = [];
  private static isProcessing = false;

  static enqueue(options: SendEmailOptions): void {
    EmailJob.queue.push(options);
    EmailJob.processQueue();
  }

  private static async processQueue(): Promise<void> {
    if (EmailJob.isProcessing || EmailJob.queue.length === 0) return;

    EmailJob.isProcessing = true;
    while (EmailJob.queue.length > 0) {
      const email = EmailJob.queue.shift();
      if (email) {
        try {
          await sendEmail(email);
        } catch (error: any) {
          logger.error(`❌ Background email delivery failed: ${error.message}`);
        }
      }
    }
    EmailJob.isProcessing = false;
  }
}
