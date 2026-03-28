export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  category: string;
  billingDate: number; // day of month
  color: string;
  icon: string;
}

export const CATEGORIES = [
  "Streaming",
  "Music",
  "Software",
  "Gaming",
  "Cloud",
  "Fitness",
  "News",
  "Other",
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Streaming: "hsl(0 72% 56%)",
  Music: "hsl(280 70% 55%)",
  Software: "hsl(172 66% 50%)",
  Gaming: "hsl(45 90% 55%)",
  Cloud: "hsl(210 80% 55%)",
  Fitness: "hsl(140 60% 45%)",
  News: "hsl(25 85% 55%)",
  Other: "hsl(215 12% 50%)",
};

export const CATEGORY_ICONS: Record<string, string> = {
  Streaming: "🎬",
  Music: "🎵",
  Software: "💻",
  Gaming: "🎮",
  Cloud: "☁️",
  Fitness: "💪",
  News: "📰",
  Other: "📦",
};

const STORAGE_KEY = "subtracker-subscriptions";

export function loadSubscriptions(): Subscription[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return getDefaultSubscriptions();
  try {
    return JSON.parse(data);
  } catch {
    return getDefaultSubscriptions();
  }
}

export function saveSubscriptions(subs: Subscription[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
}

function getDefaultSubscriptions(): Subscription[] {
  return [
    { id: "1", name: "Netflix", amount: 15.99, currency: "€", category: "Streaming", billingDate: 5, color: "hsl(0 72% 56%)", icon: "🎬" },
    { id: "2", name: "Spotify", amount: 9.99, currency: "€", category: "Music", billingDate: 12, color: "hsl(280 70% 55%)", icon: "🎵" },
    { id: "3", name: "iCloud+", amount: 2.99, currency: "€", category: "Cloud", billingDate: 20, color: "hsl(210 80% 55%)", icon: "☁️" },
    { id: "4", name: "ChatGPT Plus", amount: 20.00, currency: "€", category: "Software", billingDate: 1, color: "hsl(172 66% 50%)", icon: "💻" },
  ];
}
