import { useState, useEffect, useRef } from "react";
import { ShieldAlert, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/lib/CurrencyContext";
import { Subscription, getMonthlyTotal } from "@/lib/subscriptions";
import { useTheme } from "@/lib/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  subscriptions: Subscription[];
}

export default function SurvivalCalculator({ subscriptions }: Props) {
  const { currency } = useCurrency();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [bank, setBank] = useState("");
  const [salary, setSalary] = useState("");
  const [variable, setVariable] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [displayMonths, setDisplayMonths] = useState(0);
  const animRef = useRef<ReturnType<typeof setInterval>>();

  const bankNum = parseFloat(bank) || 0;
  const salaryNum = parseFloat(salary) || 0;
  const variableNum = parseFloat(variable) || 0;
  const fixedCosts = getMonthlyTotal(subscriptions);
  const monthlyBurn = fixedCosts + variableNum;
  const months = monthlyBurn > 0 ? Math.floor(bankNum / monthlyBurn) : 999;

  const fmt = (n: number) => `${n.toLocaleString()}${currency}`;

  const getStatus = (m: number) => {
    if (m <= 3) return { cls: "danger", badge: "🔴 Critical", color: "hsl(0 72% 55%)", text: "One bad day away from serious trouble. Time to cut costs now." };
    if (m <= 6) return { cls: "warning", badge: "🟡 Tight", color: "hsl(40 90% 50%)", text: "Some buffer, but not enough room for more mistakes or surprises." };
    return { cls: "safe", badge: "🟢 Solid", color: "hsl(145 70% 45%)", text: "Good runway. You have time to find your footing if things go wrong." };
  };

  const calculate = () => {
    if (bankNum === 0 && fixedCosts === 0 && variableNum === 0) return;
    setShowResult(true);
    setDisplayMonths(0);

    if (animRef.current) clearInterval(animRef.current);
    const target = Math.min(months, 99);
    let count = 0;
    const step = Math.max(1, Math.ceil(target / 40));
    animRef.current = setInterval(() => {
      count += step;
      if (count >= target) {
        setDisplayMonths(months > 99 ? 100 : target);
        clearInterval(animRef.current!);
        return;
      }
      setDisplayMonths(count);
    }, 30);
  };

  const reset = () => {
    if (animRef.current) clearInterval(animRef.current);
    setShowResult(false);
    setBank("");
    setSalary("");
    setVariable("");
    setDisplayMonths(0);
  };

  useEffect(() => () => { if (animRef.current) clearInterval(animRef.current); }, []);

  const status = getStatus(months);

  const textMain = isLight ? "text-black" : "text-white";
  const textMuted = isLight ? "text-black/60" : "text-white/70";
  const textFaint = isLight ? "text-black/40" : "text-white/50";

  return (
    <div
      className="rounded-xl border p-5 space-y-4 relative overflow-hidden"
      style={{
        background: isLight ? "linear-gradient(135deg, #ED1818, #B81414)" : "linear-gradient(135deg, #ED1818, #8B1010)",
        borderColor: isLight ? "hsl(0 50% 55%)" : "hsl(0 55% 38%)",
        borderWidth: "2px",
        boxShadow: isLight ? "0 4px 20px -6px hsl(0 55% 60% / 0.3)" : "0 0 30px -10px hsl(0 70% 55% / 0.2)",
      }}
    >
      <h3 className={`font-display font-semibold ${textMain} flex items-center gap-2`}>
        <ShieldAlert className="w-4 h-4" style={{ color: "#9E0000" }} />
        Survival Calculator
      </h3>
      <p className={`${textMuted} text-xs leading-relaxed`}>
        How long would you last if you lost your job tomorrow?
      </p>

      <AnimatePresence mode="wait">
        {!showResult ? (
          <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="space-y-1.5">
              <Label className={`${textMuted} text-xs`}>Money in the bank</Label>
              <Input type="number" placeholder="e.g. 20000" value={bank} onChange={(e) => setBank(e.target.value)} className="bg-muted/50 border-border text-foreground h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className={`${textMuted} text-xs`}>Monthly salary</Label>
              <Input type="number" placeholder="e.g. 2500" value={salary} onChange={(e) => setSalary(e.target.value)} className="bg-muted/50 border-border text-foreground h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className={`${textMuted} text-xs`}>Avg. monthly spending outside of bills (groceries, gas, extras)</Label>
              <Input type="number" placeholder="e.g. 500" value={variable} onChange={(e) => setVariable(e.target.value)} className="bg-muted/50 border-border text-foreground h-9 text-sm" />
            </div>
            <p className={`${textFaint} text-[10px]`}>
              Fixed costs ({fmt(fixedCosts)}/mo) are pulled from your spendings automatically.
            </p>
            <Button
              onClick={calculate}
              className="w-full rounded-lg font-display font-semibold tracking-wider text-sm"
              style={{ background: "hsl(0 72% 50%)", color: "#fff" }}
            >
              NOW IMAGINE YOU'RE FIRED →
            </Button>
          </motion.div>
        ) : (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="rounded-lg p-4 text-center" style={{ background: "hsl(0 72% 50%)" }}>
              <div className="text-3xl mb-1">📋</div>
              <p className={`font-display font-bold text-xl tracking-wider ${textMain}`}>YOU'RE FIRED.</p>
              <p className={`text-xs ${textMuted}`}>No salary. No safety net. Just your savings.</p>
            </div>

            <div className="flex items-baseline justify-center gap-3">
              <span className="font-display text-6xl font-bold" style={{ color: status.color }}>
                {displayMonths > 99 ? "99+" : displayMonths}
              </span>
              <div className="flex flex-col gap-1">
                <span className={`text-xs ${textMuted}`}>months of runway</span>
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full w-fit"
                  style={{ background: `${status.color}33`, color: status.color }}
                >
                  {status.badge}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs p-2.5 rounded-lg bg-black/20">
                <span className={textMuted}>Bank savings</span>
                <span className={`${textMain} font-medium`}>{fmt(bankNum)}</span>
              </div>
              <div className="flex justify-between text-xs p-2.5 rounded-lg bg-black/20">
                <span className={textMuted}>Fixed costs / mo</span>
                <span style={{ color: "hsl(0 72% 55%)" }} className="font-medium">−{fmt(fixedCosts)}</span>
              </div>
              <div className="flex justify-between text-xs p-2.5 rounded-lg bg-black/20">
                <span className={textMuted}>Variable spending / mo</span>
                <span style={{ color: "hsl(0 72% 55%)" }} className="font-medium">−{fmt(variableNum)}</span>
              </div>
              <div className="flex justify-between text-xs p-2.5 rounded-lg bg-black/20">
                <span className={textMuted}>Total monthly burn</span>
                <span style={{ color: "hsl(0 72% 55%)" }} className="font-medium">−{fmt(monthlyBurn)}</span>
              </div>
              <div className="flex justify-between text-xs p-2.5 rounded-lg bg-black/20">
                <span className={textMuted}>{fmt(bankNum)} ÷ {fmt(monthlyBurn)}</span>
                <span className={`${textMain} font-bold`}>= {months > 99 ? "99+" : months} months</span>
              </div>
              {salaryNum > 0 && (
                <div className="flex justify-between text-xs p-2.5 rounded-lg bg-black/20">
                  <span className={textMuted}>Income lost</span>
                  <span style={{ color: "hsl(0 72% 55%)" }} className="font-medium">−{fmt(salaryNum)}/mo</span>
                </div>
              )}
            </div>

            <div
              className="rounded-lg p-3 text-center text-xs leading-relaxed"
              style={{ background: `${status.color}15`, border: `0.5px solid ${status.color}33`, color: status.color }}
            >
              {status.text}
            </div>

            <Button
              variant="outline"
              onClick={reset}
              className="w-full rounded-lg text-muted-foreground text-xs gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Recalculate
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}