import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/AuthContext";
import { ActiveGoal, SavingsInterval } from "@/components/SavingsGoal";

export function useSavingsGoals() {
  const [activeGoals, setActiveGoals] = useState<ActiveGoal[]>([]);
  const [goalIds, setGoalIds] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) { setActiveGoals([]); setGoalIds([]); return; }

    const fetch = async () => {
      const { data, error } = await supabase
        .from("savings_goals")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && data) {
        setGoalIds(data.map((r) => r.id));
        setActiveGoals(data.map((r) => ({
          name: r.name,
          totalAmount: Number(r.total_amount),
          targetDate: new Date(r.target_date),
          interval: r.interval as SavingsInterval,
          paidPeriods: r.paid_periods,
        })));
      }
    };
    fetch();
  }, [user]);

  const addGoal = useCallback(async (goal: ActiveGoal) => {
    if (!user) return;
    setActiveGoals((prev) => [...prev, goal]);

    const { data } = await supabase.from("savings_goals").insert({
      user_id: user.id,
      name: goal.name,
      total_amount: goal.totalAmount,
      target_date: goal.targetDate.toISOString().split("T")[0],
      interval: goal.interval,
      paid_periods: goal.paidPeriods,
    }).select("id").single();

    if (data) setGoalIds((prev) => [...prev, data.id]);
  }, [user]);

  const markGoalPaid = useCallback(async (index: number) => {
    setActiveGoals((prev) =>
      prev.map((g, i) => {
        if (i !== index) return g;
        return { ...g, paidPeriods: g.paidPeriods + 1 };
      })
    );

    const id = goalIds[index];
    if (id) {
      // Read current then increment
      const { data } = await supabase.from("savings_goals").select("paid_periods").eq("id", id).single();
      if (data) {
        await supabase.from("savings_goals").update({ paid_periods: data.paid_periods + 1 }).eq("id", id);
      }
    }
  }, [goalIds]);

  const removeGoal = useCallback(async (index: number) => {
    setActiveGoals((prev) => prev.filter((_, i) => i !== index));
    const id = goalIds[index];
    setGoalIds((prev) => prev.filter((_, i) => i !== index));
    if (id) {
      await supabase.from("savings_goals").delete().eq("id", id);
    }
  }, [goalIds]);

  return { activeGoals, addGoal, markGoalPaid, removeGoal };
}
