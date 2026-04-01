import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildPushHTTPRequest } from "npm:@pushforge/builder";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Convert raw base64url VAPID keys to JWK format
function vapidKeysToJWK(publicKeyBase64: string, privateKeyBase64: string) {
  // Decode the public key (65 bytes: 0x04 || x(32) || y(32))
  const pubBytes = base64urlToBytes(publicKeyBase64);
  const x = bytesToBase64url(pubBytes.slice(1, 33));
  const y = bytesToBase64url(pubBytes.slice(33, 65));
  const d = privateKeyBase64; // Already base64url, 32 bytes

  return {
    kty: "EC",
    crv: "P-256",
    x,
    y,
    d,
  };
}

function base64urlToBytes(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const privateJWK = vapidKeysToJWK(vapidPublicKey, vapidPrivateKey);

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
    let failed = 0;

    for (const [userId, bills] of userReminders) {
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", userId);

      if (!subs || subs.length === 0) continue;

      for (const bill of bills) {
        const daysWord = bill.reminder_days === 1 ? "tomorrow" : `in ${bill.reminder_days} days`;
        const payload = {
          title: "💰 BillStack Reminder",
          body: `${bill.bill_name} (${Number(bill.amount).toFixed(2)}€) is due ${daysWord}!`,
          tag: `bill-reminder-${bill.id}`,
        };

        for (const sub of subs) {
          try {
            const subscription = {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            };

            const { endpoint, headers, body } = await buildPushHTTPRequest({
              privateJWK,
              subscription,
              message: {
                payload,
                ttl: 86400,
              },
            });

            const response = await fetch(endpoint, {
              method: "POST",
              headers,
              body,
            });

            if (response.ok) {
              sent++;
            } else {
              const responseText = await response.text();
              console.error(`Push failed (${response.status}):`, responseText);
              failed++;

              // Remove expired subscriptions (410 Gone)
              if (response.status === 410) {
                await supabase
                  .from("push_subscriptions")
                  .delete()
                  .eq("endpoint", sub.endpoint);
                console.log(`Removed expired subscription: ${sub.endpoint}`);
              }
            }
          } catch (e) {
            console.error(`Failed to send to ${sub.endpoint}:`, e);
            failed++;
          }
        }
      }
    }

    console.log(`Sent: ${sent}, Failed: ${failed}, Matched bills: ${dueSoon.length}`);
    return new Response(JSON.stringify({ sent, failed, matched: dueSoon.length }), {
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
