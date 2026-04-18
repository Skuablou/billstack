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
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      // No row → new user → not completed
      // Row exists → trust the flag exclusively
      setCompleted(data?.onboarding_completed === true);
      setLoading(false);
    };
    check();
  }, [user, authLoading]);

  return { completed, loading: loading || authLoading };
}
