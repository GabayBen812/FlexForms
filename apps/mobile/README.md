# Paradize Mobile

אפליקציית React Native מבוססת Expo (TypeScript) עבור Paradize, עם אינטגרציה ל-NestJS Auth API.

## תלויות עיקריות
- Expo SDK 54 עם EAS (`eas.json`)
- React Navigation (Native Stack)
- React Query (`@tanstack/react-query`) לניהול בקשות/מטמון
- Axios לבקשות HTTP
- Tailwind CSS דרך NativeWind
- רכיבי Radix UI Slot לבניית קומפוננטות גמישות

## הרצת הפרויקט
```bash
npm install
EXPO_PUBLIC_API_URL=http://localhost:3101 npm run start
```

> ברירת המחדל היא `http://localhost:3101`, כפי שמוגדר בסביבה המקומית של השרת החיצוני.

## מבנה קבצים
- `src/api` – לקוחות API והפונקציות הייעודיות ל-Auth
- `src/providers` – ספקי הקשר (Context) ל-Auth ול-Query
- `src/navigation` – הגדרות React Navigation
- `src/components/ui` – קומפוננטות UI (כולל שימוש ב-Radix Slot)
- `src/screens` – מסכי האפליקציה (`Login`, `Home`)

## זרימת אימות
1. מסך התחברות שולח `POST /auth/login` עם אימייל/סיסמה.
2. עוגיית ה-JWT נשמרת ב-`SecureStore` ונשלחת אוטומטית ב-Header (`Cookie`) בכל בקשה.
3. לאחר התחברות מוצלחת, מתבצע `GET /auth/user` לקבלת פרטי המשתמש.
4. `POST /auth/logout` מנקה את העוגייה ואת המידע בקוד.

## בנייה ו-Deploy
הקובץ `eas.json` כולל פרופילי build (`development`, `preview`, `production`).

```bash
npx eas-cli build --profile preview --platform android
```

## משימות המשך מוצעות
- הוספת בדיקות יחידה/אינטגרציה לזרימת האימות.
- יצירת קומפוננטות נוספות מבוססות Radix UI לפי צרכי המוצר.
- ניהול שגיאות/הודעות מערכת באמצעות ספריית Toast ייעודית.
- תמיכה במצבי תצוגה כהה.


