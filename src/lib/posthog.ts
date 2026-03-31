import posthog from "posthog-js";

const POSTHOG_TOKEN = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN || "phc_NEgO5kDJ65wgSiTwqWhcrBRgTXYX3596AdJySpxrpPl";
const POSTHOG_HOST = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

export const initPostHog = () => {
  if (typeof window !== "undefined") {
    posthog.init(POSTHOG_TOKEN, {
      api_host: POSTHOG_HOST,
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
    });
  }
};

export { posthog };
