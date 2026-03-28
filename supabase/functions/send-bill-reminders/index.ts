import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all bill reminders where reminder_days matches the days until billing
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Fetch all reminders with reminder_days > 0
    const { data: reminders, error: remErr } = await supabase
      .from("bill_reminders")
      .select("*")
      .gt("reminder_days", 0);

    if (remErr) {
      console.error("Error fetching reminders:", remErr);
      return new Response(JSON.stringify({ error: remErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ message: "No reminders configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter reminders where today + reminder_days == billing_day
    const dueSoon = reminders.filter((r) => {
      const targetDay = currentDay + r.reminder_days;
      // Handle month wrap
      if (targetDay > daysInMonth) {
        return r.billing_day === targetDay - daysInMonth;
      }
      return r.billing_day === targetDay;
    });

    if (dueSoon.length === 0) {
      return new Response(JSON.stringify({ message: "No bills due soon" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group by user
    const userReminders = new Map<string, typeof dueSoon>();
    for (const r of dueSoon) {
      const existing = userReminders.get(r.user_id) || [];
      existing.push(r);
      userReminders.set(r.user_id, existing);
    }

    let sent = 0;

    for (const [userId, bills] of userReminders) {
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", userId);

      if (!subs || subs.length === 0) continue;

      for (const bill of bills) {
        const daysWord = bill.reminder_days === 1 ? "morgen" : `in ${bill.reminder_days} Tagen`;
        const payload = JSON.stringify({
          title: "💰 BillStack Erinnerung",
          body: `${bill.bill_name} (${Number(bill.amount).toFixed(2)}€) wird ${daysWord} abgebucht!`,
          tag: `bill-reminder-${bill.id}`,
        });

        for (const sub of subs) {
          try {
            await fetch(sub.endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json", TTL: "86400" },
              body: payload,
            });
            sent++;
          } catch (e) {
            console.error(`Failed to send to ${sub.endpoint}:`, e);
          }
        }
      }
    }

    return new Response(JSON.stringify({ sent, matched: dueSoon.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
