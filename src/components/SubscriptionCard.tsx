import { motion } from "framer-motion";
import { Trash2, RefreshCw, Calendar, Bell } from "lucide-react";
import { Subscription } from "@/lib/subscriptions";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/lib/CurrencyContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  subscription: Subscription;
  index: number;
  onDelete: (id: string) => void;
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

export default function SubscriptionCard({ subscription: s, index, onDelete, onUpdate }: Props) {
  const { currency } = useCurrency();
  const initial = s.name.charAt(0).toLowerCase();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group flex items-center gap-4 rounded-xl bg-card border border-border p-5 hover:border-primary/30 transition-colors"
    >
      {/* Icon */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white"
        style={{ backgroundColor: s.color }}
      >
        {initial}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-foreground font-medium truncate">{s.name}</p>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0"
            style={{ borderColor: `${s.color}60`, color: s.color }}
          >
            {s.category}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          <span className="flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> {s.billingCycle}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {s.billingDate} {['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'][new Date().getMonth()]}
          </span>
        </div>
      </div>

      {/* Reminder selector */}
      <div className="flex items-center gap-1.5">
        <Bell className="w-3.5 h-3.5 text-muted-foreground" />
        <Select
          value={String(s.reminderDays ?? 1)}
          onValueChange={(v) => onUpdate?.(s.id, { reminderDays: parseInt(v) })}
        >
          <SelectTrigger className="h-7 w-[130px] text-xs bg-muted border-border px-2">
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

      {/* Amount */}
      <p className="text-foreground font-display font-semibold text-lg">
        {currency}{s.amount.toFixed(2)}
      </p>

      {/* Delete */}
      <button
        onClick={() => onDelete(s.id)}
        className="text-muted-foreground hover:text-destructive p-1 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
