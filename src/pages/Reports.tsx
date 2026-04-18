import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/AuthContext";
import { useCurrency } from "@/lib/CurrencyContext";
import BottomNav from "@/components/BottomNav";
import SettingsMenu from "@/components/SettingsMenu";
import { MoreVertical, Pencil, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Expense = { date: string; amount: number };
type Subscription = { amount: number; billing_cycle: string; category: string };

export default function Reports() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [salary, setSalary] = useState(0);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: exp } = await supabase
        .from("monthly_tracker_expenses")
        .select("date, amount")
        .eq("user_id", user.id);
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("amount, billing_cycle, category")
        .eq("user_id", user.id);
      const { data: settings } = await supabase
        .from("monthly_tracker_settings")
        .select("salary, monthly_budget")
        .eq("user_id", user.id)
        .maybeSingle();

      setExpenses((exp as Expense[]) || []);
      setSubscriptions((subs as Subscription[]) || []);
      setSalary(settings?.salary || 0);
      setMonthlyBudget(Number(settings?.monthly_budget) || 0);
      setLoading(false);
    })();
  }, [user]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const monthlySubsTotal = subscriptions
    .filter((s) => s.billing_cycle === "Monthly")
    .reduce((sum, s) => sum + Number(s.amount), 0);
  const yearlySubsMonthly = subscriptions
    .filter((s) => s.billing_cycle === "Yearly")
    .reduce((sum, s) => sum + Number(s.amount) / 12, 0);
  const subsBaseline = monthlySubsTotal + yearlySubsMonthly;

  const budget = monthlyBudget > 0 ? monthlyBudget : (salary > 0 ? salary : subsBaseline * 2);

  const daysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();

  const getDailyCumulative = (month: number, year: number, baseline = 0) => {
    const days = daysInMonth(month, year);
    const daily = new Array(days).fill(0);
    expenses.forEach((e) => {
      const d = new Date(e.date);
      if (d.getMonth() === month && d.getFullYear() === year) {
        const idx = d.getDate() - 1;
        if (idx >= 0 && idx < days) daily[idx] += Number(e.amount);
      }
    });
    const cumulative: number[] = [];
    daily.reduce((acc, val, i) => {
      cumulative[i] = acc + val;
      return cumulative[i];
    }, baseline);
    return cumulative;
  };

  const thisMonthDays = daysInMonth(currentMonth, currentYear);
  const lastMonthDays = daysInMonth(lastMonth, lastMonthYear);
  const thisMonthDaily = getDailyCumulative(currentMonth, currentYear, subsBaseline);
  const lastMonthDaily = getDailyCumulative(lastMonth, lastMonthYear, subsBaseline);

  const spentThisMonth = thisMonthDaily[thisMonthDays - 1] || 0;
  const spentLastMonth = lastMonthDaily[lastMonthDays - 1] || 0;

  const income = salary;

  const budgetChartData = Array.from({ length: thisMonthDays }, (_, i) => ({
    day: i + 1,
    spent: thisMonthDaily[i],
    budget,
    income,
    fixedCost: subsBaseline,
    dangerBase: budget,
    dangerSpan: income > budget ? income - budget : 0,
  }));

  const comparisonDays = Math.max(thisMonthDays, lastMonthDays);
  const comparisonData = Array.from({ length: comparisonDays }, (_, i) => ({
    day: i + 1,
    thisMonth: i < thisMonthDays ? thisMonthDaily[i] : null,
    lastMonth: i < lastMonthDays ? lastMonthDaily[i] : null,
  }));

  const categoryTotals: Record<string, number> = {};
  subscriptions.forEach((s) => {
    const amt =
      s.billing_cycle === "Yearly" ? Number(s.amount) / 12 : Number(s.amount);
    categoryTotals[s.category] = (categoryTotals[s.category] || 0) + amt;
  });
  const categoryData = Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);

  const CATEGORY_COLORS = [
    "#a78bfa",
    "#10b981",
    "#f59e0b",
    "#ec4899",
    "#6366f1",
    "#14b8a6",
    "#f43f5e",
    "#84cc16",
  ];

  const diff = spentThisMonth - spentLastMonth;
  const diffPct =
    spentLastMonth > 0 ? Math.round((diff / spentLastMonth) * 100) : 0;
  const budgetPct =
    budget > 0 ? Math.round((spentThisMonth / budget) * 100) : 0;

  const hasData = expenses.length > 0 || subscriptions.length > 0;

  const saveBudget = async () => {
    if (!user) return;
    const value = parseFloat(budgetInput);
    if (isNaN(value) || value < 0) return;

    const { data: existing } = await supabase
      .from("monthly_tracker_settings")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("monthly_tracker_settings")
        .update({ monthly_budget: value })
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("monthly_tracker_settings")
        .insert({ user_id: user.id, monthly_budget: value });
    }
    setMonthlyBudget(value);
    setEditingBudget(false);
  };

  const startEditBudget = () => {
    setBudgetInput(monthlyBudget > 0 ? String(monthlyBudget) : "");
    setEditingBudget(true);
  };

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-8">
      <header className="max-w-md mx-auto px-4 pt-4 pb-2 flex items-center justify-end">
        <button
          onClick={() => setMenuOpen(true)}
          className="rounded-full bg-card border border-border text-muted-foreground hover:text-foreground p-2"
          aria-label="Open menu"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </header>
      <SettingsMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      {loading ? (
        <div className="p-4 text-muted-foreground text-sm">Loading reports...</div>
      ) : !hasData ? (
        <div className="p-6 text-center">
          <div className="text-4xl mb-3">📊</div>
          <h2 className="text-lg font-semibold text-foreground mb-2">No data yet</h2>
          <p className="text-sm text-muted-foreground">
            Start tracking expenses to see your reports.
          </p>
        </div>
      ) : (
        <div className="p-4 max-w-md mx-auto space-y-3">
          {monthlyBudget === 0 && !editingBudget && (
            <div className="bg-card rounded-2xl border border-primary/30 p-4">
              <div className="text-sm font-medium text-foreground mb-1">Set your monthly budget</div>
              <p className="text-xs text-muted-foreground mb-3">
                How much do you want to spend per month? This sets the dashed budget line.
              </p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="e.g. 1500"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                />
                <Button onClick={saveBudget} size="sm">Save</Button>
              </div>
            </div>
          )}

          <div className="bg-card rounded-2xl border border-primary/15 p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-sm font-medium text-foreground">Monthly spend vs budget</div>
                <div className="inline-block text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1">
                  {currency}{spentThisMonth.toFixed(0)} of {currency}{budget.toFixed(0)}
                </div>
              </div>
              <div className="text-sm font-semibold text-primary">{budgetPct}%</div>
            </div>
            <div className="flex flex-nowrap items-center gap-x-2 text-[10px] text-muted-foreground mb-3 overflow-hidden">
              {income > 0 && (
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <span className="w-2.5 h-0.5 rounded" style={{ background: "#8100FF" }} />
                  Income
                </span>
              )}
              <span className="flex items-center gap-1 whitespace-nowrap">
                <span className="w-2.5 h-0.5 bg-emerald-500 rounded" />
                Spent
              </span>
              <span className="flex items-center gap-1 whitespace-nowrap">
                <span
                  className="w-2.5 h-0.5 rounded"
                  style={{
                    background:
                      "repeating-linear-gradient(to right, #a78bfa 0 3px, transparent 3px 6px)",
                  }}
                />
                Budget
              </span>
              <span className="flex items-center gap-1 whitespace-nowrap">
                <span className="w-2.5 h-0.5 rounded" style={{ background: "#f97316" }} />
                Fixed cost
              </span>
              {income > 0 && income > budget && (
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <span
                    className="w-2.5 h-1.5 rounded"
                    style={{
                      background:
                        "repeating-linear-gradient(45deg, #ef4444 0 2px, transparent 2px 4px)",
                    }}
                  />
                  Danger zone
                </span>
              )}
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={budgetChartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <defs>
                  <pattern id="dangerStripes" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                    <rect width="8" height="8" fill="rgba(239,68,68,0.04)" />
                    <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(239,68,68,0.35)" strokeWidth="1" />
                  </pattern>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis
                  dataKey="day"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  type="number"
                  domain={[1, thisMonthDays]}
                  ticks={[1, 5, 10, 15, 20, 25, thisMonthDays]}
                  interval={0}
                  minTickGap={4}
                  tickFormatter={(v) => String(v)}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                  tick={(props) => {
                    const { x, y, payload } = props;
                    const v = Number(payload.value);
                    let fill = "hsl(var(--muted-foreground))";
                    if (budget > 0 && v === Math.round(budget)) fill = "#a78bfa";
                    else if (income > 0 && v === Math.round(income)) fill = "#8100FF";
                    return (
                      <text x={x} y={y} dy={3} textAnchor="end" fontSize={10} fill={fill}>
                        {currency}{Math.round(v)}
                      </text>
                    );
                  }}
                  domain={[0, (() => {
                    const peak = Math.max(spentThisMonth, income, budget);
                    if (peak <= 0) return 100;
                    const target = peak * 1.05;
                    const pow = Math.pow(10, Math.floor(Math.log10(target)));
                    const step = pow / 2;
                    return Math.ceil(target / step) * step;
                  })()]}
                  ticks={(() => {
                    const peak = Math.max(spentThisMonth, income, budget);
                    if (peak <= 0) return [0, 25, 50, 75, 100];
                    const target = peak * 1.05;
                    const pow = Math.pow(10, Math.floor(Math.log10(target)));
                    const stepUnit = pow / 2;
                    const top = Math.ceil(target / stepUnit) * stepUnit;
                    const niceSteps = [pow / 2, pow, pow * 2, pow * 2.5, pow * 5];
                    let step = niceSteps[0];
                    for (const s of niceSteps) {
                      if (top / s <= 5) { step = s; break; }
                    }
                    const base: number[] = [];
                    for (let v = 0; v <= top + 0.001; v += step) base.push(Math.round(v));
                    const extras: number[] = [];
                    if (budget > 0) extras.push(Math.round(budget));
                    if (income > 0) extras.push(Math.round(income));
                    const threshold = top * 0.06;
                    const filtered = base.filter(
                      (v) => !extras.some((e) => Math.abs(e - v) < threshold)
                    );
                    return Array.from(new Set([...filtered, ...extras])).sort((a, b) => a - b);
                  })()}
                  allowDecimals={false}
                  interval={0}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const items = payload.filter(
                      (p) => p.dataKey !== "dangerBase" && p.dataKey !== "dangerSpan" && p.dataKey !== "fixedCost"
                    );
                    if (items.length === 0) return null;
                    return (
                      <div
                        style={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                          padding: "8px 10px",
                          color: "hsl(var(--foreground))",
                        }}
                      >
                        <div style={{ marginBottom: 4, opacity: 0.7 }}>Day {label}</div>
                        {items.map((it) => (
                          <div key={String(it.dataKey)} style={{ color: it.color }}>
                            {it.name}: {currency}{Math.round(Number(it.value))}
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                {/* Danger zone: invisible base + striped span stacked on top */}
                <Area type="monotone" dataKey="dangerBase" stackId="danger" stroke="none" fill="transparent" isAnimationActive={false} activeDot={false} legendType="none" />
                <Area type="monotone" dataKey="dangerSpan" stackId="danger" stroke="none" fill="url(#dangerStripes)" isAnimationActive={false} activeDot={false} legendType="none" />
                {/* Budget line as Area so it renders reliably in AreaChart */}
                <Area type="monotone" dataKey="budget" stroke="#a78bfa" strokeWidth={2} strokeDasharray="5 4" fill="transparent" dot={false} activeDot={false} />
                {/* Fixed cost baseline */}
                {subsBaseline > 0 && (
                  <Area type="monotone" dataKey="fixedCost" name="Fixed cost" stroke="#f97316" strokeWidth={2} fill="transparent" dot={false} activeDot={false} />
                )}
                {/* Spent on top */}
                <Area type="monotone" dataKey="spent" stroke="#10b981" strokeWidth={3} fill="rgba(16,185,129,0.18)" dot={false} activeDot={{ r: 5, fill: "#10b981", stroke: "#0f0f1e", strokeWidth: 2 }} />
                {income > 0 && (
                  <ReferenceLine y={income} stroke="#8100FF" strokeWidth={2} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-2xl border border-primary/15 p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-sm font-medium text-foreground">This month spendings vs last months</div>
                <div className="inline-block text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1">
                  {diff >= 0 ? "+" : ""}{currency}{Math.abs(diff).toFixed(0)}
                  <span className={`ml-1.5 ${diff < 0 ? "text-red-400" : "text-emerald-400"}`}>
                    {diff < 0 ? "" : "+"}
                    {diffPct}%
                  </span>
                </div>
              </div>
              <div className="text-sm font-semibold text-primary">{currency}{spentThisMonth.toFixed(0)}</div>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-0.5 bg-purple-400 rounded" />
                This month
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-0.5 bg-white/30 rounded" />
                Last month
              </span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={comparisonData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="day"
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  type="number"
                  domain={[1, comparisonDays]}
                  ticks={[1, 5, 10, 15, 20, 25, comparisonDays]}
                  interval={0}
                  minTickGap={4}
                  tickFormatter={(v) => String(v)}
                />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} width={60} tickFormatter={(v) => `${currency}${v}`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    return (
                      <div
                        style={{
                          background: "#0f0f1e",
                          border: "1px solid rgba(139,92,246,0.3)",
                          borderRadius: 8,
                          fontSize: 12,
                          padding: "8px 10px",
                          color: "rgba(255,255,255,0.85)",
                        }}
                      >
                        <div style={{ marginBottom: 4, opacity: 0.7 }}>Day {label}</div>
                        {payload.map((it) => (
                          <div key={String(it.dataKey)} style={{ color: it.color }}>
                            {it.name}: {currency}{Math.round(Number(it.value))}
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Line type="monotone" dataKey="thisMonth" name="This month" stroke="#a78bfa" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="lastMonth" name="Last month" stroke="rgba(255,255,255,0.35)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {categoryData.length > 0 && (
            <div className="bg-card rounded-2xl border border-primary/15 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-sm font-medium text-foreground">Spending by category</div>
                  <div className="inline-block text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1">
                    Top: {categoryData[0]?.name}
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "hsl(var(--foreground))",
                    }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value: number) => [`${currency}${value}`, "Amount"]}
                  />
                  <Legend
                    verticalAlign="middle"
                    align="right"
                    layout="vertical"
                    iconType="circle"
                    wrapperStyle={{ fontSize: "11px", color: "hsl(var(--foreground))" }}
                    formatter={(value) => (
                      <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-card rounded-2xl border border-primary/15 p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium text-foreground">Monthly budget</div>
              {!editingBudget && (
                <button
                  onClick={startEditBudget}
                  className="text-muted-foreground hover:text-foreground p-1"
                  aria-label="Edit budget"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
            {editingBudget ? (
              <div className="flex gap-2">
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="e.g. 1500"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  autoFocus
                />
                <Button onClick={saveBudget} size="icon" variant="default">
                  <Check className="w-4 h-4" />
                </Button>
                <Button onClick={() => setEditingBudget(false)} size="icon" variant="outline">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-primary">
                  {currency}{monthlyBudget > 0 ? monthlyBudget.toFixed(0) : "—"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {monthlyBudget > 0 ? "per month" : "not set"}
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              This is the dashed line in your spend chart above.
            </p>
          </div>
        </div>
      )}
      <BottomNav currentRoute="reports" />
    </div>
  );
}
