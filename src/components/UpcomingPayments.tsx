import { Clock, AlertCircle } from "lucide-react";
import { Subscription, getUpcomingPayments } from "@/lib/subscriptions";
import { useCurrency } from "@/lib/CurrencyContext";

interface Props {
  subscriptions: Subscription[];
}

function getDaysColor(days: number): string {
  if (days <= 4) return "hsl(0 72% 55%)";   // red
  if (days <= 7) return "hsl(45 90% 55%)";   // yellow
  return "hsl(140 60% 45%)";                  // green
}

function getDaysLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `in ${days} days`;
}

export default function UpcomingPayments({ subscriptions }: Props) {
  const { currency } = useCurrency();
  const upcoming = getUpcomingPayments(subscriptions).slice(0, 5);

  return (
    <div className="space-y-3">
      <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
        <AlertCircle className="w-4 h-4" style={{ color: "hsl(45 90% 55%)" }} />
        Upcoming payments
      </h3>
      <div className="space-y-2">
        {upcoming.length === 0 ? (
          <div className="rounded-xl bg-card border border-border p-6 text-center">
            <p className="text-muted-foreground text-sm">No upcoming payments</p>
          </div>
        ) : (
          upcoming.map((sub) => {
            const initial = sub.name.charAt(0).toLowerCase();
            const monthName = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'][sub.nextDate.getMonth()];
            const daysColor = getDaysColor(sub.daysUntil);
            return (
              <div
                key={sub.id}
                className="flex items-center gap-3 rounded-xl bg-card border border-border p-3"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: sub.color }}
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
                  <p className="text-foreground font-semibold text-sm">{sub.amount.toFixed(2)}{currency}</p>
                  <p className="text-xs font-medium" style={{ color: daysColor }}>
                    {getDaysLabel(sub.daysUntil)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
