export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  category: string;
  billingCycle: "Monthly" | "Yearly";
  billingDate: number;
  color: string;
  icon: string;
  reminderDays: number;
}

export const CATEGORIES = [
  "Housing",
  "Car & Transport",
  "Health Insurance",
  "Debt Payments",
  "Utilities & Phone",
  "Education",
  "Streaming & Subscriptions",
  "Fitness & Wellness",
  "Other",
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  "Housing": "hsl(220 70% 50%)",
  "Car & Transport": "hsl(35 90% 50%)",
  "Health Insurance": "hsl(0 72% 50%)",
  "Debt Payments": "hsl(340 70% 50%)",
  "Utilities & Phone": "hsl(200 70% 45%)",
  "Education": "hsl(270 60% 55%)",
  "Streaming & Subscriptions": "hsl(330 70% 55%)",
  "Fitness & Wellness": "hsl(45 90% 55%)",
  "Other": "hsl(215 12% 50%)",
};

export const CATEGORY_ICONS: Record<string, string> = {
  "Housing": "🏠",
  "Car & Transport": "🚗",
  "Health Insurance": "🏥",
  "Debt Payments": "💳",
  "Utilities & Phone": "📱",
  "Education": "🎓",
  "Streaming & Subscriptions": "🎬",
  "Fitness & Wellness": "💪",
  "Other": "📦",
};

const STORAGE_KEY = "billstack-subscriptions";
const MAX_FREE_SUBSCRIPTIONS = 4;

export function getMaxFreeSubscriptions() {
  return MAX_FREE_SUBSCRIPTIONS;
}

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
    { id: "1", name: "Rent", amount: 950, currency: "€", category: "Housing", billingCycle: "Monthly", billingDate: 1, color: "hsl(220 70% 50%)", icon: "🏠" },
    { id: "2", name: "Netflix", amount: 15.99, currency: "€", category: "Streaming & Subscriptions", billingCycle: "Monthly", billingDate: 15, color: "hsl(330 70% 55%)", icon: "🎬" },
  ];
}

export function getMonthlyAmount(sub: Subscription): number {
  return sub.billingCycle === "Yearly" ? sub.amount / 12 : sub.amount;
}

export function getYearlyTotal(subs: Subscription[]): number {
  return subs.reduce((sum, s) => {
    return sum + (s.billingCycle === "Yearly" ? s.amount : s.amount * 12);
  }, 0);
}

export function getMonthlyTotal(subs: Subscription[]): number {
  return subs.reduce((sum, s) => sum + getMonthlyAmount(s), 0);
}

export function getUpcomingPayments(subs: Subscription[]) {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  return subs
    .map((sub) => {
      let nextDate: Date;
      if (sub.billingDate >= currentDay) {
        nextDate = new Date(currentYear, currentMonth, sub.billingDate);
      } else {
        nextDate = new Date(currentYear, currentMonth + 1, sub.billingDate);
      }
      const diffTime = nextDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...sub, nextDate, daysUntil: diffDays };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);
}
