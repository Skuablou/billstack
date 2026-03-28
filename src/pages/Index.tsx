import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import SpendingOverview from "@/components/SpendingOverview";
import SubscriptionCard from "@/components/SubscriptionCard";
import AddSubscriptionDialog from "@/components/AddSubscriptionDialog";
import { loadSubscriptions, saveSubscriptions, Subscription } from "@/lib/subscriptions";

const STRIPE_LINK = "https://buy.stripe.com/28EbJ3gB28dT2ZL9PxgA800";

export default function Index() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    setSubscriptions(loadSubscriptions());
  }, []);

  useEffect(() => {
    if (subscriptions.length > 0) saveSubscriptions(subscriptions);
  }, [subscriptions]);

  const addSubscription = (sub: Subscription) => {
    setSubscriptions((prev) => [...prev, sub]);
  };

  const deleteSubscription = (id: string) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-lg font-display font-bold text-foreground">SubTracker</h1>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-primary/30 text-primary hover:bg-primary/10 gap-1.5"
          >
            <a href={STRIPE_LINK} target="_blank" rel="noopener noreferrer">
              <Sparkles className="w-3.5 h-3.5" /> Pro · €2.99/mo
            </a>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-[1fr_1.4fr] gap-8">
          {/* Left: Overview */}
          <SpendingOverview subscriptions={subscriptions} />

          {/* Right: List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-foreground">Subscriptions</h2>
              <AddSubscriptionDialog onAdd={addSubscription} />
            </div>
            <div className="space-y-2">
              {subscriptions.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl bg-card border border-border p-12 text-center"
                >
                  <p className="text-muted-foreground">No subscriptions yet. Add one to get started!</p>
                </motion.div>
              ) : (
                subscriptions.map((sub, i) => (
                  <SubscriptionCard
                    key={sub.id}
                    subscription={sub}
                    index={i}
                    onDelete={deleteSubscription}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
