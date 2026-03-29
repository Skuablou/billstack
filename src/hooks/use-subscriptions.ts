import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/AuthContext";
import { Subscription } from "@/lib/subscriptions";

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load from DB
  useEffect(() => {
    if (!user) { setSubscriptions([]); setLoading(false); return; }

    const fetchSubs = async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && data) {
        setSubscriptions(data.map((row) => ({
          id: row.id,
          name: row.name,
          amount: Number(row.amount),
          currency: row.currency,
          category: row.category,
          billingCycle: row.billing_cycle as "Monthly" | "Yearly",
          billingDate: row.billing_date,
          color: row.color,
          icon: row.icon,
          reminderDays: row.reminder_days,
        })));
      }
      setLoading(false);
    };
    fetchSubs();
  }, [user]);

  const addSubscription = useCallback(async (sub: Subscription) => {
    if (!user) return;
    setSubscriptions((prev) => [...prev, sub]);

    await supabase.from("subscriptions").insert({
      id: sub.id,
      user_id: user.id,
      name: sub.name,
      amount: sub.amount,
      currency: sub.currency,
      category: sub.category,
      billing_cycle: sub.billingCycle,
      billing_date: sub.billingDate,
      color: sub.color,
      icon: sub.icon,
      reminder_days: sub.reminderDays,
    });
  }, [user]);

  const deleteSubscription = useCallback(async (id: string) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    await supabase.from("subscriptions").delete().eq("id", id);
  }, []);

  const updateSubscription = useCallback(async (id: string, updates: Partial<Subscription>) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.billingCycle !== undefined) dbUpdates.billing_cycle = updates.billingCycle;
    if (updates.billingDate !== undefined) dbUpdates.billing_date = updates.billingDate;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
    if (updates.reminderDays !== undefined) dbUpdates.reminder_days = updates.reminderDays;

    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from("subscriptions").update(dbUpdates).eq("id", id);
    }
  }, []);

  return { subscriptions, loading, addSubscription, deleteSubscription, updateSubscription };
}
