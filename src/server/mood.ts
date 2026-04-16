import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const saveMoodEntry = createServerFn({ method: "POST" })
  .inputValidator((input: { userId: string; moodScore: number; freeText?: string | null; outreachRequested: boolean }) => input)
  .handler(async ({ data }) => {
    // Hash user ID server-side
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data.userId));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const anonUserHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    const crisisFlag = data.moodScore <= 2 && data.outreachRequested;

    const { error } = await supabaseAdmin.from("mood_entries").insert({
      anon_user_hash: anonUserHash,
      mood_score: data.moodScore,
      free_text: data.freeText || null,
      outreach_requested: data.outreachRequested,
      crisis_flag: crisisFlag,
    });

    if (error) {
      console.error("Error saving mood entry:", error);
      throw new Error("Failed to save mood entry");
    }

    return { success: true };
  });
