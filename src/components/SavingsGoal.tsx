import { useState } from "react";
import { Target, CalendarIcon, Check } from "lucide-react";
import targetIcon from "@/assets/3d-target.png";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useCurrency } from "@/lib/CurrencyContext";
import { useTheme } from "@/lib/ThemeContext";
import { motion } from "framer-motion";
import { format, differenceInDays, differenceInWeeks, differenceInMonths } from "date-fns";
import { cn } from "@/lib/utils";

export type SavingsInterval = "daily" | "weekly" | "monthly";

export interface ActiveGoal {
  name: string;
  totalAmount: number;
  targetDate: Date;
  interval: SavingsInterval;
  paidPeriods: number;
}

function getIntervalDays(interval: SavingsInterval): number {
  if (interval === "daily") return 1;
  return interval === "weekly" ? 7 : 30;
}

function getIntervalLabel(interval: SavingsInterval): string {
  if (interval === "daily") return "day";
  return interval === "weekly" ? "wk" : "mo";
}

export function getTotalPeriods(targetDate: Date, interval: SavingsInterval): number {
  const now = new Date();
  const totalDays = Math.max(1, differenceInDays(targetDate, now));
  return Math.max(1, Math.ceil(totalDays / getIntervalDays(interval)));
}

export function getMonthlyEquivalent(goal: ActiveGoal): number {
  const totalPeriods = getTotalPeriods(goal.targetDate, goal.interval);
  const perPeriod = goal.totalAmount / totalPeriods;
  if (goal.interval === "weekly") return perPeriod * (30 / 7);
  return perPeriod;
}

function getTimeLeftLabel(targetDate: Date): string {
  const now = new Date();
  const days = differenceInDays(targetDate, now);
  if (days <= 0) return "Due today";
  if (days < 30) return days === 1 ? "1 day left" : `${days} days left`;
  const months = differenceInMonths(targetDate, now);
  if (months === 1) return "1 month left";
  return `${months} months left`;
}

/* ──── Creator Form (goes in right column under Budget Calculator) ──── */
interface FormProps {
  onAdd: (goal: ActiveGoal) => void;
}

