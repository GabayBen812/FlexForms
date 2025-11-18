export interface BaseTemplateOptions {
  title: string;
  content: string;
  language?: 'he' | 'en';
  actionButton?: {
    text: string;
    url: string;
  };
  footerText?: string;
}

export function getBaseEmailTemplate(options: BaseTemplateOptions): string {
  const { title, content, language = 'en', actionButton, footerText } = options;
  const isRTL = language === 'he';
  const direction = isRTL ? 'rtl' : 'ltr';
  const textAlign = isRTL ? 'right' : 'left';

  const buttonHtml = actionButton
    ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
      <tr>
        <td align="${textAlign}">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="background-color: #2563eb; border-radius: 6px;">
                <a href="${actionButton.url}" style="display: inline-block; padding: 12px 24px; font-family: Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 6px;">
                  ${actionButton.text}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
    : '';

  return `
<!DOCTYPE html>
<html lang="${language}" dir="${direction}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6; direction: ${direction};">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px; text-align: ${textAlign};">
              <h1 style="margin: 0 0 20px 0; font-size: 24px; color: #111827; font-weight: 600;">
                ${title}
              </h1>
              <div style="font-size: 16px; line-height: 1.6; color: #374151;">
                ${content}
              </div>
              ${buttonHtml}
              ${footerText ? `<p style="margin-top: 30px; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px;">${footerText}</p>` : ''}
            </td>
          </tr>
        </table>
        <p style="margin-top: 20px; font-size: 12px; color: #9ca3af; text-align: center;">
          ${language === 'he' ? 'זהו אימייל אוטומטי, אנא אל תשיב' : 'This is an automated email, please do not reply'}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}


