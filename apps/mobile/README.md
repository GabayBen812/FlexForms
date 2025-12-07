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

### Development (Local Server)
```bash
npm install
EXPO_PUBLIC_API_URL=http://localhost:3101 npm run start
```

### Production
```bash
npm install
EXPO_PUBLIC_API_URL=https://flexforms-production.up.railway.app npm run start
```

### Using Tunnel Mode (for Expo Go connection issues)
If you're having trouble connecting with Expo Go (e.g., "could not connect to the server"), use tunnel mode:
```bash
EXPO_PUBLIC_API_URL=https://flexforms-production.up.railway.app npm run start:tunnel
```

> ברירת המחדל היא `http://localhost:3101`, כפי שמוגדר בסביבה המקומית של השרת החיצוני.
> 
> **EAS Builds**: ה-API URL מוגדר אוטומטית ב-`eas.json` לפי פרופיל ה-build:
> - `development`: `http://localhost:3101`
> - `preview`: `https://flexforms-production.up.railway.app` (Railway backend)
> - `production`: `https://flexforms-production.up.railway.app` (Railway backend)

## Troubleshooting

### Expo Go Connection Issues
If you see "could not connect to the server" when scanning the QR code:

1. **Use Tunnel Mode**: Run `npm run start:tunnel` instead of `npm run start`
   - Tunnel mode uses Expo's servers to create a secure connection
   - Works even if your phone and computer are on different networks
   - May be slower than LAN mode but more reliable

2. **Check Network Connection**:
   - Ensure both devices are on the same Wi-Fi network (for LAN mode)
   - Check if firewall is blocking port 8081
   - Try disabling VPN if active

3. **Alternative**: Press `s` in the Expo CLI to switch connection modes (LAN/Tunnel)

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


