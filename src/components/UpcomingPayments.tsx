import { AlertCircle, Bell, BellOff, Calendar, Check } from "lucide-react";
import { Subscription, getUpcomingPayments, getMonthlyAmount } from "@/lib/subscriptions";
import { useCurrency } from "@/lib/CurrencyContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import catHousing from "@/assets/cat-housing.png";
import catCar from "@/assets/cat-car.png";
import catInsurance from "@/assets/cat-insurance.png";
import catDebt from "@/assets/cat-debt.png";
import catUtilities from "@/assets/cat-utilities.png";
import catStreaming from "@/assets/cat-streaming.png";

const CATEGORY_IMAGES: Record<string, string> = {
  "Housing": catHousing,
  "Car & Transport": catCar,
  "Insurance": catInsurance,
  "Debt Payments": catDebt,
  "Utilities & Phone": catUtilities,
  "Streaming & Subscriptions": catStreaming,
};

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
  { value: "5", label: "5 days" },
  { value: "6", label: "6 days" },
  { value: "7", label: "7 days" },
];

function getDaysColor(days: number): string {
  if (days <= 4) return "hsl(0 72% 55%)";
  if (days <= 7) return "hsl(45 90% 55%)";
  return "hsl(145 70% 45%)";
}

function getDaysLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `in ${days} days`;
}

export default function UpcomingPayments({ subscriptions, onUpdate }: Props) {
  const { currency } = useCurrency();
  const upcoming = getUpcomingPayments(subscriptions)
    .sort((a, b) => getMonthlyAmount(b) - getMonthlyAmount(a))
    .slice(0, 5);

  return (
    <div className="space-y-3">
      <h3 className="font-display font-semibold text-foreground flex items-center gap-2 text-lg">
        <AlertCircle className="w-5 h-5" style={{ color: "hsl(45 90% 55%)" }} />
        Upcoming payments
      </h3>
      <div className="space-y-2">
        {upcoming.length === 0 ? (
          <div className="rounded-xl bg-card border border-border p-6 text-center">
            <p className="text-muted-foreground text-sm">No upcoming payments</p>
          </div>
        ) : (
          upcoming.map((sub) => {
            const categoryImage = CATEGORY_IMAGES[sub.category];
            const initial = sub.name.charAt(0).toLowerCase();
            const monthName = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'][sub.nextDate.getMonth()];
            const daysColor = getDaysColor(sub.daysUntil);
            return (
              <div
                key={sub.id}
                className="rounded-xl bg-card border border-border p-4 space-y-2"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0 overflow-hidden"
                    style={{ backgroundColor: sub.color }}
                  >
                    {categoryImage ? (
                      <img src={categoryImage} alt={sub.category} className="w-8 h-8 object-contain" />
                    ) : (
                      initial
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-semibold text-lg truncate">{sub.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {sub.billingDate} {monthName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-foreground font-bold text-sm">{sub.amount.toFixed(2)}{currency}</p>
                    <p className="text-xs font-medium" style={{ color: daysColor }}>
                      {getDaysLabel(sub.daysUntil)}
                    </p>
                  </div>
                </div>
                {/* Reminder */}
                <div className="flex items-center gap-1.5 pl-14">
                  {String(sub.reminderDays ?? 1) === "0" ? (
                    <BellOff className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <Bell className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <Select
                    value={String(sub.reminderDays ?? 1)}
                    onValueChange={(v) => onUpdate?.(sub.id, { reminderDays: parseInt(v) })}
                  >
                    <SelectTrigger className="h-7 w-[120px] text-xs bg-muted border-border px-2">
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
