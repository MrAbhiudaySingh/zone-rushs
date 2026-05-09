// @ts-nocheck
// ═══════════════════════════════════════════════════════════════════════════════
// STORY QUEST SCREEN — campus mystery, chapters, clue submissions
// Reachable from the Story card on Home (full-screen takeover; back to Home).
// ═══════════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppContext } from "../AppContext";
import { showToast } from "../toast";
import { Card, TabBar } from "../ui/Primitives";
import { BG, S1, S2, BR, T, TL, TG, TA, TR, TX, TM, TD, FONT, MONO } from "../constants";

interface StoryScreenProps { onBack: () => void; }

const CHAPTER_FALLBACK = [
  {
    id: "ch1",
    title: "The Vanishing Lecturer",
    sub:   "Dr Patel's office is dark. His laptop is open. Find out where he went.",
    art:   "🎓",
    totalClues: 6,
    bgColor: "#0A1A17",
    accent: T,
    clues: [
      { id: "c1", title: "Find Patel's calendar", desc: "Inspect the planner on his desk", type: "gps",   location: "Faculty Block", reward: "+150 AE", found: true },
      { id: "c2", title: "Photograph the whiteboard", desc: "Capture his last equation", type: "photo", reward: "+150 AE", found: true },
      { id: "c3", title: "Decode the symbols",   desc: "The marginalia points to a campus location", type: "puzzle", reward: "+200 AE", found: false },
      { id: "c4", title: "Visit the library carrel", desc: "His usual study spot — check the shelf", type: "gps", location: "Library Floor 3", reward: "+150 AE", found: false },
      { id: "c5", title: "Scan the QR sticker",  desc: "Hidden somewhere on Floor 3", type: "qr", reward: "+200 AE", found: false },
      { id: "c6", title: "Submit your theory",   desc: "Write a 100-word account of where he went and why", type: "submission", reward: "🔷 1 Shard", found: false },
    ],
  },
];

