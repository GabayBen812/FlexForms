import { ReactNode, useEffect } from "react";
import { router } from "@/utils/routes/router";
import {
  initializeMixpanel,
  registerSuperProperties,
  trackPageView,
} from "@/lib/analytics/mixpanel";

type AnalyticsProviderProps = {
  children: ReactNode;
};

export const AnalyticsProvider = ({ children }: AnalyticsProviderProps) => {
  useEffect(() => {
    const enabled = initializeMixpanel();

    if (!enabled) {
      return;
    }

    registerSuperProperties({
      app: "FlexForms Client",
      environment: import.meta.env.MODE,
    });

    trackPageView(router.state.location);

    const unsubscribe = router.subscribe((state) => {
      trackPageView(state.location, {
        action: state.historyAction,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return <>{children}</>;
};










