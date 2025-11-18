import { InvoiceEmailData } from '../../types/email.types';
import { getBaseEmailTemplate } from './base.template';

export function getInvoiceNotificationEmailTemplate(data: InvoiceEmailData): { html: string; text: string } {
  const { recipientName, invoiceNumber, invoiceAmount, invoiceDate, dueDate, invoiceUrl, paymentStatus, language = 'en' } = data;
  const isHebrew = language === 'he';

  const statusText = isHebrew
    ? paymentStatus === 'paid'
      ? 'שולם'
      : paymentStatus === 'overdue'
        ? 'פג תוקף'
        : 'ממתין לתשלום'
    : paymentStatus === 'paid'
      ? 'Paid'
      : paymentStatus === 'overdue'
        ? 'Overdue'
        : 'Pending';

  const statusColor = paymentStatus === 'paid' ? '#10b981' : paymentStatus === 'overdue' ? '#ef4444' : '#f59e0b';

  const title = isHebrew ? 'הודעה על חשבונית' : 'Invoice Notification';
  const greeting = isHebrew ? `שלום ${recipientName},` : `Hello ${recipientName},`;

  const content = isHebrew
    ? `
    <p>${greeting}</p>
    <p>${paymentStatus === 'paid' ? 'תודה על התשלום!' : paymentStatus === 'overdue' ? 'חשבונית זו פגה תוקף.' : 'יש לך חשבונית חדשה.'}</p>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #111827;">חשבונית #${invoiceNumber}</h2>
      <p style="margin: 10px 0; color: #374151;"><strong>סכום:</strong> ₪${invoiceAmount.toLocaleString('he-IL')}</p>
      <p style="margin: 10px 0; color: #374151;"><strong>תאריך:</strong> ${new Date(invoiceDate).toLocaleDateString('he-IL')}</p>
      ${dueDate ? `<p style="margin: 10px 0; color: #374151;"><strong>תאריך יעד:</strong> ${new Date(dueDate).toLocaleDateString('he-IL')}</p>` : ''}
      <p style="margin: 10px 0; color: #374151;">
        <strong>סטטוס תשלום:</strong> 
        <span style="color: ${statusColor}; font-weight: 600;">${statusText}</span>
      </p>
    </div>
    ${invoiceUrl && paymentStatus !== 'paid' ? '<p>לצפייה בחשבונית ולשלם, לחץ על הכפתור למטה:</p>' : invoiceUrl ? '<p>לצפייה בחשבונית, לחץ על הכפתור למטה:</p>' : ''}
  `
    : `
    <p>${greeting}</p>
    <p>${paymentStatus === 'paid' ? 'Thank you for your payment!' : paymentStatus === 'overdue' ? 'This invoice is overdue.' : 'You have a new invoice.'}</p>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #111827;">Invoice #${invoiceNumber}</h2>
      <p style="margin: 10px 0; color: #374151;"><strong>Amount:</strong> $${invoiceAmount.toLocaleString('en-US')}</p>
      <p style="margin: 10px 0; color: #374151;"><strong>Date:</strong> ${new Date(invoiceDate).toLocaleDateString('en-US')}</p>
      ${dueDate ? `<p style="margin: 10px 0; color: #374151;"><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString('en-US')}</p>` : ''}
      <p style="margin: 10px 0; color: #374151;">
        <strong>Payment Status:</strong> 
        <span style="color: ${statusColor}; font-weight: 600;">${statusText}</span>
      </p>
    </div>
    ${invoiceUrl && paymentStatus !== 'paid' ? '<p>To view and pay the invoice, click the button below:</p>' : invoiceUrl ? '<p>To view the invoice, click the button below:</p>' : ''}
  `;

  const buttonText = paymentStatus === 'paid'
    ? isHebrew
      ? 'צפה בחשבונית'
      : 'View Invoice'
    : isHebrew
      ? 'שלם עכשיו'
      : 'Pay Now';

  const footerText = isHebrew
    ? 'אם יש לך שאלות, אנא צור קשר עם התמיכה.'
    : 'If you have any questions, please contact support.';

  const html = getBaseEmailTemplate({
    title,
    content,
    language,
    actionButton: invoiceUrl
      ? {
          text: buttonText,
          url: invoiceUrl,
        }
      : undefined,
    footerText,
  });

  const text = isHebrew
    ? `
${greeting}

${paymentStatus === 'paid' ? 'תודה על התשלום!' : paymentStatus === 'overdue' ? 'חשבונית זו פגה תוקף.' : 'יש לך חשבונית חדשה.'}

חשבונית #${invoiceNumber}
סכום: ₪${invoiceAmount.toLocaleString('he-IL')}
תאריך: ${new Date(invoiceDate).toLocaleDateString('he-IL')}
${dueDate ? `תאריך יעד: ${new Date(dueDate).toLocaleDateString('he-IL')}\n` : ''}סטטוס תשלום: ${statusText}

${invoiceUrl ? `${paymentStatus !== 'paid' ? 'שלם עכשיו' : 'צפה בחשבונית'}: ${invoiceUrl}` : ''}
  `.trim()
    : `
${greeting}

${paymentStatus === 'paid' ? 'Thank you for your payment!' : paymentStatus === 'overdue' ? 'This invoice is overdue.' : 'You have a new invoice.'}

Invoice #${invoiceNumber}
Amount: $${invoiceAmount.toLocaleString('en-US')}
Date: ${new Date(invoiceDate).toLocaleDateString('en-US')}
${dueDate ? `Due Date: ${new Date(dueDate).toLocaleDateString('en-US')}\n` : ''}Payment Status: ${statusText}

${invoiceUrl ? `${paymentStatus !== 'paid' ? 'Pay now' : 'View invoice'}: ${invoiceUrl}` : ''}
  `.trim();

  return { html, text };
}


