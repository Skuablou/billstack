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
        className="max-w-lg w-full text-center space-y-8 relative z-10"
      >
        <div>
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-5">
            <CreditCard className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground">
            <span style={{ background: "linear-gradient(135deg, hsl(145 70% 45%), hsl(145 80% 40%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Bill</span>
            <span style={{ background: "linear-gradient(135deg, hsl(267 100% 50%), hsl(280 100% 55%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Stack</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">All your bills. One place. Zero stress.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-left">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className="rounded-xl border border-border bg-card p-4 space-y-2"
            >
              <f.icon className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center gap-3"
        >
          <img src={appPreview} alt="BillStack App Preview" className="w-36 rounded-2xl" />
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
