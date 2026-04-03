import { motion } from "framer-motion";
import { Trash2, RefreshCw, Calendar } from "lucide-react";
import { Subscription, getMonthlyAmount } from "@/lib/subscriptions";
import { useCurrency } from "@/lib/CurrencyContext";

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
  subscription: Subscription;
  index: number;
  onDelete: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Subscription>) => void;
}

export default function SubscriptionCard({ subscription: s, index, onDelete }: Props) {
  const { currency } = useCurrency();
  const categoryImage = CATEGORY_IMAGES[s.category];
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
          className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0 overflow-hidden"
          style={{ backgroundColor: s.color }}
        >
          {categoryImage ? (
            <img src={categoryImage} alt={s.category} className="w-8 h-8 md:w-9 md:h-9 object-contain" />
          ) : (
            initial
          )}
        </div>

        {/* Name + Monthly */}
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-semibold truncate text-lg md:text-xl">{s.name}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> {s.billingCycle}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {s.billingDate}. {['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'][new Date().getMonth()]}
            </span>
          </div>
        </div>

        {/* Amount */}
        <p className="text-foreground font-display font-bold text-sm md:text-base shrink-0">
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
