import { AlertCircle, Bell } from "lucide-react";
import { Subscription, getUpcomingPayments } from "@/lib/subscriptions";
import { useCurrency } from "@/lib/CurrencyContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  subscriptions: Subscription[];
  onUpdate?: (id: string, updates: Partial<Subscription>) => void;
}

const REMINDER_OPTIONS = [
  { value: "0", label: "Off" },
  { value: "1", label: "1 day" },
  { value: "2", label: "2 days" },
  { value: "3", label: "3 days" },
  { value: "4", label: "4 days" },
  { value: "7", label: "7 days" },
];

function getDaysColor(days: number): string {
  if (days <= 4) return "hsl(0 72% 55%)";
  if (days <= 7) return "hsl(45 90% 55%)";
  return "hsl(140 60% 45%)";
}

function getDaysLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `in ${days} days`;
}

export default function UpcomingPayments({ subscriptions, onUpdate }: Props) {
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
                className="rounded-xl bg-card border border-border p-3 space-y-2"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
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
                {/* Reminder */}
                <div className="flex items-center gap-1.5 pl-12">
                  <Bell className="w-3.5 h-3.5 text-muted-foreground" />
                  <Select
                    value={String(sub.reminderDays ?? 1)}
                    onValueChange={(v) => onUpdate?.(sub.id, { reminderDays: parseInt(v) })}
                  >
                    <SelectTrigger className="h-6 w-[110px] text-[11px] bg-muted border-border px-2">
                      <SelectValue placeholder="Reminder" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {REMINDER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.value === "0" ? "Off" : `${opt.label} before`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
