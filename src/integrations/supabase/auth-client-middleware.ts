// Client middleware that attaches the current Supabase session's access_token
// as an Authorization: Bearer header to outgoing server-function RPCs.
// Pair this with `requireSupabaseAuth` on the server side.
import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "./client";

export const attachSupabaseAuth = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    let token: string | undefined;
    if (typeof window !== "undefined") {
      try {
        const { data } = await supabase.auth.getSession();
        token = data?.session?.access_token;
      } catch {
        // ignore — call will 401 and the server fn can return an error
      }
    }
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  });
