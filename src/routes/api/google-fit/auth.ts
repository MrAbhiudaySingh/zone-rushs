import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { signOAuthState } from "@/server/oauth-state.server";

export const Route = createFileRoute("/api/google-fit/auth")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Verify the caller's session — only the authenticated user can start
        // an OAuth flow for themselves. This (combined with the signed state)
        // prevents a third party from initiating the OAuth dance on behalf of
        // a victim.
        const authHeader = request.headers.get("authorization") || "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
        if (!token) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401, headers: { "Content-Type": "application/json" },
          });
        }
        const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!);
        const { data: userData, error: userErr } = await sb.auth.getUser(token);
        if (userErr || !userData?.user?.id) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401, headers: { "Content-Type": "application/json" },
          });
        }
        const userId = userData.user.id;

        const clientId = process.env.GOOGLE_FIT_CLIENT_ID;
        if (!clientId) {
          return new Response(JSON.stringify({ error: "Google Fit not configured" }), {
            status: 500, headers: { "Content-Type": "application/json" },
          });
        }

        const url = new URL(request.url);
        const redirectUri = `${url.origin}/api/google-fit/callback`;

        const scopes = [
          "https://www.googleapis.com/auth/fitness.activity.read",
          "https://www.googleapis.com/auth/fitness.body.read",
        ];

        const signedState = await signOAuthState(userId);

        const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        authUrl.searchParams.set("client_id", clientId);
        authUrl.searchParams.set("redirect_uri", redirectUri);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", scopes.join(" "));
        authUrl.searchParams.set("access_type", "offline");
        authUrl.searchParams.set("prompt", "consent");
        authUrl.searchParams.set("state", signedState);

        // Return the URL as JSON so the client can redirect (callers used to
        // hit this endpoint directly with `window.location`, but they cannot
        // pass an Authorization header that way — see /api/google-fit/auth
        // callers in the client code, which now POSTs through fetch).
        return new Response(JSON.stringify({ url: authUrl.toString() }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
