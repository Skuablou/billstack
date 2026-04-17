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
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/AuthContext";
import BottomNav from "@/components/BottomNav";

type Expense = { date: string; amount: number };
type Subscription = { amount: number; billing_cycle: string; category: string };

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [salary, setSalary] = useState(0);
  const [loading, setLoading] = useState(true);

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
        .select("salary")
        .eq("user_id", user.id)
        .maybeSingle();

      setExpenses((exp as Expense[]) || []);
      setSubscriptions((subs as Subscription[]) || []);
      setSalary(settings?.salary || 0);
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

  const budget = salary > 0 ? salary : monthlySubsTotal * 2;

  const getWeeklyData = (month: number, year: number) => {
    const weeks = [0, 0, 0, 0];
    expenses.forEach((e) => {
      const d = new Date(e.date);
      if (d.getMonth() === month && d.getFullYear() === year) {
        const weekIdx = Math.min(Math.floor((d.getDate() - 1) / 7), 3);
        weeks[weekIdx] += Number(e.amount);
      }
    });
    const cumulative: number[] = [];
    weeks.reduce((acc, val, i) => {
      cumulative[i] = acc + val;
      return cumulative[i];
    }, 0);
    return cumulative;
  };

  const thisMonthWeekly = getWeeklyData(currentMonth, currentYear);
  const lastMonthWeekly = getWeeklyData(lastMonth, lastMonthYear);

  const spentThisMonth = thisMonthWeekly[3] || 0;
  const spentLastMonth = lastMonthWeekly[3] || 0;

  const budgetData = [0.25, 0.5, 0.75, 1].map((p) => Math.round(budget * p));

  const budgetChartData = ["Week 1", "Week 2", "Week 3", "Week 4"].map(
    (label, i) => ({
      week: label,
      spent: thisMonthWeekly[i],
      budget: budgetData[i],
    })
  );

  const comparisonData = ["Week 1", "Week 2", "Week 3", "Week 4"].map(
    (label, i) => ({
      week: label,
      thisMonth: thisMonthWeekly[i],
      lastMonth: lastMonthWeekly[i],
    })
  );

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

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="max-w-md mx-auto px-4 pt-6 pb-2">
        <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
      </header>

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
          <div className="bg-card rounded-2xl border border-primary/15 p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-sm font-medium text-foreground">Monthly spend vs budget</div>
                <div className="inline-block text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1">
                  €{spentThisMonth.toFixed(0)} of €{budget.toFixed(0)}
                </div>
              </div>
              <div className="text-sm font-semibold text-primary">{budgetPct}%</div>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-0.5 bg-emerald-500 rounded" />
                Spent
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="w-3.5 h-0.5 rounded"
                  style={{
                    background:
                      "repeating-linear-gradient(to right, #a78bfa 0 3px, transparent 3px 6px)",
                  }}
                />
                Budget
              </span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={budgetChartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `€${v}`} />
                <Tooltip
                  contentStyle={{
                    background: "#0f0f1e",
                    border: "1px solid rgba(139,92,246,0.3)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="spent" stroke="#10b981" strokeWidth={2.5} fill="rgba(16,185,129,0.12)" dot={false} />
                <Line type="monotone" dataKey="budget" stroke="#a78bfa" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-2xl border border-primary/15 p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-sm font-medium text-foreground">This month vs last month</div>
                <div className="inline-block text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1">
                  {diff >= 0 ? "+" : ""}€{Math.abs(diff).toFixed(0)}
                  <span className={`ml-1.5 ${diff < 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {diff < 0 ? "" : "+"}
                    {diffPct}%
                  </span>
                </div>
              </div>
              <div className="text-sm font-semibold text-primary">€{spentThisMonth.toFixed(0)}</div>
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
                <XAxis dataKey="week" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `€${v}`} />
                <Tooltip
                  contentStyle={{
                    background: "#0f0f1e",
                    border: "1px solid rgba(139,92,246,0.3)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line type="monotone" dataKey="thisMonth" stroke="#a78bfa" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="lastMonth" stroke="rgba(255,255,255,0.35)" strokeWidth={2} dot={false} />
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
                      background: "#0f0f1e",
                      border: "1px solid rgba(139,92,246,0.3)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`€${value}`, "Amount"]}
                  />
                  <Legend
                    verticalAlign="middle"
                    align="right"
                    layout="vertical"
                    iconType="circle"
                    wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.7)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
      <BottomNav currentRoute="reports" />
    </div>
  );
}
