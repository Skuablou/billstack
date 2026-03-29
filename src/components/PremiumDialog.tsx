import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { useCurrency } from "@/lib/CurrencyContext";

const STRIPE_LINK = "https://buy.stripe.com/28EbJ3gB28dT2ZL9PxgA800";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PremiumDialog({ open, onOpenChange }: Props) {
  const { currency } = useCurrency();
  const price = currency === "€" ? "€2.99" : "$2.99";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm text-center p-8">
        <div className="mx-auto w-14 h-14 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: "hsl(36 100% 50% / 0.2)" }}>
          <Crown className="w-7 h-7" style={{ color: "hsl(36 100% 50%)" }} />
        </div>

        <h2 className="font-display font-bold text-foreground text-xl">Unlock Premium</h2>
        <p className="text-muted-foreground text-sm">Upgrade for unlimited subscriptions.</p>

        <div className="rounded-xl border p-5 mt-4 text-left space-y-3" style={{ borderColor: "hsl(36 100% 50% / 0.4)", backgroundColor: "hsl(36 100% 50% / 0.05)" }}>
          <div className="text-center">
            <span className="font-display font-bold text-3xl" style={{ color: "hsl(36 100% 50%)" }}>{price}</span>
            <p className="text-muted-foreground text-sm">per month</p>
          </div>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "hsl(36 100% 50%)" }} />
              Unlimited subscriptions
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "hsl(36 100% 50%)" }} />
              Early access to new features
            </li>
          </ul>
        </div>

        <Button
          asChild
          className="w-full mt-4 font-semibold rounded-xl h-11 text-black"
          style={{ background: "linear-gradient(135deg, hsl(36 100% 50%), hsl(25 100% 50%))" }}
        >
          <a href={STRIPE_LINK} target="_blank" rel="noopener noreferrer">
            Upgrade now → {price}/month
          </a>
        </Button>

        <button
          onClick={() => onOpenChange(false)}
          className="text-muted-foreground text-sm hover:text-foreground transition-colors mt-1"
        >
          Maybe later
        </button>
      </DialogContent>
    </Dialog>
  );
}
