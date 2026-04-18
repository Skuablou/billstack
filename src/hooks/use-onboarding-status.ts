import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/AuthContext";

export function useOnboardingStatus() {
  const { user, loading: authLoading } = useAuth();
  const [completed, setCompleted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setCompleted(null);
      setLoading(false);
      return;
    }

    const check = async () => {
      const { data } = await supabase
        .from("monthly_tracker_settings")
        .select("onboarding_completed, salary")
        .eq("user_id", user.id)
        .maybeSingle();

      // No row → new user → not completed
      // Row exists → use the flag (or treat existing salary as completed)
      if (!data) {
        setCompleted(false);
      } else {
        setCompleted(data.onboarding_completed || Number(data.salary) > 0);
      }
      setLoading(false);
    };
    check();
  }, [user, authLoading]);

  return { completed, loading: loading || authLoading };
}
