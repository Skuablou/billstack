import posthog from "posthog-js";

export const initPostHog = () => {
  posthog.init(
    import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN || "phx_ZPLHQnM7LJBn7roy8VBMtjODakLOgWCUjDNetaQA3D7NxH1",
    {
      api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
    }
  );
};

export { posthog };
