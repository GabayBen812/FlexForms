import { TaskEmailData } from '../../types/email.types';
import { getBaseEmailTemplate } from './base.template';

export function getTaskAssignmentEmailTemplate(data: TaskEmailData): { html: string; text: string } {
  const { recipientName, taskTitle, taskDescription, taskStatus, taskUrl, assignedBy, dueDate, language = 'en' } = data;
  const isHebrew = language === 'he';

  const title = isHebrew ? 'משימה הוקצתה לך' : 'Task Assigned to You';
  const greeting = isHebrew ? `שלום ${recipientName},` : `Hello ${recipientName},`;

  const dueDateText = dueDate
    ? isHebrew
      ? `תאריך יעד: ${new Date(dueDate).toLocaleDateString('he-IL')}`
      : `Due Date: ${new Date(dueDate).toLocaleDateString('en-US')}`
    : '';

  const assignedByText = assignedBy
    ? isHebrew
      ? `הוקצה על ידי: ${assignedBy}`
      : `Assigned by: ${assignedBy}`
    : '';

  const content = isHebrew
    ? `
    <p>${greeting}</p>
    <p>משימה חדשה הוקצתה לך:</p>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #111827;">${taskTitle}</h2>
      ${taskDescription ? `<p style="margin: 10px 0; color: #374151;">${taskDescription}</p>` : ''}
      <p style="margin: 10px 0; color: #6b7280; font-size: 14px;"><strong>סטטוס:</strong> ${taskStatus}</p>
      ${dueDateText ? `<p style="margin: 10px 0; color: #6b7280; font-size: 14px;">${dueDateText}</p>` : ''}
      ${assignedByText ? `<p style="margin: 10px 0; color: #6b7280; font-size: 14px;">${assignedByText}</p>` : ''}
    </div>
    ${taskUrl ? '<p>לצפייה במשימה, לחץ על הכפתור למטה:</p>' : ''}
  `
    : `
    <p>${greeting}</p>
    <p>A new task has been assigned to you:</p>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #111827;">${taskTitle}</h2>
      ${taskDescription ? `<p style="margin: 10px 0; color: #374151;">${taskDescription}</p>` : ''}
      <p style="margin: 10px 0; color: #6b7280; font-size: 14px;"><strong>Status:</strong> ${taskStatus}</p>
      ${dueDateText ? `<p style="margin: 10px 0; color: #6b7280; font-size: 14px;">${dueDateText}</p>` : ''}
      ${assignedByText ? `<p style="margin: 10px 0; color: #6b7280; font-size: 14px;">${assignedByText}</p>` : ''}
    </div>
    ${taskUrl ? '<p>To view the task, click the button below:</p>' : ''}
  `;

  const buttonText = isHebrew ? 'צפה במשימה' : 'View Task';
  const footerText = isHebrew
    ? 'זהו אימייל אוטומטי מהמערכת.'
    : 'This is an automated email from the system.';

  const html = getBaseEmailTemplate({
    title,
    content,
    language,
    actionButton: taskUrl
      ? {
          text: buttonText,
          url: taskUrl,
        }
      : undefined,
    footerText,
  });

  const text = isHebrew
    ? `
${greeting}

משימה חדשה הוקצתה לך:

${taskTitle}
${taskDescription ? `\n${taskDescription}` : ''}
סטטוס: ${taskStatus}
${dueDateText ? `\n${dueDateText}` : ''}
${assignedByText ? `\n${assignedByText}` : ''}

${taskUrl ? `צפה במשימה: ${taskUrl}` : ''}
  `.trim()
    : `
${greeting}

A new task has been assigned to you:

${taskTitle}
${taskDescription ? `\n${taskDescription}` : ''}
Status: ${taskStatus}
${dueDateText ? `\n${dueDateText}` : ''}
${assignedByText ? `\n${assignedByText}` : ''}

${taskUrl ? `View task: ${taskUrl}` : ''}
  `.trim();

  return { html, text };
}


