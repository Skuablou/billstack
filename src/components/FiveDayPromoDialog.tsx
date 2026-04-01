import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { useCurrency } from "@/lib/CurrencyContext";

const STRIPE_LINK = "https://buy.stripe.com/cNi8wR3Ogcu96bX5zhgA801";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FiveDayPromoDialog({ open, onOpenChange }: Props) {
  const { currency } = useCurrency();
  const price = currency === "€" ? "2.99€" : "$2.99";

  const handleDismiss = () => {
    localStorage.setItem("billstack-5day-promo-shown", "true");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleDismiss}>
      <DialogContent className="bg-card border-border max-w-sm text-center p-8">
        <div className="text-4xl mb-2">🎉</div>

        <h2 className="font-display font-bold text-foreground text-xl">
          You've been tracking for 5 days!
        </h2>
        <p className="text-muted-foreground text-sm">
          Unlock unlimited tracking, Survival Calculator and notifications for {price}/mo. Your data stays safe.
        </p>

        <Button
          asChild
          className="w-full mt-4 font-semibold rounded-xl h-11 text-black"
          style={{ background: "linear-gradient(135deg, hsl(36 100% 50%), hsl(25 100% 50%))" }}
        >
          <a
            href={STRIPE_LINK}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => localStorage.setItem("billstack-5day-promo-shown", "true")}
          >
            <Crown className="w-4 h-4 mr-1.5" /> Upgrade now → {price}/month
          </a>
        </Button>

        <button
          onClick={handleDismiss}
          className="text-muted-foreground text-sm hover:text-foreground transition-colors mt-1"
        >
          Maybe later
        </button>
      </DialogContent>
    </Dialog>
  );
}
