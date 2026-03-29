import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { CreditCard, TrendingUp, RefreshCw, Plus, User, LogOut, Crown, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import SubscriptionCard from "@/components/SubscriptionCard";
import AddSubscriptionDialog from "@/components/AddSubscriptionDialog";
import PremiumDialog from "@/components/PremiumDialog";
import UpcomingPayments from "@/components/UpcomingPayments";
import YearlyProjection from "@/components/YearlyProjection";
import BudgetCalculator from "@/components/BudgetCalculator";
import SavingsGoal from "@/components/SavingsGoal";
import { useCurrency } from "@/lib/CurrencyContext";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useAuth } from "@/lib/AuthContext";
import {
  loadSubscriptions,
  saveSubscriptions,
  Subscription,
  getMonthlyTotal,
  getYearlyTotal,
  getMaxFreeSubscriptions,
} from "@/lib/subscriptions";
import { isPremiumUser, checkPremiumActivation } from "@/lib/premium";

const STRIPE_LINK = "https://buy.stripe.com/28EbJ3gB28dT2ZL9PxgA800";

export default function Index() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(isPremiumUser());
  const { currency, toggle: toggleCurrency } = useCurrency();
  const { user, logout } = useAuth();
  const { isSupported, isSubscribed, isLoading: pushLoading, subscribe, unsubscribe } = usePushNotifications();

  useEffect(() => {
    checkPremiumActivation().then(() => {
      setIsPremium(isPremiumUser());
    });
    setSubscriptions(loadSubscriptions());
  }, []);

  useEffect(() => {
    if (subscriptions.length > 0) {
      saveSubscriptions(subscriptions);
      // Re-sync bill reminders if push is subscribed
      if (isSubscribed) {
        subscribe(subscriptions);
      }
    }
  }, [subscriptions]);

  const addSubscription = (sub: Subscription) => {
    setSubscriptions((prev) => [...prev, sub]);
  };

  const deleteSubscription = (id: string) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSubscription = (id: string, updates: Partial<Subscription>) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  // isPremium is now managed via state above
  const monthlyTotal = getMonthlyTotal(subscriptions);
  const yearlyTotal = getYearlyTotal(subscriptions);
  const maxFree = getMaxFreeSubscriptions();
  const freeLeft = Math.max(0, maxFree - subscriptions.length);

  const fmt = (n: number) => `${currency}${n.toFixed(2)}`;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[180px] pointer-events-none" style={{ background: "hsl(270 80% 40% / 0.08)" }} />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none" style={{ background: "hsl(36 100% 50% / 0.05)" }} />
      <div className="fixed top-1/2 right-0 w-[400px] h-[400px] rounded-full blur-[140px] pointer-events-none" style={{ background: "hsl(210 70% 50% / 0.06)" }} />

      {/* Header */}
      <header className="max-w-5xl mx-auto px-6 pt-10 pb-2 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-display font-bold">
              <span style={{ background: "linear-gradient(135deg, hsl(145 70% 45%), hsl(160 80% 40%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Bill</span><span style={{ background: "linear-gradient(135deg, hsl(270 80% 60%), hsl(320 70% 55%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Stack</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Keep track of all your monthly bills</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Currency toggle - shows current symbol */}
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-border text-muted-foreground hover:text-foreground font-semibold text-sm"
              onClick={toggleCurrency}
              title={`Switch to ${currency === "€" ? "$" : "€"}`}
            >
              {currency}
            </Button>
            {/* Notification toggle */}
            {isSupported && (
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-border text-muted-foreground hover:text-foreground"
                onClick={() => isSubscribed ? unsubscribe() : subscribe(subscriptions)}
                disabled={pushLoading}
                title={isSubscribed ? "Disable reminders" : "Enable bill reminders"}
              >
                {isSubscribed ? <Bell className="w-4 h-4 text-primary" /> : <BellOff className="w-4 h-4" />}
              </Button>
            )}
            {/* Premium / Manage */}
            {isPremium ? (
              <Button
                asChild
                size="sm"
                className="rounded-full gap-1.5 px-5 py-2 text-black font-semibold border-0"
                style={{ background: "linear-gradient(135deg, hsl(36 100% 50%), hsl(25 100% 50%))" }}
              >
                <a href="https://billing.stripe.com/p/login/28EbJ3gB28dT2ZL9PxgA800" target="_blank" rel="noopener noreferrer">
                  <Crown className="w-4 h-4" /> Manage Plan
                </a>
              </Button>
            ) : (
              <Button
                size="sm"
                className="rounded-full gap-1.5 px-5 py-2 text-black font-semibold border-0"
                style={{ background: "linear-gradient(135deg, hsl(36 100% 50%), hsl(25 100% 50%))" }}
                onClick={() => setPremiumOpen(true)}
              >
                <Crown className="w-4 h-4" /> Premium
              </Button>
            )}
            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-border text-muted-foreground hover:text-foreground"
                >
                  <User className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border w-56">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm text-foreground font-medium truncate">{user?.email ?? "User"}</p>
                </div>
                <DropdownMenuItem
                  onClick={logout}
                  className="text-destructive focus:text-destructive cursor-pointer gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Stat Cards */}
      <main className="max-w-5xl mx-auto px-6 py-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {/* Monthly - purple */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border p-5"
            style={{ background: "linear-gradient(135deg, hsl(270 60% 18%), hsl(270 40% 12%))", borderColor: "hsl(270 80% 60% / 0.4)", boxShadow: "0 0 30px -10px hsl(270 80% 60% / 0.2)" }}
          >
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(270 80% 60% / 0.25)" }}>
                <CreditCard className="w-3.5 h-3.5" style={{ color: "hsl(270 80% 60%)" }} />
              </div>
              Monthly (avg)
            </div>
            <p className="text-3xl font-display font-bold text-foreground">{fmt(monthlyTotal)}</p>
          </motion.div>

          {/* Yearly - blue/teal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl border p-5"
            style={{ background: "linear-gradient(135deg, hsl(210 50% 14%), hsl(220 40% 10%))", borderColor: "hsl(210 70% 50% / 0.3)", boxShadow: "0 0 30px -10px hsl(210 70% 50% / 0.15)" }}
          >
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(210 70% 50% / 0.25)" }}>
                <TrendingUp className="w-3.5 h-3.5" style={{ color: "hsl(210 70% 55%)" }} />
              </div>
              Yearly
            </div>
            <p className="text-3xl font-display font-bold text-foreground">{fmt(yearlyTotal)}</p>
          </motion.div>

          {/* Subscription Count - green/teal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border p-5"
            style={{ background: "linear-gradient(135deg, hsl(160 50% 14%), hsl(160 40% 10%))", borderColor: "hsl(160 70% 45% / 0.3)", boxShadow: "0 0 30px -10px hsl(160 70% 45% / 0.15)" }}
          >
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(160 70% 45% / 0.25)" }}>
                <RefreshCw className="w-3.5 h-3.5" style={{ color: "hsl(160 70% 45%)" }} />
              </div>
              Spendings
            </div>
            <p className="text-3xl font-display font-bold text-foreground">
              {subscriptions.length}
              {!isPremium && (
                <span className="text-base font-normal text-muted-foreground ml-1">/ {maxFree} free</span>
              )}
            </p>
            {!isPremium && (
              <>
                <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((subscriptions.length / maxFree) * 100, 100)}%`, backgroundColor: "hsl(140 70% 45%)" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{freeLeft} left free</p>
              </>
            )}
          </motion.div>
        </div>

        {/* Main Grid */}
        <div className="grid md:grid-cols-[1.2fr_1fr] gap-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-foreground text-lg">Your spendings</h2>
              <Button
                onClick={() => {
                  if (!isPremium && subscriptions.length >= maxFree) {
                    setPremiumOpen(true);
                  } else {
                    setDialogOpen(true);
                  }
                }}
                size="sm"
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 px-4"
              >
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {subscriptions.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl bg-card border border-border p-12 text-center"
                >
                  <p className="text-muted-foreground">No spendings yet. Add one to get started!</p>
                </motion.div>
              ) : (
                subscriptions.map((sub, i) => (
                  <SubscriptionCard key={sub.id} subscription={sub} index={i} onDelete={deleteSubscription} onUpdate={updateSubscription} />
                ))
              )}

              {/* Track more subscriptions banner - free mode only */}
              {!isPremium && subscriptions.length >= maxFree && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border p-4 flex items-center gap-4 cursor-pointer hover:border-opacity-60 transition-colors"
                  style={{ borderColor: "hsl(36 100% 50% / 0.5)", borderStyle: "dashed", backgroundColor: "hsl(36 100% 50% / 0.03)" }}
                  onClick={() => setPremiumOpen(true)}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(36 100% 50% / 0.2)" }}>
                    <Crown className="w-5 h-5" style={{ color: "hsl(36 100% 50%)" }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground font-medium text-sm">Track more spendings?</p>
                    <p className="text-muted-foreground text-xs">Unlock Premium for unlimited spendings</p>
                  </div>
                  <Plus className="w-5 h-5" style={{ color: "hsl(36 100% 50%)" }} />
                </motion.div>
              )}
            </div>

            {/* Savings Goals - left column, below subscriptions */}
            <SavingsGoal />
          </div>

          <div className="space-y-6">
            <UpcomingPayments subscriptions={subscriptions} />
            <YearlyProjection subscriptions={subscriptions} />
            <BudgetCalculator subscriptions={subscriptions} isPremium={isPremium} onUpgrade={() => setPremiumOpen(true)} />
          </div>
        </div>
      </main>

      <AddSubscriptionDialog open={dialogOpen} onOpenChange={setDialogOpen} onAdd={addSubscription} />
      <PremiumDialog open={premiumOpen} onOpenChange={setPremiumOpen} />
    </div>
  );
}
