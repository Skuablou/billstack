import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, TrendingUp, RefreshCw, Plus, User, LogOut, Crown, Bell, BellOff, CalendarClock, Wallet, Clock, Calculator, MoreVertical, X, CalendarDays } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import SubscriptionCard from "@/components/SubscriptionCard";
import AddSubscriptionDialog from "@/components/AddSubscriptionDialog";
import PremiumDialog from "@/components/PremiumDialog";
import UpcomingPayments from "@/components/UpcomingPayments";

import BudgetCalculator from "@/components/BudgetCalculator";
import SurvivalCalculator from "@/components/SurvivalCalculator";
import MonthlyTracker from "@/components/MonthlyTracker";
import { SavingsGoalForm, SavingsGoalDisplay, getMonthlyEquivalent, getTotalPeriods } from "@/components/SavingsGoal";
import { useCurrency } from "@/lib/CurrencyContext";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useAuth } from "@/lib/AuthContext";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { useSavingsGoals } from "@/hooks/use-savings-goals";
import {
  Subscription,
  getMonthlyTotal,
  getYearlyTotal,
  getMaxFreeSubscriptions,
} from "@/lib/subscriptions";
import { isPremiumUser, checkPremiumActivation } from "@/lib/premium";
import { supabase } from "@/integrations/supabase/client";


const STRIPE_LINK = "https://buy.stripe.com/28EbJ3gB28dT2ZL9PxgA800";

