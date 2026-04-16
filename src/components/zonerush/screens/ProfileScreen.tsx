// @ts-nocheck
import { useState, useEffect, useRef, useContext, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppContext } from "../AppContext";
import { showToast } from "../toast";
import { Chip, Card, SectionHeader, ProgressBar, TabBar } from "../ui/Primitives";
import {
  BG, S1, S2, BR, T, TL, TG, TA, TY, TR, TB, TX, TM, TD, FONT, MONO,
  RARITY_COLOR, USER, MISSIONS, SHOP_ITEMS, INIT_SHOP_ITEMS,
  COMMUNITY_ITEMS, STORY, WEEKLY, STYLE_EVENT_LIVE, CL_USER, MEMBERS,
  GAME_RULES, clanZoneOnCooldown, clanCooldownRemaining,
  ZONES, ATTACKABLE_ZONES, WAR_LOG, ENEMY_CLANS, TREASURY_LOG,
  MOODS, SUGGESTED_CLANS, TABS, SPRITE_IMG, ITEM_ICONS, IMG,
  LIVE_EVENTS, MONTHLY_MISSIONS, PROOF_SUBMISSIONS, STYLE_SUBMISSIONS_INIT,
} from "../constants";

export function ProfileScreen({ user, onAdminAccess }: any) {
  const ctx = useContext(AppContext);
  const tapRef = useRef<number>(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iframeRef = useRef(null);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [avatarDataUrl, setAvatarDataUrl] = useState(null);
  const handleAdminTap = () => {
    tapRef.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (tapRef.current >= 7) { tapRef.current = 0; if (onAdminAccess) onAdminAccess(); return; }
    tapTimer.current = setTimeout(() => { tapRef.current = 0; }, 2000);
  };

  // Collect owned item IDs from shop context
  const getOwnedIds = () => {
    const allItems = ctx?.sharedShopItems || SHOP_ITEMS;
    return allItems.filter((i: any) => i.owned).map((i: any) => i.id);
  };

  // Send owned items to iframe when it loads
  const handleIframeLoad = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'set-owned-items',
        ownedIds: getOwnedIds(),
      }, '*');
    }
  };

  // Listen for avatar postMessage from iframe
  useEffect(() => {
    const handler = (e) => {
      if (e.data && e.data.type === 'avatar-confirmed') {
        setAvatarDataUrl(e.data.dataUrl);
        setShowAvatarEditor(false);
        showToast("✨ Avatar updated!", "success");
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const xpPct = (user.xp / user.xpNext) * 100;
  const r = 50, circ = 2 * Math.PI * r;

  return (
    <div style={{ position:"relative", zIndex:1, height:"100dvh", overflowY:"auto", paddingBottom:90 }}>
      {/* Avatar Editor Modal */}
      {showAvatarEditor && (
        <div style={{ position:"fixed", inset:0, zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>
          <div onClick={() => setShowAvatarEditor(false)} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(8px)" }} />
          <div style={{ position:"relative", zIndex:1, width:"100%", height:"100%", maxWidth:960, maxHeight:"95vh", borderRadius:0, overflow:"hidden", border:`2px solid ${T}`, boxShadow:`0 0 40px ${T}40` }}>
            <button onClick={() => setShowAvatarEditor(false)} style={{
              position:"absolute", top:8, right:8, zIndex:10,
              width:36, height:36, borderRadius:"50%", border:`2px solid ${TR}`,
              background:"rgba(13,17,23,0.9)", color:TR, fontSize:18, fontWeight:900,
              display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
            }}>✕</button>
            <iframe
              ref={iframeRef}
              src="/avatar-editor.html"
              onLoad={handleIframeLoad}
              style={{ width:"100%", height:"100%", border:"none" }}
              title="Avatar Editor"
            />
          </div>
        </div>
      )}

      {/* Profile header */}
      <div style={{ padding:"24px 16px 0", textAlign:"center", position:"relative" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:160, background:`linear-gradient(160deg, ${T}20, ${TA}10, transparent)`, pointerEvents:"none" }} />
        {/* Avatar */}
        <div style={{ position:"relative", display:"inline-block", marginBottom:14 }}>
          <div onClick={handleAdminTap} style={{
            width:90, height:90, borderRadius:28, margin:"0 auto",
            background: avatarDataUrl ? "transparent" : `linear-gradient(135deg, ${T}, ${TA})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:36, fontWeight:900, color:"#0D1117",
            boxShadow:`0 0 0 4px ${BG}, 0 0 0 6px ${T}60, 0 12px 32px ${T}40`,
            animation:"tealGlow 3s ease-in-out infinite", position:"relative", userSelect:"none",
            overflow:"hidden",
          }}>
            {avatarDataUrl ? (
              <img src={avatarDataUrl} alt="Avatar" style={{ width:"100%", height:"100%", objectFit:"cover", imageRendering:"pixelated" }} />
            ) : (
              user.name.charAt(0)
            )}
          </div>
          {/* Edit Avatar button */}
          <button onClick={() => setShowAvatarEditor(true)} style={{
            position:"absolute", bottom:-4, right:-4,
            width:30, height:30, borderRadius:"50%",
            background:`linear-gradient(135deg, ${T}, ${TG})`,
            border:`2px solid ${BG}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:13, cursor:"pointer", color:"#0D1117", fontWeight:900,
            boxShadow:`0 2px 8px ${T}60`,
          }}>✎</button>
        </div>
        <div style={{ fontSize:24, fontWeight:900, color:TX, letterSpacing:"-0.5px" }}>{user.name}</div>
        <div style={{ fontSize:12, color:TM, marginTop:4, marginBottom:16 }}>Level {user.level} · {user.combatRank} · {user.influenceRank}</div>

        {/* XP Ring */}
        <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
          <svg width={120} height={120}>
            <defs><linearGradient id="profxp" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={T} /><stop offset="100%" stopColor={TG} /></linearGradient></defs>
            <circle cx={60} cy={60} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
            <circle cx={60} cy={60} r={r} fill="none" stroke="url(#profxp)" strokeWidth={8}
              strokeDasharray={circ} strokeDashoffset={circ * (1 - xpPct/100)}
              strokeLinecap="round" transform="rotate(-90 60 60)"
              style={{ filter:`drop-shadow(0 0 8px ${T}80)` }} />
            <text x={60} y={52} textAnchor="middle" fill={TX} fontSize={18} fontWeight={900} fontFamily="Nunito">{user.xp.toLocaleString()}</text>
            <text x={60} y={72} textAnchor="middle" fill={TM} fontSize={10} fontFamily="Nunito">/ {user.xpNext.toLocaleString()} XP</text>
          </svg>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:8, padding:"0 16px", marginBottom:16 }}>
        {[
          { icon:"◎", val:user.ae.toLocaleString(), lbl:"AE Balance", c:TY },
          { icon:"◆", val:user.shards, lbl:"Shards", c:T },
          { icon:"🔥", val:`${user.streak} days`, lbl:"Streak", c:TA },
          { icon:"🛡️", val:user.shields, lbl:"Shields", c:TG },
          { icon:"🥈", val:user.combatRank, lbl:"Combat Rank", c:TB },
          { icon:"🌱", val:user.influenceRank, lbl:"Influence", c:TG },
        ].map((s: any) => (
          <div key={s.lbl} style={{ background:S1, border:`1.5px solid ${s.c}30`, borderRadius:18, padding:"14px 10px", display:"flex", flexDirection:"column", alignItems:"center", gap:5, boxShadow:`0 4px 16px ${s.c}12` }}>
            <span style={{ fontSize:20 }}>{s.icon}</span>
            <span style={{ fontSize:14, fontWeight:900, color:s.c }}>{s.val}</span>
            <span style={{ fontSize:9, color:TM, fontWeight:700, textAlign:"center" }}>{s.lbl}</span>
          </div>
        ))}
      </div>

      {/* Achievements */}
      {(() => {
        const ctx = useContext(AppContext);
        const [achievements, setAchievements] = useState([
          { icon:"📍", name:"First Zone", desc:"Capture your first zone", unlocked:false, key:"first_zone" },
          { icon:"🔥", name:"Streak 3", desc:"3-day streak", unlocked:false, key:"streak_3" },
          { icon:"🔥", name:"Streak 7", desc:"7-day streak", unlocked:false, key:"streak_7" },
          { icon:"🏃", name:"Step Master", desc:"Sync 10K steps", unlocked:false, key:"step_master" },
          { icon:"⚔️", name:"Warrior", desc:"Win 10 combats", unlocked:false, key:"warrior" },
          { icon:"🗺️", name:"Explorer", desc:"Visit 5+ zones", unlocked:false, key:"explorer" },
          { icon:"🏅", name:"Quest Hero", desc:"Complete 20 quests", unlocked:false, key:"quest_hero" },
          { icon:"👑", name:"Clan Leader", desc:"Create or lead a clan", unlocked:false, key:"clan_leader" },
        ]);

        useEffect(() => {
          if (!ctx?.authUser) return;
          const uid = ctx.authUser.id;
          (async () => {
            const unlocked = new Set();

            // Check zone captures
            const { count: zoneCount } = await supabase.from("zone_captures").select("id", { count:"exact", head:true }).eq("attacker_user_id", uid).eq("status", "completed");
            if (zoneCount && zoneCount >= 1) unlocked.add("first_zone");

            // Check streak from profile
            const { data: profile } = await supabase.from("profiles").select("streak").eq("user_id", uid).maybeSingle();
            if (profile?.streak >= 3) unlocked.add("streak_3");
            if (profile?.streak >= 7) unlocked.add("streak_7");

            // Check steps from google_fit_tokens
            const { data: fit } = await supabase.from("google_fit_tokens").select("daily_steps").eq("user_id", uid).maybeSingle();
            if (fit?.daily_steps >= 10000) unlocked.add("step_master");

            // Check completed quests
            const { count: questCount } = await supabase.from("quest_progress").select("id", { count:"exact", head:true }).eq("user_id", uid).eq("status", "completed");
            if (questCount && questCount >= 20) unlocked.add("quest_hero");

            // Check unique zones visited (via quest_proofs with gps)
            const { data: proofs } = await supabase.from("quest_proofs").select("latitude,longitude").eq("user_id", uid);
            if (proofs && proofs.length >= 5) unlocked.add("explorer");

            // Check clan leadership
            const { data: clan } = await supabase.from("clans").select("id").eq("leader_id", uid).maybeSingle();
            if (clan) unlocked.add("clan_leader");

            setAchievements(prev => prev.map((a: any) => ({ ...a, unlocked: unlocked.has(a.key) })));
          })();
        }, [ctx?.authUser]);

        return (
          <div style={{ padding:"0 16px", marginBottom:16 }}>
            <SectionHeader title="🏆 Achievements" />
            <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4 }}>
              {achievements.map((a: any) => (
                <div key={a.name} style={{
                  flex:"0 0 100px", display:"flex", flexDirection:"column", alignItems:"center", gap:6,
                  padding:"14px 8px", background: a.unlocked ? `${TY}08` : "rgba(255,255,255,0.02)",
                  border:`1.5px solid ${a.unlocked ? `${TY}40` : BR}`, borderRadius:16,
                  opacity: a.unlocked ? 1 : 0.5,
                }}>
                  <span style={{ fontSize:28, filter: a.unlocked ? "none" : "grayscale(1)" }}>{a.icon}</span>
                  <span style={{ fontSize:10, fontWeight:800, color: a.unlocked ? TX : TM, textAlign:"center" }}>{a.name}</span>
                  <span style={{ fontSize:9, color:TM, textAlign:"center" }}>{a.desc}</span>
                  {a.unlocked && <span style={{ fontSize:9, color:TY, fontWeight:700 }}>✓ Unlocked</span>}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Settings */}
      {(() => {
        const [notifs, setNotifs] = useState(true);
        const [theme, setTheme] = useState("Dark");
        return (
          <div style={{ padding:"0 16px" }}>
            <SectionHeader title="⚙️ Settings" />
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {/* Google Fit Connection */}
              {(() => {
                const [fitConnected, setFitConnected] = useState<boolean>(false);
                const [fitLoading, setFitLoading] = useState(true);
                const ctx = useContext(AppContext);
                useEffect(() => {
                  if (!ctx?.authUser) return;
                  supabase.from("google_fit_tokens").select("connected").eq("user_id", ctx.authUser.id).maybeSingle().then(({ data }: any) => {
                    setFitConnected(!!data?.connected);
                    setFitLoading(false);
                  });
                }, [ctx?.authUser]);
                const handleConnect = () => {
                  if (!ctx?.authUser) return;
                  window.open(`/api/google-fit/auth?user_id=${ctx.authUser.id}`, "_blank", "width=500,height=600");
                  // Poll for connection
                  const interval = setInterval(async () => {
                    const { data } = await supabase.from("google_fit_tokens").select("connected").eq("user_id", ctx.authUser.id).maybeSingle();
                    if (data?.connected) { setFitConnected(true); clearInterval(interval); showToast("✅ Google Fit connected! Steps will sync automatically.", "success"); }
                  }, 3000);
                  setTimeout(() => clearInterval(interval), 120000);
                };
                return (
                  <div onClick={fitConnected ? undefined : handleConnect} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", background:S1, border:`1.5px solid ${fitConnected ? TG : T}`, borderRadius:16, cursor: fitConnected ? "default" : "pointer" }}>
                    <span style={{ fontSize:18 }}>🏃</span>
                    <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:700, color:TX }}>Google Fit</div><div style={{ fontSize:11, color: fitConnected ? TG : TM }}>{fitLoading ? "Checking..." : fitConnected ? "Connected — steps sync automatically" : "Tap to connect & auto-track steps"}</div></div>
                    {fitConnected ? <span style={{ color:TG, fontSize:11, fontWeight:700 }}>✓ Active</span> : <span style={{ color:T, fontSize:16 }}>›</span>}
                  </div>
                );
              })()}
              {/* Notifications toggle */}
              <div onClick={() => { setNotifs(!notifs); showToast(notifs ? "🔕 Notifications disabled" : "🔔 Notifications enabled", "info"); }} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", background:S1, border:`1.5px solid ${BR}`, borderRadius:16, cursor:"pointer" }}>
                <span style={{ fontSize:18 }}>🔔</span>
                <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:700, color:TX }}>Notifications</div><div style={{ fontSize:11, color:TM }}>{notifs ? "On" : "Off"}</div></div>
                <div style={{ width:44, height:24, borderRadius:99, background: notifs ? T : BR, padding:2, transition:"background 0.2s", display:"flex", alignItems: "center" }}>
                  <div style={{ width:20, height:20, borderRadius:"50%", background:"#fff", transform: notifs ? "translateX(20px)" : "translateX(0)", transition:"transform 0.2s", boxShadow:"0 2px 4px rgba(0,0,0,0.3)" }} />
                </div>
              </div>
              {/* Privacy */}
              <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", background:S1, border:`1.5px solid ${BR}`, borderRadius:16 }}>
                <span style={{ fontSize:18 }}>🔒</span>
                <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:700, color:TX }}>Privacy</div><div style={{ fontSize:11, color:TM }}>Encrypted end-to-end</div></div>
                <span style={{ color:TG, fontSize:11, fontWeight:700 }}>✓ Active</span>
              </div>
              {/* Theme toggle */}
              <div onClick={() => { const next = theme === "Dark" ? "Light" : "Dark"; setTheme(next); showToast(`🎨 Theme: ${next} (visual only in demo)`, "info"); }} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", background:S1, border:`1.5px solid ${BR}`, borderRadius:16, cursor:"pointer" }}>
                <span style={{ fontSize:18 }}>🎨</span>
                <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:700, color:TX }}>Theme</div><div style={{ fontSize:11, color:TM }}>{theme}</div></div>
                <div style={{ width:44, height:24, borderRadius:99, background: theme === "Dark" ? T : TA, padding:2, transition:"background 0.2s", display:"flex", alignItems:"center" }}>
                  <div style={{ width:20, height:20, borderRadius:"50%", background:"#fff", transform: theme === "Dark" ? "translateX(20px)" : "translateX(0)", transition:"transform 0.2s", boxShadow:"0 2px 4px rgba(0,0,0,0.3)" }} />
                </div>
              </div>
              {/* Data Export */}
              <div onClick={() => { showToast("📊 Your data export is being prepared. Download will start shortly.", "success"); }} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", background:S1, border:`1.5px solid ${BR}`, borderRadius:16, cursor:"pointer" }}>
                <span style={{ fontSize:18 }}>📊</span>
                <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:700, color:TX }}>Data Export</div><div style={{ fontSize:11, color:TM }}>Download your activity data</div></div>
                <span style={{ color:TM, fontSize:16 }}>›</span>
              </div>
              {/* Terms */}
              <div onClick={() => showToast("📋 Terms & Privacy policy would open here", "info")} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", background:S1, border:`1.5px solid ${BR}`, borderRadius:16, cursor:"pointer" }}>
                <span style={{ fontSize:18 }}>📋</span>
                <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:700, color:TX }}>Terms & Privacy</div></div>
                <span style={{ color:TM, fontSize:16 }}>›</span>
              </div>
            </div>
          </div>
        );
      })()}
      <div style={{ height:40 }} />
    </div>
  );
}
