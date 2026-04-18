import { motion, AnimatePresence } from "framer-motion";
import { X, Sun, Moon, Bell, BellOff, Crown, Mail, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/ThemeContext";
import { useCurrency } from "@/lib/CurrencyContext";
import { useAuth } from "@/lib/AuthContext";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { isPremiumUser, checkPremiumActivation } from "@/lib/premium";
import { useEffect, useState } from "react";
import PremiumDialog from "@/components/PremiumDialog";

interface SettingsMenuProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsMenu({ open, onClose }: SettingsMenuProps) {
  const { theme, toggleTheme } = useTheme();
  const { currency, toggle: toggleCurrency } = useCurrency();
  const { user, logout } = useAuth();
  const { isSupported, isSubscribed, isLoading: pushLoading, subscribe, unsubscribe } = usePushNotifications();
  const { subscriptions } = useSubscriptions();
  const [isPremium, setIsPremium] = useState(isPremiumUser());
  const [premiumOpen, setPremiumOpen] = useState(false);

  useEffect(() => {
    checkPremiumActivation().then(setIsPremium);
  }, []);

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={onClose}
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
                <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <button onClick={() => { toggleTheme(); onClose(); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-foreground hover:bg-muted/50 transition-colors">
                {theme === "dark" ? <Sun className="w-5 h-5 text-muted-foreground" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </button>

              <button onClick={() => { toggleCurrency(); onClose(); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-foreground hover:bg-muted/50 transition-colors">
                <span className="w-5 h-5 flex items-center justify-center font-semibold text-muted-foreground text-base">{currency}</span>
                Switch to {currency === "€" ? "$" : "€"}
              </button>

              {isSupported && (
                <button
                  onClick={() => {
                    if (!isPremium) { setPremiumOpen(true); onClose(); return; }
                    isSubscribed ? unsubscribe() : subscribe(subscriptions);
                    onClose();
                  }}
                  disabled={pushLoading}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-foreground hover:bg-muted/50 transition-colors"
                >
                  {isSubscribed ? <Bell className="w-5 h-5 text-primary" /> : <BellOff className="w-5 h-5 text-muted-foreground" />}
                  {isSubscribed ? "Disable reminders" : "Enable reminders"}
                  {!isPremium && <Crown className="w-4 h-4 ml-auto" style={{ color: "hsl(36 100% 50%)" }} />}
                </button>
              )}

              {isPremium ? (
                <a
                  href="https://billing.stripe.com/p/login/28EbJ3gB28dT2ZL9PxgA800"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-foreground hover:bg-muted/50 transition-colors no-underline"
                >
                  <Crown className="w-5 h-5" style={{ color: "hsl(36 100% 50%)" }} />
                  Manage Plan
                </a>
              ) : (
                <button
                  onClick={() => { setPremiumOpen(true); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold hover:bg-muted/50 transition-colors"
                  style={{ color: "hsl(36 100% 50%)" }}
                >
                  <Crown className="w-5 h-5" />
                  Upgrade to Premium
                </button>
              )}

              <div className="border-t border-border pt-2 mt-2">
                <button
                  onClick={() => { window.location.href = "mailto:markclump6@gmail.com"; onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-foreground hover:bg-muted/50 transition-colors"
                >
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  Contact Support
                </button>
                <button
                  onClick={() => { logout(); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-destructive hover:bg-muted/50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Log out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <PremiumDialog open={premiumOpen} onOpenChange={setPremiumOpen} />
    </>
  );
}
