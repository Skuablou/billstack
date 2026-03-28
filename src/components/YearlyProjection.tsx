import { DollarSign } from "lucide-react";
import { Subscription, getYearlyTotal, getMonthlyTotal } from "@/lib/subscriptions";

interface Props {
  subscriptions: Subscription[];
}

export default function YearlyProjection({ subscriptions }: Props) {
  const yearlyTotal = getYearlyTotal(subscriptions);
  const monthlyAvg = getMonthlyTotal(subscriptions);
  const dailyAvg = monthlyAvg / 30;

  return (
    <div
      className="rounded-xl bg-card border border-primary/20 p-5 space-y-4"
      style={{ boxShadow: "0 0 30px -10px hsl(36 100% 50% / 0.1)" }}
    >
      <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-primary" />
        Yearly projection
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">Next 12 months</span>
          <span className="text-primary font-display font-bold text-xl">€{yearlyTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">Average/month</span>
          <span className="text-foreground font-medium text-sm">€{monthlyAvg.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">Average/day</span>
          <span className="text-foreground font-medium text-sm">€{dailyAvg.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
