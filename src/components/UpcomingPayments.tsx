import { Clock } from "lucide-react";
import { Subscription, getUpcomingPayments } from "@/lib/subscriptions";
import { useCurrency } from "@/lib/CurrencyContext";

interface Props {
  subscriptions: Subscription[];
}

export default function UpcomingPayments({ subscriptions }: Props) {
  const { currency } = useCurrency();
  const upcoming = getUpcomingPayments(subscriptions).slice(0, 5);

  return (
    <div className="space-y-3">
      <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
        <Clock className="w-4 h-4 text-muted-foreground" />
        Upcoming payments
      </h3>
      <div className="space-y-2">
        {upcoming.length === 0 ? (
          <p className="text-muted-foreground text-sm">No upcoming payments</p>
        ) : (
          upcoming.map((sub) => {
            const initial = sub.name.charAt(0).toLowerCase();
            const monthName = sub.nextDate.toLocaleString('default', { month: 'short' });
            return (
              <div
                key={sub.id}
                className="flex items-center gap-3 rounded-xl bg-card border border-border p-3"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: `${sub.color}30`, color: sub.color }}
                >
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-medium text-sm truncate">{sub.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {sub.billingDate} {monthName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-foreground font-semibold text-sm">{currency}{sub.amount.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">in {sub.daysUntil} days</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
