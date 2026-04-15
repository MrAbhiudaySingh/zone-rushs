import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/google-fit/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const userId = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error || !code || !userId) {
          return new Response(renderHTML("Connection Failed", "Google Fit connection was denied or failed. You can close this window."), {
            status: 400,
            headers: { "Content-Type": "text/html" },
          });
        }

        const clientId = process.env.GOOGLE_FIT_CLIENT_ID!;
        const clientSecret = process.env.GOOGLE_FIT_CLIENT_SECRET!;
        const origin = url.origin;
        const redirectUri = `${origin}/api/google-fit/callback`;

        try {
          // Exchange code for tokens
          const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              code,
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: redirectUri,
              grant_type: "authorization_code",
            }),
          });

          if (!tokenRes.ok) {
            const errBody = await tokenRes.text();
            console.error("Google token exchange failed:", errBody);
            return new Response(renderHTML("Connection Failed", "Could not exchange token with Google. Please try again."), {
              status: 500,
              headers: { "Content-Type": "text/html" },
            });
          }

          const tokens = await tokenRes.json();
          const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

          // Upsert tokens into google_fit_tokens
          const { error: dbError } = await supabaseAdmin
            .from("google_fit_tokens")
            .upsert({
              user_id: userId,
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token || null,
              token_expires_at: expiresAt,
              connected: true,
              last_synced_at: null,
              daily_steps: 0,
            }, { onConflict: "user_id" });

          if (dbError) {
            console.error("DB upsert error:", dbError);
            return new Response(renderHTML("Connection Failed", "Could not save connection. Please try again."), {
              status: 500,
              headers: { "Content-Type": "text/html" },
            });
          }

          return new Response(renderHTML("Connected!", "Google Fit is now connected. You can close this window and return to ZoneRush."), {
            status: 200,
            headers: { "Content-Type": "text/html" },
          });
        } catch (err) {
          console.error("Google Fit callback error:", err);
          return new Response(renderHTML("Error", "Something went wrong. Please try again."), {
            status: 500,
            headers: { "Content-Type": "text/html" },
          });
        }
      },
    },
  },
});

function renderHTML(title: string, message: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>body{font-family:system-ui,sans-serif;background:#0D1117;color:#F0F6FC;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{text-align:center;padding:40px;border-radius:20px;background:#161B22;border:1px solid #2A3441;max-width:400px}
h1{color:#00C9B1;margin:0 0 12px}p{color:#8B9AB0;margin:0}
</style></head><body><div class="card"><h1>${title}</h1><p>${message}</p></div></body></html>`;
}
