import { useCallback } from "react";
import {
  trackEvent,
  trackPageView,
  identifyUser,
  aliasUser,
  resetMixpanel,
  setUserProfile,
  registerSuperProperties,
  unregisterSuperProperty,
  setOnceSuperProperties,
  initializeMixpanel,
} from "@/lib/analytics/mixpanel";

type TrackOptions = {
  properties?: Record<string, unknown>;
};

export const useAnalytics = () => {
  const safeTrack = useCallback(
    (event: string, options: TrackOptions = {}) => {
      initializeMixpanel();
      trackEvent(event, options.properties);
    },
    []
  );

  const safeTrackPageView = useCallback(
    (
      location:
        | string
        | {
            pathname?: string;
            search?: string;
            hash?: string;
          },
      properties?: Record<string, unknown>
    ) => {
      initializeMixpanel();
      trackPageView(location, properties);
    },
    []
  );

  const safeIdentify = useCallback((id: string) => {
    initializeMixpanel();
    identifyUser(id);
  }, []);

  const safeAlias = useCallback((id: string) => {
    initializeMixpanel();
    aliasUser(id);
  }, []);

  const safeReset = useCallback(() => {
    initializeMixpanel();
    resetMixpanel();
  }, []);

  const safeSetProfile = useCallback((properties: Record<string, unknown>) => {
    initializeMixpanel();
    setUserProfile(properties);
  }, []);

  const safeRegister = useCallback((properties: Record<string, unknown>) => {
    initializeMixpanel();
    registerSuperProperties(properties);
  }, []);

  const safeSetOnce = useCallback((properties: Record<string, unknown>) => {
    initializeMixpanel();
    setOnceSuperProperties(properties);
  }, []);

  const safeUnregister = useCallback((property: string) => {
    initializeMixpanel();
    unregisterSuperProperty(property);
  }, []);

  return {
    trackEvent: safeTrack,
    trackPageView: safeTrackPageView,
    identifyUser: safeIdentify,
    aliasUser: safeAlias,
    reset: safeReset,
    setUserProfile: safeSetProfile,
    registerSuperProperties: safeRegister,
    setOnceSuperProperties: safeSetOnce,
    unregisterSuperProperty: safeUnregister,
  };
};










