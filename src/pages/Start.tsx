import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, TrendingDown, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { Navigate } from "react-router-dom";

const WALKTHROUGH_KEY = "billstack_walkthrough_seen";

const slides = [
  {
    icon: CreditCard,
    title: "Alle Rechnungen an einem Ort",
    desc: "Behalte den Überblick über all deine monatlichen Ausgaben, Abos und Rechnungen.",
  },
  {
    icon: TrendingDown,
    title: "Jahresübersicht & Sparziele",
    desc: "Sieh auf einen Blick, wie viel du pro Monat und Jahr ausgibst – und setze dir Sparziele.",
  },
  {
    icon: Bell,
    title: "Nie wieder eine Zahlung verpassen",
    desc: "Smarte Erinnerungen sorgen dafür, dass du keine Rechnung mehr vergisst.",
  },
];

type Phase = "splash" | "walkthrough" | "start";

export default function Start() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const [phase, setPhase] = useState<Phase>("splash");
  const [slideIndex, setSlideIndex] = useState(0);

  // Check if already seen
  useEffect(() => {
    if (localStorage.getItem(WALKTHROUGH_KEY)) {
      navigate("/landing", { replace: true });
    }
  }, [navigate]);

  // Splash → Walkthrough after 2.5s
  useEffect(() => {
    if (phase === "splash") {
      const timer = setTimeout(() => setPhase("walkthrough"), 2500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;

  const nextSlide = () => {
    if (slideIndex < slides.length - 1) {
      setSlideIndex(slideIndex + 1);
    } else {
      setPhase("start");
    }
  };

  const skipToStart = () => setPhase("start");

  const handleStart = () => {
    localStorage.setItem(WALKTHROUGH_KEY, "true");
    navigate("/landing", { replace: true });
  };

  // ─── Splash Screen ───
  if (phase === "splash") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
        <div className="fixed top-0 right-0 w-96 h-96 bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="fixed bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center gap-6 relative z-10"
        >
          <h1 className="text-5xl font-display font-bold">
            <span
              style={{
                background: "linear-gradient(135deg, hsl(145 70% 45%), hsl(145 80% 40%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Bill
            </span>
            <span
              style={{
                background: "linear-gradient(135deg, hsl(267 100% 50%), hsl(280 100% 55%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Stack
            </span>
          </h1>

          {/* Animated loading dots */}
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Walkthrough ───
  if (phase === "walkthrough") {
    const slide = slides[slideIndex];
    const Icon = slide.icon;

    return (
      <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
        <div className="fixed top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="fixed bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Skip button */}
        <div className="flex justify-end p-4 relative z-10">
          <button
            onClick={skipToStart}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </button>
        </div>

        {/* Slide content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={slideIndex}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center text-center gap-6 max-w-sm"
            >
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-10 h-10 text-primary" />
              </div>
              <h2
                className="text-2xl font-display font-bold text-foreground"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                {slide.title}
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed">
                {slide.desc}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dot indicator + Next button */}
        <div className="flex flex-col items-center gap-6 pb-12 px-8 relative z-10">
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === slideIndex
                    ? "w-6 bg-primary"
                    : "w-2 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <Button
            onClick={nextSlide}
            className="w-full max-w-sm h-12 text-base font-semibold"
          >
            {slideIndex === slides.length - 1 ? "Weiter" : "Nächste"}
          </Button>
        </div>
      </div>
    );
  }

  // ─── Start Activity ───
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-8 relative overflow-hidden">
      <div className="fixed top-0 right-0 w-96 h-96 bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-8 relative z-10 max-w-sm w-full"
      >
        <h1 className="text-4xl font-display font-bold">
          <span
            style={{
              background: "linear-gradient(135deg, hsl(145 70% 45%), hsl(145 80% 40%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Bill
          </span>
          <span
            style={{
              background: "linear-gradient(135deg, hsl(267 100% 50%), hsl(280 100% 55%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Stack
          </span>
        </h1>

        <p className="text-muted-foreground text-center text-base">
          Bereit, deine Finanzen in den Griff zu bekommen?
        </p>

        <Button
          onClick={handleStart}
          size="lg"
          className="w-full h-14 text-lg font-bold"
        >
          Start
        </Button>
      </motion.div>
    </div>
  );
}
