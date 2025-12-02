# Internationalization (i18n)

This document describes how internationalization is implemented in FlexForms, including language support, RTL (Right-to-Left) handling, and translation patterns.

## Overview

FlexForms supports multiple languages with:
- **Primary Languages**: English (en) and Hebrew (he)
- **RTL Support**: Automatic RTL layout for Hebrew
- **Translation Management**: i18next with JSON files
- **Language Detection**: localStorage and cookies (not browser language)

## Setup

### Client Configuration

i18n is configured in `Client/src/i18n/index.ts`:

```typescript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "he", // Default to Hebrew
    debug: true, // Enable in development
    load: "all",
    defaultNS: "translation",
    ns: ["translation"],
    nsSeparator: false,
    backend: { loadPath: "/locales/{{lng}}/{{ns}}.json" },
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'cookie'],
      caches: ['localStorage', 'cookie'],
    },
  });
```

### Translation Files

Translation files are located in:
```
public/locales/
  en/
    translation.json
  he/
    translation.json
```

## Using Translations

### Basic Usage

```tsx
import { useTranslation } from "react-i18next";

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t("welcome")}</h1>
      <p>{t("description")}</p>
    </div>
  );
};
```

### Translation Keys

Translation keys use dot notation for nested structures:

```json
// translation.json
{
  "forms": {
    "title": "Forms",
    "create": "Create Form",
    "edit": "Edit Form"
  }
}
```

```tsx
// Usage
{t("forms.title")}
{t("forms.create")}
```

### Interpolation

Pass variables to translations:

```json
{
  "welcome": "Welcome, {{name}}!",
  "items_count": "You have {{count}} items"
}
```

```tsx
{t("welcome", { name: user.name })}
{t("items_count", { count: items.length })}
```

### Pluralization

i18next handles pluralization automatically:

```json
{
  "items": "{{count}} item",
  "items_plural": "{{count}} items"
}
```

```tsx
{t("items", { count: 1 })}
{t("items", { count: 5 })}
```

## RTL (Right-to-Left) Support

### Automatic RTL Detection

The router automatically sets document direction based on language:

```tsx
// Client/src/Router.tsx
useEffect(() => {
  document.documentElement.dir = i18n.language === "he" ? "rtl" : "ltr";
}, [i18n.language]);
```

### CSS RTL Handling

Tailwind CSS automatically handles RTL with the `dir` attribute:

```tsx
<div className="mr-4"> {/* margin-right in LTR, margin-left in RTL */}
  Content
</div>
```

### Manual RTL Classes

For custom RTL handling:

```tsx
<div className={i18n.language === "he" ? "text-right" : "text-left"}>
  {content}
</div>
```

## Language Switching

### Language Picker Component

Use the `LanguagePicker` component:

```tsx
import LanguagePicker from "@/components/LanguagePicker";

<LanguagePicker />
```

### Programmatic Language Change

```tsx
import { useTranslation } from "react-i18next";

const MyComponent = () => {
  const { i18n } = useTranslation();
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    // Direction is automatically updated by Router
  };
  
  return (
    <button onClick={() => changeLanguage("he")}>עברית</button>
    <button onClick={() => changeLanguage("en")}>English</button>
  );
};
```

## Translation Best Practices

### 1. Always Use Translation Keys

```tsx
// ❌ Bad - Hardcoded text
<button>Submit</button>

// ✅ Good - Translated
<button>{t("submit")}</button>
```

### 2. Use Descriptive Keys

```tsx
// ❌ Bad - Generic key
{t("text1")}

// ✅ Good - Descriptive key
{t("forms.create.button")}
```

### 3. Group Related Translations

```json
{
  "forms": {
    "create": {
      "title": "Create Form",
      "button": "Create",
      "success": "Form created successfully"
    }
  }
}
```

### 4. Handle Missing Translations

i18next will show the key if translation is missing. In development, enable debug mode to see missing keys.

### 5. Date Formatting

Use the centralized date utilities for consistent date formatting:

```tsx
import { formatDateForDisplay } from "@/lib/dateUtils";

// Automatically formats as DD/MM/YYYY
const formatted = formatDateForDisplay(date);
```

## Server-Side Considerations

### Error Messages

Server error messages should be internationalized on the client:

```typescript
// Server returns error key or English message
throw new BadRequestException('user_not_found');

// Client translates
const errorMessage = t(`errors.${error.key}`) || error.message;
```

### API Response Messages

API responses can include translation keys:

```typescript
{
  status: 200,
  message: "form_created_successfully" // Translation key
}
```

## Common Patterns

### Form Labels

```tsx
<label>{t("forms.fields.name.label")}</label>
<input placeholder={t("forms.fields.name.placeholder")} />
```

### Button Text

```tsx
<button>
  {isLoading ? t("saving") : t("save")}
</button>
```

### Toast Messages

```tsx
toast({
  title: t("success"),
  description: t("form_created_successfully")
});
```

### Table Headers

```tsx
const columns = [
  { header: t("forms.table.name"), accessor: "name" },
  { header: t("forms.table.created"), accessor: "createdAt" }
];
```

## Translation File Structure

### Recommended Structure

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit"
  },
  "forms": {
    "title": "Forms",
    "create": "Create Form",
    "table": {
      "name": "Name",
      "created": "Created At"
    }
  },
  "errors": {
    "generic": "An error occurred",
    "not_found": "Resource not found"
  }
}
```

## Language Detection

### Priority Order

1. **localStorage**: User's previous language choice
2. **Cookie**: Language preference from cookie
3. **Fallback**: Default language (Hebrew)

### Setting Language Preference

```tsx
// Language is automatically saved to localStorage when changed
i18n.changeLanguage("en");
// Stored in localStorage and cookie for persistence
```

## Mobile App Considerations

The mobile app (`apps/mobile`) uses the same i18n setup but may have different translation files or structure. Check mobile-specific i18n configuration if working on mobile features.

## Troubleshooting

### Translations Not Showing
- Verify translation files exist in `public/locales/{lng}/translation.json`
- Check that translation keys match exactly (case-sensitive)
- Ensure i18n is properly initialized in `main.tsx`

### RTL Not Working
- Verify `document.documentElement.dir` is set correctly
- Check that Tailwind CSS RTL plugin is configured
- Ensure language is correctly detected

### Language Not Persisting
- Check localStorage and cookies in browser DevTools
- Verify language detection order in i18n config
- Ensure language change is saved after switching

### Missing Translation Keys
- Enable debug mode: `debug: true` in i18n config
- Check console for missing key warnings
- Verify translation files are loaded correctly

## Adding New Languages

To add a new language:

1. Create translation file: `public/locales/{lang}/translation.json`
2. Add language to i18n configuration (if needed)
3. Update language picker component
4. Test RTL support if the language is RTL

