export interface RegistrationPdfData {
  form: {
    title: string;
    fields: Array<{
      name: string;
      label: string;
      type: string;
      config?: {
        options?: string[];
      };
    }>;
  };
  registration: {
    _id: string;
    fullName?: string;
    email?: string;
    phone?: string;
    additionalData?: Record<string, any>;
    createdAt: string;
  };
  kid?: {
    firstname: string;
    lastname: string;
    idNumber?: string;
    birthDate?: string;
    gender?: string;
    address?: string;
    profileImageUrl?: string;
    dynamicFields?: Record<string, any>;
  };
  organization?: {
    name?: string;
    logo?: string;
  };
  paymentDetails?: {
    cardOwnerName?: string;
    last4Digits?: string;
    amountPaid?: number;
    paymentDate?: string;
    lowProfileCode?: string;
  };
  language: 'en' | 'he';
  translations: {
    formTitle: string;
    registrationDetails: string;
    childInformation: string;
    formFields: string;
    paymentDetails: string;
    registeredAt: string;
    fullName: string;
    email: string;
    phone: string;
    name: string;
    idNumber: string;
    birthDate: string;
    gender: string;
    address: string;
    cardOwnerName: string;
    last4Digits: string;
    amountPaid: string;
    paymentDate: string;
    lowProfileCode: string;
    termsAccepted: string;
    termsNotAccepted: string;
    officialDocument: string;
    generatedAt: string;
    dynamicFields: string;
    field: string;
    value: string;
    downloadFile: string;
  };
}