export function StoryScreen({ onBack }: StoryScreenProps) {
  const ctx = useContext(AppContext);
  const [view, setView] = useState<"current" | "chronicle" | "credits">("current");
  const [chapter, setChapter] = useState<any>(CHAPTER_FALLBACK[0]);
  const [pastChapters, setPastChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [theoryText, setTheoryText] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.from("story_chapters").select("*").order("chapter_num", { ascending: true });
        if (cancelled) return;
        if (data?.length) {
          const active = data.find((c: any) => c.status === "active") || data[data.length - 1];
          setChapter({
            id: active.id, title: active.title, sub: active.subtitle,
            art: active.art_emoji || "📖", totalClues: active.total_clues || 6,
            bgColor: active.bg_color || "#0A1A17", accent: active.accent_color || T,
            clues: active.clues || CHAPTER_FALLBACK[0].clues,
          });
          setPastChapters(data.filter((c: any) => c.status === "completed"));
        }
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const cluesFound = chapter.clues?.filter((c: any) => c.found).length || 0;
  const totalClues = chapter.clues?.length || chapter.totalClues || 6;
  const progress = Math.round((cluesFound / Math.max(1, totalClues)) * 100);

  const investigateClue = async (clueId: string) => {
    showToast("🔍 Investigating…", "info");
    setTimeout(() => {
      setChapter((c: any) => ({ ...c, clues: c.clues.map((cl: any) => cl.id === clueId ? { ...cl, found: true } : cl) }));
      if (ctx?.discoverClue) ctx.discoverClue();
      showToast(`✓ Clue discovered! +150 AE +80 XP`, "success");
    }, 1200);
  };

  const submitTheory = () => {
    if (theoryText.trim().length < 50) { showToast("⚠ Theory should be at least 50 characters", "error"); return; }
    setChapter((c: any) => ({ ...c, clues: c.clues.map((cl: any) => cl.type === "submission" ? { ...cl, found: true } : cl) }));
    showToast("📜 Theory submitted! +500 AE +1 Shard", "success");
    setTheoryText("");
  };

  return (
    <div style={{ minHeight:"100vh", background:BG, paddingBottom:120 }}>
      <div style={{ position:"sticky", top:0, zIndex:30, background:BG, borderBottom:`1px solid ${BR}`, padding:"14px 16px 10px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <button onClick={onBack} aria-label="Back" style={{ width:38, height:38, borderRadius:12, background:S1, border:`1px solid ${BR}`, color:TX, fontSize:16, cursor:"pointer", fontFamily:FONT }}>←</button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:18, fontWeight:900, color:TX, letterSpacing:"-0.3px" }}>📖 Campus Story</div>
            <div style={{ fontSize:11, color:TM }}>An ongoing mystery, told together</div>
          </div>
        </div>
        <TabBar
          tabs={[
            ["current", "📍 Active"],
            ["chronicle", "📚 Chronicle"],
            ["credits", "🏆 Credits"],
          ]}
          active={view}
          onSelect={(v: any) => setView(v)}
        />
      </div>

      <div style={{ padding:16 }}>
        {view === "current" && (
          loading ? <div style={{ padding:"40px 20px", textAlign:"center", color:TM }}>Loading chapter…</div>
          : chapter ? (
            <>
              <div style={{ background:`linear-gradient(135deg, ${chapter.bgColor}, #0E201C)`, border:`1.5px solid ${chapter.accent}40`, borderRadius:20, padding:18, marginBottom:14, position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:-20, right:-10, fontSize:90, opacity:0.12 }}>{chapter.art}</div>
                <div style={{ fontSize:10, fontWeight:900, color:chapter.accent, letterSpacing:"1px", marginBottom:6 }}>CHAPTER {chapter.id?.replace("ch", "") || 1} · ACTIVE</div>
                <div style={{ fontSize:22, fontWeight:900, color:TX, marginBottom:8, letterSpacing:"-0.4px" }}>{chapter.title}</div>
                <div style={{ fontSize:13, color:TM, lineHeight:1.5, marginBottom:14 }}>{chapter.sub}</div>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                  <div style={{ flex:1, height:8, borderRadius:99, background:"rgba(255,255,255,0.08)", overflow:"hidden" }}>
                    <div style={{ width:`${progress}%`, height:"100%", background:`linear-gradient(90deg, ${chapter.accent}, ${TG})`, transition:"width 0.4s ease" }} />
                  </div>
                  <span style={{ fontSize:13, fontWeight:800, color:chapter.accent, fontFamily:MONO, minWidth:48, textAlign:"right" }}>{cluesFound}/{totalClues}</span>
                </div>
                <div style={{ fontSize:11, color:TM }}>{progress === 100 ? "✓ Chapter complete — submit final theory!" : "Discover all clues to unlock the conclusion"}</div>
              </div>

              <div style={{ fontSize:11, color:TM, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:8, padding:"0 4px" }}>Clues</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
                {(chapter.clues || []).map((cl: any) => <ClueCard key={cl.id} clue={cl} accent={chapter.accent} onInvestigate={() => investigateClue(cl.id)} theoryText={theoryText} setTheoryText={setTheoryText} onSubmitTheory={submitTheory} />)}
              </div>
            </>
          ) : null
        )}

        {view === "chronicle" && (
          <>
            <div style={{ fontSize:13, color:TM, marginBottom:14, lineHeight:1.5 }}>Past chapters of the campus story, archived for posterity.</div>
            {pastChapters.length === 0 && (
              <Card style={{ textAlign:"center", padding:"40px 20px" }}>
                <div style={{ fontSize:36, marginBottom:10 }}>📚</div>
                <div style={{ fontSize:14, fontWeight:700, color:TX, marginBottom:6 }}>No completed chapters yet</div>
                <div style={{ fontSize:12, color:TM }}>Solve the active mystery and it'll be archived here.</div>
              </Card>
            )}
            {pastChapters.map((c: any) => (
              <Card key={c.id} style={{ marginBottom:10, opacity:0.85 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                  <span style={{ fontSize:24 }}>{c.art_emoji || "📜"}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:800, color:TX }}>{c.title}</div>
                    <div style={{ fontSize:11, color:TG, fontWeight:700 }}>✓ Completed {c.completed_at ? new Date(c.completed_at).toLocaleDateString() : ""}</div>
                  </div>
                </div>
                {c.summary && <div style={{ fontSize:12, color:TM, lineHeight:1.5 }}>{c.summary}</div>}
              </Card>
            ))}
          </>
        )}

        {view === "credits" && (
          <>
            <Card style={{ marginBottom:12, textAlign:"center", padding:"20px 16px", background:`linear-gradient(135deg, ${T}10, ${TG}06)`, border:`1px solid ${T}30` }}>
              <div style={{ fontSize:40, marginBottom:8 }}>🏆</div>
              <div style={{ fontSize:15, fontWeight:800, color:TX, marginBottom:4 }}>Hall of Detectives</div>
              <div style={{ fontSize:12, color:TM, lineHeight:1.5 }}>Players who unraveled the campus mysteries — credited forever.</div>
            </Card>
            <CreditsList />
          </>
        )}
      </div>
    </div>
  );
}

function ClueCard({ clue, accent, onInvestigate, theoryText, setTheoryText, onSubmitTheory }: any) {
  const TYPE_ICONS: any = { gps:"📍", photo:"📷", qr:"⏹", nfc:"📡", puzzle:"🧩", submission:"📝" };
  return (
    <div style={{
      background: clue.found ? `${TG}08` : S1,
      border: `1px solid ${clue.found ? `${TG}40` : BR}`,
      borderRadius:14, padding:14,
      opacity: clue.found ? 0.75 : 1,
    }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:11 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:clue.found ? `${TG}20` : `${accent}15`, border:`1px solid ${clue.found ? `${TG}40` : `${accent}40`}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>
          {clue.found ? "✓" : TYPE_ICONS[clue.type] || "🔍"}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:800, color:TX, marginBottom:3, textDecoration: clue.found ? "line-through" : "none" }}>{clue.title}</div>
          <div style={{ fontSize:12, color:TM, lineHeight:1.45, marginBottom:8 }}>{clue.desc}</div>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", fontSize:10 }}>
            <span style={{ padding:"2px 8px", borderRadius:99, background:"rgba(255,255,255,0.04)", border:`1px solid ${BR}`, color:TM, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.4px" }}>{clue.type}</span>
            {clue.location && <span style={{ color:TM }}>📍 {clue.location}</span>}
            <span style={{ color:TG, fontWeight:700, marginLeft:"auto" }}>{clue.reward}</span>
          </div>
        </div>
      </div>

      {!clue.found && clue.type === "submission" && (
        <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${BR}` }}>
          <textarea value={theoryText} onChange={(e: any) => setTheoryText(e.target.value)} maxLength={500} placeholder="Write your theory… (min 50 chars)" style={{ width:"100%", minHeight:80, background:"rgba(255,255,255,0.04)", border:`1px solid ${BR}`, borderRadius:10, padding:"10px 12px", color:TX, fontSize:12, resize:"none", lineHeight:1.5, fontFamily:FONT }} />
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
            <span style={{ fontSize:10, color:TM, fontFamily:MONO }}>{theoryText.length}/500</span>
            <button onClick={onSubmitTheory} disabled={theoryText.trim().length < 50} style={{ padding:"8px 14px", background: theoryText.trim().length >= 50 ? `linear-gradient(135deg, ${T}, ${TG})` : "rgba(255,255,255,0.05)", border: theoryText.trim().length >= 50 ? "none" : `1px solid ${BR}`, borderRadius:10, color: theoryText.trim().length >= 50 ? "#0D1117" : TM, fontSize:12, fontWeight:800, fontFamily:FONT, cursor: theoryText.trim().length >= 50 ? "pointer" : "not-allowed" }}>📜 Submit Theory</button>
          </div>
        </div>
      )}

      {!clue.found && clue.type !== "submission" && (
        <button onClick={onInvestigate} style={{ width:"100%", marginTop:10, padding:"9px", background:`${accent}15`, border:`1px solid ${accent}40`, borderRadius:10, color:accent, fontSize:12, fontWeight:800, fontFamily:FONT, cursor:"pointer" }}>🔍 Investigate</button>
      )}
    </div>
  );
}

function CreditsList() {
  const [credits, setCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("user_id, display_name, story_clues, level")
          .gt("story_clues", 0)
          .order("story_clues", { ascending: false })
          .limit(20);
        setCredits(data || []);
      } catch {}
      setLoading(false);
    })();
  }, []);
  if (loading) return <div style={{ color:TM, textAlign:"center", padding:20 }}>Loading…</div>;
  if (credits.length === 0) return <Card style={{ textAlign:"center", padding:"24px 16px", color:TM, fontSize:12 }}>No detectives yet — be the first.</Card>;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {credits.map((p: any, i: number) => (
        <div key={p.user_id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:S1, border:`1px solid ${BR}`, borderRadius:12 }}>
          <span style={{ fontSize:13, fontWeight:800, color: i < 3 ? TA : TM, fontFamily:MONO, width:26 }}>#{i+1}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:TX }}>{p.display_name || "Player"}</div>
            <div style={{ fontSize:11, color:TM }}>Lv {p.level || 1}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:13, fontWeight:800, color:T, fontFamily:MONO }}>{p.story_clues}</div>
            <div style={{ fontSize:9, color:TM, fontWeight:700 }}>CLUES</div>
          </div>
        </div>
      ))}
    </div>
  );
}
