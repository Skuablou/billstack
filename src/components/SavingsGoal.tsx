import { useState } from "react";
import { Target, CalendarIcon, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useCurrency } from "@/lib/CurrencyContext";
import { motion } from "framer-motion";
import { format, differenceInDays, differenceInWeeks, differenceInMonths, addDays } from "date-fns";
import { cn } from "@/lib/utils";

type Interval = "weekly" | "biweekly" | "monthly";

interface ActiveGoal {
  name: string;
  totalAmount: number;
  targetDate: Date;
  interval: Interval;
  paidPeriods: number;
}

function getIntervalDays(interval: Interval): number {
  switch (interval) {
    case "weekly": return 7;
    case "biweekly": return 14;
    case "monthly": return 30;
  }
}

function getIntervalLabel(interval: Interval): string {
  switch (interval) {
    case "weekly": return "wk";
    case "biweekly": return "2wk";
    case "monthly": return "mo";
  }
}

function getTotalPeriods(targetDate: Date, interval: Interval): number {
  const now = new Date();
  const totalDays = Math.max(1, differenceInDays(targetDate, now));
  return Math.max(1, Math.ceil(totalDays / getIntervalDays(interval)));
}

function getTimeLeftLabel(targetDate: Date): string {
  const months = differenceInMonths(targetDate, new Date());
  if (months > 1) return `${months} months left`;
  if (months === 1) return "1 month left";
  const weeks = differenceInWeeks(targetDate, new Date());
  if (weeks > 1) return `${weeks} weeks left`;
  if (weeks === 1) return "1 week left";
  const days = differenceInDays(targetDate, new Date());
  if (days > 1) return `${days} days left`;
  if (days === 1) return "1 day left";
  return "Due today";
}

export default function SavingsGoal() {
  const { currency } = useCurrency();
  const [goalName, setGoalName] = useState("");
  const [goalTotal, setGoalTotal] = useState("");
  const [goalDate, setGoalDate] = useState<Date>();
  const [interval, setInterval] = useState<Interval>("weekly");
  const [activeGoals, setActiveGoals] = useState<ActiveGoal[]>([]);

  const fmt = (n: number) => `${currency}${n.toFixed(2)}`;

  const handleStartSaving = () => {
    if (!goalName.trim() || !goalTotal || !goalDate) return;
    const total = parseFloat(goalTotal);
    if (total <= 0) return;
    setActiveGoals((prev) => [
      ...prev,
      { name: goalName.trim(), totalAmount: total, targetDate: goalDate, interval, paidPeriods: 0 },
    ]);
    setGoalName("");
    setGoalTotal("");
    setGoalDate(undefined);
  };

  const markPaid = (index: number) => {
    setActiveGoals((prev) =>
      prev.map((g, i) => {
        if (i !== index) return g;
        const totalPeriods = getTotalPeriods(g.targetDate, g.interval);
        if (g.paidPeriods >= totalPeriods) return g;
        return { ...g, paidPeriods: g.paidPeriods + 1 };
      })
    );
  };

  const removeGoal = (index: number) => {
    setActiveGoals((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-foreground text-lg flex items-center gap-2">
        <Target className="w-5 h-5 text-primary" />
        Savings Goals
      </h2>

      {/* Creator form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border p-5 space-y-3"
        style={{
          background: "linear-gradient(135deg, hsl(270 40% 14%), hsl(260 30% 10%))",
          borderColor: "hsl(270 60% 50% / 0.25)",
          boxShadow: "0 0 30px -10px hsl(270 60% 50% / 0.1)",
        }}
      >
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
          <Select value={interval} onValueChange={(v) => setInterval(v as Interval)}>
            <SelectTrigger className="bg-muted/50 border-border text-foreground h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Bi-weekly</SelectItem>
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
          style={{ background: "linear-gradient(135deg, hsl(270 80% 60%), hsl(320 70% 55%))" }}
          disabled={!goalName.trim() || !goalTotal || !goalDate}
          onClick={handleStartSaving}
        >
          Start Saving
        </Button>
      </motion.div>

      {/* Active Goals */}
      {activeGoals.map((goal, i) => {
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
              background: "linear-gradient(135deg, hsl(270 40% 14%), hsl(260 30% 10%))",
              borderColor: isComplete ? "hsl(36 100% 50% / 0.5)" : "hsl(270 60% 50% / 0.25)",
              boxShadow: isComplete
                ? "0 0 30px -10px hsl(36 100% 50% / 0.3)"
                : "0 0 30px -10px hsl(270 60% 50% / 0.1)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-foreground font-semibold text-base">{goal.name}</h3>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {getTimeLeftLabel(goal.targetDate)} · until {format(goal.targetDate, "MMM yyyy")}
                </p>
              </div>
              <button
                onClick={() => removeGoal(i)}
                className="text-muted-foreground hover:text-destructive text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg p-2.5 text-center" style={{ backgroundColor: "hsl(270 40% 20% / 0.6)" }}>
                <p className="text-xs text-muted-foreground">Target</p>
                <p className="text-sm font-bold text-foreground">{fmt(goal.totalAmount)}</p>
              </div>
              <div className="rounded-lg p-2.5 text-center" style={{ backgroundColor: "hsl(270 40% 20% / 0.6)" }}>
                <p className="text-xs text-muted-foreground">Per {getIntervalLabel(goal.interval)}</p>
                <p className="text-sm font-bold" style={{ color: "hsl(270 80% 65%)" }}>{fmt(perPeriod)}</p>
              </div>
              <div className="rounded-lg p-2.5 text-center" style={{ backgroundColor: "hsl(270 40% 20% / 0.6)" }}>
                <p className="text-xs text-muted-foreground">Saved</p>
                <p className="text-sm font-bold" style={{ color: "hsl(140 60% 45%)" }}>{fmt(savedSoFar)}</p>
              </div>
            </div>

            {/* Calendar grid */}
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
                          ? "hsl(140 60% 45%)"
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

            {/* Paid button */}
            {!isComplete ? (
              <Button
                onClick={() => markPaid(i)}
                className="w-full rounded-lg gap-2 text-sm font-semibold h-10"
                style={{ background: "linear-gradient(135deg, hsl(140 60% 40%), hsl(160 70% 35%))" }}
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
    </div>
  );
}
