import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
  const [goalDate, setGoalDate] = useState<Date | undefined>(undefined);
  const [goalInterval, setGoalInterval] = useState<"daily" | "weekly" | "monthly">("monthly");

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
          target_date: format(goalDate, "yyyy-MM-dd"),
          interval: goalInterval,
          paid_periods: 0,
        });
      }

      navigate("/", { replace: true });
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong");
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
          Step {step} of {totalSteps}
        </span>
        <button
          onClick={skip}
          disabled={submitting}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip
        </button>
      </div>

      <Progress value={progress} className="mb-8 h-2" />

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                How much do you earn per month?
              </h1>
              <p className="text-muted-foreground">
                Your monthly net income helps us track your finances.
              </p>
            </div>
            <div>
              <Label htmlFor="salary">Net income (€)</Label>
              <Input
                id="salary"
                type="number"
                inputMode="decimal"
                placeholder="e.g. 2500"
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
                When do you work?
              </h1>
              <p className="text-muted-foreground">
                Pick your work days and enter the hours per day.
              </p>
            </div>
            <div>
              <Label className="mb-3 block">Work days</Label>
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
              <Label htmlFor="hours">Hours per work day</Label>
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
                Your biggest bills
              </h1>
              <p className="text-muted-foreground">
                Add your most important monthly fixed costs (rent, insurance, subscriptions…).
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
                  Add another bill
                </Button>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                What are you saving for?
              </h1>
              <p className="text-muted-foreground">
                Set a savings goal — we'll help you reach it.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="gname">Goal name</Label>
                <Input
                  id="gname"
                  placeholder="e.g. Vacation, Car, Emergency fund"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="gamount">Target amount (€)</Label>
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
                  <Label htmlFor="gdate">Target date</Label>
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
                <Label className="mb-2 block">Savings rhythm</Label>
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
                      {iv === "weekly" ? "Weekly" : "Monthly"}
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
          {step === totalSteps ? (submitting ? "Saving…" : "Done") : "Next"}
        </Button>
      </div>
    </div>
  );
}
