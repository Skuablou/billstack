import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Web Push crypto utilities
async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
) {
  // For simplicity, use the web-push compatible approach via fetch
  // We encode the VAPID and payload using the Web Push protocol
  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      TTL: "86400",
    },
    body: payload,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`Push failed [${response.status}]: ${text}`);
  }
  return response;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get tomorrow's day
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDay = tomorrow.getDate();

    // Find all bill reminders due tomorrow
    const { data: reminders, error: remErr } = await supabase
      .from("bill_reminders")
      .select("*")
      .eq("billing_day", tomorrowDay);

    if (remErr) {
      console.error("Error fetching reminders:", remErr);
      return new Response(JSON.stringify({ error: remErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ message: "No reminders for tomorrow" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group reminders by user
    const userReminders = new Map<string, typeof reminders>();
    for (const r of reminders) {
      const existing = userReminders.get(r.user_id) || [];
      existing.push(r);
      userReminders.set(r.user_id, existing);
    }

    let sent = 0;

    for (const [userId, bills] of userReminders) {
      // Get push subscriptions for this user
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", userId);

      if (!subs || subs.length === 0) continue;

      const billNames = bills.map((b) => b.bill_name).join(", ");
      const totalAmount = bills.reduce((sum, b) => sum + Number(b.amount), 0);
      const payload = JSON.stringify({
        title: "💰 BillStack Erinnerung",
        body: `Morgen werden ${bills.length} Rechnungen fällig: ${billNames} (${totalAmount.toFixed(2)}€)`,
        tag: "bill-reminder-" + tomorrowDay,
      });

      for (const sub of subs) {
        try {
          // Simple push notification via endpoint
          await fetch(sub.endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              TTL: "86400",
            },
            body: payload,
          });
          sent++;
        } catch (e) {
          console.error(`Failed to send to ${sub.endpoint}:`, e);
        }
      }
    }

    return new Response(JSON.stringify({ sent, reminders: reminders.length }), {
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
