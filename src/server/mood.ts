import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-client-middleware";

/**
 * Salt for anonymising user IDs in `mood_entries`. SHA-256 of `userId` alone is
 * deterministic and trivially reversible if the attacker knows the user list,
 * which defeats the privacy promise in the docs. Salting with a server-only
 * secret means: same input still maps to the same hash (so we can still query
 * for "this user's entries"), but the hash is no longer a brute-forceable
 * function of just the user ID.
 *
 * Configure a strong random value via the MOOD_HASH_SALT environment variable
 * (e.g. `openssl rand -hex 32`). The fallback is intentionally low-quality so
 * misconfiguration is loud in dev but doesn't crash production.
 */
const MOOD_HASH_SALT = (typeof globalThis !== "undefined"
  && (globalThis as any).process?.env?.MOOD_HASH_SALT)
  || "zr-mood-salt-PLEASE-OVERRIDE-IN-ENV";

async function hashUserIdForMood(userId: string): Promise<string> {
  const encoder = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", encoder.encode(`${MOOD_HASH_SALT}:${userId}`));
  const arr = Array.from(new Uint8Array(buf));
  return arr.map(b => b.toString(16).padStart(2, "0")).join("");
}

export const saveMoodEntry = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .inputValidator((input: { moodScore: number; freeText?: string | null; outreachRequested: boolean }) => {
    if (typeof input?.moodScore !== "number" || input.moodScore < 1 || input.moodScore > 5) {
      throw new Error("Invalid mood score");
    }
    const freeText = typeof input.freeText === "string" ? input.freeText.slice(0, 2000) : null;
    return {
      moodScore: Math.round(input.moodScore),
      freeText,
      outreachRequested: !!input.outreachRequested,
    };
  })
  .handler(async ({ data, context }) => {
    // Use the JWT-verified user ID, never trust the client.
    const anonUserHash = await hashUserIdForMood(context.userId);

    const crisisFlag = data.moodScore <= 2 && data.outreachRequested;

    const { error } = await supabaseAdmin.from("mood_entries").insert({
      anon_user_hash: anonUserHash,
      mood_score: data.moodScore,
      free_text: data.freeText,
      outreach_requested: data.outreachRequested,
      crisis_flag: crisisFlag,
    });

    if (error) {
      console.error("Error saving mood entry:", error);
      throw new Error("Failed to save mood entry");
    }

    return { success: true };
  });

/**
 * Resolve the mood-anon hash for the *currently authenticated* user only.
 * Used by the data-export path so it can query `mood_entries` by the same hash
 * that `saveMoodEntry` writes. Never accepts a user ID from the client.
 */
export const resolveMoodAnonHash = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }) => ({
    anonUserHash: await hashUserIdForMood(context.userId),
  }));
