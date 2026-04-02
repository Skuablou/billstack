import { useState } from "react";
import { Calculator, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Subscription, getMonthlyAmount } from "@/lib/subscriptions";
import { useCurrency } from "@/lib/CurrencyContext";
import { useTheme } from "@/lib/ThemeContext";
import { motion } from "framer-motion";

interface Props {
  subscriptions: Subscription[];
  savingsMonthly: number; // auto-injected from active savings goals
}

export default function BudgetCalculator({ subscriptions, savingsMonthly }: Props) {
  const { currency } = useCurrency();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [income, setIncome] = useState("");
  const [variableSpendings, setVariableSpendings] = useState("");
  const incomeNum = parseFloat(income) || 0;
  const variableNum = parseFloat(variableSpendings) || 0;
  const totalFixed = subscriptions.reduce((s, sub) => s + getMonthlyAmount(sub), 0);
  const totalSpendings = totalFixed + variableNum + savingsMonthly;
  const leftOver = incomeNum - totalSpendings;
  const overspend = incomeNum > 0 && leftOver < 0;

  const sorted = [...subscriptions]
    .map((s) => ({ ...s, monthly: getMonthlyAmount(s) }))
    .sort((a, b) => b.monthly - a.monthly);

  let cumulative = 0;
  const toQuit: typeof sorted = [];
  if (overspend) {
    const needToSave = -leftOver;
    for (const sub of sorted) {
      if (cumulative >= needToSave) break;
      toQuit.push(sub);
      cumulative += sub.monthly;
    }
  }

  const fmt = (n: number) => `${n.toFixed(2)}${currency}`;

  return (
    <div
      className="rounded-xl border p-5 space-y-4 relative overflow-hidden"
      style={{
        background: isLight ? "linear-gradient(135deg, hsl(295 55% 92%), hsl(295 45% 86%))" : "linear-gradient(135deg, hsl(295 50% 24%), hsl(295 35% 16%))",
        borderColor: isLight ? "hsl(295 50% 55%)" : "hsl(295 55% 40%)",
        borderWidth: "2px",
        boxShadow: isLight ? "0 4px 20px -6px hsl(270 60% 65% / 0.3)" : "0 0 30px -10px hsl(270 70% 55% / 0.2)",
      }}
    >
      <h3 className="font-display font-semibold flex items-center gap-2 text-white">
        <Calculator className="w-4 h-4 text-white" />
        Budget Calculator
      </h3>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-white/70 text-xs">Monthly income</Label>
          <Input
            type="number"
            placeholder="e.g. 3000"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            className="bg-muted/50 border-border text-foreground h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">Variable monthly spendings on average (e.g. groceries, gas)</Label>
          <Input
            type="number"
            placeholder="e.g. 500"
            value={variableSpendings}
            onChange={(e) => setVariableSpendings(e.target.value)}
            className="bg-muted/50 border-border text-foreground h-9 text-sm"
          />
        </div>
      </div>

      {incomeNum > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 pt-2 border-t border-border/50"
        >
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Fixed bills</span>
            <span className="text-foreground font-medium">{fmt(totalFixed)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Variable spendings</span>
            <span className="text-foreground font-medium">{fmt(variableNum)}</span>
          </div>
          {savingsMonthly > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Savings goals</span>
              <span className="font-medium" style={{ color: "hsl(295 75% 63%)" }}>{fmt(savingsMonthly)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm border-t border-border/30 pt-2">
            <span className="text-muted-foreground">Left over</span>
            <span
              className="font-display font-bold"
              style={{ color: leftOver >= 0 ? "hsl(145 70% 45%)" : "hsl(0 72% 55%)" }}
            >
              {fmt(leftOver)}
            </span>
          </div>

          {overspend && toQuit.length > 0 && (
            <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: "hsl(0 72% 50% / 0.08)", borderLeft: "3px solid hsl(0 72% 55%)" }}>
              <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: "hsl(0 72% 55%)" }}>
                <TrendingDown className="w-3.5 h-3.5" />
                Consider cancelling to meet your budget:
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

          {!overspend && leftOver >= 0 && (
            <div className="rounded-lg p-3" style={{ backgroundColor: "hsl(140 60% 45% / 0.08)", borderLeft: "3px solid hsl(145 70% 45%)" }}>
              <p className="text-xs font-medium" style={{ color: "hsl(145 70% 45%)" }}>
                ✓ You're within budget! {fmt(leftOver)} left over.
              </p>
            </div>
          )}
        </motion.div>
      )}

    </div>
  );
}
