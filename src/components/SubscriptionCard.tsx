import { motion } from "framer-motion";
import { Trash2, RefreshCw } from "lucide-react";
import { Subscription, getMonthlyAmount } from "@/lib/subscriptions";
import { useCurrency } from "@/lib/CurrencyContext";

interface Props {
  subscription: Subscription;
  index: number;
  onDelete: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Subscription>) => void;
}

export default function SubscriptionCard({ subscription: s, index, onDelete }: Props) {
  const { currency } = useCurrency();
  const initial = s.name.charAt(0).toLowerCase();
  const monthly = getMonthlyAmount(s);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group rounded-xl bg-card border border-border p-4 md:p-5 hover:border-primary/30 transition-colors overflow-hidden"
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className="w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-base font-bold text-white shrink-0"
          style={{ backgroundColor: s.color }}
        >
          {initial}
        </div>

        {/* Name + Monthly */}
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-semibold truncate text-base md:text-lg">{s.name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> {s.billingCycle}
          </p>
        </div>

        {/* Amount */}
        <p className="text-foreground font-display font-bold text-base md:text-lg shrink-0">
          {monthly.toFixed(2)}{currency}
        </p>

        {/* Delete */}
        <button
          onClick={() => onDelete(s.id)}
          className="text-muted-foreground hover:text-destructive p-1 transition-colors shrink-0 opacity-0 group-hover:opacity-100 md:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
