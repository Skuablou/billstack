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

/** Sync premium status from the database */
export async function syncPremiumStatus(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("premium_users")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const isPremium = !!data;
  setPremiumUser(isPremium);
  return isPremium;
}

/** Activate premium: save to DB + localStorage */
export async function activatePremium(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("premium_users")
    .upsert({ user_id: user.id }, { onConflict: "user_id" });

  if (!error) {
    setPremiumUser(true);
    return true;
  }
  return false;
}

/** Check URL for ?premium=success, activate premium, clean URL */
export async function checkPremiumActivation(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search);
  if (params.get("premium") === "success") {
    // Always set localStorage immediately so UI updates right away
    setPremiumUser(true);
    // Also try to persist to DB (may fail if auth not ready yet)
    activatePremium().catch(() => {});
    // Clean the URL
    params.delete("premium");
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.replaceState({}, "", newUrl);
    return true;
  }
  // Try syncing from DB, fall back to localStorage
  try {
    return await syncPremiumStatus();
  } catch {
    return isPremiumUser();
  }
}
