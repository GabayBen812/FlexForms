# Analytics Instrumentation

This document describes how Mixpanel analytics is wired into FlexForms and how to extend it safely.

## Setup

1. Configure the environment variables listed in the [project README](../README) for both the client (`VITE_MIXPANEL_TOKEN`) and server (`MIXPANEL_TOKEN`).
2. Optional: enable verbose logging by setting `VITE_MIXPANEL_DEBUG=true` or `MIXPANEL_DEBUG=true` in local environments.
3. Without tokens, analytics is automatically disabled while the rest of the application keeps working.

## Client Integration

- The Mixpanel SDK is initialised in `src/app/providers/AnalyticsProvider.tsx` and attached in `src/main.tsx`.
- Route changes are captured through the shared router instance and tracked as `Page Viewed` events.
- Reusable helpers are exposed from `src/lib/analytics/mixpanel.ts`.
- Components and hooks should depend on the typed wrapper from `src/hooks/useAnalytics.ts`, which handles lazy initialisation and defensive fallbacks.
- Example usage:

```tsx
import { useAnalytics } from "@/hooks/useAnalytics";

const Example = () => {
  const { trackEvent } = useAnalytics();

  const handleClick = () => {
    trackEvent("ui:cta_clicked", {
      properties: { source: "hero" },
    });
  };

  return <button onClick={handleClick}>Donate</button>;
};
```

## Server Integration

- `MixpanelService` wraps the Node SDK (`src/nestjs/services/mixpanel.service.ts`) and is exported via `AnalyticsModule`.
- `AuthService` demonstrates usage by tracking login successes/failures and populating Mixpanel People profiles.
- Inject `MixpanelService` into other NestJS services where business events should be recorded. Always prefer domain-aligned event names (e.g., `forms:published`).

```ts
constructor(private readonly mixpanel: MixpanelService) {}

this.mixpanel.track("forms:published", {
  organizationId,
  formId,
  publishedBy: userId,
});
```

## Manual Verification

1. Start the client (`npm run dev`) and server (`npm run start:nest`) with tokens configured.
2. Log in through the UI and confirm the `auth:login_success` event appears in Mixpanel with user metadata.
3. Navigate between routes; each change should emit a `Page Viewed` event with the path.
4. Remove or comment the tokens and reload—no analytics events should be emitted and no errors should appear in the console or server logs.




