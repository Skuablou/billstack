import { motion } from "framer-motion";
import { getStreakLevel, getNextLevel, STREAK_LEVELS } from "@/hooks/use-streak";

interface StreakCardProps {
  current: number;
  best: number;
  totalDays: number;
  thisMonth: number;
}

export default function StreakCard({ current, best, totalDays, thisMonth }: StreakCardProps) {
  const level = getStreakLevel(current);
  const next = getNextLevel(current);

  // Progress to next level
  const prevMin = level.minDays;
  const nextMin = next ? next.minDays : level.minDays;
  const progress = next ? Math.min(100, Math.round(((current - prevMin) / (nextMin - prevMin)) * 100)) : 100;

  const badgeLabel = current >= 30 ? "Legendary!" : current >= 14 ? "Unstoppable!" : current >= 7 ? "On fire!" : current >= 3 ? "Keep it up!" : current >= 1 ? "Nice start!" : "Start tracking!";

  // Week progress: 7 days needed per level, show progress in current week-cycle
  const daysInCurrentWeek = current % 7;
  const completedToday = daysInCurrentWeek; // how many days done in this 7-day cycle

  return (
    <div className="space-y-3">
      {/* Main streak card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border p-4"
        style={{
          background: "hsl(var(--card))",
          borderColor: "hsl(267 100% 50% / 0.25)",
        }}
      >
        {/* Top row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{current >= 3 ? "🔥" : "✨"}</span>
            <div>
              <p className="text-2xl font-display font-bold" style={{ color: "#8100FF" }}>{current}</p>
              <p className="text-[11px] text-muted-foreground">day streak</p>
            </div>
          </div>
          <div
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{
              background: "hsl(267 100% 50% / 0.15)",
              border: "0.5px solid hsl(267 100% 50% / 0.3)",
              color: "#8100FF",
            }}
          >
            {badgeLabel}
          </div>
        </div>

        {/* Day circles - show which days of this week had entries */}
        <div className="flex gap-1.5 justify-between mb-3">
          {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
            const isDone = dayNum <= completedToday;
            const isNext = dayNum === completedToday + 1;

            return (
              <div key={dayNum} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all"
                  style={{
                    background: isDone
                      ? "#8100FF"
                      : isNext
                        ? "hsl(267 100% 50% / 0.2)"
                        : "hsl(var(--muted))",
                    border: isNext
                      ? "1.5px solid #8100FF"
                      : "1px solid transparent",
                    color: isDone
                      ? "white"
                      : isNext
                        ? "#8100FF"
                        : "hsl(var(--muted-foreground))",
                  }}
                >
                  {isDone ? "✓" : dayNum}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer stats */}
        <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: "hsl(var(--border))" }}>
          <div className="text-center flex-1">
            <p className="text-sm font-semibold text-foreground">{best}</p>
            <p className="text-[10px] text-muted-foreground">best streak</p>
          </div>
          <div className="w-px h-7" style={{ background: "hsl(var(--border))" }} />
          <div className="text-center flex-1">
            <p className="text-sm font-semibold text-foreground">{totalDays}</p>
            <p className="text-[10px] text-muted-foreground">total days</p>
          </div>
          <div className="w-px h-7" style={{ background: "hsl(var(--border))" }} />
          <div className="text-center flex-1">
            <p className="text-sm font-semibold text-foreground">{thisMonth}</p>
            <p className="text-[10px] text-muted-foreground">this month</p>
          </div>
        </div>
      </motion.div>

      {/* Level / Milestone card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border p-3 flex items-center gap-3"
        style={{
          background: "hsl(267 100% 50% / 0.06)",
          borderColor: "hsl(267 100% 50% / 0.2)",
        }}
      >
        <span className="text-2xl shrink-0">{level.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">{level.name}</p>
            {next && (
              <span className="text-[10px] text-muted-foreground">
                {next.icon} in {next.minDays - current}d
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">{level.tagline}</p>
          {next && (
            <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: "#8100FF" }}
              />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
