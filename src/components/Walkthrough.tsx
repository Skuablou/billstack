import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CreditCard, PiggyBank, Bell } from "lucide-react";

const SLIDES = [
  {
    icon: CreditCard,
    title: "Alle Rechnungen im Blick",
    desc: "Verwalte alle deine monatlichen Abos und Fixkosten an einem Ort — übersichtlich und stressfrei.",
    color: "hsl(267 100% 50%)",
  },
  {
    icon: PiggyBank,
    title: "Sparziele erreichen",
    desc: "Setze Sparziele und sieh in Echtzeit, wie nah du deinem Traum schon bist.",
    color: "hsl(145 70% 45%)",
  },
  {
    icon: Bell,
    title: "Nie wieder vergessen",
    desc: "Smarte Erinnerungen sorgen dafür, dass du keine Zahlung mehr verpasst.",
    color: "hsl(28 95% 55%)",
  },
];

export default function Walkthrough({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const total = SLIDES.length;
  const slide = SLIDES[step];
  const Icon = slide.icon;
  const isLast = step === total - 1;

  const next = () => (isLast ? onDone() : setStep(step + 1));
  const skip = () => onDone();

  return (
    <div className="fixed inset-0 z-[90] bg-background flex flex-col p-6 max-w-md mx-auto w-full">
      <div className="flex items-center justify-between pt-4">
        <div className="flex gap-1.5">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-8 bg-primary" : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>
        <button
          onClick={skip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Überspringen
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col items-center gap-6 px-4"
          >
            <div
              className="w-28 h-28 rounded-3xl flex items-center justify-center shadow-xl"
              style={{ backgroundColor: `${slide.color}20`, color: slide.color }}
            >
              <Icon className="w-14 h-14" strokeWidth={1.8} />
            </div>
            <h2
              className="text-3xl font-bold"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {slide.title}
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed max-w-xs">
              {slide.desc}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="pb-6 space-y-3">
        <Button
          onClick={next}
          className="w-full h-12 text-base font-semibold"
        >
          {isLast ? "Los geht's" : "Weiter"}
        </Button>
      </div>
    </div>
  );
}
