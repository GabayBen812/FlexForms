import { Injectable, Logger } from '@nestjs/common';
import sgMail from '@sendgrid/mail';
import { EmailOptions, PasswordResetEmailData, WelcomeEmailData, FormSubmissionEmailData, TaskEmailData, InvoiceEmailData } from '../types/email.types';
import { getPasswordResetEmailTemplate } from '../templates/email/password-reset.template';
import { getWelcomeEmailTemplate } from '../templates/email/welcome.template';
import { getFormSubmissionEmailTemplate } from '../templates/email/form-submission.template';
import { getTaskAssignmentEmailTemplate } from '../templates/email/task-assignment.template';
import { getInvoiceNotificationEmailTemplate } from '../templates/email/invoice-notification.template';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly isEnabled: boolean;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    const enabled = (process.env.SENDGRID_ENABLED || 'true').toLowerCase() === 'true';
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@paradize.com';
    this.fromName = process.env.SENDGRID_FROM_NAME || 'Paradize';

    if (!apiKey || !enabled) {
      this.isEnabled = false;
      this.logger.warn('SendGrid is disabled or API key is missing. Emails will be logged instead of sent.');
      return;
    }

    sgMail.setApiKey(apiKey);
    this.isEnabled = true;
    this.logger.log('SendGrid email service initialized.');
  }

  private async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const msg: {
        to: string | string[];
        from: { email: string; name: string };
        subject: string;
        html: string;
        text: string;
        cc?: string | string[];
        bcc?: string | string[];
        replyTo?: string;
      } = {
        to: options.to,
        from: {
          email: options.from || this.fromEmail,
          name: options.fromName || this.fromName,
        },
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      };

      if (options.cc) {
        msg.cc = options.cc;
      }

      if (options.bcc) {
        msg.bcc = options.bcc;
      }

      if (options.replyTo) {
        msg.replyTo = options.replyTo;
      }

      if (!this.isEnabled) {
        this.logger.log(`[EMAIL LOG] Would send email to: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
        this.logger.log(`[EMAIL LOG] Subject: ${options.subject}`);
        this.logger.log(`[EMAIL LOG] Content: ${options.text || this.stripHtml(options.html)}`);
        return true;
      }

      await sgMail.send(msg);
      this.logger.log(`Email sent successfully to: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send email: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      return false;
    }
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<boolean> {
    const { email, language = 'en' } = data;
    const isHebrew = language === 'he';
    const subject = isHebrew ? 'איפוס סיסמה - Paradize' : 'Password Reset - Paradize';
    const template = getPasswordResetEmailTemplate(data);

    return this.sendEmail({
      to: email,
      subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    const { email, language = 'en' } = data;
    const isHebrew = language === 'he';
    const subject = isHebrew ? 'ברוכים הבאים ל-Paradize' : 'Welcome to Paradize';
    const template = getWelcomeEmailTemplate(data);

    return this.sendEmail({
      to: email,
      subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendFormSubmissionNotification(data: FormSubmissionEmailData): Promise<boolean> {
    const { recipientEmail, formName, language = 'en' } = data;
    const isHebrew = language === 'he';
    const subject = isHebrew ? `הגשה חדשה לטופס: ${formName}` : `New Submission for Form: ${formName}`;
    const template = getFormSubmissionEmailTemplate(data);

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendTaskAssignmentEmail(data: TaskEmailData): Promise<boolean> {
    const { recipientEmail, taskTitle, language = 'en' } = data;
    const isHebrew = language === 'he';
    const subject = isHebrew ? `משימה הוקצתה לך: ${taskTitle}` : `Task Assigned: ${taskTitle}`;
    const template = getTaskAssignmentEmailTemplate(data);

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendInvoiceNotification(data: InvoiceEmailData): Promise<boolean> {
    const { recipientEmail, invoiceNumber, paymentStatus, language = 'en' } = data;
    const isHebrew = language === 'he';
    const statusText = isHebrew
      ? paymentStatus === 'paid'
        ? 'שולם'
        : paymentStatus === 'overdue'
          ? 'פג תוקף'
          : 'חדש'
      : paymentStatus === 'paid'
        ? 'Paid'
        : paymentStatus === 'overdue'
          ? 'Overdue'
          : 'New';
    const subject = isHebrew
      ? `חשבונית ${statusText} #${invoiceNumber}`
      : `${statusText} Invoice #${invoiceNumber}`;
    const template = getInvoiceNotificationEmailTemplate(data);

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendCustomEmail(options: EmailOptions): Promise<boolean> {
    return this.sendEmail(options);
  }
}

