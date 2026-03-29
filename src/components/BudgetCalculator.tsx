import { useState } from "react";
import { Calculator, Lock, TrendingDown, Target, CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Subscription, getMonthlyAmount } from "@/lib/subscriptions";
import { useCurrency } from "@/lib/CurrencyContext";
import { motion } from "framer-motion";
import { format, differenceInMonths } from "date-fns";
import { cn } from "@/lib/utils";

interface SavingsGoal {
  name: string;
  monthlyAmount: number;
  targetDate: Date;
}

interface Props {
  subscriptions: Subscription[];
  isPremium: boolean;
  onUpgrade: () => void;
}

export default function BudgetCalculator({ subscriptions, isPremium, onUpgrade }: Props) {
  const { currency } = useCurrency();
  const [income, setIncome] = useState("");
  const [saveTarget, setSaveTarget] = useState("");

  // Savings goal state
  const [goalName, setGoalName] = useState("");
  const [goalTotal, setGoalTotal] = useState("");
  const [goalDate, setGoalDate] = useState<Date>();
  const [activeGoals, setActiveGoals] = useState<SavingsGoal[]>([]);

  const incomeNum = parseFloat(income) || 0;
  const saveNum = parseFloat(saveTarget) || 0;
  const totalMonthly = subscriptions.reduce((s, sub) => s + getMonthlyAmount(sub), 0);
  const available = incomeNum - saveNum;
  const overspend = totalMonthly > available && available > 0;

  const sorted = [...subscriptions]
    .map((s) => ({ ...s, monthly: getMonthlyAmount(s) }))
    .sort((a, b) => b.monthly - a.monthly);

  let cumulative = 0;
  const toQuit: typeof sorted = [];
  if (overspend) {
    const needToSave = totalMonthly - available;
    for (const sub of sorted) {
      if (cumulative >= needToSave) break;
      toQuit.push(sub);
      cumulative += sub.monthly;
    }
  }

  const fmt = (n: number) => `${currency}${n.toFixed(2)}`;

  const handleStartSaving = () => {
    if (!goalName.trim() || !goalAmount || !goalDate) return;
    setActiveGoals((prev) => [
      ...prev,
      { name: goalName.trim(), monthlyAmount: parseFloat(goalAmount), targetDate: goalDate },
    ]);
    setGoalName("");
    setGoalAmount("");
    setGoalDate(undefined);
  };

  const removeGoal = (index: number) => {
    setActiveGoals((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      className="rounded-xl border p-5 space-y-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(270 40% 14%), hsl(260 30% 10%))",
        borderColor: "hsl(270 60% 50% / 0.25)",
        boxShadow: "0 0 30px -10px hsl(270 60% 50% / 0.1)",
      }}
    >
      <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
        <Calculator className="w-4 h-4 text-primary" />
        Budget Calculator
      </h3>

      {!isPremium && (
        <div
          className="absolute inset-0 top-12 z-10 flex flex-col items-center justify-center gap-3 cursor-pointer rounded-b-xl"
          style={{ backgroundColor: "hsl(230 20% 7% / 0.85)", backdropFilter: "blur(4px)" }}
          onClick={onUpgrade}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "hsl(36 100% 50% / 0.2)" }}
          >
            <Lock className="w-6 h-6" style={{ color: "hsl(36 100% 50%)" }} />
          </div>
          <p className="text-foreground font-medium text-sm">Premium Feature</p>
          <p className="text-muted-foreground text-xs">Upgrade to use the Budget Calculator</p>
        </div>
      )}

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">Monthly income</Label>
          <Input
            type="number"
            placeholder="e.g. 3000"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            disabled={!isPremium}
            className="bg-muted/50 border-border text-foreground h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">Monthly savings goal</Label>
          <Input
            type="number"
            placeholder="e.g. 500"
            value={saveTarget}
            onChange={(e) => setSaveTarget(e.target.value)}
            disabled={!isPremium}
            className="bg-muted/50 border-border text-foreground h-9 text-sm"
          />
        </div>
      </div>

      {/* Results */}
      {isPremium && incomeNum > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 pt-2 border-t border-border/50"
        >
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Available after savings</span>
            <span className="text-foreground font-medium">{fmt(available)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total subscriptions</span>
            <span className={`font-medium ${overspend ? "text-destructive" : "text-foreground"}`}>
              {fmt(totalMonthly)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Left over</span>
            <span
              className="font-display font-bold"
              style={{ color: available - totalMonthly >= 0 ? "hsl(140 60% 45%)" : "hsl(0 72% 55%)" }}
            >
              {fmt(available - totalMonthly)}
            </span>
          </div>

          {overspend && toQuit.length > 0 && (
            <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: "hsl(0 72% 50% / 0.08)", borderLeft: "3px solid hsl(0 72% 55%)" }}>
              <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: "hsl(0 72% 55%)" }}>
                <TrendingDown className="w-3.5 h-3.5" />
                Consider cancelling to meet your goal:
              </p>
              {toQuit.map((sub) => (
                <div key={sub.id} className="flex justify-between text-xs">
                  <span className="text-foreground">{sub.name}</span>
                  <span className="text-muted-foreground">-{fmt(sub.monthly)}/mo</span>
                </div>
              ))}
              <p className="text-xs text-muted-foreground pt-1">
                Saves you {fmt(cumulative)}/month
              </p>
            </div>
          )}

          {!overspend && available - totalMonthly >= 0 && (
            <div className="rounded-lg p-3" style={{ backgroundColor: "hsl(140 60% 45% / 0.08)", borderLeft: "3px solid hsl(140 60% 45%)" }}>
              <p className="text-xs font-medium" style={{ color: "hsl(140 60% 45%)" }}>
                ✓ You're within budget! {fmt(available - totalMonthly)} left after subscriptions.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Savings Goal Creator */}
      {isPremium && (
        <div className="space-y-3 pt-3 border-t border-border/50">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-primary" />
            Savings Goal
          </h4>
          <div className="space-y-2">
            <Input
              placeholder="Goal name (e.g. Vacation Spain)"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              className="bg-muted/50 border-border text-foreground h-9 text-sm"
            />
            <Input
              type="number"
              placeholder="Monthly saving amount"
              value={goalAmount}
              onChange={(e) => setGoalAmount(e.target.value)}
              className="bg-muted/50 border-border text-foreground h-9 text-sm"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-9 text-sm bg-muted/50 border-border",
                    !goalDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
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
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <Button
              size="sm"
              className="w-full rounded-lg gap-1.5 text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, hsl(270 80% 60%), hsl(320 70% 55%))" }}
              disabled={!goalName.trim() || !goalAmount || !goalDate}
              onClick={handleStartSaving}
            >
              Start Saving
            </Button>
          </div>
        </div>
      )}

      {/* Active Goals */}
      {isPremium && activeGoals.length > 0 && (
        <div className="space-y-2 pt-2">
          {activeGoals.map((goal, i) => {
            const monthsLeft = Math.max(1, differenceInMonths(goal.targetDate, new Date()));
            const totalTarget = goal.monthlyAmount * monthsLeft;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg p-3 space-y-2"
                style={{ backgroundColor: "hsl(270 40% 18% / 0.6)", border: "1px solid hsl(270 60% 50% / 0.2)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-foreground text-sm font-medium">{goal.name}</span>
                  <button
                    onClick={() => removeGoal(i)}
                    className="text-muted-foreground hover:text-destructive text-xs transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{fmt(goal.monthlyAmount)}/mo</span>
                  <span>until {format(goal.targetDate, "MMM yyyy")}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total target</span>
                  <span className="text-foreground font-medium">{fmt(totalTarget)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Months left</span>
                  <span className="text-foreground font-medium">{monthsLeft}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}