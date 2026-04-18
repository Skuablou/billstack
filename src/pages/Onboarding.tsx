import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

interface BillRow { name: string; amount: string }

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [salary, setSalary] = useState("");

  // Step 2
  const [activeDays, setActiveDays] = useState([true, true, true, true, true, false, false]);
  const [hoursPerDay, setHoursPerDay] = useState("8");

  // Step 3
  const [bills, setBills] = useState<BillRow[]>([{ name: "", amount: "" }]);

  // Step 4
  const [goalName, setGoalName] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [goalDate, setGoalDate] = useState("");
  const [goalInterval, setGoalInterval] = useState<"weekly" | "monthly">("monthly");

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const finish = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      // Always upsert settings to mark onboarding complete (and save salary/days/hours if set)
      const hours = activeDays.map((active) => (active ? Number(hoursPerDay) || 0 : 0));
      await supabase.from("monthly_tracker_settings").upsert({
        user_id: user.id,
        salary: Number(salary) || 0,
        active_days: activeDays,
        hours,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      } as never, { onConflict: "user_id" });

      // Save bills
      const validBills = bills.filter((b) => b.name.trim() && Number(b.amount) > 0);
      if (validBills.length > 0) {
        await supabase.from("subscriptions").insert(
          validBills.map((b) => ({
            user_id: user.id,
            name: b.name.trim(),
            amount: Number(b.amount),
            billing_cycle: "Monthly",
            billing_date: 1,
          }))
        );
      }

      // Save savings goal
      if (goalName.trim() && Number(goalAmount) > 0 && goalDate) {
        await supabase.from("savings_goals").insert({
          user_id: user.id,
          name: goalName.trim(),
          total_amount: Number(goalAmount),
          target_date: goalDate,
          interval: goalInterval,
          paid_periods: 0,
        });
      }

      navigate("/", { replace: true });
    } catch (e) {
      console.error(e);
      toast.error("Etwas ist schiefgelaufen");
      setSubmitting(false);
    }
  };

  const next = () => {
    if (step < totalSteps) setStep(step + 1);
    else finish();
  };

  const skip = () => next();

  const toggleDay = (i: number) => {
    setActiveDays((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  const addBill = () => setBills((b) => [...b, { name: "", amount: "" }]);
  const removeBill = (i: number) => setBills((b) => b.filter((_, idx) => idx !== i));
  const updateBill = (i: number, field: keyof BillRow, val: string) => {
    setBills((b) => b.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col p-6 max-w-md mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-4">
        <span className="text-sm text-muted-foreground font-medium">
          Schritt {step} von {totalSteps}
        </span>
        <button
          onClick={skip}
          disabled={submitting}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Überspringen
        </button>
      </div>

      <Progress value={progress} className="mb-8 h-2" />

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                Wie viel verdienst du im Monat?
              </h1>
              <p className="text-muted-foreground">
                Dein monatliches Netto-Einkommen hilft uns, deine Finanzen zu tracken.
              </p>
            </div>
            <div>
              <Label htmlFor="salary">Netto-Einkommen (€)</Label>
              <Input
                id="salary"
                type="number"
                inputMode="decimal"
                placeholder="z.B. 2500"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="mt-2 text-lg h-12"
                autoFocus
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                Wann arbeitest du?
              </h1>
              <p className="text-muted-foreground">
                Wähle deine Arbeitstage und gib die Stunden pro Tag an.
              </p>
            </div>
            <div>
              <Label className="mb-3 block">Arbeitstage</Label>
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map((d, i) => (
                  <button
                    key={d}
                    onClick={() => toggleDay(i)}
                    className={`h-12 rounded-lg font-semibold text-sm transition-colors border ${
                      activeDays[i]
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="hours">Stunden pro Arbeitstag</Label>
              <Input
                id="hours"
                type="number"
                inputMode="decimal"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(e.target.value)}
                className="mt-2 text-lg h-12"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                Deine größten Rechnungen
              </h1>
              <p className="text-muted-foreground">
                Trage deine wichtigsten monatlichen Fixkosten ein (Miete, Strom, Abos…).
              </p>
            </div>
            <div className="space-y-3">
              {bills.map((bill, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="Name"
                    value={bill.name}
                    onChange={(e) => updateBill(i, "name", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="€"
                    value={bill.amount}
                    onChange={(e) => updateBill(i, "amount", e.target.value)}
                    className="w-24"
                  />
                  {bills.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeBill(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {bills.length < 5 && (
                <Button variant="outline" onClick={addBill} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Weitere Rechnung
                </Button>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                Worauf sparst du?
              </h1>
              <p className="text-muted-foreground">
                Setze ein Sparziel — wir helfen dir, es zu erreichen.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="gname">Name des Ziels</Label>
                <Input
                  id="gname"
                  placeholder="z.B. Urlaub, Auto, Notgroschen"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="gamount">Zielbetrag (€)</Label>
                  <Input
                    id="gamount"
                    type="number"
                    inputMode="decimal"
                    placeholder="1000"
                    value={goalAmount}
                    onChange={(e) => setGoalAmount(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="gdate">Zieldatum</Label>
                  <Input
                    id="gdate"
                    type="date"
                    value={goalDate}
                    onChange={(e) => setGoalDate(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Sparrhythmus</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["weekly", "monthly"] as const).map((iv) => (
                    <button
                      key={iv}
                      onClick={() => setGoalInterval(iv)}
                      className={`h-11 rounded-lg font-medium text-sm border transition-colors ${
                        goalInterval === iv
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border"
                      }`}
                    >
                      {iv === "weekly" ? "Wöchentlich" : "Monatlich"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-6 pb-4">
        <Button onClick={next} disabled={submitting} className="w-full h-12 text-base font-semibold">
          {step === totalSteps ? (submitting ? "Speichere…" : "Fertig") : "Weiter"}
        </Button>
      </div>
    </div>
  );
}