export default function Index() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [premiumMessage, setPremiumMessage] = useState<string | undefined>(undefined);
  
  const [isPremium, setIsPremium] = useState(isPremiumUser());
  const [trackedDays, setTrackedDays] = useState(0);
  const [planExpanded, setPlanExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  
  const isMobile = useIsMobile();
  const { subscriptions, addSubscription, deleteSubscription, updateSubscription } = useSubscriptions();
  const { activeGoals, addGoal, markGoalPaid, removeGoal } = useSavingsGoals();
  const { currency, toggle: toggleCurrency } = useCurrency();
  const { user, logout } = useAuth();
  const { isSupported, isSubscribed, isLoading: pushLoading, subscribe, unsubscribe } = usePushNotifications();

  useEffect(() => {
    checkPremiumActivation().then((result) => {
      setIsPremium(result);
      if (!result && user) {
        // Check if user has logged expenses on 10+ distinct days → force premium
        supabase
          .from("monthly_tracker_expenses")
          .select("date")
          .eq("user_id", user.id)
          .then(({ data: expenses }) => {
            if (!expenses) return;
            const distinctDays = new Set(expenses.map((e: any) => e.date)).size;
            setTrackedDays(distinctDays);
            // Just track count, don't auto-open
          });
      }
    });
  }, [user]);

  const maxFree = getMaxFreeSubscriptions();
  const freeLeft = Math.max(0, maxFree - subscriptions.length);

  // Calculate total monthly savings from all active (non-complete) goals
  const savingsMonthly = activeGoals.reduce((sum, goal) => {
    const totalPeriods = getTotalPeriods(goal.targetDate, goal.interval);
    if (goal.paidPeriods >= totalPeriods) return sum;
    return sum + getMonthlyEquivalent(goal);
  }, 0);

  const monthlyTotal = getMonthlyTotal(subscriptions);
  const yearlyTotal = getYearlyTotal(subscriptions);

  const fmt = (n: number) => `${n.toFixed(2)}${currency}`;

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Background gradient effects */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[180px] pointer-events-none" style={{ background: "hsl(270 80% 40% / 0.08)" }} />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none" style={{ background: "hsl(36 100% 50% / 0.05)" }} />
      <div className="fixed top-1/2 right-0 w-[400px] h-[400px] rounded-full blur-[140px] pointer-events-none" style={{ background: "hsl(210 70% 50% / 0.06)" }} />

      {/* Header */}
      <header className="max-w-5xl mx-auto px-6 pt-6 md:pt-10 pb-2 relative z-10">
        <div className="flex items-center justify-between">
          <div className="min-w-0 shrink">
            <h1 className="text-3xl md:text-5xl font-display font-bold">
              <span style={{ background: "linear-gradient(135deg, hsl(145 70% 45%), hsl(160 80% 40%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Bill</span><span style={{ background: "linear-gradient(135deg, hsl(270 80% 60%), hsl(320 70% 55%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Stack</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1 hidden md:block">Keep track of all your monthly bills</p>
          </div>

          {/* Mobile: 3-dot menu button - inline with title */}
          <div className="flex md:hidden items-center shrink-0">
            <Button variant="ghost" size="icon" className="rounded-full bg-card border border-border text-muted-foreground hover:text-foreground" onClick={() => setMenuOpen(true)}>
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>

          {/* Desktop buttons */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <Button variant="outline" size="icon" className="rounded-full border-border text-muted-foreground hover:text-foreground font-semibold text-sm" onClick={toggleCurrency} title={`Switch to ${currency === "€" ? "$" : "€"}`}>{currency}</Button>
            {isSupported && (
              <Button variant="outline" size="icon" className="rounded-full border-border text-muted-foreground hover:text-foreground" onClick={() => { if (!isPremium) { setPremiumOpen(true); return; } isSubscribed ? unsubscribe() : subscribe(subscriptions); }} disabled={pushLoading} title={isSubscribed ? "Disable reminders" : "Enable bill reminders"}>
                {isSubscribed ? <Bell className="w-4 h-4 text-primary" /> : <BellOff className="w-4 h-4" />}
              </Button>
            )}
            {isPremium ? (
              <button onClick={() => setPlanExpanded(!planExpanded)} className="rounded-full flex items-center gap-1.5 font-semibold border-0 text-black overflow-hidden transition-all duration-300 ease-in-out cursor-pointer" style={{ background: "linear-gradient(135deg, hsl(36 100% 50%), hsl(25 100% 50%))", width: planExpanded ? "auto" : "32px", height: "32px", padding: planExpanded ? "0 16px" : "0", minWidth: "32px" }}>
                <Crown className="w-4 h-4 shrink-0" style={{ marginLeft: planExpanded ? "0" : "8px" }} />
                <motion.span initial={false} animate={{ opacity: planExpanded ? 1 : 0, width: planExpanded ? "auto" : 0 }} transition={{ duration: 0.2 }} className="whitespace-nowrap text-sm overflow-hidden">
                  <a href="https://billing.stripe.com/p/login/28EbJ3gB28dT2ZL9PxgA800" target="_blank" rel="noopener noreferrer" className="text-black no-underline" onClick={(e) => e.stopPropagation()}>Manage Plan</a>
                </motion.span>
              </button>
            ) : (
              <Button size="sm" className="rounded-full gap-1.5 px-5 py-2 text-black font-semibold border-0 text-sm" style={{ background: "linear-gradient(135deg, hsl(36 100% 50%), hsl(25 100% 50%))" }} onClick={() => setPremiumOpen(true)}><Crown className="w-4 h-4" /> Premium</Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full border-border text-muted-foreground hover:text-foreground"><User className="w-4 h-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border w-56">
                <div className="px-3 py-2 border-b border-border"><p className="text-sm text-foreground font-medium truncate">{user?.email ?? "User"}</p></div>
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer gap-2"><LogOut className="w-4 h-4" />Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>



        </div>
      </header>

      {/* Mobile slide-in menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-72 bg-card border-l border-border z-50 p-6 space-y-2"
            >
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground font-medium truncate">{user?.email ?? "User"}</p>
                <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground" onClick={() => setMenuOpen(false)}><X className="w-5 h-5" /></Button>
              </div>

              <button onClick={() => { toggleCurrency(); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-foreground hover:bg-muted/50 transition-colors">
                <span className="w-8 h-8 rounded-full border border-border flex items-center justify-center font-semibold text-sm">{currency}</span>
                Switch to {currency === "€" ? "$" : "€"}
              </button>

              {isSupported && (
                <button onClick={() => { if (!isPremium) { setPremiumOpen(true); setMenuOpen(false); return; } isSubscribed ? unsubscribe() : subscribe(subscriptions); setMenuOpen(false); }} disabled={pushLoading} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-foreground hover:bg-muted/50 transition-colors">
                  {isSubscribed ? <Bell className="w-5 h-5 text-primary" /> : <BellOff className="w-5 h-5 text-muted-foreground" />}
                  {isSubscribed ? "Disable reminders" : "Enable reminders"}
                  {!isPremium && <Crown className="w-4 h-4 ml-auto" style={{ color: "hsl(36 100% 50%)" }} />}
                </button>
              )}

              {isPremium ? (
                <a href="https://billing.stripe.com/p/login/28EbJ3gB28dT2ZL9PxgA800" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-foreground hover:bg-muted/50 transition-colors no-underline">
                  <Crown className="w-5 h-5" style={{ color: "hsl(36 100% 50%)" }} />
                  Manage Plan
                </a>
              ) : (
                <button onClick={() => { setPremiumOpen(true); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold hover:bg-muted/50 transition-colors" style={{ color: "hsl(36 100% 50%)" }}>
                  <Crown className="w-5 h-5" />
                  Upgrade to Premium
                </button>
              )}

              <div className="border-t border-border pt-2 mt-2">
                <button onClick={() => { logout(); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-destructive hover:bg-muted/50 transition-colors">
                  <LogOut className="w-5 h-5" />
                  Log out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Stat Cards */}
      <main className="max-w-5xl mx-auto px-6 py-8 relative z-10 pb-24 md:pb-8">
        {/* Desktop: show everything */}
        {!isMobile ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border p-5" style={{ background: "linear-gradient(135deg, hsl(36 60% 18%), hsl(36 40% 12%))", borderColor: "hsl(36 80% 50% / 0.4)", boxShadow: "0 0 30px -10px hsl(36 80% 50% / 0.2)" }}>
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(36 80% 50% / 0.25)" }}><CalendarClock className="w-3.5 h-3.5" style={{ color: "hsl(36 80% 50%)" }} /></div>Daily
                </div>
                <p className="text-3xl font-display font-bold text-foreground">{fmt(monthlyTotal / 30)}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl border p-5" style={{ background: "linear-gradient(135deg, hsl(270 60% 18%), hsl(270 40% 12%))", borderColor: "hsl(270 80% 60% / 0.4)", boxShadow: "0 0 30px -10px hsl(270 80% 60% / 0.2)" }}>
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(270 80% 60% / 0.25)" }}><CreditCard className="w-3.5 h-3.5" style={{ color: "hsl(270 80% 60%)" }} /></div>Monthly
                </div>
                <p className="text-3xl font-display font-bold text-foreground">{fmt(monthlyTotal)}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border p-5" style={{ background: "linear-gradient(135deg, hsl(210 50% 14%), hsl(220 40% 10%))", borderColor: "hsl(210 70% 50% / 0.3)", boxShadow: "0 0 30px -10px hsl(210 70% 50% / 0.15)" }}>
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(210 70% 50% / 0.25)" }}><TrendingUp className="w-3.5 h-3.5" style={{ color: "hsl(210 70% 55%)" }} /></div>Yearly
                </div>
                <p className="text-3xl font-display font-bold text-foreground">{fmt(yearlyTotal)}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border p-5" style={{ background: "linear-gradient(135deg, hsl(160 50% 14%), hsl(160 40% 10%))", borderColor: "hsl(160 70% 45% / 0.3)", boxShadow: "0 0 30px -10px hsl(160 70% 45% / 0.15)" }}>
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(160 70% 45% / 0.25)" }}><RefreshCw className="w-3.5 h-3.5" style={{ color: "hsl(160 70% 45%)" }} /></div>Spendings
                </div>
                <p className="text-3xl font-display font-bold text-foreground">{subscriptions.length}</p>
              </motion.div>
            </div>
            <div className="grid md:grid-cols-[1.2fr_1fr] gap-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display font-semibold text-foreground text-lg">Your spendings</h2>
                    {!isPremium && <p className="text-muted-foreground text-xs">{freeLeft > 0 ? `${subscriptions.length}/${maxFree} free spendings used` : "Free limit reached"}</p>}
                  </div>
                  <Button onClick={() => { if (!isPremium && freeLeft <= 0) { setPremiumOpen(true); return; } setDialogOpen(true); }} size="sm" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 px-4"><Plus className="w-4 h-4" /> Add</Button>
                </div>
                <div className="space-y-2">
                  {subscriptions.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card border border-border p-12 text-center"><p className="text-muted-foreground">No spendings yet. Add one to get started!</p></motion.div>
                  ) : subscriptions.map((sub, i) => (<SubscriptionCard key={sub.id} subscription={sub} index={i} onDelete={deleteSubscription} onUpdate={updateSubscription} />))}
                </div>
                {isPremium ? (
                  <SavingsGoalDisplay goals={activeGoals} onMarkPaid={markGoalPaid} onRemove={removeGoal} />
                ) : (
                  <div className="rounded-xl border p-5 space-y-3 relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(270 30% 14%), hsl(270 20% 10%))", borderColor: "hsl(270 60% 50% / 0.25)" }}>
                    <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><Crown className="w-4 h-4" style={{ color: "hsl(36 100% 50%)" }} /> Savings Goals</h3>
                    <p className="text-muted-foreground text-sm">Set savings goals and track your progress.</p>
                    <Button size="sm" className="rounded-full gap-1.5 text-black font-semibold text-xs" style={{ background: "linear-gradient(135deg, hsl(36 100% 50%), hsl(25 100% 50%))" }} onClick={() => setPremiumOpen(true)}><Crown className="w-3.5 h-3.5" /> Upgrade</Button>
                  </div>
                )}
              </div>
              <div className="space-y-6">
                <UpcomingPayments subscriptions={subscriptions} onUpdate={updateSubscription} />
                <MonthlyTracker subscriptions={subscriptions} isPremium={isPremium} trackedDays={trackedDays} onPremiumRequired={() => { setPremiumMessage("You've been tracking for 10 days! 🎉"); setPremiumOpen(true); }} onTrackedDaysChange={setTrackedDays} />
                {isPremium ? (
                  <BudgetCalculator subscriptions={subscriptions} savingsMonthly={savingsMonthly} />
                ) : (
                  <div className="rounded-xl border p-5 space-y-3 relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(270 40% 14%), hsl(260 30% 10%))", borderColor: "hsl(270 60% 50% / 0.25)" }}>
                    <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><Crown className="w-4 h-4" style={{ color: "hsl(36 100% 50%)" }} /> Budget Calculator</h3>
                    <p className="text-muted-foreground text-sm">Calculate your monthly budget and see what's left.</p>
                    <Button size="sm" className="rounded-full gap-1.5 text-black font-semibold text-xs" style={{ background: "linear-gradient(135deg, hsl(36 100% 50%), hsl(25 100% 50%))" }} onClick={() => setPremiumOpen(true)}><Crown className="w-3.5 h-3.5" /> Upgrade</Button>
                  </div>
                )}
                {isPremium ? (
                  <SurvivalCalculator subscriptions={subscriptions} />
                ) : (
                  <div className="rounded-xl border p-5 space-y-3 relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(0 30% 14%), hsl(0 20% 10%))", borderColor: "hsl(0 60% 50% / 0.25)" }}>
                    <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><Crown className="w-4 h-4" style={{ color: "hsl(36 100% 50%)" }} /> Survival Calculator</h3>
                    <p className="text-muted-foreground text-sm">Find out how long you'd survive without income.</p>
                    <Button size="sm" className="rounded-full gap-1.5 text-black font-semibold text-xs" style={{ background: "linear-gradient(135deg, hsl(36 100% 50%), hsl(25 100% 50%))" }} onClick={() => setPremiumOpen(true)}><Crown className="w-3.5 h-3.5" /> Upgrade</Button>
                  </div>
                )}
                {isPremium ? (
                  <SavingsGoalForm onAdd={addGoal} />
                ) : null}
              </div>
            </div>
          </>
        ) : (
          /* Mobile: sectioned view */
          <AnimatePresence mode="wait">
            {activeSection === 0 && (
              <motion.div key="spendings" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="rounded-xl border p-4" style={{ background: "linear-gradient(135deg, hsl(36 60% 18%), hsl(36 40% 12%))", borderColor: "hsl(36 80% 50% / 0.4)" }}>
                    <div className="flex items-center gap-2 text-foreground font-semibold text-xs mb-1.5">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(36 80% 50% / 0.25)" }}><CalendarClock className="w-3 h-3" style={{ color: "hsl(36 80% 50%)" }} /></div>Daily
                    </div>
                    <p className="text-2xl font-display font-bold text-foreground">{fmt(monthlyTotal / 30)}</p>
                  </div>
                  <div className="rounded-xl border p-4" style={{ background: "linear-gradient(135deg, hsl(270 60% 18%), hsl(270 40% 12%))", borderColor: "hsl(270 80% 60% / 0.4)" }}>
                    <div className="flex items-center gap-2 text-foreground font-semibold text-xs mb-1.5">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(270 80% 60% / 0.25)" }}><CreditCard className="w-3 h-3" style={{ color: "hsl(270 80% 60%)" }} /></div>Monthly
                    </div>
                    <p className="text-2xl font-display font-bold text-foreground">{fmt(monthlyTotal)}</p>
                  </div>
                  <div className="rounded-xl border p-4" style={{ background: "linear-gradient(135deg, hsl(210 50% 14%), hsl(220 40% 10%))", borderColor: "hsl(210 70% 50% / 0.3)" }}>
                    <div className="flex items-center gap-2 text-foreground font-semibold text-xs mb-1.5">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(210 70% 50% / 0.25)" }}><TrendingUp className="w-3 h-3" style={{ color: "hsl(210 70% 55%)" }} /></div>Yearly
                    </div>
                    <p className="text-2xl font-display font-bold text-foreground">{fmt(yearlyTotal)}</p>
                  </div>
                  <div className="rounded-xl border p-4" style={{ background: "linear-gradient(135deg, hsl(160 50% 14%), hsl(160 40% 10%))", borderColor: "hsl(160 70% 45% / 0.3)" }}>
                    <div className="flex items-center gap-2 text-foreground font-semibold text-xs mb-1.5">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(160 70% 45% / 0.25)" }}><RefreshCw className="w-3 h-3" style={{ color: "hsl(160 70% 45%)" }} /></div>Spendings
                    </div>
                    <p className="text-2xl font-display font-bold text-foreground">{subscriptions.length}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-display font-semibold text-foreground text-lg">Your spendings</h2>
                      {!isPremium && <p className="text-muted-foreground text-xs">{freeLeft > 0 ? `${subscriptions.length}/${maxFree} free spendings used` : "Free limit reached"}</p>}
                    </div>
                    <Button onClick={() => { if (!isPremium && freeLeft <= 0) { setPremiumOpen(true); return; } setDialogOpen(true); }} size="sm" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 px-4"><Plus className="w-4 h-4" /> Add</Button>
                  </div>
                  <div className="space-y-2">
                    {subscriptions.length === 0 ? (
                      <div className="rounded-xl bg-card border border-border p-12 text-center"><p className="text-muted-foreground">No spendings yet. Add one to get started!</p></div>
                    ) : subscriptions.map((sub, i) => (<SubscriptionCard key={sub.id} subscription={sub} index={i} onDelete={deleteSubscription} onUpdate={updateSubscription} />))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 1 && (
              <motion.div key="upcoming" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                <UpcomingPayments subscriptions={subscriptions} onUpdate={updateSubscription} />
              </motion.div>
            )}

            {activeSection === 2 && (
              <motion.div key="calendar" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                <MonthlyTracker subscriptions={subscriptions} isPremium={isPremium} trackedDays={trackedDays} onPremiumRequired={() => { setPremiumMessage("You've been tracking for 10 days! 🎉"); setPremiumOpen(true); }} onTrackedDaysChange={setTrackedDays} />
              </motion.div>
            )}

            {activeSection === 3 && (
              <motion.div key="calculators" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="space-y-6">
                {isPremium ? (
                  <SavingsGoalDisplay goals={activeGoals} onMarkPaid={markGoalPaid} onRemove={removeGoal} />
                ) : (
                  <div className="rounded-xl border p-5 space-y-3 relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(270 30% 14%), hsl(270 20% 10%))", borderColor: "hsl(270 60% 50% / 0.25)" }}>
                    <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><Crown className="w-4 h-4" style={{ color: "hsl(36 100% 50%)" }} /> Savings Goals</h3>
                    <p className="text-muted-foreground text-sm">Set savings goals and track your progress.</p>
                    <Button size="sm" className="rounded-full gap-1.5 text-black font-semibold text-xs" style={{ background: "linear-gradient(135deg, hsl(36 100% 50%), hsl(25 100% 50%))" }} onClick={() => setPremiumOpen(true)}><Crown className="w-3.5 h-3.5" /> Upgrade</Button>
                  </div>
                )}
                {isPremium ? (
                  <BudgetCalculator subscriptions={subscriptions} savingsMonthly={savingsMonthly} />
                ) : (
                  <div className="rounded-xl border p-5 space-y-3 relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(270 40% 14%), hsl(260 30% 10%))", borderColor: "hsl(270 60% 50% / 0.25)" }}>
                    <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><Crown className="w-4 h-4" style={{ color: "hsl(36 100% 50%)" }} /> Budget Calculator</h3>
                    <p className="text-muted-foreground text-sm">Calculate your monthly budget and see what's left.</p>
                    <Button size="sm" className="rounded-full gap-1.5 text-black font-semibold text-xs" style={{ background: "linear-gradient(135deg, hsl(36 100% 50%), hsl(25 100% 50%))" }} onClick={() => setPremiumOpen(true)}><Crown className="w-3.5 h-3.5" /> Upgrade</Button>
                  </div>
                )}
                {isPremium ? (
                  <SurvivalCalculator subscriptions={subscriptions} />
                ) : (
                  <div className="rounded-xl border p-5 space-y-3 relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(0 30% 14%), hsl(0 20% 10%))", borderColor: "hsl(0 60% 50% / 0.25)" }}>
                    <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><Crown className="w-4 h-4" style={{ color: "hsl(36 100% 50%)" }} /> Survival Calculator</h3>
                    <p className="text-muted-foreground text-sm">Find out how long you'd survive without income.</p>
                    <Button size="sm" className="rounded-full gap-1.5 text-black font-semibold text-xs" style={{ background: "linear-gradient(135deg, hsl(36 100% 50%), hsl(25 100% 50%))" }} onClick={() => setPremiumOpen(true)}><Crown className="w-3.5 h-3.5" /> Upgrade</Button>
                  </div>
                )}
                {isPremium && <SavingsGoalForm onAdd={addGoal} />}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl">
          <div className="flex items-center justify-around py-2 px-4">
            {[
              { icon: Wallet, label: "Spendings" },
              { icon: Clock, label: "Upcoming" },
              { icon: CalendarDays, label: "Calendar" },
              { icon: Calculator, label: "Tools" },
            ].map((item, i) => (
              <button
                key={item.label}
                onClick={() => setActiveSection(i)}
                className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-colors ${activeSection === i ? "text-primary" : "text-muted-foreground"}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <AddSubscriptionDialog open={dialogOpen} onOpenChange={setDialogOpen} onAdd={addSubscription} />
      <PremiumDialog open={premiumOpen} onOpenChange={(open) => { setPremiumOpen(open); if (!open) setPremiumMessage(undefined); }} message={premiumMessage} />
      
    </div>
  );
}
