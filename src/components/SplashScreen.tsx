import { motion } from "framer-motion";
import { useEffect } from "react";

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center gap-5 relative z-10"
      >
        <motion.img
          src="/icons/icon-512.png"
          alt="BillStack"
          className="w-28 h-28 rounded-3xl shadow-2xl"
          initial={{ rotate: -8 }}
          animate={{ rotate: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-4xl font-bold"
          style={{ fontFamily: "Space Grotesk, sans-serif" }}
        >
          <span style={{ background: "linear-gradient(135deg, hsl(145 70% 45%), hsl(145 80% 40%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Bill</span>
          <span style={{ background: "linear-gradient(135deg, hsl(267 100% 50%), hsl(280 100% 55%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Stack</span>
        </motion.h1>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex gap-1.5"
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