export function generateRegistrationPdfHtml(data: RegistrationPdfData): string {
  const { form, registration, kid, organization, paymentDetails, language, translations } = data;
  const isRtl = language === 'he';
  const dir = isRtl ? 'rtl' : 'ltr';
  const textAlign = isRtl ? 'right' : 'left';

  // Helper function to format dates as DD/MM/YYYY
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '-';
    }
  };

  // Helper function to format date-time as DD/MM/YYYY HH:mm
  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return '-';
    }
  };

  // Helper to safely get field value
  const getFieldValue = (field: any): string => {
    const additionalData = registration.additionalData || {};
    const fieldName = field.name;
    
    // Handle terms field
    if (field.type === 'terms') {
      const value = additionalData[fieldName];
      const termsText = field.config?.text || '';
      const isAccepted = value === true || value === 'true' || value === 1 || value === '1';
      
      if (termsText) {
        // If there's terms text, show it with acceptance status
        const acceptanceStatus = isAccepted 
          ? `<div style="color: #16a34a; font-weight: 600; margin-bottom: 10px;">✓ ${translations.termsAccepted}</div>`
          : `<div style="color: #dc2626; font-weight: 600; margin-bottom: 10px;">✗ ${translations.termsNotAccepted || 'Not Accepted'}</div>`;
        
        return `
          ${acceptanceStatus}
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; margin-top: 8px; max-height: 300px; overflow-y: auto;">
            <div style="font-size: 13px; line-height: 1.6; white-space: pre-line;">${termsText}</div>
          </div>
        `;
      }
      
      // If no terms text, just show acceptance status
      if (isAccepted) {
        return `✓ ${translations.termsAccepted}`;
      }
      return '-';
    }

    // Handle date fields
    if (field.type === 'date') {
      return formatDate(additionalData[fieldName]);
    }

    // Handle signature fields
    if (field.type === 'signature' && typeof additionalData[fieldName] === 'string') {
      return `<img src="${additionalData[fieldName]}" alt="signature" style="max-width: 200px; max-height: 80px; border: 1px solid #ddd; padding: 5px;" />`;
    }

    // Handle image fields
    if (field.type === 'image' && typeof additionalData[fieldName] === 'string') {
      return `<img src="${additionalData[fieldName]}" alt="${field.label}" style="max-width: 200px; max-height: 80px; border: 1px solid #ddd; padding: 5px;" />`;
    }

    // Handle file fields
    if (field.type === 'file' && typeof additionalData[fieldName] === 'string') {
      return `<a href="${additionalData[fieldName]}" target="_blank" style="color: #2563eb; text-decoration: underline;">${translations.downloadFile}</a>`;
    }

    // Handle select/multiselect
    if ((field.type === 'select' || field.type === 'multiselect') && additionalData[fieldName]) {
      const value = additionalData[fieldName];
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return String(value);
    }

    // For all other fields
    const value = additionalData[fieldName];
    if (value === undefined || value === null || value === '') return '-';
    if (typeof value === 'object') return '-';
    return String(value);
  };

  return `
<!DOCTYPE html>
<html lang="${language}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${form.title} - ${translations.registrationDetails}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      direction: ${dir};
      text-align: ${textAlign};
      padding: 40px;
      background: #ffffff;
      color: #1a1a1a;
      line-height: 1.6;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 40px;
    }

    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-content {
      flex: 1;
    }

    .logo {
      max-width: 120px;
      max-height: 80px;
      ${isRtl ? 'margin-left: 20px;' : 'margin-right: 20px;'}
    }

    .form-title {
      font-size: 28px;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 10px;
    }

    .registration-date {
      color: #64748b;
      font-size: 14px;
    }

    .section {
      margin-bottom: 30px;
      padding: 20px;
      background: #f8fafc;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }

    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #dbeafe;
    }

    .field-row {
      display: flex;
      padding: 12px 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .field-row:last-child {
      border-bottom: none;
    }

    .field-label {
      font-weight: 600;
      color: #475569;
      min-width: 200px;
      ${isRtl ? 'margin-left: 20px;' : 'margin-right: 20px;'}
    }

    .field-value {
      color: #1e293b;
      flex: 1;
      word-break: break-word;
    }

    .kid-profile {
      display: flex;
      align-items: start;
      gap: 20px;
      margin-bottom: 20px;
    }

    .kid-image {
      width: 100px;
      height: 100px;
      border-radius: 8px;
      object-fit: cover;
      border: 2px solid #e2e8f0;
    }

    .kid-details {
      flex: 1;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }

    .official-stamp {
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      color: white;
      padding: 15px 30px;
      border-radius: 6px;
      font-weight: 600;
      display: inline-block;
      margin: 20px auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    .no-data {
      color: #94a3b8;
      font-style: italic;
    }

    @media print {
      body {
        padding: 0;
      }
      .container {
        border: none;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      ${organization?.logo ? `<img src="${organization.logo}" alt="Organization Logo" class="logo" />` : ''}
      <div class="header-content">
        <h1 class="form-title">${form.title}</h1>
        <div class="registration-date">
          ${translations.registeredAt}: ${formatDateTime(registration.createdAt)}
        </div>
      </div>
    </div>

    <!-- Kid Information Section (if exists) -->
    ${kid ? `
    <div class="section">
      <h2 class="section-title">${translations.childInformation}</h2>
      <div class="kid-profile">
        ${kid.profileImageUrl ? `<img src="${kid.profileImageUrl}" alt="Kid Profile" class="kid-image" />` : ''}
        <div class="kid-details">
          <div class="field-row">
            <div class="field-label">${translations.name}</div>
            <div class="field-value">${kid.firstname} ${kid.lastname}</div>
          </div>
          ${kid.idNumber ? `
          <div class="field-row">
            <div class="field-label">${translations.idNumber}</div>
            <div class="field-value">${kid.idNumber}</div>
          </div>` : ''}
          ${kid.birthDate ? `
          <div class="field-row">
            <div class="field-label">${translations.birthDate}</div>
            <div class="field-value">${formatDate(kid.birthDate)}</div>
          </div>` : ''}
          ${kid.gender ? `
          <div class="field-row">
            <div class="field-label">${translations.gender}</div>
            <div class="field-value">${kid.gender}</div>
          </div>` : ''}
          ${kid.address ? `
          <div class="field-row">
            <div class="field-label">${translations.address}</div>
            <div class="field-value">${kid.address}</div>
          </div>` : ''}
        </div>
      </div>
      
      ${kid.dynamicFields && Object.keys(kid.dynamicFields).length > 0 ? `
      <div style="margin-top: 20px;">
        <h3 style="font-size: 16px; font-weight: 600; color: #475569; margin-bottom: 10px;">
          ${translations.dynamicFields}
        </h3>
        ${Object.entries(kid.dynamicFields).map(([key, value]) => `
        <div class="field-row">
          <div class="field-label">${key}</div>
          <div class="field-value">${value !== null && value !== undefined && value !== '' ? value : '-'}</div>
        </div>
        `).join('')}
      </div>
      ` : ''}
    </div>
    ` : ''}

    <!-- Registration Details Section -->
    <div class="section">
      <h2 class="section-title">${translations.registrationDetails}</h2>
      ${registration.fullName ? `
      <div class="field-row">
        <div class="field-label">${translations.fullName}</div>
        <div class="field-value">${registration.fullName}</div>
      </div>` : ''}
      ${registration.email ? `
      <div class="field-row">
        <div class="field-label">${translations.email}</div>
        <div class="field-value">${registration.email}</div>
      </div>` : ''}
      ${registration.phone ? `
      <div class="field-row">
        <div class="field-label">${translations.phone}</div>
        <div class="field-value">${registration.phone}</div>
      </div>` : ''}
    </div>

    <!-- Form Fields Section -->
    ${form.fields && form.fields.length > 0 ? `
    <div class="section">
      <h2 class="section-title">${translations.formFields}</h2>
      ${form.fields.filter(f => f.name).map(field => `
      <div class="field-row">
        <div class="field-label">${field.label}</div>
        <div class="field-value">${getFieldValue(field)}</div>
      </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- Payment Details Section (if exists) -->
    ${paymentDetails && (paymentDetails.cardOwnerName || paymentDetails.amountPaid) ? `
    <div class="section">
      <h2 class="section-title">${translations.paymentDetails}</h2>
      ${paymentDetails.cardOwnerName ? `
      <div class="field-row">
        <div class="field-label">${translations.cardOwnerName}</div>
        <div class="field-value">${paymentDetails.cardOwnerName}</div>
      </div>` : ''}
      ${paymentDetails.last4Digits ? `
      <div class="field-row">
        <div class="field-label">${translations.last4Digits}</div>
        <div class="field-value">**** ${paymentDetails.last4Digits}</div>
      </div>` : ''}
      ${paymentDetails.amountPaid !== undefined && paymentDetails.amountPaid !== null ? `
      <div class="field-row">
        <div class="field-label">${translations.amountPaid}</div>
        <div class="field-value">${paymentDetails.amountPaid} ₪</div>
      </div>` : ''}
      ${paymentDetails.paymentDate ? `
      <div class="field-row">
        <div class="field-label">${translations.paymentDate}</div>
        <div class="field-value">${formatDate(paymentDetails.paymentDate)}</div>
      </div>` : ''}
      ${paymentDetails.lowProfileCode ? `
      <div class="field-row">
        <div class="field-label">${translations.lowProfileCode}</div>
        <div class="field-value">${paymentDetails.lowProfileCode}</div>
      </div>` : ''}
    </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
      <div class="official-stamp">${translations.officialDocument}</div>
      <div>${translations.generatedAt}: ${formatDateTime(new Date().toISOString())}</div>
    </div>
  </div>
</body>
</html>
  `;
}

