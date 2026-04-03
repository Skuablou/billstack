import { useState } from "react";
import { TrendingDown } from "lucide-react";
import calculatorIcon from "@/assets/3d-calculator.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Subscription, getMonthlyAmount } from "@/lib/subscriptions";
import { useCurrency } from "@/lib/CurrencyContext";
import { useTheme } from "@/lib/ThemeContext";
import { motion } from "framer-motion";

interface Props {
  subscriptions: Subscription[];
  savingsMonthly: number;
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

  const textMain = isLight ? "text-black" : "text-white";
  const textMuted = isLight ? "text-black" : "text-white/70";

  return (
    <div
      className="rounded-xl border p-5 space-y-4 relative overflow-hidden"
      style={{
        background: isLight ? "linear-gradient(135deg, hsl(267 70% 92%), hsl(267 50% 86%))" : "linear-gradient(135deg, hsl(267 60% 24%), hsl(267 40% 16%))",
        borderColor: isLight ? "hsl(267 70% 55%)" : "hsl(267 70% 40%)",
        borderWidth: "2px",
        boxShadow: isLight ? "0 4px 20px -6px hsl(267 80% 60% / 0.3)" : "0 0 30px -10px hsl(267 90% 50% / 0.2)",
      }}
    >
      <h3 className={`font-display font-semibold flex items-center gap-2 ${textMain}`}>
        <img src={calculatorIcon} alt="Budget Calculator" className="w-6 h-6 object-contain" />
        Budget Calculator
      </h3>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className={`${textMuted} text-xs`}>Monthly income</Label>
          <Input
            type="number"
            placeholder="e.g. 3000"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            className="bg-muted/50 border-border text-foreground h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className={`${textMuted} text-xs`}>Avg. monthly spending outside of bills (groceries, gas, extras)</Label>
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
            <span className={textMuted}>Fixed bills</span>
            <span className={`${textMain} font-medium`}>{fmt(totalFixed)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className={textMuted}>Variable spendings</span>
            <span className={`${textMain} font-medium`}>{fmt(variableNum)}</span>
          </div>
          {savingsMonthly > 0 && (
            <div className="flex justify-between text-sm">
              <span className={textMuted}>Savings goals</span>
              <span className="font-medium" style={{ color: "hsl(267 100% 60%)" }}>{fmt(savingsMonthly)}</span>
            </div>
          )}
          <div className={`flex justify-between text-sm border-t pt-2 ${isLight ? "border-black/20" : "border-white/20"}`}>
            <span className={textMuted}>Left over</span>
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
                  <span className={textMain}>{sub.name}</span>
                  <span className={textMuted}>-{fmt(sub.monthly)}/mo</span>
                </div>
              ))}
              <p className={`text-xs ${textMuted} pt-1`}>
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