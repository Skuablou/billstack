const PREMIUM_KEY = "billstack-premium";

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

/** Check URL for ?premium=success, activate premium, clean URL */
export function checkPremiumActivation(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.get("premium") === "success") {
    setPremiumUser(true);
    // Clean the URL
    params.delete("premium");
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.replaceState({}, "", newUrl);
    return true;
  }
  return false;
}