export function SavingsGoalForm({ onAdd }: FormProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [goalName, setGoalName] = useState("");
  const [goalTotal, setGoalTotal] = useState("");
  const [goalDate, setGoalDate] = useState<Date>();
  const [interval, setInterval] = useState<SavingsInterval>("weekly");

  const handleStartSaving = () => {
    if (!goalName.trim() || !goalTotal || !goalDate) return;
    const total = parseFloat(goalTotal);
    if (total <= 0) return;
    onAdd({ name: goalName.trim(), totalAmount: total, targetDate: goalDate, interval, paidPeriods: 0 });
    setGoalName("");
    setGoalTotal("");
    setGoalDate(undefined);
    // Auto-scroll to savings plans display
    setTimeout(() => {
      const el = document.getElementById("savings-plans-display");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border p-5 space-y-3"
      style={{
        background: isLight ? "linear-gradient(135deg, hsl(267 70% 92%), hsl(267 50% 86%))" : "linear-gradient(135deg, hsl(267 60% 24%), hsl(267 40% 16%))",
        borderColor: isLight ? "hsl(267 70% 55%)" : "hsl(267 70% 40%)",
        borderWidth: "2px",
        boxShadow: isLight ? "0 4px 20px -6px hsl(267 80% 60% / 0.3)" : "0 0 30px -10px hsl(267 90% 50% / 0.2)",
      }}
    >
      <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
        <img src={targetIcon} alt="Savings Goal" className="w-6 h-6 object-contain" />
        Savings Goal
      </h3>
      <Input
        placeholder="Goal name (e.g. Vacation Spain)"
        value={goalName}
        onChange={(e) => setGoalName(e.target.value)}
        className="bg-muted/50 border-border text-foreground h-10 text-sm"
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="number"
          placeholder="Total amount"
          value={goalTotal}
          onChange={(e) => setGoalTotal(e.target.value)}
          className="bg-muted/50 border-border text-foreground h-10 text-sm"
        />
        <Select value={interval} onValueChange={(v) => setInterval(v as SavingsInterval)}>
          <SelectTrigger className="bg-muted/50 border-border text-foreground h-10 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-10 text-sm bg-muted/50 border-border",
              !goalDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {goalDate ? format(goalDate, "PPP") : "Target date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={goalDate}
            onSelect={setGoalDate}
            disabled={(date) => date <= new Date()}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      <Button
        className="w-full rounded-lg gap-1.5 text-sm font-semibold h-10"
        style={{ background: "linear-gradient(135deg, hsl(267 100% 50%), hsl(280 100% 55%))" }}
        disabled={!goalName.trim() || !goalTotal || !goalDate}
        onClick={handleStartSaving}
      >
        Start Saving
      </Button>
      <p className="text-xs text-muted-foreground/70 italic">
        💡 Tip: Before using the savings goal, calculate your left over budget first.
      </p>
    </motion.div>
  );
}

/* ──── Active Goals Display (goes in left column) ──── */
interface DisplayProps {
  goals: ActiveGoal[];
  onMarkPaid: (index: number) => void;
  onRemove: (index: number) => void;
}

export function SavingsGoalDisplay({ goals, onMarkPaid, onRemove }: DisplayProps) {
  const { currency } = useCurrency();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const fmt = (n: number) => `${n.toFixed(2)}${currency}`;

  if (goals.length === 0) return null;

  return (
    <div className="space-y-4" id="savings-plans-display">
      <h2 className="font-display font-semibold text-foreground text-lg flex items-center gap-2">
        <Target className="w-5 h-5 text-primary" />
        Savings Plans
      </h2>
      {goals.map((goal, i) => {
        const totalPeriods = getTotalPeriods(goal.targetDate, goal.interval);
        const perPeriod = goal.totalAmount / totalPeriods;
        const savedSoFar = perPeriod * goal.paidPeriods;
        const isComplete = goal.paidPeriods >= totalPeriods;

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border p-5 space-y-4"
            style={{
              background: isLight ? "linear-gradient(135deg, hsl(267 70% 92%), hsl(267 50% 86%))" : "linear-gradient(135deg, hsl(267 60% 24%), hsl(267 40% 16%))",
              borderColor: isComplete ? "hsl(36 100% 50% / 0.5)" : (isLight ? "hsl(267 70% 55%)" : "hsl(267 70% 40%)"),
              borderWidth: "2px",
              boxShadow: isComplete
                ? "0 0 30px -10px hsl(36 100% 50% / 0.3)"
                : isLight ? "0 4px 20px -6px hsl(267 80% 60% / 0.3)" : "0 0 30px -10px hsl(267 80% 50% / 0.1)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-foreground font-semibold text-base">{goal.name}</h3>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {getTimeLeftLabel(goal.targetDate)} · until {format(goal.targetDate, "MMM d, yyyy")}
                </p>
              </div>
              <button
                onClick={() => onRemove(i)}
                className="text-muted-foreground hover:text-destructive text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg p-2.5 text-center" style={{ backgroundColor: "hsl(267 40% 20% / 0.6)" }}>
                <p className="text-xs text-muted-foreground">Target</p>
                <p className="text-sm font-bold text-foreground">{fmt(goal.totalAmount)}</p>
              </div>
              <div className="rounded-lg p-2.5 text-center" style={{ backgroundColor: "hsl(267 40% 20% / 0.6)" }}>
                <p className="text-xs text-muted-foreground">Per {getIntervalLabel(goal.interval)}</p>
                <p className="text-sm font-bold" style={{ color: "hsl(267 100% 60%)" }}>{fmt(perPeriod)}</p>
              </div>
              <div className="rounded-lg p-2.5 text-center" style={{ backgroundColor: "hsl(267 40% 20% / 0.6)" }}>
                <p className="text-xs text-muted-foreground">Saved</p>
                <p className="text-sm font-bold" style={{ color: "hsl(145 70% 45%)" }}>{fmt(savedSoFar)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Progress ({goal.paidPeriods}/{totalPeriods})</p>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: totalPeriods }, (_, idx) => {
                  const isPaid = idx < goal.paidPeriods;
                  const isLast = idx === totalPeriods - 1;
                  return (
                    <div
                      key={idx}
                      className="w-5 h-5 rounded-sm transition-colors"
                      style={{
                        backgroundColor: isPaid
                          ? "hsl(145 70% 45%)"
                          : isLast
                            ? "hsl(36 100% 50%)"
                            : "hsl(230 14% 18%)",
                        border: isLast && !isPaid ? "1.5px solid hsl(36 100% 50% / 0.7)" : "1px solid hsl(230 14% 22%)",
                        boxShadow: isPaid ? "0 0 6px hsl(140 60% 45% / 0.3)" : isLast ? "0 0 6px hsl(36 100% 50% / 0.3)" : "none",
                      }}
                      title={
                        isPaid
                          ? `Period ${idx + 1} — Paid`
                          : isLast
                            ? `Goal! ${format(goal.targetDate, "PP")}`
                            : `Period ${idx + 1}`
                      }
                    />
                  );
                })}
              </div>
            </div>

            {!isComplete ? (
              <Button
                onClick={() => onMarkPaid(i)}
                className="w-full rounded-lg gap-2 text-sm font-semibold h-10"
                style={{ background: "linear-gradient(135deg, hsl(145 70% 40%), hsl(145 70% 35%))" }}
              >
                <Check className="w-4 h-4" />
                Mark as Paid ({getIntervalLabel(goal.interval)})
              </Button>
            ) : (
              <div className="rounded-lg p-3 text-center" style={{ backgroundColor: "hsl(36 100% 50% / 0.1)", border: "1px solid hsl(36 100% 50% / 0.3)" }}>
                <p className="text-sm font-semibold" style={{ color: "hsl(36 100% 50%)" }}>
                  🎉 Goal reached!
                </p>
              </div>
            )}
          </motion.div>
        );
      })}
      <p className="text-xs text-muted-foreground/70 italic">
        💡 Remember to set this money aside — the app tracks it, but you have to move it.
      </p>
    </div>
  );
}

// Keep default export for backwards compat (not used anymore but safe)
export default function SavingsGoal() {
  return null;
}
