import { DollarSign } from "lucide-react";
import { Subscription, getYearlyTotal, getMonthlyTotal } from "@/lib/subscriptions";
import { useCurrency } from "@/lib/CurrencyContext";

interface Props {
  subscriptions: Subscription[];
}

export default function YearlyProjection({ subscriptions }: Props) {
  const { currency } = useCurrency();
  const yearlyTotal = getYearlyTotal(subscriptions);
  const monthlyAvg = getMonthlyTotal(subscriptions);
  const dailyAvg = monthlyAvg / 30;
  const fmt = (n: number) => `${n.toFixed(2)}${currency}`;

  return (
    <div
      className="rounded-xl border p-5 space-y-4"
      style={{ background: "linear-gradient(135deg, hsl(220 50% 14%), hsl(230 40% 10%))", borderColor: "hsl(210 70% 50% / 0.3)", boxShadow: "0 0 30px -10px hsl(210 70% 50% / 0.1)" }}
    >
      <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
        <DollarSign className="w-4 h-4" style={{ color: "hsl(210 70% 55%)" }} />
        Yearly projection
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">Next 12 months</span>
          <span className="font-display font-bold text-xl" style={{ color: "hsl(210 80% 60%)" }}>{fmt(yearlyTotal)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">Average/month</span>
          <span className="text-foreground font-medium text-sm">{fmt(monthlyAvg)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">Average/day</span>
          <span className="text-foreground font-medium text-sm">{fmt(dailyAvg)}</span>
        </div>
      </div>
    </div>
  );
}
