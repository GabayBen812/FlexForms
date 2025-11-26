import { FormSubmissionEmailData } from '../../types/email.types';
import { getBaseEmailTemplate } from './base.template';

export function getFormSubmissionEmailTemplate(data: FormSubmissionEmailData): { html: string; text: string } {
  const { recipientName, formName, submitterName, submitterEmail, submissionData, submissionUrl, language = 'en' } = data;
  const isHebrew = language === 'he';

  const title = isHebrew ? 'הגשת טופס חדשה' : 'New Form Submission';
  const greeting = recipientName
    ? isHebrew
      ? `שלום ${recipientName},`
      : `Hello ${recipientName},`
    : isHebrew
      ? 'שלום,'
      : 'Hello,';

  const submissionDetails = Object.entries(submissionData)
    .map(([key, value]) => {
      const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
      const displayValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
      return `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>${displayKey}:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${displayValue}</td></tr>`;
    })
    .join('');

  const content = isHebrew
    ? `
    <p>${greeting}</p>
    <p>התקבלה הגשה חדשה לטופס <strong>${formName}</strong>.</p>
    <p><strong>מגיש:</strong> ${submitterName} (${submitterEmail})</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tbody>
        ${submissionDetails}
      </tbody>
    </table>
    ${submissionUrl ? '<p>לצפייה בהגשה, לחץ על הכפתור למטה:</p>' : ''}
  `
    : `
    <p>${greeting}</p>
    <p>A new submission has been received for the form <strong>${formName}</strong>.</p>
    <p><strong>Submitted by:</strong> ${submitterName} (${submitterEmail})</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tbody>
        ${submissionDetails}
      </tbody>
    </table>
    ${submissionUrl ? '<p>To view the submission, click the button below:</p>' : ''}
  `;

  const buttonText = isHebrew ? 'צפה בהגשה' : 'View Submission';
  const footerText = isHebrew
    ? 'זהו אימייל אוטומטי מהמערכת.'
    : 'This is an automated email from the system.';

  const html = getBaseEmailTemplate({
    title,
    content,
    language,
    actionButton: submissionUrl
      ? {
          text: buttonText,
          url: submissionUrl,
        }
      : undefined,
    footerText,
  });

  const textDetails = Object.entries(submissionData)
    .map(([key, value]) => {
      const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
      const displayValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
      return `${displayKey}: ${displayValue}`;
    })
    .join('\n');

  const text = isHebrew
    ? `
${greeting}

התקבלה הגשה חדשה לטופס ${formName}.

מגיש: ${submitterName} (${submitterEmail})

פרטי ההגשה:
${textDetails}

${submissionUrl ? `צפה בהגשה: ${submissionUrl}` : ''}
  `.trim()
    : `
${greeting}

A new submission has been received for the form ${formName}.

Submitted by: ${submitterName} (${submitterEmail})

Submission Details:
${textDetails}

${submissionUrl ? `View submission: ${submissionUrl}` : ''}
  `.trim();

  return { html, text };
}



