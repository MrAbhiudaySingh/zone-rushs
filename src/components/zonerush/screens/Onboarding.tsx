// @ts-nocheck
// ═══════════════════════════════════════════════════════════════════════════════
// ONBOARDING FLOW — 3 steps shown on first auth, gated by localStorage flag
// ═══════════════════════════════════════════════════════════════════════════════
import { useState, useContext } from "react";
import { AppContext } from "../AppContext";
import { BG, S1, BR, T, TG, TA, TR, TX, TM, FONT, MONO } from "../constants";

interface OnboardingProps { onComplete: () => void; }

export function Onboarding({ onComplete }: OnboardingProps) {
  const ctx = useContext(AppContext);
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: "⚡",
      title: "Welcome to ZoneRush",
      lead: "Turn campus into a game",
      body: "Capture zones, rack up streaks, complete quests, and team up with a clan. Your real-world activity earns Aether (AE) you can spend on cosmetics and clan upgrades.",
      cta: "Show me how",
    },
    {
      icon: "◈",
      title: "Three things to know",
      lead: "Quests, Zones, Clans",
      body: "Daily quests refresh at midnight. Zones across campus generate AE/hr when you control them. Reach Level 3 to start a clan with friends — or join an existing one.",
      cta: "Got it",
    },
    {
      icon: "💙",
      title: "We care about your wellbeing",
      lead: "Anonymous daily check-in",
      body: "Once a day we'll quietly ask how you're doing. Responses are salted-hashed and never tied to rewards or leaderboards. Crisis flags are reviewed by trained wellbeing staff.",
      cta: "Let's go",
    },
  ];

  const cur = steps[step];

  const finish = () => {
    try {
      const uid = ctx?.authUser?.id || "anon";
      window.localStorage.setItem(`zr_onboarded_${uid}`, "1");
    } catch {}
    onComplete();
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:BG, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 24px", fontFamily:FONT }}>
      <div style={{ position:"absolute", inset:0, background:`radial-gradient(circle at 50% 30%, ${T}10, transparent 60%)`, pointerEvents:"none" }} />

      <div style={{ position:"absolute", top:24, left:24, right:24, display:"flex", gap:6, justifyContent:"center" }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            flex:1, maxWidth:60, height:4, borderRadius:99,
            background: i <= step ? `linear-gradient(90deg, ${T}, ${TG})` : "rgba(255,255,255,0.1)",
            transition:"background 0.4s",
          }} />
        ))}
      </div>

      <div style={{ textAlign:"center", maxWidth:340, position:"relative", zIndex:1 }}>
        <div style={{ fontSize:80, marginBottom:18, animation:"fadeUp 0.5s ease" }}>{cur.icon}</div>
        <div style={{ fontSize:11, fontWeight:900, color:T, letterSpacing:"1.4px", marginBottom:10, textTransform:"uppercase" }}>{cur.lead}</div>
        <h1 style={{ fontSize:28, fontWeight:900, color:TX, marginBottom:14, letterSpacing:"-0.5px", lineHeight:1.15 }}>{cur.title}</h1>
        <p style={{ fontSize:14, color:TM, lineHeight:1.6, marginBottom:36 }}>{cur.body}</p>

        <button
          onClick={() => step < steps.length - 1 ? setStep(step + 1) : finish()}
          style={{
            width:"100%", padding:"14px 20px",
            background:`linear-gradient(135deg, ${T}, ${TG})`,
            border:"none", borderRadius:14,
            color:"#0D1117", fontSize:14, fontWeight:900, fontFamily:FONT,
            boxShadow:`0 6px 20px ${T}40`, cursor:"pointer",
          }}
        >
          {cur.cta} →
        </button>

        {step > 0 && (
          <button onClick={() => setStep(step - 1)} style={{ marginTop:14, padding:"8px", background:"none", border:"none", color:TM, fontSize:13, fontFamily:FONT, cursor:"pointer" }}>
            ← Back
          </button>
        )}

        {step === 0 && (
          <button onClick={finish} style={{ marginTop:14, padding:"8px", background:"none", border:"none", color:TM, fontSize:12, fontFamily:FONT, cursor:"pointer" }}>
            Skip intro
          </button>
        )}
      </div>

      <div style={{ position:"absolute", bottom:18, color:TM, fontSize:10, letterSpacing:"0.5px", fontFamily:MONO }}>
        Step {step + 1} of {steps.length}
      </div>
    </div>
  );
}

export const shouldShowOnboarding = (uid: string | null | undefined) => {
  try {
    const k = `zr_onboarded_${uid || "anon"}`;
    return typeof window !== "undefined" && !window.localStorage.getItem(k);
  } catch { return false; }
};
