import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/google-fit/sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const corsHeaders = {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        };

        try {
          const body = await request.json();
          const userId = body?.user_id;
          if (!userId || typeof userId !== "string" || userId.length > 100) {
            return new Response(JSON.stringify({ error: "Invalid user_id" }), {
              status: 400,
              headers: corsHeaders,
            });
          }

          // Get user's Google Fit tokens
          const { data: fitData, error: fitError } = await supabaseAdmin
            .from("google_fit_tokens")
            .select("*")
            .eq("user_id", userId)
            .eq("connected", true)
            .maybeSingle();

          if (fitError || !fitData) {
            return new Response(JSON.stringify({ error: "Google Fit not connected", steps: 0 }), {
              status: 200,
              headers: corsHeaders,
            });
          }

          // Refresh token if expired
          let accessToken = fitData.access_token;
          if (fitData.token_expires_at && new Date(fitData.token_expires_at) < new Date()) {
            if (!fitData.refresh_token) {
              return new Response(JSON.stringify({ error: "Token expired, reconnect required", steps: 0 }), {
                status: 200,
                headers: corsHeaders,
              });
            }

            const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                client_id: process.env.GOOGLE_FIT_CLIENT_ID!,
                client_secret: process.env.GOOGLE_FIT_CLIENT_SECRET!,
                refresh_token: fitData.refresh_token,
                grant_type: "refresh_token",
              }),
            });

            if (!refreshRes.ok) {
              console.error("Token refresh failed:", await refreshRes.text());
              // Mark as disconnected
              await supabaseAdmin.from("google_fit_tokens").update({ connected: false }).eq("user_id", userId);
              return new Response(JSON.stringify({ error: "Token refresh failed, reconnect required", steps: 0 }), {
                status: 200,
                headers: corsHeaders,
              });
            }

            const newTokens = await refreshRes.json();
            accessToken = newTokens.access_token;
            const expiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();

            await supabaseAdmin.from("google_fit_tokens").update({
              access_token: accessToken,
              token_expires_at: expiresAt,
              ...(newTokens.refresh_token ? { refresh_token: newTokens.refresh_token } : {}),
            }).eq("user_id", userId);
          }

          // Fetch today's steps from Google Fitness API
          const now = new Date();
          const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const startTimeMillis = startOfDay.getTime().toString();
          const endTimeMillis = now.getTime().toString();

          const fitnessRes = await fetch("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              aggregateBy: [{
                dataTypeName: "com.google.step_count.delta",
                dataSourceId: "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps",
              }],
              bucketByTime: { durationMillis: 86400000 },
              startTimeMillis,
              endTimeMillis,
            }),
          });

          if (!fitnessRes.ok) {
            console.error("Fitness API error:", await fitnessRes.text());
            return new Response(JSON.stringify({ error: "Failed to fetch fitness data", steps: fitData.daily_steps || 0 }), {
              status: 200,
              headers: corsHeaders,
            });
          }

          const fitnessData = await fitnessRes.json();
          let totalSteps = 0;
          for (const bucket of fitnessData.bucket || []) {
            for (const dataset of bucket.dataset || []) {
              for (const point of dataset.point || []) {
                for (const val of point.value || []) {
                  totalSteps += val.intVal || 0;
                }
              }
            }
          }

          // Update daily_steps in google_fit_tokens
          await supabaseAdmin.from("google_fit_tokens").update({
            daily_steps: totalSteps,
            last_synced_at: new Date().toISOString(),
          }).eq("user_id", userId);

          // Also update any step-related quest_progress
          const { data: stepQuests } = await supabaseAdmin
            .from("quest_definitions")
            .select("id, target_value")
            .eq("tracking_type", "health_api")
            .eq("is_active", true);

          if (stepQuests && stepQuests.length > 0) {
            for (const quest of stepQuests) {
              const { data: existing } = await supabaseAdmin
                .from("quest_progress")
                .select("id, status")
                .eq("user_id", userId)
                .eq("quest_definition_id", quest.id)
                .eq("status", "active")
                .maybeSingle();

              if (existing) {
                await supabaseAdmin.from("quest_progress").update({
                  current_value: totalSteps,
                  ...(totalSteps >= quest.target_value ? { status: "completed", completed_at: new Date().toISOString() } : {}),
                }).eq("id", existing.id);
              }
            }
          }

          return new Response(JSON.stringify({ steps: totalSteps, synced: true }), {
            status: 200,
            headers: corsHeaders,
          });
        } catch (err) {
          console.error("Sync error:", err);
          return new Response(JSON.stringify({ error: "Internal error", steps: 0 }), {
            status: 500,
            headers: corsHeaders,
          });
        }
      },
      OPTIONS: async () => {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        });
      },
    },
  },
});
