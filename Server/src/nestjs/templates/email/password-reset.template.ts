import { PasswordResetEmailData } from '../../types/email.types';
import { getBaseEmailTemplate } from './base.template';

export function getPasswordResetEmailTemplate(data: PasswordResetEmailData): { html: string; text: string } {
  const { email, name, resetToken, resetUrl, language = 'en' } = data;
  const isHebrew = language === 'he';

  const title = isHebrew ? 'איפוס סיסמה' : 'Password Reset';
  const greeting = isHebrew ? `שלום ${name},` : `Hello ${name},`;
  const content = isHebrew
    ? `
    <p>${greeting}</p>
    <p>קיבלנו בקשה לאיפוס הסיסמה שלך. לחץ על הכפתור למטה כדי לאפס את הסיסמה שלך:</p>
    <p>אם לא ביקשת לאפס את הסיסמה, תוכל להתעלם מהאימייל הזה.</p>
    <p>קישור האיפוס יפוג תוך 1 שעה.</p>
  `
    : `
    <p>${greeting}</p>
    <p>We received a request to reset your password. Click the button below to reset your password:</p>
    <p>If you didn't request a password reset, you can safely ignore this email.</p>
    <p>The reset link will expire in 1 hour.</p>
  `;

  const buttonText = isHebrew ? 'איפוס סיסמה' : 'Reset Password';
  const footerText = isHebrew
    ? 'אם הכפתור לא עובד, העתק והדבק את הקישור הבא לדפדפן שלך:'
    : 'If the button doesn\'t work, copy and paste the following link into your browser:';

  const html = getBaseEmailTemplate({
    title,
    content,
    language,
    actionButton: {
      text: buttonText,
      url: resetUrl,
    },
    footerText: `${footerText}<br><a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>`,
  });

  const text = isHebrew
    ? `
${greeting}

קיבלנו בקשה לאיפוס הסיסמה שלך. השתמש בקישור הבא כדי לאפס את הסיסמה שלך:

${resetUrl}

אם לא ביקשת לאפס את הסיסמה, תוכל להתעלם מהאימייל הזה.
קישור האיפוס יפוג תוך 1 שעה.
  `.trim()
    : `
${greeting}

We received a request to reset your password. Use the following link to reset your password:

${resetUrl}

If you didn't request a password reset, you can safely ignore this email.
The reset link will expire in 1 hour.
  `.trim();

  return { html, text };
}







