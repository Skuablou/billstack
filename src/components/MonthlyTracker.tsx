import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronLeft, ChevronRight, Briefcase, ChevronDown, ChevronUp, Check, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/lib/CurrencyContext";
import { useMonthlyTracker } from "@/hooks/use-monthly-tracker";
import { Subscription, getMonthlyTotal } from "@/lib/subscriptions";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_LABELS = ["Mo","Tu","We","Th","Fr","Sa","Su"];

function dateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

interface MonthlyTrackerProps {
  subscriptions?: Subscription[];
  isPremium?: boolean;
  trackedDays?: number;
  onPremiumRequired?: () => void;
  onTrackedDaysChange?: (days: number) => void;
}

export default function MonthlyTracker({ subscriptions = [], isPremium = false, trackedDays = 0, onPremiumRequired, onTrackedDaysChange }: MonthlyTrackerProps) {
  const isMobile = useIsMobile();
  const { currency } = useCurrency();
  const fmt = (n: number) => `${n.toFixed(2)}${currency}`;
  const fmtShort = (n: number) => `${Math.abs(n).toFixed(0)}${currency}`;

  const {
    salary, setSalary, salaryInput, setSalaryInput, salaryConfirmed, confirmSalary,
    activeDays, setActiveDays, hours, setHours,
    data, addExpense, deleteExpense,
  } = useMonthlyTracker();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [scheduleOpen, setScheduleOpen] = useState(() => {
    return localStorage.getItem("schedule-closed") !== "true";
  });
  const handleToggleSchedule = () => {
    setScheduleOpen(prev => {
      if (prev) localStorage.setItem("schedule-closed", "true");
      return !prev;
    });
  };
  const [selectedDay, setSelectedDay] = useState<string | null>(() => {
    const today = new Date();
    return dateKey(today.getFullYear(), today.getMonth(), today.getDate());
  });
  const [entryInput, setEntryInput] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getHoursForDow = useCallback((dow: number) => activeDays[dow] ? hours[dow] : 0, [activeDays, hours]);

  const monthlyHours = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let total = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      let dow = new Date(year, month, d).getDay();
      dow = dow === 0 ? 6 : dow - 1;
      total += getHoursForDow(dow);
    }
    return total;
  }, [year, month, getHoursForDow]);

  const hourlyRate = salary > 0 && monthlyHours > 0 ? salary / monthlyHours : 0;

  // Count working days in month for distributing fixed costs
  const workingDaysInMonth = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      let dow = new Date(year, month, d).getDay();
      dow = dow === 0 ? 6 : dow - 1;
      if (getHoursForDow(dow) > 0) count++;
    }
    return count;
  }, [year, month, getHoursForDow]);

  const monthSpent = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    let total = 0;
    Object.keys(data).forEach(k => {
      if (k.startsWith(prefix)) (data[k] || []).forEach(e => total += e.amt);
    });
    return total;
  }, [data, year, month]);

  const totalSubscriptions = useMemo(() => getMonthlyTotal(subscriptions), [subscriptions]);
  const dailyFixedCost = workingDaysInMonth > 0 ? totalSubscriptions / workingDaysInMonth : 0;
  const totalAmount = salary - totalSubscriptions - monthSpent;

  const changeMonth = (dir: number) => {
    const newDate = new Date(year, month + dir, 1);
    setCurrentDate(newDate);
    if (isMobile) {
      setSelectedDay(dateKey(newDate.getFullYear(), newDate.getMonth(), 1));
    } else {
      setSelectedDay(null);
    }
  };

  const toggleDay = (dow: number) => {
    setActiveDays(prev => prev.map((v, i) => i === dow ? !v : v));
  };

  const setDayHours = (dow: number, val: number) => {
    setHours(prev => prev.map((v, i) => i === dow ? val : v));
  };

  const calendarRows = useMemo(() => {
    const first = new Date(year, month, 1);
    let startDow = first.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const rows: (null | { day: number; key: string; isToday: boolean; earned: number; spent: number; dayHrs: number })[][] = [];
    let dayCount = 1;
    const numRows = Math.ceil((startDow + daysInMonth) / 7);
    for (let r = 0; r < numRows; r++) {
      const row: typeof rows[0] = [];
      for (let c = 0; c < 7; c++) {
        const ci = r * 7 + c;
        if (ci < startDow || dayCount > daysInMonth) {
          row.push(null);
        } else {
          const d = dayCount;
          const k = dateKey(year, month, d);
          let dow = new Date(year, month, d).getDay();
          dow = dow === 0 ? 6 : dow - 1;
          const dayHrs = getHoursForDow(dow);
          const dayEarned = dayHrs > 0 ? (hourlyRate * dayHrs) - dailyFixedCost : 0;
          const entries = data[k] || [];
          const daySpent = entries.reduce((s, e) => s + e.amt, 0);
          row.push({ day: d, key: k, isToday: today.getFullYear() === year && today.getMonth() === month && today.getDate() === d, earned: dayEarned, spent: daySpent, dayHrs });
          dayCount++;
        }
      }
      rows.push(row);
    }
    return rows;
  }, [year, month, data, hourlyRate, getHoursForDow]);

  const selectedData = useMemo(() => {
    if (!selectedDay) return null;
    const [yStr, mStr, dStr] = selectedDay.split("-");
    const yi = parseInt(yStr), mi = parseInt(mStr) - 1, di = parseInt(dStr);
    let dow = new Date(yi, mi, di).getDay();
    dow = dow === 0 ? 6 : dow - 1;
    const dayHrs = getHoursForDow(dow);
    const earned = dayHrs > 0 ? (hourlyRate * dayHrs) - dailyFixedCost : 0;
    const entries = data[selectedDay] || [];
    const spent = entries.reduce((s, e) => s + e.amt, 0);
    return { date: `${di} ${MONTHS[mi]} ${yStr}`, earned, spent, left: earned - spent, entries, dayHrs };
  }, [selectedDay, data, hourlyRate, getHoursForDow]);

  const handleAddEntry = async () => {
    if (!selectedDay) return;
    const amt = parseFloat(entryInput);
    if (isNaN(amt) || amt <= 0) return;
    // Check if adding this expense would hit the 10-day limit for free users
    if (!isPremium && trackedDays >= 10) {
      onPremiumRequired?.();
      return;
    }
    // Check if this is a new day (not yet tracked)
    const isNewDay = !(data[selectedDay] && data[selectedDay].length > 0);
    if (!isPremium && isNewDay && trackedDays >= 9) {
      // This would be the 10th day - allow it but after saving, trigger premium next time
    }
    await addExpense(selectedDay, amt);
    // Update tracked days count if this was a new day
    if (isNewDay) {
      onTrackedDaysChange?.(trackedDays + 1);
    }
    setEntryInput("");
  };

  const handleDeleteEntry = async (index: number) => {
    if (!selectedDay) return;
    await deleteExpense(selectedDay, index);
  };

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => changeMonth(-1)} className="text-muted-foreground hover:text-foreground gap-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <h2 className="font-display font-semibold text-foreground text-lg">{MONTHS[month]} {year}</h2>
        <Button variant="ghost" size="sm" onClick={() => changeMonth(1)} className="text-muted-foreground hover:text-foreground gap-1">
          Next <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Salary input */}
      <AnimatePresence>
        {!salaryConfirmed && (
          <motion.div
            initial={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border border-border overflow-hidden"
            style={{ background: "hsl(var(--card))" }}
          >
            <div className="flex items-center gap-3 p-3">
              <span className="text-foreground text-sm whitespace-nowrap">Monthly salary (net)</span>
              <span className="text-muted-foreground text-sm">{currency}</span>
              <Input
                type="number"
                value={salaryInput}
                onChange={e => setSalaryInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && confirmSalary()}
                placeholder="e.g. 2500"
                className="flex-1 h-8 bg-transparent border-0 text-sm font-medium focus-visible:ring-0 p-0"
                style={{ color: "hsl(145 70% 45%)" }}
              />
              <Button size="icon" className="h-8 w-8 shrink-0 rounded-lg" style={{ background: "hsl(145 70% 45%)" }} onClick={confirmSalary}>
                <Check className="w-4 h-4 text-white" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Work schedule */}
      <div className="rounded-xl border border-border p-3" style={{ background: "hsl(var(--card))" }}>
        <button onClick={handleToggleSchedule} className="flex items-center justify-between w-full text-left">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-foreground" />
            <span className="text-foreground text-sm font-medium">Work schedule / edit</span>
          </div>
          {scheduleOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        <AnimatePresence>
          {scheduleOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="pt-3 space-y-3">
                {salaryConfirmed && (
                  <div className="flex items-center gap-2 pb-3 border-b border-border">
                    <span className="text-foreground text-sm flex-1">Monthly salary (net) {currency}</span>
                    <Input
                      type="number"
                      value={salary || ""}
                      onChange={e => setSalary(parseFloat(e.target.value) || 0)}
                      className="w-24 h-8 text-sm text-right bg-muted/50 border-border"
                      style={{ color: "hsl(145 70% 45%)" }}
                    />
                  </div>
                )}
                <div className="flex gap-1.5 justify-center flex-wrap">
                  {DAY_LABELS.map((label, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <button
                        onClick={() => toggleDay(i)}
                        className="w-9 h-7 rounded-lg text-xs font-medium transition-colors"
                        style={{
                          background: activeDays[i] ? "hsl(145 70% 45%)" : "hsl(var(--muted))",
                          color: activeDays[i] ? "white" : "hsl(var(--muted-foreground))",
                          border: activeDays[i] ? "none" : "1px solid hsl(var(--border))",
                        }}
                      >
                        {label}
                      </button>
                      <Input
                        type="number"
                        value={hours[i]}
                        onChange={e => setDayHours(i, parseFloat(e.target.value) || 0)}
                        disabled={!activeDays[i]}
                        className="w-9 h-7 text-[11px] text-center p-0 bg-muted/50 border-border disabled:opacity-30"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-xl border border-border p-2.5" style={{ background: "hsl(var(--card))" }}>
          <p className="text-xs uppercase tracking-wider text-foreground font-medium mb-1">Salary</p>
          <p className="text-lg font-display font-bold text-foreground">
            {salary > 0 ? `${salary.toFixed(0)}${currency}` : `—${currency}`}
          </p>
        </div>
        <div className="rounded-xl border border-border p-2.5" style={{ background: "hsl(var(--card))" }}>
          <p className="text-xs uppercase tracking-wider text-foreground font-medium mb-1">Fixed Cost</p>
          <p className="text-xl font-display font-bold text-foreground">
            {totalSubscriptions > 0 ? `${totalSubscriptions.toFixed(0)}${currency}` : `0${currency}`}
          </p>
        </div>
        <div className="rounded-xl border border-border p-2.5" style={{ background: "hsl(var(--card))" }}>
          <p className="text-xs uppercase tracking-wider text-foreground font-medium mb-1">Spent</p>
          <p className="text-xl font-display font-bold text-foreground">
            {monthSpent.toFixed(0)}{currency}
          </p>
        </div>
        <div className="rounded-xl border border-border p-2.5" style={{ background: "hsl(var(--card))" }}>
          <p className="text-xs uppercase tracking-wider text-foreground font-medium mb-1">Total</p>
          <p className="text-xl font-display font-bold text-foreground">
            {salary > 0 ? `${Math.abs(totalAmount).toFixed(0)}${currency}` : `—${currency}`}
          </p>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border border-border overflow-hidden" style={{ background: "hsl(var(--card))" }}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {DAY_LABELS.map(d => (
                <th key={d} className="text-center text-xs text-muted-foreground font-normal py-2">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {calendarRows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => {
                  if (!cell) return <td key={ci} />;
                  const left = cell.earned - cell.spent;
                  const isSelected = selectedDay === cell.key;
                  return (
                    <td key={ci} className="text-center p-0.5 cursor-pointer" onClick={() => setSelectedDay(isMobile ? cell.key : (selectedDay === cell.key ? null : cell.key))}>
                      <div
                        className="rounded-lg py-1 px-0.5 min-h-[48px] flex flex-col items-center justify-start gap-0.5 transition-colors"
                        style={{
                          background: isSelected ? "hsl(var(--primary) / 0.15)" : "transparent",
                          border: isSelected ? "1px solid hsl(var(--primary) / 0.3)" : "1px solid transparent",
                        }}
                      >
                        <span
                          className="text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full"
                          style={{
                            background: cell.isToday ? "hsl(210 70% 55%)" : "transparent",
                            color: cell.isToday ? "white" : "hsl(var(--foreground))",
                          }}
                        >
                          {cell.day}
                        </span>
                        {cell.earned > 0 ? (
                          <span className="text-[10px] font-medium" style={{
                            color: cell.spent === 0 ? "hsl(var(--muted-foreground))" : left >= 0 ? "hsl(145 70% 45%)" : "hsl(15 70% 50%)"
                          }}>
                            {left >= 0 ? "+" : "-"}{fmtShort(left)}
                          </span>
                        ) : cell.dayHrs === 0 && salary > 0 ? (
                          cell.spent > 0 ? (
                            <span className="text-[10px] font-medium" style={{ color: "hsl(15 70% 50%)" }}>-{fmtShort(cell.spent)}</span>
                          ) : (
                            <span className="text-[9px] text-muted-foreground">off</span>
                          )
                        ) : null}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Day detail panel */}
      <AnimatePresence>
        {selectedDay && selectedData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="rounded-xl border border-border p-4 space-y-4"
            style={{ background: "hsl(var(--card))" }}
          >
            <h3 className="font-display font-semibold text-foreground">{selectedData.date}</h3>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg p-2.5 text-center" style={{ background: "hsl(var(--muted))" }}>
                <p className="text-xs uppercase tracking-wider text-foreground font-medium mb-0.5">Earned</p>
                <p className="text-lg font-bold text-foreground">
                  {selectedData.dayHrs > 0 ? fmt(selectedData.earned) : (selectedData.dayHrs === 0 ? "Day off" : `—${currency}`)}
                </p>
              </div>
              <div className="rounded-lg p-2.5 text-center" style={{ background: "hsl(var(--muted))" }}>
                <p className="text-xs uppercase tracking-wider text-foreground font-medium mb-0.5">Spent</p>
                <p className="text-lg font-bold text-foreground">{fmt(selectedData.spent)}</p>
              </div>
              <div className="rounded-lg p-2.5 text-center" style={{ background: "hsl(var(--muted))" }}>
                <p className="text-xs uppercase tracking-wider text-foreground font-medium mb-0.5">Left</p>
                <p className="text-lg font-bold text-foreground">
                  {selectedData.earned > 0
                    ? `${selectedData.left >= 0 ? "" : "-"}${fmt(Math.abs(selectedData.left))}`
                    : (selectedData.spent > 0 ? `-${fmt(selectedData.spent)}` : `—${currency}`)}
                </p>
              </div>
            </div>

            {/* Entries list */}
            <div className="space-y-1.5 max-h-44 overflow-y-auto">
              {selectedData.entries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">No expenses logged yet.</p>
              ) : (
                selectedData.entries.map((e, i) => {
                  const hrsWorked = hourlyRate > 0 ? (e.amt / hourlyRate).toFixed(1) : null;
                  return (
                    <div key={i} className="flex items-center justify-between rounded-lg p-2.5" style={{ background: "hsl(var(--muted))" }}>
                      <span className="text-sm text-foreground">{hrsWorked ? `${hrsWorked}h of work` : "Expense"}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: "hsl(15 70% 50%)" }}>-{fmt(e.amt)}</span>
                        <button onClick={() => handleDeleteEntry(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add expense */}
            <div className="flex gap-2">
              <Input
                type="number"
                value={entryInput}
                onChange={e => setEntryInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddEntry()}
                placeholder={`Total spent today ${currency}`}
                className="flex-1 h-10 bg-muted/50 border-border text-foreground"
              />
              <Button onClick={() => { if (navigator.vibrate) navigator.vibrate(50); handleAddEntry(); }} className="h-10 px-4 rounded-lg" style={{ background: "hsl(15 70% 50%)" }}>
                <Plus className="w-4 h-4 text-white" />
              </Button>
            </div>

            <div className="flex items-start gap-2 rounded-lg p-3" style={{ background: "hsl(var(--muted))" }}>
              <span className="text-base shrink-0">💡</span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                BIG TIP: Write down the amount you spend that day by checking your daily expenses on your bank account in the night.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
