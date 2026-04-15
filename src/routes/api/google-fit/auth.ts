import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/google-fit/auth")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const userId = url.searchParams.get("user_id");
        if (!userId) {
          return new Response(JSON.stringify({ error: "Missing user_id" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const clientId = process.env.GOOGLE_FIT_CLIENT_ID;
        if (!clientId) {
          return new Response(JSON.stringify({ error: "Google Fit not configured" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Build the redirect URI based on current host
        const origin = url.origin;
        const redirectUri = `${origin}/api/google-fit/callback`;

        const scopes = [
          "https://www.googleapis.com/auth/fitness.activity.read",
          "https://www.googleapis.com/auth/fitness.body.read",
        ];

        const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        authUrl.searchParams.set("client_id", clientId);
        authUrl.searchParams.set("redirect_uri", redirectUri);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", scopes.join(" "));
        authUrl.searchParams.set("access_type", "offline");
        authUrl.searchParams.set("prompt", "consent");
        authUrl.searchParams.set("state", userId);

        return Response.redirect(authUrl.toString(), 302);
      },
    },
  },
});
