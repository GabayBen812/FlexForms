import { WelcomeEmailData } from '../../types/email.types';
import { getBaseEmailTemplate } from './base.template';

export function getWelcomeEmailTemplate(data: WelcomeEmailData): { html: string; text: string } {
  const { email, name, organizationName, loginUrl, language = 'en' } = data;
  const isHebrew = language === 'he';

  const title = isHebrew ? 'ברוכים הבאים ל-Paradize' : 'Welcome to Paradize';
  const greeting = isHebrew ? `שלום ${name},` : `Hello ${name},`;
  const orgText = organizationName
    ? isHebrew
      ? `ב-${organizationName}`
      : `at ${organizationName}`
    : '';

  const content = isHebrew
    ? `
    <p>${greeting}</p>
    <p>ברוכים הבאים ל-Paradize${orgText ? ` ${orgText}` : ''}!</p>
    <p>החשבון שלך נוצר בהצלחה. אתה יכול להתחיל להשתמש בפלטפורמה עכשיו.</p>
    <p>לחץ על הכפתור למטה כדי להתחבר לחשבון שלך:</p>
  `
    : `
    <p>${greeting}</p>
    <p>Welcome to Paradize${orgText ? ` ${orgText}` : ''}!</p>
    <p>Your account has been successfully created. You can start using the platform now.</p>
    <p>Click the button below to log in to your account:</p>
  `;

  const buttonText = isHebrew ? 'התחבר' : 'Log In';
  const footerText = isHebrew
    ? 'אם יש לך שאלות, אנא צור קשר עם התמיכה.'
    : 'If you have any questions, please contact support.';

  const html = getBaseEmailTemplate({
    title,
    content,
    language,
    actionButton: {
      text: buttonText,
      url: loginUrl,
    },
    footerText,
  });

  const text = isHebrew
    ? `
${greeting}

ברוכים הבאים ל-Paradize${orgText ? ` ${orgText}` : ''}!

החשבון שלך נוצר בהצלחה. אתה יכול להתחיל להשתמש בפלטפורמה עכשיו.

התחבר לחשבון שלך: ${loginUrl}

אם יש לך שאלות, אנא צור קשר עם התמיכה.
  `.trim()
    : `
${greeting}

Welcome to Paradize${orgText ? ` ${orgText}` : ''}!

Your account has been successfully created. You can start using the platform now.

Log in to your account: ${loginUrl}

If you have any questions, please contact support.
  `.trim();

  return { html, text };
}


