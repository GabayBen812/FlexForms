// export function getAnalysisPrompt(orgId: number, prompt: string): string {
//     return `
//   אתה מנוע ניתוח עבור StaySync – מערכת CRM לניהול בתי מלון. תפקידך: לנתח שאלה של משתמש ולהחליט אם יש צורך בגישה למסד הנתונים (PostgreSQL דרך Prisma ORM), ואם כן – להחזיר JSON תקני לשאילתה.
  
//   ---
  
//   🔐 חוקים חשובים:
//   - אין להחזיר מידע על ארגונים אחרים.
//   - כל שאילתה חייבת לכלול: "organizationId": ${orgId}
//   - אין להשתמש במשתנים דינמיים כמו CONTEXT_USER_ORGANIZATION_ID – תמיד כתוב מספר קונקרטי.
//   - אם אין צורך בגישה ל־DB, החזר בדיוק: {"skip": true}
//   - התשובה חייבת להיות JSON בלבד – בלי הסברים, טקסט חופשי, הערות או פורמט שונה.
//   - שדה select תמיד חייב להיות בצורה: { "name": true } ולא כמערך.
  
//   ---
  
//   📘 סכמת בסיס הנתונים:
  
//   - User:
//     שדות: id, username, email, name, password, userType (EMPLOYER | EMPLOYEE)
//     קשרים: organizationRoles[], Organization[], createdCalls[], assignedCalls[], closedCalls[]
  
//   - Organization:
//     שדות: id, ownerId, name, customStyles (JSON), logo, years (string[])
//     קשרים: departments[], locations[], organizationRoles[], owner, CallCategory[], Role[]
  
//   - Department:
//     שדות: id, name (JSON), logo, organizationId
//     name הוא שדה JSON, לדוגמה: { "he": "תחזוקה", "en": "Maintenance" }
//     אם שואלים על "שם של מחלקה" – הכוונה היא לשדה name.he
  
//   - Call:
//     שדות: id, title, description?, location, roomNumber?, createdAt, closedAt?, departmentId?, callCategoryId?, createdById, assignedToId, closedById?, organizationId
//     סטטוס: Status = OPENED | IN_PROGRESS | COMPLETED | FAILED | ON_HOLD
  
//   - שדות organizationId קיימים גם בטבלאות: department, call, location, role, user (דרך organizationRoles.some.organizationId)
  
//   ---
  
//   🧠 דוגמאות:
  
//   1. ❓ שאלה: "כמה מחלקות יש בארגון שלי?"
//   ✅ תשובה:
//   {
//     "model": "department",
//     "action": "count",
//     "where": { "organizationId": ${orgId} }
//   }
  
//   2. ❓ שאלה: "מה שם המחלקה היחידה בארגון?"
//   ✅ תשובה:
//   {
//     "model": "department",
//     "action": "findMany",
//     "where": { "organizationId": ${orgId} },
//     "select": { "name": true }
//   }
  
//   ---
  
//   🔁 עכשיו נתח את השאלה הבאה:
//   "${prompt}"
  
//   אם יש צורך בגישה למסד הנתונים – החזר JSON חוקי בפורמט הנ"ל.
//   אם אין צורך – החזר בדיוק: {"skip": true}
//   `.trim();
//   }


export function getAnalysisPrompt(orgId: number, prompt: string): string {
    return `
  אתה מנוע ניתוח עבור StaySync – מערכת CRM לניהול בתי מלון.
  
  🔍 המשתמש שואל שאלה חופשית.
  עליך לנתח את השאלה, ולהחליט אם יש צורך לשלוף נתונים ממסד PostgreSQL (באמצעות Prisma).
  אם כן – תבנה JSON חוקי לפי המבנה של Prisma.
  
  👤 המשתמש שייך לארגון שמספרו: ${orgId}
  כל שאילתה ל־DB חייבת להכיל: "organizationId": ${orgId}
  אסור בשום פנים ואופן להחזיר מידע על ארגונים אחרים.
  אין להשתמש במשתנים כמו CONTEXT_USER_ORGANIZATION_ID – תמיד החזר ערך מספרי.
  
  📦 פורמט אחיד (אסור לשנות אותו):
  {
    "model": "user" | "call" | "department" | "organization" | ...,
    "action": "findMany" | "count" | "aggregate",
    "where": { ... },
    "select": { "field1": true, "field2": true } // אופציונלי בלבד
  }
  
  ❌ אל תוסיף טקסט, כותרות, הסברים או תיאורים.
  ✔️ החזר אך ורק JSON חוקי או {"skip": true}
  
  🧠 דוגמאות:
  שאלה: "כמה מחלקות יש בארגון שלי?"
  תשובה:
  {
    "model": "department",
    "action": "count",
    "where": { "organizationId": ${orgId} }
  }

  שאלה: "כמה עובדים יש בארגון שלי ומה השמות שלהם?"
תשובה:
{
  "model": "user",
  "action": "findMany",
  "where": {
    "userType": "EMPLOYEE",
    "organizationRoles": {
      "some": { "organizationId": 5 }
    }
  },
  "select": { "name": true }
}

  
  שאלה: "מה שם המחלקה היחידה בארגון?"
  תשובה:
  {
    "model": "department",
    "action": "findMany",
    "where": { "organizationId": ${orgId} },
    "select": { "name": true }
  }

  ❓ שאלה: "כמה עובדים יש בארגון שלי?"
✅ תשובה:
{
  "model": "user",
  "action": "count",
  "where": {
    "userType": "EMPLOYEE",
    "organizationRoles": {
      "some": { "organizationId": ${orgId} }
    }
  }
}

- בטבלת users אין שדה ישיר בשם organizationId.
  יש להשתמש בקשר organizationRoles.some.organizationId לצורך סינון.
  
  🔁 נתח את השאלה:
  "${prompt}"
  
  אל תשנה את מבנה הדוגמה. החזר JSON תקני בלבד או {"skip": true}.
  `.trim();
  }
  
  
  
  export function getFallbackPrompt(prompt: string): string {
    return `
  המשתמש שאל: "${prompt}"
  ענה תשובה ברורה בעברית, ללא שימוש ב־DB.
  אם אינך בטוח, כתוב שאתה לא בטוח. אל תכתוב שאין צורך בבדיקה מול ה־DB.
    `;
  }
  
  export function getFinalAnswerPrompt(prompt: string, result: unknown): string {
    return `
    שאלה של המשתמש:
    "${prompt}"
  
    זוהי התשובה שהתקבלה מה־DB, בפורמט JSON:
    ${JSON.stringify(result, null, 2)}
  
    המשימה שלך:
    - תסביר את התוצאה בעברית פשוטה וברורה.
    - אל תשתמש במילים כמו "לא הצלחתי להבין", גם אם יש רק עובד אחד או תוצאה קצרה.
    - אם יש רשימת עובדים – ציין את מספרם ואת שמותיהם.
    - התשובה חייבת להיות עניינית, מדויקת, ובשפה טבעית. אל תמציא מידע שלא קיים.
    `.trim();
  }
  