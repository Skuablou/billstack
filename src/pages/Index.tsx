import { useState, useEffect } from "react";
import billstackLogo from "@/assets/billstack-logo.png";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, TrendingUp, RefreshCw, Plus, User, LogOut, Crown, Bell, BellOff, CalendarClock, Wallet, Clock, Calculator, MoreVertical, X, CalendarDays, Sun, Moon, Filter, BarChart3, Mail } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import SubscriptionCard from "@/components/SubscriptionCard";
import AddSubscriptionDialog from "@/components/AddSubscriptionDialog";
import PremiumDialog from "@/components/PremiumDialog";
import UpcomingPayments from "@/components/UpcomingPayments";
import BottomNav from "@/components/BottomNav";

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
  CATEGORIES,
  CATEGORY_ICONS,
  getMonthlyTotal,
  getYearlyTotal,
  getMaxFreeSubscriptions,
} from "@/lib/subscriptions";
import { isPremiumUser, checkPremiumActivation } from "@/lib/premium";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/lib/ThemeContext";


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
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterOpen, setFilterOpen] = useState(false);
  
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const st = location.state as { section?: number; openMenu?: boolean } | null;
    if (typeof st?.section === "number") setActiveSection(st.section);
    if (st?.openMenu) setMenuOpen(true);
  }, [location.state]);
  const { subscriptions, addSubscription, deleteSubscription, updateSubscription } = useSubscriptions();
  const { activeGoals, addGoal, markGoalPaid, removeGoal } = useSavingsGoals();
  const { currency, toggle: toggleCurrency } = useCurrency();
  const { user, logout } = useAuth();
  const { isSupported, isSubscribed, isLoading: pushLoading, subscribe, unsubscribe } = usePushNotifications();
  const { theme, toggleTheme } = useTheme();

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
  const isLight = theme === "light";

  const cardStyles = {
    daily: {
      background: isLight
        ? "linear-gradient(135deg, hsl(36 80% 88%), hsl(36 70% 82%))"
        : "linear-gradient(135deg, hsl(36 70% 26%), hsl(36 50% 18%))",
      borderColor: isLight ? "hsl(36 70% 55%)" : "hsl(36 80% 40%)",
      borderWidth: "2px",
      boxShadow: isLight ? "0 4px 20px -6px hsl(36 80% 60% / 0.3)" : "0 0 30px -10px hsl(36 90% 55% / 0.3)",
    },
    monthly: {
      background: isLight
        ? "linear-gradient(135deg, hsl(267 80% 92%), hsl(267 60% 86%))"
        : "linear-gradient(135deg, hsl(267 80% 26%), hsl(267 50% 18%))",
      borderColor: isLight ? "hsl(267 80% 55%)" : "hsl(267 80% 45%)",
      borderWidth: "2px",
      boxShadow: isLight ? "0 4px 20px -6px hsl(267 90% 60% / 0.3)" : "0 0 30px -10px hsl(267 100% 55% / 0.3)",
    },
    yearly: {
      background: isLight
        ? "linear-gradient(135deg, hsl(210 70% 90%), hsl(220 60% 84%))"
        : "linear-gradient(135deg, hsl(210 65% 22%), hsl(220 50% 16%))",
      borderColor: isLight ? "hsl(210 60% 60%)" : "hsl(210 65% 40%)",
      borderWidth: "2px",
      boxShadow: isLight ? "0 4px 20px -6px hsl(210 70% 60% / 0.3)" : "0 0 30px -10px hsl(210 80% 55% / 0.25)",
    },
    spendings: {
      background: isLight
        ? "linear-gradient(135deg, hsl(145 60% 88%), hsl(145 50% 82%))"
        : "linear-gradient(135deg, hsl(145 65% 22%), hsl(145 50% 16%))",
      borderColor: isLight ? "hsl(145 55% 45%)" : "hsl(145 60% 35%)",
      borderWidth: "2px",
      boxShadow: isLight ? "0 4px 20px -6px hsl(160 60% 55% / 0.3)" : "0 0 30px -10px hsl(160 80% 50% / 0.25)",
    },
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Background gradient effects */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[180px] pointer-events-none" style={{ background: "hsl(270 80% 40% / 0.08)" }} />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none" style={{ background: "hsl(36 100% 50% / 0.05)" }} />
      <div className="fixed top-1/2 right-0 w-[400px] h-[400px] rounded-full blur-[140px] pointer-events-none" style={{ background: "hsl(210 70% 50% / 0.06)" }} />

      {/* Header */}
      <header className="max-w-5xl mx-auto px-6 pt-4 md:pt-6 pb-2 relative z-10">
        <div className="flex items-center justify-between">
          <div className="min-w-0 shrink flex items-center gap-3">
            <img src={billstackLogo} alt="BillStack" className="h-8 md:h-10 w-auto hidden md:block" />
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
            <Button variant="outline" size="icon" className="rounded-full border-border text-muted-foreground hover:text-foreground" onClick={() => navigate("/reports")} title="Reports">
              <BarChart3 className="w-4 h-4" />
            </Button>
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
                <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer gap-2">
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </DropdownMenuItem>
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

              <button onClick={() => { toggleTheme(); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-foreground hover:bg-muted/50 transition-colors">
                {theme === "dark" ? <Sun className="w-5 h-5 text-muted-foreground" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </button>

              <button onClick={() => { toggleCurrency(); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-foreground hover:bg-muted/50 transition-colors">
                <span className="w-5 h-5 flex items-center justify-center font-semibold text-muted-foreground text-base">{currency}</span>
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
                <button onClick={() => { window.location.href = "mailto:markclump6@gmail.com"; setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-foreground hover:bg-muted/50 transition-colors">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  Contact Support
                </button>
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
      <main className="max-w-5xl mx-auto px-6 pt-2 md:pt-8 pb-28 md:pb-8 relative z-10">
        {/* Desktop: show everything */}
        {!isMobile ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border p-5" style={cardStyles.daily}>
                <div className="flex items-center gap-2 text-foreground font-bold text-sm mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(36 80% 50% / 0.25)" }}><CalendarClock className="w-4 h-4" style={{ color: "hsl(36 80% 50%)" }} /></div>Daily
                </div>
                <p className="text-3xl font-display font-bold text-foreground">{fmt(monthlyTotal / 30)}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl border p-5" style={cardStyles.monthly}>
                <div className="flex items-center gap-2 text-foreground font-bold text-sm mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(267 100% 50% / 0.25)" }}><CreditCard className="w-4 h-4" style={{ color: "hsl(267 100% 50%)" }} /></div>Monthly
                </div>
                <p className="text-3xl font-display font-bold text-foreground">{fmt(monthlyTotal)}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border p-5" style={cardStyles.yearly}>
                <div className="flex items-center gap-2 text-foreground font-bold text-sm mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(210 70% 50% / 0.25)" }}><TrendingUp className="w-4 h-4" style={{ color: "hsl(210 70% 55%)" }} /></div>Yearly
                </div>
                <p className="text-3xl font-display font-bold text-foreground">{fmt(yearlyTotal)}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border p-5" style={cardStyles.spendings}>
                <div className="flex items-center gap-2 text-foreground font-bold text-sm mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(160 70% 45% / 0.25)" }}><RefreshCw className="w-4 h-4" style={{ color: "hsl(145 70% 45%)" }} /></div>Spendings
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
                  <div className="flex items-center gap-2">
                    {subscriptions.length > 0 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full relative" onClick={() => setFilterOpen(prev => !prev)} style={{ color: filterCategory !== "All" ? "#8100FF" : undefined }}>
                        <Filter className="w-4 h-4" />
                        {filterCategory !== "All" && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: "#8100FF" }} />}
                      </Button>
                    )}
                    <Button onClick={() => { if (!isPremium && freeLeft <= 0) { setPremiumOpen(true); return; } setDialogOpen(true); }} size="sm" className="rounded-full text-primary-foreground hover:opacity-90 gap-1.5 px-4" style={{ backgroundColor: "#8100FF" }}><Plus className="w-4 h-4" /> Add</Button>
                  </div>
                </div>
                <AnimatePresence>
                  {filterOpen && subscriptions.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="flex gap-1.5 flex-wrap rounded-xl border border-border p-3" style={{ background: "hsl(var(--card))" }}>
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-xs font-medium text-muted-foreground">Filter by category</span>
                          <button onClick={() => setFilterOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                        </div>
                        {["All", ...CATEGORIES].map(cat => (
                          <button key={cat} onClick={() => setFilterCategory(cat)} className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors" style={{ background: filterCategory === cat ? "#8100FF" : "hsl(var(--muted))", color: filterCategory === cat ? "white" : "hsl(var(--muted-foreground))", border: filterCategory === cat ? "none" : "1px solid hsl(var(--border))" }}>
                            {cat !== "All" && CATEGORY_ICONS[cat] ? `${CATEGORY_ICONS[cat]} ` : ""}{cat}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="space-y-2">
                  {subscriptions.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card border border-border p-12 text-center"><p className="text-muted-foreground">No spendings yet. Add one to get started!</p></motion.div>
                  ) : [...subscriptions].filter(s => filterCategory === "All" || s.category === filterCategory).sort((a, b) => b.amount - a.amount).map((sub, i) => (<SubscriptionCard key={sub.id} subscription={sub} index={i} onDelete={deleteSubscription} onUpdate={updateSubscription} />))}
                </div>
                {isPremium ? (
                  <SavingsGoalDisplay goals={activeGoals} onMarkPaid={markGoalPaid} onRemove={removeGoal} />
                ) : (
                  <div className="rounded-xl border p-5 space-y-3 relative overflow-hidden" style={{ background: theme === "light" ? "linear-gradient(135deg, hsl(267 25% 90%), hsl(267 15% 85%))" : "linear-gradient(135deg, hsl(267 25% 14%), hsl(267 15% 10%))", borderColor: "hsl(267 60% 50% / 0.25)" }}>
                    <h3 className={`font-display font-semibold ${theme === "light" ? "text-foreground" : "text-white"} flex items-center gap-2`}><Crown className="w-4 h-4" style={{ color: "hsl(36 100% 50%)" }} /> Savings Goals</h3>
                    <p className={`${theme === "light" ? "text-muted-foreground" : "text-white/70"} text-sm`}>Set savings goals and track your progress.</p>
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
                  <div className="rounded-xl border p-5 space-y-3 relative overflow-hidden" style={{ background: theme === "light" ? "linear-gradient(135deg, hsl(267 25% 90%), hsl(267 15% 85%))" : "linear-gradient(135deg, hsl(267 35% 14%), hsl(267 25% 10%))", borderColor: "hsl(267 60% 50% / 0.25)" }}>
                    <h3 className={`font-display font-semibold ${theme === "light" ? "text-foreground" : "text-white"} flex items-center gap-2`}><Crown className="w-4 h-4" style={{ color: "hsl(36 100% 50%)" }} /> Budget Calculator</h3>
                    <p className={`${theme === "light" ? "text-muted-foreground" : "text-white/70"} text-sm`}>Calculate your monthly budget and see what's left.</p>
                    <Button size="sm" className="rounded-full gap-1.5 text-black font-semibold text-xs" style={{ background: "linear-gradient(135deg, hsl(36 100% 50%), hsl(25 100% 50%))" }} onClick={() => setPremiumOpen(true)}><Crown className="w-3.5 h-3.5" /> Upgrade</Button>
                  </div>
                )}
                {isPremium ? (
                  <SurvivalCalculator subscriptions={subscriptions} />
                ) : (
                  <div className="rounded-xl border p-5 space-y-3 relative overflow-hidden" style={{ background: theme === "light" ? "linear-gradient(135deg, hsl(0 30% 90%), hsl(0 20% 85%))" : "linear-gradient(135deg, hsl(0 30% 14%), hsl(0 20% 10%))", borderColor: "hsl(0 60% 50% / 0.25)" }}>
                    <h3 className={`font-display font-semibold ${theme === "light" ? "text-foreground" : "text-white"} flex items-center gap-2`}><Crown className="w-4 h-4" style={{ color: "hsl(36 100% 50%)" }} /> Survival Calculator</h3>
                    <p className={`${theme === "light" ? "text-muted-foreground" : "text-white/70"} text-sm`}>Find out how long you'd survive without income.</p>
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
                  <div className="rounded-xl border p-4" style={cardStyles.daily}>
                    <div className="flex items-center gap-2 text-foreground font-bold text-sm mb-1.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(36 80% 50% / 0.25)" }}><CalendarClock className="w-4 h-4" style={{ color: "hsl(36 80% 50%)" }} /></div>Daily
                    </div>
                    <p className="text-2xl font-display font-bold text-foreground">{fmt(monthlyTotal / 30)}</p>
                  </div>
                  <div className="rounded-xl border p-4" style={cardStyles.monthly}>
                    <div className="flex items-center gap-2 text-foreground font-bold text-sm mb-1.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(267 100% 50% / 0.25)" }}><CreditCard className="w-4 h-4" style={{ color: "hsl(267 100% 50%)" }} /></div>Monthly
                    </div>
                    <p className="text-2xl font-display font-bold text-foreground">{fmt(monthlyTotal)}</p>
                  </div>
                  <div className="rounded-xl border p-4" style={cardStyles.yearly}>
                    <div className="flex items-center gap-2 text-foreground font-bold text-sm mb-1.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(210 70% 50% / 0.25)" }}><TrendingUp className="w-4 h-4" style={{ color: "hsl(210 70% 55%)" }} /></div>Yearly
                    </div>
                    <p className="text-2xl font-display font-bold text-foreground">{fmt(yearlyTotal)}</p>
                  </div>
                  <div className="rounded-xl border p-4" style={cardStyles.spendings}>
                    <div className="flex items-center gap-2 text-foreground font-bold text-sm mb-1.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(160 70% 45% / 0.25)" }}><RefreshCw className="w-4 h-4" style={{ color: "hsl(145 70% 45%)" }} /></div>Spendings
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
                    <div className="flex items-center gap-2">
                      {subscriptions.length > 0 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full relative" onClick={() => setFilterOpen(prev => !prev)} style={{ color: filterCategory !== "All" ? "#8100FF" : undefined }}>
                          <Filter className="w-4 h-4" />
                          {filterCategory !== "All" && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: "#8100FF" }} />}
                        </Button>
                      )}
                      <Button onClick={() => { if (!isPremium && freeLeft <= 0) { setPremiumOpen(true); return; } setDialogOpen(true); }} size="sm" className="rounded-full text-primary-foreground hover:opacity-90 gap-1.5 px-4" style={{ backgroundColor: "#8100FF" }}><Plus className="w-4 h-4" /> Add</Button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {filterOpen && subscriptions.length > 0 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="flex gap-1.5 flex-wrap rounded-xl border border-border p-3" style={{ background: "hsl(var(--card))" }}>
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="text-xs font-medium text-muted-foreground">Filter by category</span>
                            <button onClick={() => setFilterOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                          </div>
                          {["All", ...CATEGORIES].map(cat => (
                            <button key={cat} onClick={() => setFilterCategory(cat)} className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors" style={{ background: filterCategory === cat ? "#8100FF" : "hsl(var(--muted))", color: filterCategory === cat ? "white" : "hsl(var(--muted-foreground))", border: filterCategory === cat ? "none" : "1px solid hsl(var(--border))" }}>
                              {cat !== "All" && CATEGORY_ICONS[cat] ? `${CATEGORY_ICONS[cat]} ` : ""}{cat}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="space-y-2">
                    {subscriptions.length === 0 ? (
                      <div className="rounded-xl bg-card border border-border p-12 text-center"><p className="text-muted-foreground">No spendings yet. Add one to get started!</p></div>
                    ) : [...subscriptions].filter(s => filterCategory === "All" || s.category === filterCategory).sort((a, b) => b.amount - a.amount).map((sub, i) => (<SubscriptionCard key={sub.id} subscription={sub} index={i} onDelete={deleteSubscription} onUpdate={updateSubscription} />))}
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
                  <div className="rounded-xl border p-5 space-y-3 relative overflow-hidden" style={{ background: theme === "light" ? "linear-gradient(135deg, hsl(267 25% 90%), hsl(267 15% 85%))" : "linear-gradient(135deg, hsl(267 25% 14%), hsl(267 15% 10%))", borderColor: "hsl(267 60% 50% / 0.25)" }}>
                    <h3 className={`font-display font-semibold ${theme === "light" ? "text-foreground" : "text-white"} flex items-center gap-2`}><Crown className="w-4 h-4" style={{ color: "hsl(36 100% 50%)" }} /> Savings Goals</h3>
                    <p className={`${theme === "light" ? "text-muted-foreground" : "text-white/70"} text-sm`}>Set savings goals and track your progress.</p>
                    <Button size="sm" className="rounded-full gap-1.5 text-black font-semibold text-xs" style={{ background: "linear-gradient(135deg, hsl(36 100% 50%), hsl(25 100% 50%))" }} onClick={() => setPremiumOpen(true)}><Crown className="w-3.5 h-3.5" /> Upgrade</Button>
                  </div>
                )}
                {isPremium ? (
                  <BudgetCalculator subscriptions={subscriptions} savingsMonthly={savingsMonthly} />
                ) : (
                  <div className="rounded-xl border p-5 space-y-3 relative overflow-hidden" style={{ background: theme === "light" ? "linear-gradient(135deg, hsl(267 25% 90%), hsl(267 15% 85%))" : "linear-gradient(135deg, hsl(267 35% 14%), hsl(267 25% 10%))", borderColor: "hsl(267 60% 50% / 0.25)" }}>
                    <h3 className={`font-display font-semibold ${theme === "light" ? "text-foreground" : "text-white"} flex items-center gap-2`}><Crown className="w-4 h-4" style={{ color: "hsl(36 100% 50%)" }} /> Budget Calculator</h3>
                    <p className={`${theme === "light" ? "text-muted-foreground" : "text-white/70"} text-sm`}>Calculate your monthly budget and see what's left.</p>
                    <Button size="sm" className="rounded-full gap-1.5 text-black font-semibold text-xs" style={{ background: "linear-gradient(135deg, hsl(36 100% 50%), hsl(25 100% 50%))" }} onClick={() => setPremiumOpen(true)}><Crown className="w-3.5 h-3.5" /> Upgrade</Button>
                  </div>
                )}
                {isPremium ? (
                  <SurvivalCalculator subscriptions={subscriptions} />
                ) : (
                  <div className="rounded-xl border p-5 space-y-3 relative overflow-hidden" style={{ background: theme === "light" ? "linear-gradient(135deg, hsl(0 30% 90%), hsl(0 20% 85%))" : "linear-gradient(135deg, hsl(0 30% 14%), hsl(0 20% 10%))", borderColor: "hsl(0 60% 50% / 0.25)" }}>
                    <h3 className={`font-display font-semibold ${theme === "light" ? "text-foreground" : "text-white"} flex items-center gap-2`}><Crown className="w-4 h-4" style={{ color: "hsl(36 100% 50%)" }} /> Survival Calculator</h3>
                    <p className={`${theme === "light" ? "text-muted-foreground" : "text-white/70"} text-sm`}>Find out how long you'd survive without income.</p>
                    <Button size="sm" className="rounded-full gap-1.5 text-black font-semibold text-xs" style={{ background: "linear-gradient(135deg, hsl(36 100% 50%), hsl(25 100% 50%))" }} onClick={() => setPremiumOpen(true)}><Crown className="w-3.5 h-3.5" /> Upgrade</Button>
                  </div>
                )}
                {isPremium && <SavingsGoalForm onAdd={addGoal} />}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      <BottomNav activeSection={activeSection} onSectionChange={setActiveSection} currentRoute="home" />

      <AddSubscriptionDialog open={dialogOpen} onOpenChange={setDialogOpen} onAdd={addSubscription} />
      <PremiumDialog open={premiumOpen} onOpenChange={(open) => { setPremiumOpen(open); if (!open) setPremiumMessage(undefined); }} message={premiumMessage} />
      
    </div>
  );
}
