import { supabase } from "@/integrations/supabase/client";

const PREMIUM_KEY = "billstack-premium";

/** Check premium from local cache */
export function isPremiumUser(): boolean {
  return localStorage.getItem(PREMIUM_KEY) === "true";
}

export function setPremiumUser(value: boolean) {
  if (value) {
    localStorage.setItem(PREMIUM_KEY, "true");
  } else {
    localStorage.removeItem(PREMIUM_KEY);
  }
}

/** Check subscription status via Stripe */
export async function checkSubscription(): Promise<{ subscribed: boolean; subscription_end?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("check-subscription");
    if (error) throw error;
    setPremiumUser(data?.subscribed ?? false);
    return data ?? { subscribed: false };
  } catch {
    // Fallback to DB check
    return { subscribed: isPremiumUser() };
  }
}

/** Start Stripe checkout for premium */
export async function startCheckout(): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke("create-checkout");
  if (error || !data?.url) return null;
  return data.url;
}

/** Open Stripe customer portal */
export async function openCustomerPortal(): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke("customer-portal");
  if (error || !data?.url) return null;
  return data.url;
}

/** Check URL for ?premium=success, then verify with Stripe */
export async function checkPremiumActivation(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search);
  if (params.get("premium") === "success") {
    setPremiumUser(true);
    params.delete("premium");
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.replaceState({}, "", newUrl);
  }
  
  const result = await checkSubscription();
  return result.subscribed;
}
