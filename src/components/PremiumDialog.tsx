import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";

const STRIPE_LINK = "https://buy.stripe.com/28EbJ3gB28dT2ZL9PxgA800";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PremiumDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm text-center p-8">
        {/* Crown icon */}
        <div className="mx-auto w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-2">
          <Crown className="w-7 h-7 text-primary" />
        </div>

        <h2 className="font-display font-bold text-foreground text-xl">Unlock Premium</h2>
        <p className="text-muted-foreground text-sm">Upgrade for unlimited subscriptions.</p>

        {/* Pricing card */}
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-5 mt-4 text-left space-y-3">
          <div className="text-center">
            <span className="text-primary font-display font-bold text-3xl">€2.99</span>
            <p className="text-muted-foreground text-sm">per month</p>
          </div>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Unlimited subscriptions
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Early access to new features
            </li>
          </ul>
        </div>

        {/* CTA */}
        <Button
          asChild
          className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-xl h-11"
        >
          <a href={STRIPE_LINK} target="_blank" rel="noopener noreferrer">
            Upgrade now → €2.99/month
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
