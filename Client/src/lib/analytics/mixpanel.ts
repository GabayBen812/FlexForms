import mixpanel from "mixpanel-browser";

const TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN;
const DEBUG = import.meta.env.VITE_MIXPANEL_DEBUG === "true";
const IS_BROWSER = typeof window !== "undefined";

let isInitialized = false;
let isEnabled = false;

const noop = () => undefined;

type MixpanelProperties = Record<string, unknown>;

const ensureInitialized = () => {
  if (!IS_BROWSER || isInitialized) {
    return isEnabled;
  }

  if (!TOKEN) {
    isInitialized = true;
    isEnabled = false;
    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.info("[Mixpanel] Token missing; analytics disabled");
    }
    return false;
  }

  mixpanel.init(TOKEN, {
    debug: DEBUG,
    track_pageview: false,
    ignore_dnt: false,
  });

  isInitialized = true;
  isEnabled = true;

  return true;
};

export const initializeMixpanel = () => ensureInitialized();

const withClient = <T extends unknown[]>(
  fn: (...args: T) => void,
  fallback: (...args: T) => void = noop
) => {
  return (...args: T) => {
    if (!ensureInitialized()) {
      return fallback(...args);
    }

    return fn(...args);
  };
};

export const trackEvent = withClient(
  (event: string, properties: MixpanelProperties = {}) => {
    mixpanel.track(event, properties);
  }
);

export const trackPageView = withClient(
  (
    location:
      | string
      | {
          pathname?: string;
          search?: string;
          hash?: string;
        },
    properties: MixpanelProperties = {}
  ) => {
    const path =
      typeof location === "string"
        ? location
        : [
            location.pathname ?? "",
            location.search ?? "",
            location.hash ?? "",
          ].join("");

    mixpanel.track("Page Viewed", {
      path,
      ...properties,
    });
  }
);

export const identifyUser = withClient((id: string) => {
  mixpanel.identify(id);
});

export const aliasUser = withClient((id: string) => {
  mixpanel.alias(id);
});

export const resetMixpanel = withClient(() => {
  mixpanel.reset();
});

export const setUserProfile = withClient(
  (properties: MixpanelProperties = {}) => {
    mixpanel.people.set(properties);
  }
);

export const registerSuperProperties = withClient(
  (properties: MixpanelProperties = {}) => {
    mixpanel.register(properties);
  }
);

export const unregisterSuperProperty = withClient((propertyName: string) => {
  mixpanel.unregister(propertyName);
});

export const setOnceSuperProperties = withClient(
  (properties: MixpanelProperties = {}) => {
    mixpanel.register_once(properties);
  }
);






