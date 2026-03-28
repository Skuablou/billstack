import { motion } from "framer-motion";
import { Subscription, CATEGORY_COLORS } from "@/lib/subscriptions";

interface Props {
  subscriptions: Subscription[];
}

export default function SpendingOverview({ subscriptions }: Props) {
  const total = subscriptions.reduce((sum, s) => sum + s.amount, 0);

  const byCategory = subscriptions.reduce<Record<string, number>>((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + s.amount;
    return acc;
  }, {});

  const categories = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amount]) => ({
      name: cat,
      amount,
      percent: total > 0 ? (amount / total) * 100 : 0,
      color: CATEGORY_COLORS[cat] || CATEGORY_COLORS.Other,
    }));

  return (
    <div className="space-y-6">
      {/* Total */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-card border border-border p-6 text-center"
        style={{ boxShadow: "var(--shadow-glow)" }}
      >
        <p className="text-sm text-muted-foreground mb-1">Monthly Spending</p>
        <p className="text-5xl font-display font-bold text-foreground">
          €{total.toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {subscriptions.length} active subscription{subscriptions.length !== 1 ? "s" : ""}
        </p>
      </motion.div>

      {/* Category breakdown */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">By Category</h3>
        {/* Bar */}
        <div className="h-3 rounded-full bg-muted overflow-hidden flex">
          {categories.map((c) => (
            <motion.div
              key={c.name}
              initial={{ width: 0 }}
              animate={{ width: `${c.percent}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ backgroundColor: c.color }}
              className="h-full first:rounded-l-full last:rounded-r-full"
            />
          ))}
        </div>
        {/* Legend */}
        <div className="space-y-2">
          {categories.map((c) => (
            <div key={c.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <span className="text-secondary-foreground">{c.name}</span>
              </div>
              <span className="text-foreground font-medium">€{c.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
