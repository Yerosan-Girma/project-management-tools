import { prisma } from '../../config/database';
import { sendEmail } from '../../config/email';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { PlatformRole } from '../../constants/roles';
import { UserStatus } from '../../constants/status';
import { ContactMessageInput } from './contact.schema';

const TOPIC_LABELS: Record<string, string> = {
  product: 'Product & Features',
  pricing: 'Team or Organization Plan',
  security: 'Security & Access',
  other: 'General Inquiry',
};

export class ContactService {
  async handleContactMessage(input: ContactMessageInput): Promise<{ success: boolean; message: string }> {
    const topicLabel = TOPIC_LABELS[input.topic] || 'General Inquiry';
    const timestamp = new Date().toUTCString();

    // 1. Retrieve all active platform admins from DB
    const platformAdmins = await prisma.user.findMany({
      where: {
        platformRole: PlatformRole.PLATFORM_ADMIN,
        deletedAt: null,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // 2. Aggregate recipient admin emails (including system configured SMTP user for live deliverability)
    const adminEmails = new Set<string>();
    for (const admin of platformAdmins) {
      if (admin.email) {
        adminEmails.add(admin.email.trim().toLowerCase());
      }
    }

    if (env.SMTP_USER) {
      adminEmails.add(env.SMTP_USER.trim().toLowerCase());
    }

    // Default fallback if no admin email found
    if (adminEmails.size === 0) {
      adminEmails.add('yerosang463@gmail.com');
    }

    const recipientList = Array.from(adminEmails);
    logger.info(`📬 Dispatching contact message notification to platform admins: ${recipientList.join(', ')}`);

    // 3. Format email body for Platform Admins
    const adminSubject = `[TeamFlow Contact] ${topicLabel} from ${input.name}`;
    const safeMessageHtml = input.message
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');

    const adminHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">TeamFlow</h1>
          <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">Platform Administrator Notification</p>
        </div>

        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="display: inline-block; padding: 4px 10px; background-color: #e0e7ff; color: #4338ca; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-bottom: 16px;">
            ${topicLabel}
          </div>

          <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
            New Contact Message Received
          </h2>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 100px;">From:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${input.name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Email:</td>
              <td style="padding: 6px 0; color: #4f46e5; font-weight: 600;">
                <a href="mailto:${input.email}?subject=Re: Your TeamFlow inquiry" style="color: #4f46e5; text-decoration: underline;">
                  ${input.email}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Topic:</td>
              <td style="padding: 6px 0; color: #0f172a;">${topicLabel}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Time (UTC):</td>
              <td style="padding: 6px 0; color: #64748b; font-size: 13px;">${timestamp}</td>
            </tr>
          </table>

          <div style="margin-top: 16px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">
              Message Content:
            </p>
            <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 14px 16px; border-radius: 6px; font-size: 14px; line-height: 1.6; color: #1e293b;">
              ${safeMessageHtml}
            </div>
          </div>

          <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9;">
            <a href="mailto:${input.email}?subject=Re: Your TeamFlow inquiry regarding ${topicLabel}" 
               style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none;">
              Reply directly to ${input.name}
            </a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0;">This notification was automatically dispatched to TeamFlow Platform Administrators.</p>
        </div>
      </div>
    `;

    const adminText = `[TeamFlow Contact Inquiry]\n\nTopic: ${topicLabel}\nFrom: ${input.name} <${input.email}>\nDate: ${timestamp}\n\nMessage:\n${input.message}\n\nReply directly by emailing: ${input.email}`;

    // 4. Send email notification to all platform admin addresses
    const emailPromises = recipientList.map((adminEmail) =>
      sendEmail({
        to: adminEmail,
        subject: adminSubject,
        text: adminText,
        html: adminHtml,
        category: 'contact_admin_notification',
      })
    );

    // 5. Send automated confirmation to the user who sent the message
    const userConfirmationPromise = sendEmail({
      to: input.email,
      subject: 'We received your message - TeamFlow',
      text: `Hello ${input.name},\n\nThank you for reaching out to TeamFlow regarding "${topicLabel}".\n\nOur platform leadership team has received your message and will review it shortly.\n\nSummary of your message:\n${input.message}\n\nBest regards,\nThe TeamFlow Team`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1e293b;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 700;">TeamFlow</h1>
          </div>
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
            <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 18px;">Thank you for contacting us, ${input.name}</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
              We have received your inquiry regarding <strong>${topicLabel}</strong> and routed it directly to our platform leadership team.
            </p>
            <div style="background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 12px 14px; border-radius: 4px; font-size: 13px; line-height: 1.5; color: #334155; margin-bottom: 16px;">
              ${safeMessageHtml}
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0;">
              We will follow up at this email address (<strong>${input.email}</strong>) as soon as possible.
            </p>
          </div>
        </div>
      `,
      category: 'contact_user_confirmation',
    }).catch((err) => {
      logger.warn(`Could not dispatch user confirmation email: ${err.message}`);
    });

    await Promise.allSettled([...emailPromises, userConfirmationPromise]);

    return {
      success: true,
      message: 'Your message has been sent to our platform administrators. We will get back to you shortly.',
    };
  }
}

export const contactService = new ContactService();
