import { useNavigate } from "react-router-dom";
import { Wallet, Clock, CalendarDays, Calculator, BarChart3 } from "lucide-react";

interface BottomNavProps {
  activeSection?: number;
  onSectionChange?: (section: number) => void;
  currentRoute?: "home" | "reports";
}

export default function BottomNav({ activeSection = 0, onSectionChange, currentRoute = "home" }: BottomNavProps) {
  const navigate = useNavigate();

  const goToSection = (section: number) => {
    if (currentRoute === "home") {
      onSectionChange?.(section);
    } else {
      navigate("/", { state: { section } });
    }
  };

  const items = [
    { icon: Wallet, label: "Spendings", action: () => goToSection(0), active: currentRoute === "home" && activeSection === 0 },
    { icon: Clock, label: "Upcoming", action: () => goToSection(1), active: currentRoute === "home" && activeSection === 1 },
    { icon: CalendarDays, label: "Calendar", action: () => goToSection(2), active: currentRoute === "home" && activeSection === 2 },
    { icon: Calculator, label: "Tools", action: () => goToSection(3), active: currentRoute === "home" && activeSection === 3 },
    { icon: BarChart3, label: "Reports", action: () => navigate("/reports"), active: currentRoute === "reports" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around py-2 px-4">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${item.active ? "" : "text-muted-foreground"}`}
            style={item.active ? { color: "#8100FF" } : undefined}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
