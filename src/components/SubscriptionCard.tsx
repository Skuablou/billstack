import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { Subscription } from "@/lib/subscriptions";

interface Props {
  subscription: Subscription;
  index: number;
  onDelete: (id: string) => void;
}

export default function SubscriptionCard({ subscription: s, index, onDelete }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group flex items-center gap-4 rounded-xl bg-card border border-border p-4 hover:border-primary/30 transition-colors"
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
        style={{ backgroundColor: `${s.color}20` }}
      >
        {s.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-foreground font-medium truncate">{s.name}</p>
        <p className="text-xs text-muted-foreground">
          {s.category} · Day {s.billingDate}
        </p>
      </div>
      <p className="text-foreground font-display font-semibold text-lg">
        {s.currency}{s.amount.toFixed(2)}
      </p>
      <button
        onClick={() => onDelete(s.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
