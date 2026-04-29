import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import SplashScreen from "@/components/SplashScreen";
import Walkthrough from "@/components/Walkthrough";

const WALKTHROUGH_KEY = "billstack_walkthrough_done";
const SPLASH_KEY = "billstack_splash_shown";

type Phase = "splash" | "walkthrough" | "start";

export default function Start() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("splash");

  useEffect(() => {
    // Splash only once per session
    if (sessionStorage.getItem(SPLASH_KEY) === "1") {
      const walkthroughDone = localStorage.getItem(WALKTHROUGH_KEY) === "1";
      setPhase(walkthroughDone ? "start" : "walkthrough");
    }
  }, []);

  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSplashDone = () => {
    sessionStorage.setItem(SPLASH_KEY, "1");
    const walkthroughDone = localStorage.getItem(WALKTHROUGH_KEY) === "1";
    setPhase(walkthroughDone ? "start" : "walkthrough");
  };

  const handleWalkthroughDone = () => {
    localStorage.setItem(WALKTHROUGH_KEY, "1");
    setPhase("start");
  };

  if (phase === "splash") return <SplashScreen onDone={handleSplashDone} />;
  if (phase === "walkthrough") return <Walkthrough onDone={handleWalkthroughDone} />;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="fixed top-0 right-0 w-96 h-96 bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-sm w-full text-center space-y-8 relative z-10"
      >
        <div className="flex flex-col items-center gap-5">
          <img
            src="/icons/icon-512.png"
            alt="BillStack"
            className="w-24 h-24 rounded-3xl shadow-2xl"
          />
          <div>
            <h1
              className="text-4xl font-bold"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              <span style={{ background: "linear-gradient(135deg, hsl(145 70% 45%), hsl(145 80% 40%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Bill</span>
              <span style={{ background: "linear-gradient(135deg, hsl(267 100% 50%), hsl(280 100% 55%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Stack</span>
            </h1>
            <p className="text-muted-foreground mt-2 text-base">
              All your bills. One place. Zero stress.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <Button
            size="lg"
            className="w-full h-14 text-base font-semibold"
            onClick={() => navigate("/landing")}
          >
            Start
          </Button>
          <button
            onClick={() => navigate("/auth")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Already have an account? <span className="text-primary font-medium">Sign in</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
