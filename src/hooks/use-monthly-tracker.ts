import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/AuthContext";

interface DayEntry { amt: number; id?: string; created_at?: string }
type DataMap = Record<string, DayEntry[]>;

export function useMonthlyTracker() {
  const { user } = useAuth();
  const [salary, setSalary] = useState(0);
  const [salaryInput, setSalaryInput] = useState("");
  const [salaryConfirmed, setSalaryConfirmed] = useState(false);
  const [activeDays, setActiveDays] = useState([true, true, true, true, true, false, false]);
  const [hours, setHours] = useState([8, 8, 8, 8, 8, 0, 0]);
  const [data, setData] = useState<DataMap>({});
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  // Load settings and expenses from DB
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: settings } = await supabase
        .from("monthly_tracker_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (settings) {
        setSalary(Number(settings.salary) || 0);
        setSalaryInput(String(settings.salary || ""));
        setSalaryConfirmed(Number(settings.salary) > 0);
        if (settings.active_days) setActiveDays(settings.active_days as unknown as boolean[]);
        if (settings.hours) setHours((settings.hours as unknown as number[]).map(Number));
      }

      const { data: expenses } = await supabase
        .from("monthly_tracker_expenses")
        .select("*")
        .eq("user_id", user.id);

      if (expenses && expenses.length > 0) {
        const map: DataMap = {};
        expenses.forEach((e: any) => {
          const key = e.date;
          if (!map[key]) map[key] = [];
          map[key].push({ amt: Number(e.amount), id: e.id, created_at: e.created_at });
        });
        setData(map);
      }
      setLoaded(true);
    };
    load();
  }, [user]);

  // Auto-save settings (debounced)
  const saveSettings = useCallback(() => {
    if (!user || !loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await supabase.from("monthly_tracker_settings").upsert({
        user_id: user.id,
        salary,
        active_days: activeDays as any,
        hours: hours as any,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    }, 500);
  }, [user, salary, activeDays, hours, loaded]);

  useEffect(() => {
    if (loaded) saveSettings();
  }, [salary, activeDays, hours, saveSettings, loaded]);

  const addExpense = useCallback(async (dateKey: string, amount: number) => {
    if (!user) return;
    const { data: inserted } = await supabase
      .from("monthly_tracker_expenses")
      .insert({ user_id: user.id, date: dateKey, amount } as any)
      .select()
      .single();

    if (inserted) {
      setData(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), { amt: Number((inserted as any).amount), id: (inserted as any).id, created_at: (inserted as any).created_at }],
      }));
    }
  }, [user]);

  const deleteExpense = useCallback(async (dateKey: string, index: number) => {
    if (!user) return;
    const entries = data[dateKey] || [];
    const entry = entries[index];
    if (entry?.id) {
      await supabase.from("monthly_tracker_expenses").delete().eq("id", entry.id);
    }
    setData(prev => {
      const updated = [...(prev[dateKey] || [])];
      updated.splice(index, 1);
      const next = { ...prev };
      if (updated.length === 0) delete next[dateKey];
      else next[dateKey] = updated;
      return next;
    });
  }, [user, data]);

  const confirmSalary = useCallback(() => {
    const val = parseFloat(salaryInput) || 0;
    if (val <= 0) return;
    setSalary(val);
    setSalaryConfirmed(true);
  }, [salaryInput]);

  return {
    salary, setSalary, salaryInput, setSalaryInput, salaryConfirmed, confirmSalary,
    activeDays, setActiveDays, hours, setHours,
    data, addExpense, deleteExpense, loaded,
  };
}
