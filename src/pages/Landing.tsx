import { motion } from "framer-motion";
import { CreditCard, TrendingDown, Bell, PiggyBank } from "lucide-react";
import appPreview from "@/assets/app-preview.png";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Navigate } from "react-router-dom";

const features = [
  { icon: CreditCard, title: "Track Subscriptions", desc: "Keep all your bills and subscriptions in one place." },
  { icon: TrendingDown, title: "Yearly Projections", desc: "See how much you spend per month and year at a glance." },
  { icon: Bell, title: "Bill Reminders", desc: "Never miss a payment with smart notifications." },
  { icon: PiggyBank, title: "Savings Goals", desc: "Set goals and track your progress over time." },
];

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="fixed top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full text-center space-y-5 relative z-10 py-4"
      >
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            <span style={{ background: "linear-gradient(135deg, hsl(145 70% 45%), hsl(145 80% 40%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Bill</span>
            <span style={{ background: "linear-gradient(135deg, hsl(267 100% 50%), hsl(280 100% 55%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Stack</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">All your bills. One place. Zero stress.</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-left">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className="rounded-xl border border-border bg-card p-3 space-y-1"
            >
              <f.icon className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold text-foreground">{f.title}</h3>
              <p className="text-[11px] text-muted-foreground leading-snug">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="space-y-2 pt-1">
          <Button
            size="lg"
            className="w-full h-11 text-base font-semibold"
            onClick={() => navigate("/auth?mode=register")}
          >
            Get Started Free
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <button onClick={() => navigate("/auth")} className="text-primary hover:underline font-medium">
              Sign in
            </button>
          </p>
        </div>
      </motion.div>

        <div className="space-y-3 pt-2">
          <Button
            size="lg"
            className="w-full h-12 text-base font-semibold"
            onClick={() => navigate("/auth?mode=register")}
          >
            Get Started Free
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <button onClick={() => navigate("/auth")} className="text-primary hover:underline font-medium">
              Sign in
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
