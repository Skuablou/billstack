import { useMemo } from "react";

export interface StreakLevel {
  name: string;
  icon: string;
  minDays: number;
  tagline: string;
}

export const STREAK_LEVELS: StreakLevel[] = [
  { name: "Couch Potato", icon: "🥔", minDays: 0, tagline: "Time to start tracking!" },
  { name: "Penny Pincher", icon: "🐣", minDays: 1, tagline: "Every journey starts with one step!" },
  { name: "Budget Rookie", icon: "🦊", minDays: 3, tagline: "You're getting the hang of it!" },
  { name: "Money Hunter", icon: "🐺", minDays: 7, tagline: "A whole week! Respect." },
  { name: "Cash Commander", icon: "💰", minDays: 14, tagline: "Two weeks strong! Beast mode." },
  { name: "Finance Boss", icon: "🦁", minDays: 30, tagline: "A whole month?! You're insane." },
  { name: "Geld-Drache", icon: "🐉", minDays: 60, tagline: "You breathe fire and savings." },
  { name: "Legendary Banker", icon: "👑", minDays: 100, tagline: "Wall Street wants your number." },
];

export function getStreakLevel(streak: number): StreakLevel {
  let level = STREAK_LEVELS[0];
  for (const l of STREAK_LEVELS) {
    if (streak >= l.minDays) level = l;
  }
  return level;
}

export function getNextLevel(streak: number): StreakLevel | null {
  for (const l of STREAK_LEVELS) {
    if (streak < l.minDays) return l;
  }
  return null;
}

export function getStreakMessage(streak: number): string {
  if (streak === 0) return "Log an expense to start your streak!";
  const level = getStreakLevel(streak);
  const messages = [
    `🔥 ${streak} day streak! ${level.tagline}`,
    `${level.icon} ${streak} days! You're a ${level.name}!`,
    `🔥 ${streak} Tage am Stück! Weiter so!`,
    `${level.icon} ${streak} day streak! Keep grinding!`,
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

type DataMap = Record<string, { amt: number; id?: string }[]>;

export function calculateStreak(data: DataMap): { current: number; best: number; totalDays: number; thisMonth: number } {
  const allDates = Object.keys(data).filter(k => data[k] && data[k].length > 0).sort();
  const totalDays = allDates.length;

  // This month count
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisMonth = allDates.filter(d => d.startsWith(monthPrefix)).length;

  if (allDates.length === 0) return { current: 0, best: 0, totalDays: 0, thisMonth: 0 };

  // Calculate current streak (counting back from today or yesterday)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const toDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const dateSet = new Set(allDates);
  let current = 0;
  
  // Start from today, if no entry today, start from yesterday
  let checkDate = new Date(today);
  if (!dateSet.has(toDateStr(checkDate))) {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  while (dateSet.has(toDateStr(checkDate))) {
    current++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Calculate best streak
  let best = 0;
  let tempStreak = 1;
  for (let i = 1; i < allDates.length; i++) {
    const prev = new Date(allDates[i - 1]);
    const curr = new Date(allDates[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (Math.round(diff) === 1) {
      tempStreak++;
    } else {
      best = Math.max(best, tempStreak);
      tempStreak = 1;
    }
  }
  best = Math.max(best, tempStreak, current);

  return { current, best, totalDays, thisMonth };
}

export function useStreak(data: DataMap) {
  return useMemo(() => calculateStreak(data), [data]);
}
