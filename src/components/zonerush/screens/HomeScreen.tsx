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
import { saveMoodEntry } from "@/server/mood";
import { GlobalStyles } from "../ui/Primitives";
import type {
  WellbeingOverlayProps, ZoneAlertProps, HudHeaderProps, XpTrackProps, StatStripProps,
  MissionCardProps, StoryCardProps, StyleEventGalleryProps,
} from "../types";
import { AdminRoot } from "../admin/AdminDashboard";
import { QuestScreen } from "./QuestScreen";
import { MarketScreen } from "./MarketScreen";
import { ClanScreen } from "./ClanScreen";
import { ProfileScreen } from "./ProfileScreen";

function WellbeingOverlay({ onDone }: WellbeingOverlayProps) {
  const [phase, setPhase] = useState("ask");
  const [mood, setMood] = useState<number | null>(null);
  const [freeText, setFreeText] = useState("");
  const [wantTalk, setWantTalk] = useState(false);
  const [outreach, setOutreach] = useState(false);
  const [consentShare, setConsentShare] = useState(false);

  const pickMood = (score: number) => {
    setMood(score);
    if (score <= 2) { setTimeout(() => setPhase("comfort"), 300); }
    else { setTimeout(() => onDone(score, null, false), 600); }
  };

  if (phase === "ask") return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(13,17,23,0.95)", backdropFilter:"blur(20px)" }} />
      <div style={{ position:"relative", zIndex:1, textAlign:"center", width:"100%", maxWidth:360, animation:"fadeUp 0.4s ease" }}>
        <div style={{ width:80, height:80, borderRadius:"50%", background:`linear-gradient(135deg, ${T}30, ${TG}20)`, border:`2px solid ${T}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, margin:"0 auto 24px" }}>💚</div>
        <div style={{ fontSize:24, fontWeight:900, color:TX, marginBottom:8, letterSpacing:"-0.5px" }}>Good afternoon, {USER.name}.</div>
        <div style={{ fontSize:14, color:TM, marginBottom:36, lineHeight:1.6 }}>How are you feeling right now?</div>
        <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:32, flexWrap:"wrap" }}>
          {MOODS.map((m: any) => (
            <button key={m.s} onClick={() => pickMood(m.s)} style={{
              display:"flex", flexDirection:"column", alignItems:"center", gap:8,
              padding:"16px 12px", border:`1.5px solid ${mood===m.s ? m.c : BR}`,
              borderRadius:16, fontFamily:FONT, minWidth:60, transition:"all 0.2s",
              background: mood===m.s ? `${m.c}15` : S1,
              transform: mood===m.s ? "scale(1.12)" : "scale(1)",
              background: mood===m.s ? `${m.c}15` : S1,
            }}>
              <span style={{ fontSize:28, lineHeight:1 }}>{m.e}</span>
              <span style={{ fontSize:10, fontWeight:700, color:m.c }}>{m.l}</span>
            </button>
          ))}
        </div>
        <div style={{ fontSize:11, color:TD, marginBottom:20 }}>🔒 Private & encrypted — never shared</div>
        <button onClick={() => onDone(null, null, false)} style={{ background:"none", border:`1px solid ${BR}`, borderRadius:99, color:TD, fontSize:12, fontFamily:FONT, padding:"10px 24px" }}>Skip for now</button>
      </div>
    </div>
  );

  if (phase === "comfort") return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(13,17,23,0.97)", backdropFilter:"blur(20px)" }} />
      <div style={{ position:"relative", zIndex:1, textAlign:"center", width:"100%", maxWidth:360, animation:"fadeUp 0.4s ease" }}>
        <div style={{ fontSize:44, marginBottom:20 }}>{mood===1 ? "🫂" : "💛"}</div>
        <div style={{ fontSize:20, fontWeight:800, color:TX, marginBottom:12 }}>That's okay. You don't have to be okay.</div>
        <div style={{ fontSize:14, color:TM, marginBottom:28, lineHeight:1.7 }}>You showed up today — that matters. Do you want to share what's going on?</div>
        {!wantTalk ? (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <button onClick={() => setWantTalk(true)} style={{ padding:"14px", borderRadius:14, border:"none", background:`linear-gradient(135deg, #4C1D95, #6D28D9)`, color:"#E9D5FF", fontSize:13, fontWeight:700 }}>💬 Yes, I'd like to write about it</button>
            <button onClick={() => { setPhase("done"); setTimeout(() => onDone(mood, null, false), 1800); }} style={{ padding:"13px", borderRadius:14, background:"none", border:`1px solid ${BR}`, color:TD, fontSize:12, fontFamily:FONT }}>Just log it and continue</button>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:12, textAlign:"left" }}>
            <textarea
              style={{ width:"100%", background:S2, border:`1px solid ${BR}`, borderRadius:14, padding:"14px 16px", color:TX, fontSize:13, resize:"none", lineHeight:1.6, height:120 }}
              placeholder="Take your time. Write whatever you need to..."
              value={freeText}
              onChange={e => setFreeText(e.target.value)}
              autoFocus
            />
            {/* Request outreach toggle */}
            <div onClick={() => setOutreach(!outreach)} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background: outreach ? "rgba(76,29,149,0.15)" : S2, border:`1.5px solid ${outreach ? "#6D28D9" : BR}`, borderRadius:14, cursor:"pointer", transition:"all 0.2s" }}>
              <div style={{ width:44, height:24, borderRadius:99, background: outreach ? "#6D28D9" : BR, padding:2, transition:"background 0.2s", display:"flex", alignItems:"center", flexShrink:0 }}>
                <div style={{ width:20, height:20, borderRadius:"50%", background:"#fff", transform: outreach ? "translateX(20px)" : "translateX(0)", transition:"transform 0.2s", boxShadow:"0 2px 4px rgba(0,0,0,0.3)" }} />
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color: outreach ? "#E9D5FF" : TX }}>🙋 Request student support outreach</div>
                <div style={{ fontSize:10, color: outreach ? "#C4B5FD" : TD, marginTop:2 }}>A wellbeing counsellor may reach out to you privately</div>
              </div>
            </div>
            {/* Consent to share free text */}
            <div onClick={() => setConsentShare(!consentShare)} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background: consentShare ? "rgba(0,201,177,0.08)" : S2, border:`1.5px solid ${consentShare ? `${T}50` : BR}`, borderRadius:14, cursor:"pointer", transition:"all 0.2s" }}>
              <div style={{ width:44, height:24, borderRadius:99, background: consentShare ? T : BR, padding:2, transition:"background 0.2s", display:"flex", alignItems:"center", flexShrink:0 }}>
                <div style={{ width:20, height:20, borderRadius:"50%", background:"#fff", transform: consentShare ? "translateX(20px)" : "translateX(0)", transition:"transform 0.2s", boxShadow:"0 2px 4px rgba(0,0,0,0.3)" }} />
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color: consentShare ? TX : TM }}>🔓 Allow staff to read my entry</div>
                <div style={{ fontSize:10, color: consentShare ? TM : TD, marginTop:2 }}>Without this, only your mood score (not text) is visible</div>
              </div>
            </div>
            <button onClick={() => { setPhase("done"); setTimeout(() => onDone(mood, freeText, outreach, consentShare), 1800); }} style={{ padding:"14px", borderRadius:14, border:"none", background:`linear-gradient(135deg, ${T}, ${TG})`, color:"#0D1117", fontSize:13, fontWeight:700 }}>Done — log my entry</button>
          </div>
        )}
        <div style={{ fontSize:11, color:TD, marginTop:20 }}>🔒 Your entry is encrypted before it leaves your device</div>
      </div>
    </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(13,17,23,0.97)", backdropFilter:"blur(20px)" }} />
      <div style={{ position:"relative", zIndex:1, textAlign:"center" }}>
        <div style={{ fontSize:44, marginBottom:16 }}>🌱</div>
        <div style={{ fontSize:18, fontWeight:800, color:TX, marginBottom:8 }}>Thank you for checking in.</div>
        <div style={{ fontSize:13, color:TM, lineHeight:1.6 }}>Your entry has been logged privately. You've got this.</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ZONE ALERT BANNER
// ═══════════════════════════════════════════════════════════════════════════════
function ZoneAlert({ onDismiss }: ZoneAlertProps) {
  const ctx = useContext(AppContext);
  const [secs, setSecs] = useState(1458);
  useEffect(() => {
    const t = setInterval(() => setSecs((s: any) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return (
    <div style={{
      margin:"12px 14px 0", padding:"14px 16px",
      background:`linear-gradient(135deg, rgba(255,71,87,0.18), rgba(255,71,87,0.06))`,
      border:`1.5px solid ${TR}50`, borderRadius:18,
      display:"flex", alignItems:"center", gap:12,
      animation:"contestPulse 2.5s ease-in-out infinite",
      boxShadow:`0 4px 20px ${TR}15`,
    }}>
      <div style={{ width:50, height:50, borderRadius:16, background:`${TR}20`, border:`1.5px solid ${TR}50`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>⚔️</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:900, color:TR, letterSpacing:"0.8px", marginBottom:2 }}>ZONE UNDER ATTACK</div>
        <div style={{ fontSize:12, color:TM }}>Library Zone · BlazeThorn is capturing</div>
        <div style={{ fontSize:22, fontWeight:900, color:TR, letterSpacing:3, marginTop:2, fontVariantNumeric:"tabular-nums" }}>{mm}:{ss}</div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
        <button onClick={() => { if (ctx?.defendZone) ctx.defendZone(); onDismiss(); }} style={{ padding:"9px 16px", background:`linear-gradient(135deg,${TR},#FF8C00)`, border:"none", borderRadius:12, color:"#fff", fontSize:12, fontWeight:900, boxShadow:`0 4px 16px ${TR}40` }}>Defend!</button>
        <button onClick={onDismiss} style={{ padding:"6px", background:"none", border:`1px solid ${BR}`, borderRadius:8, color:TM, fontSize:11, fontFamily:FONT }}>✕</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HUD HEADER — hero gradient with floating orbs + 7-tap admin access
// ═══════════════════════════════════════════════════════════════════════════════
function HudHeader({ user, onAdminAccess }: HudHeaderProps) {
  const tapRef = useRef<number>(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleLogoTap = () => {
    tapRef.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (tapRef.current >= 7) { tapRef.current = 0; if (onAdminAccess) onAdminAccess(); return; }
    tapTimer.current = setTimeout(() => { tapRef.current = 0; }, 2000);
  };
  return (
    <div style={{ position:"relative", padding:"20px 16px 0", overflow:"visible" }}>
      {/* Floating colour orbs in background */}
      <div style={{ position:"absolute", top:-20, right:-30, width:120, height:120, borderRadius:"50%", background:`radial-gradient(circle, ${T}40, transparent 70%)`, animation:"orbFloat 8s ease-in-out infinite", pointerEvents:"none" }} />
      <div style={{ position:"absolute", top:10, right:60, width:80, height:80, borderRadius:"50%", background:`radial-gradient(circle, ${TA}30, transparent 70%)`, animation:"orbFloat 11s ease-in-out infinite reverse", pointerEvents:"none" }} />

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {/* Avatar with teal glow ring — 7-tap opens admin */}
          <div style={{ position:"relative" }} onClick={handleLogoTap}>
            <div style={{
              width:50, height:50, borderRadius:18,
              background:`linear-gradient(135deg, ${T}, ${TA})`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:22, fontWeight:900, color:"#0D1117",
              boxShadow:`0 0 0 3px ${BG}, 0 0 0 5px ${T}60, 0 8px 24px ${T}40`,
              animation:"tealGlow 3s ease-in-out infinite",
              userSelect:"none",
            }}>
              {user.name.charAt(0)}
            </div>
            {/* Online dot */}
            <div style={{ position:"absolute", bottom:2, right:2, width:10, height:10, borderRadius:"50%", background:TG, border:`2px solid ${BG}`, boxShadow:`0 0 8px ${TG}` }} />
          </div>
          <div>
            <div style={{ fontSize:11, color:TM, fontWeight:700, marginBottom:1 }}>Hey there 👋</div>
            <div style={{ fontSize:19, fontWeight:900, color:TX, display:"flex", alignItems:"center", gap:8, letterSpacing:"-0.4px" }}>
              {user.name}
              <span style={{
                fontSize:10, fontWeight:900, color:"#0D1117",
                background:`linear-gradient(135deg, ${TY}, ${TA})`,
                borderRadius:99, padding:"3px 9px",
                boxShadow:`0 2px 8px ${TY}50`,
              }}>LV {user.level}</span>
            </div>
          </div>
        </div>
        {/* Currency chips */}
        <div style={{ display:"flex", gap:7 }}>
          <Chip color={TY} icon="◎" label={user.ae.toLocaleString()} />
          <Chip color={T} icon="◆" label={user.shards} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// XP BAR — animated with glow
// ═══════════════════════════════════════════════════════════════════════════════
function XpTrack({ user }: XpTrackProps) {
  const pct = (user.xp / user.xpNext) * 100;
  return (
    <div style={{ padding:"14px 16px 0" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7, alignItems:"center" }}>
        <span style={{ fontSize:12, color:TM, fontWeight:700 }}>
          <span style={{ color:TG, fontWeight:900 }}>{user.xp.toLocaleString()}</span>
          <span style={{ color:TD }}> / {user.xpNext.toLocaleString()} XP to next level</span>
        </span>
        <span style={{ fontSize:11, padding:"3px 10px", background:`${TY}18`, border:`1px solid ${TY}50`, borderRadius:99, color:TY, fontWeight:800 }}>🥈 {user.combatRank}</span>
      </div>
      {/* XP track */}
      <div style={{ height:10, background:"rgba(255,255,255,0.06)", borderRadius:99, overflow:"hidden", position:"relative", border:`1px solid ${BR}` }}>
        <div style={{
          height:"100%", width:`${pct}%`, borderRadius:99,
          background:`linear-gradient(90deg, ${T}, ${TG})`,
          boxShadow:`0 0 12px ${T}80, 0 0 4px ${TG}60`,
          position:"relative", overflow:"hidden",
          transition:"width 1s cubic-bezier(0.34,1.56,0.64,1)",
        }}>
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)", animation:"shimmer 2.5s ease-in-out infinite" }} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAT STRIP — colourful scrollable stat cards
// ═══════════════════════════════════════════════════════════════════════════════
function StatStrip({ weekly }: StatStripProps) {
  const ctx = useContext(AppContext);
  const user = ctx?.sharedUser || USER;
  const completedCount = ctx?.completedMissions?.size || 0;
  const userZones = user.clan ? (ZONES.filter((z: any) => z.capturedBy === user.clan?.name).length) : 0;

  const STATS = [
    { icon:"⚡", val:user.xp.toLocaleString(), lbl:"XP", c:TG },
    { icon:"◈",  val:String(userZones), lbl:"Zones", c:TB },
    { icon:"◎",  val:user.ae.toLocaleString(), lbl:"AE", c:TY },
    { icon:"◉",  val:String(STORY.clues), lbl:"Clues", c:TA },
  ];

  const r = 16, circ = 2 * Math.PI * r;
  const weeklyDone = Math.min(weekly.total, weekly.done + completedCount);
  const pct = weeklyDone / weekly.total;
  return (
    <div style={{ display:"flex", gap:8, padding:"14px 16px 0", overflowX:"auto" }}>
      {STATS.map((s: any, i: number) => (
        <div key={s.lbl} className="card-entry" style={{
          flex:"0 0 auto", display:"flex", flexDirection:"column", alignItems:"center", gap:5,
          padding:"14px 16px", background:S1, border:`1.5px solid ${s.c}30`,
          borderRadius:18, minWidth:76,
          boxShadow:`0 4px 20px ${s.c}15`,
          animationDelay:`${i * 0.06}s`,
        }}>
          <span style={{ fontSize:20, animation:"float 3s ease-in-out infinite", animationDelay:`${i * 0.5}s`, lineHeight:1 }}>{s.icon}</span>
          <span style={{ fontSize:17, fontWeight:900, color:s.c }}>{s.val}</span>
          <span style={{ fontSize:10, color:TM, fontWeight:700 }}>{s.lbl}</span>
        </div>
      ))}
      {/* Weekly ring */}
      <div className="card-entry" style={{
        flex:"0 0 auto", display:"flex", flexDirection:"column", alignItems:"center", gap:4,
        padding:"10px 14px", background:S1, border:`1.5px solid ${T}30`,
        borderRadius:18, minWidth:82,
        boxShadow:`0 4px 20px ${T}15`,
        animationDelay:"0.24s",
      }}>
        <svg width={44} height={44}>
          <circle cx={22} cy={22} r={r} fill="none" stroke={BR} strokeWidth={4.5} />
          <circle cx={22} cy={22} r={r} fill="none" stroke={`url(#wg)`} strokeWidth={4.5}
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
            strokeLinecap="round" transform="rotate(-90 22 22)"
            style={{ filter:`drop-shadow(0 0 4px ${T}80)` }} />
          <defs>
            <linearGradient id="wg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={T} />
              <stop offset="100%" stopColor={TG} />
            </linearGradient>
          </defs>
          <text x={22} y={22} textAnchor="middle" dominantBaseline="central" fill={TX} fontSize={9} fontWeight={900} fontFamily="Nunito">
            {weeklyDone}/{weekly.total}
          </text>
        </svg>
        <span style={{ fontSize:10, color:TM, fontWeight:700 }}>Weekly</span>
        <span style={{ fontSize:9, color:TD }}>{weekly.days}d left</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STREAK CARD — fire animation, orange gradient
// ═══════════════════════════════════════════════════════════════════════════════
function StreakCard({ user }: any) {
  return (
    <div className="card-entry" style={{
      margin:"14px 16px 0",
      background:`linear-gradient(135deg, #1A120A, #201508)`,
      border:`1.5px solid ${TA}40`,
      borderRadius:22, padding:16, position:"relative", overflow:"hidden",
      boxShadow:`0 8px 32px ${TA}20`,
    }}>
      {/* Warm glow bg */}
      <div style={{ position:"absolute", top:-40, right:-20, width:150, height:150, borderRadius:"50%", background:`radial-gradient(circle, ${TA}25, transparent 70%)`, pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:-20, left:20, width:100, height:100, borderRadius:"50%", background:`radial-gradient(circle, #FF9F1C22, transparent 70%)`, pointerEvents:"none" }} />

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, position:"relative" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:28, animation:"streakBurn 1.5s ease-in-out infinite" }}>🔥</span>
          <div>
            <div style={{ fontSize:18, fontWeight:900, color:TX }}>Day {user.streak} Streak</div>
            <div style={{ fontSize:11, color:TM }}>3 more days to the Day 7 bonus!</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", background:"rgba(6,255,148,0.12)", border:`1px solid ${TG}40`, borderRadius:99 }}>
          <span style={{ animation:"pulse 2s ease-in-out infinite" }}>🛡️</span>
          <span style={{ fontSize:12, fontWeight:900, color:TG }}>{user.shields} shields</span>
        </div>
      </div>

      <div style={{ display:"flex", gap:5, marginBottom:14, position:"relative" }}>
        {[1,2,3,4,5,6,7].map((d: any) => {
          const done = d < user.streak, curr = d === user.streak;
          return (
            <div key={d} style={{
              flex:1, height:38, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center",
              background: curr
                ? `linear-gradient(135deg, ${TA}, #FF9F1C)`
                : done ? `${TA}25` : `rgba(255,255,255,0.04)`,
              border:`1.5px solid ${curr ? TA : done ? `${TA}50` : BR}`,
              fontSize: curr ? 18 : 12, fontWeight:900,
              color: curr ? "#fff" : done ? TA : TD,
              boxShadow: curr ? `0 4px 16px ${TA}50` : "none",
              transform: curr ? "scale(1.08)" : "scale(1)",
              animation: curr ? "streakBurn 1.5s ease-in-out infinite" : "none",
            }}>
              {curr ? "🔥" : done ? "✓" : d}
            </div>
          );
        })}
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", position:"relative" }}>
        <span style={{ fontSize:12, color:TM }}>🎯 Day 7: <span style={{ color:TY, fontWeight:900 }}>+200 AE bonus</span></span>
        <span style={{ fontSize:11, color:TD }}>Resets at midnight</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SQUAD UP CARD
// ═══════════════════════════════════════════════════════════════════════════════
function SquadUpCard({ user, onNavigateClan }: any) {
  const [jName, setJName] = useState("");
  const canCreate = user.level >= 5;
  const lvlToGo = Math.max(0, 5 - user.level);

  return (
    <div className="card-entry" style={{
      margin:"14px 16px 0",
      background:`linear-gradient(135deg, #0E1A1A, #111D1C)`,
      border:`1.5px solid ${T}35`,
      borderRadius:22, padding:16, overflow:"hidden", position:"relative",
      boxShadow:`0 8px 28px ${T}15`,
    }}>
      <div style={{ position:"absolute", top:-30, right:-20, width:120, height:120, borderRadius:"50%", background:`radial-gradient(circle, ${T}20, transparent 70%)`, pointerEvents:"none" }} />
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, position:"relative" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:22 }}>⚔️</span>
          <div style={{ fontSize:16, fontWeight:900, color:TX }}>Squad Up</div>
        </div>
        <button onClick={onNavigateClan} style={{ background:`${T}18`, border:`1.5px solid ${T}40`, borderRadius:99, color:T, fontSize:12, fontWeight:800, padding:"6px 14px" }}>Browse →</button>
      </div>

      <div style={{ fontSize:11, fontWeight:900, color:TM, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.8px" }}>Join a clan</div>
      <div style={{ display:"flex", gap:8, marginBottom:14, position:"relative" }}>
        <input
          style={{ flex:1, background:"rgba(255,255,255,0.05)", border:`1.5px solid ${BR}`, borderRadius:14, padding:"11px 14px", color:TX, fontSize:13, fontFamily:FONT }}
          placeholder="Search clan name or tag..."
          value={jName}
          onChange={e => setJName(e.target.value)}
        />
        <button style={{ padding:"11px 18px", background:`linear-gradient(135deg, ${T}, ${TG})`, border:"none", borderRadius:14, color:"#0D1117", fontSize:13, fontWeight:900, boxShadow:`0 4px 16px ${T}40`, fontFamily:FONT }}>Search</button>
      </div>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", background:"rgba(255,255,255,0.03)", borderRadius:14, border:`1.5px solid ${BR}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:16 }}>{canCreate ? "⚔️" : "🔒"}</span>
          <div>
            <div style={{ fontSize:13, fontWeight:800, color: canCreate ? TX : TM }}>Create a clan</div>
            <div style={{ fontSize:11, color:TD }}>
              {canCreate ? "You're eligible — go to Clan tab" : `Level 5 required (${lvlToGo} level${lvlToGo !== 1 ? "s" : ""} away)`}
            </div>
          </div>
        </div>
        {canCreate && (
          <button onClick={onNavigateClan} style={{ padding:"8px 14px", background:`linear-gradient(135deg, ${T}, ${TG})`, border:"none", borderRadius:12, color:"#0D1117", fontSize:12, fontWeight:900, fontFamily:FONT }}>Go →</button>
        )}
        {!canCreate && (
          <div style={{ padding:"4px 10px", background:`${TR}15`, border:`1.5px solid ${TR}40`, borderRadius:99, fontSize:11, fontWeight:900, color:TR }}>Lv 5</div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE EVENTS STRIP
// ═══════════════════════════════════════════════════════════════════════════════
function LiveEventsStrip({ events, onViewAll }: any) {
  return (
    <div style={{ margin:"14px 16px 0" }}>
      <SectionHeader title="⚡ Live Events" action="See All →" onAction={onViewAll} />
      {events.map((ev: any, i: number) => (
        <div key={ev.id} className="card-entry" style={{
          display:"flex", alignItems:"center", gap:12, padding:"16px",
          background:`linear-gradient(135deg, ${ev.color}20, ${ev.color}06)`,
          border:`1.5px solid ${ev.color}50`, borderRadius:20, marginBottom:8,
          boxShadow:`0 6px 24px ${ev.color}18`,
          animationDelay:`${i * 0.08}s`,
        }}>
          <div style={{ width:52, height:52, borderRadius:16, background:`${ev.color}25`, border:`2px solid ${ev.color}50`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0, boxShadow:`0 4px 12px ${ev.color}30` }}>⚡</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:900, color:TX, marginBottom:3 }}>{ev.title}</div>
            <div style={{ fontSize:11, color:TM }}>Ends {ev.endDate} · {ev.participants}/{ev.maxParticipants || "∞"} joined</div>
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <div style={{ fontSize:13, fontWeight:900, color:ev.color, marginBottom:6 }}>{ev.reward.split(" + ")[0]}</div>
            <button style={{ padding:"8px 14px", background:`linear-gradient(135deg, ${ev.color}, ${ev.color}CC)`, border:"none", borderRadius:12, color:"#0D1117", fontSize:12, fontWeight:900, fontFamily:FONT, boxShadow:`0 4px 12px ${ev.color}40` }}>Join →</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLE EVENT BANNER
// ═══════════════════════════════════════════════════════════════════════════════
function StyleEventBanner({ event, onOpen }: any) {
  const isVoting = event.phase === "voting";
  return (
    <div onClick={onOpen} style={{
      margin:"14px 16px 0", padding:"16px",
      background:`linear-gradient(135deg, rgba(0,201,177,0.15), rgba(255,107,53,0.08))`,
      border:`1.5px solid ${T}50`, borderRadius:22, cursor:"pointer",
      display:"flex", alignItems:"center", gap:12,
      boxShadow:`0 6px 24px ${T}15`,
      animation:"tealGlow 4s ease-in-out infinite",
    }}>
      <div style={{ width:54, height:54, borderRadius:16, background:`linear-gradient(135deg, ${T}30, ${TA}20)`, border:`2px solid ${T}50`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0, boxShadow:`0 4px 12px ${T}30` }}>👗</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
          <span style={{ fontSize:9, fontWeight:900, color:T, letterSpacing:"0.8px", background:`${T}20`, padding:"2px 8px", borderRadius:99 }}>{isVoting ? "🗳️ VOTING OPEN" : "✏️ SUBMIT"}</span>
        </div>
        <div style={{ fontSize:14, fontWeight:900, color:TX, marginBottom:2 }}>Week #{event.weekId} Style Challenge</div>
        <div style={{ fontSize:11, color:TM, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>"{event.theme.slice(0, 50)}…"</div>
      </div>
      <span style={{ color:T, fontSize:22, flexShrink:0, fontWeight:900 }}>›</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARKET SHORTCUT
// ═══════════════════════════════════════════════════════════════════════════════
function MarketShortcut({ onOpen }: any) {
  const featured = SHOP_ITEMS.filter((i: any) => i.featured).slice(0, 3);
  return (
    <div style={{ margin:"14px 16px 0" }}>
      <SectionHeader title="🏪 Market" action="Browse →" onAction={onOpen} />
      <div style={{ display:"flex", gap:8 }}>
        {featured.map((item: any, i: number) => {
          const rc = RARITY_COLOR[item.rarity];
          return (
            <button key={item.id} onClick={onOpen} className="card-entry" style={{
              flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:7,
              padding:"14px 6px", background:`linear-gradient(160deg, ${rc}12, ${S1})`,
              border:`1.5px solid ${rc}40`, borderRadius:18, fontFamily:FONT,
              boxShadow:`0 4px 16px ${rc}15`,
              animationDelay:`${i * 0.06}s`,
            }}>
              <div style={{ width:44, height:44, borderRadius:14, background:`${rc}20`, border:`1.5px solid ${rc}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, boxShadow:`0 2px 12px ${rc}30` }}>
                {item.icon}
              </div>
              <div style={{ fontSize:11, fontWeight:800, color:TX, textAlign:"center", lineHeight:1.2 }}>{item.name}</div>
              <div style={{ fontSize:11, fontWeight:900, color:rc, background:`${rc}15`, padding:"3px 10px", borderRadius:99 }}>◎ {item.price}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MISSION CARD — colourful gradient accent, illustrated feel
// ═══════════════════════════════════════════════════════════════════════════════
export function MissionCard({ m, idx=0 }: MissionCardProps) {
  const ctx = useContext(AppContext);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(() => ctx?.completedMissions?.has(m.id) || false);
  const [proofSubmitted, setProofSubmitted] = useState(false);
  const [simSteps, setSimSteps] = useState(m.progress || 0);
  const [gpsVerifying, setGpsVerifying] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [fitConnected, setFitConnected] = useState(null);
  const fileInputRef = useRef(null);

  // Check Google Fit connection for health_api quests
  useEffect(() => {
    if (m.type !== "health_api" || !ctx?.authUser) return;
    supabase.from("google_fit_tokens").select("connected").eq("user_id", ctx.authUser.id).maybeSingle().then(({ data }: any) => {
      setFitConnected(!!data?.connected);
    });
  }, [m.type, ctx?.authUser]);

  const handleConnectGoogleFit = () => {
    if (!ctx?.authUser) return;
    window.open(`/api/google-fit/auth?user_id=${ctx.authUser.id}`, "_blank", "width=500,height=600");
    const interval = setInterval(async () => {
      const { data } = await supabase.from("google_fit_tokens").select("connected").eq("user_id", ctx.authUser.id).maybeSingle();
      if (data?.connected) { setFitConnected(true); clearInterval(interval); showToast("✅ Google Fit connected! Tap Sync to pull steps.", "success"); }
    }, 3000);
    setTimeout(() => clearInterval(interval), 120000);
  };

  // Sync completion state from context
  useEffect(() => {
    if (ctx?.completedMissions?.has(m.id)) setCompleted(true);
  }, [ctx?.completedMissions, m.id]);

  // Steps/health_api tracking
  useEffect(() => {
    if (m.type === "health_api" && simSteps >= m.goal && !completed) {
      const ae = m.aether_reward || 0;
      const xp = m.xp_reward || 0;
      if (ctx?.completeMission) ctx.completeMission(m.id, ae, xp);
      setCompleted(true);
      showToast(`✓ ${m.title} completed! +${ae} AE +${xp} XP`, "success");
    }
  }, [simSteps]);

  const handleSyncHealth = async () => {
    if (syncing || completed) return;
    setSyncing(true);
    try {
      if (ctx?.authUser) {
        // Call real Google Fit sync endpoint
        const res = await fetch("/api/google-fit/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: ctx.authUser.id }),
        });
        const result = await res.json();
        if (result.synced && result.steps > 0) {
          setSimSteps(result.steps);
          showToast(`📡 Synced ${result.steps.toLocaleString()} steps from Google Fit`, "success");
        } else if (result.error?.includes("not connected")) {
          showToast("📡 Connect Google Fit in Settings to auto-track steps.", "info");
        } else {
          // Fallback: check quest_progress directly
          const { data } = await supabase.from("quest_progress").select("current_value").eq("user_id", ctx.authUser.id).eq("quest_definition_id", m.id).maybeSingle();
          if (data?.current_value) {
            setSimSteps(data.current_value);
            showToast(`📡 ${data.current_value.toLocaleString()} steps recorded`, "success");
          } else {
            showToast("📡 No steps yet. Connect Google Fit in Settings.", "info");
          }
        }
      }
    } catch { showToast("📡 Health sync unavailable.", "info"); }
    setSyncing(false);
  };

  const handleGPSCheckIn = () => {
    if (completed || submitting || gpsVerifying) return;
    setGpsVerifying(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setGpsVerifying(false);
          setSubmitting(true);
          // Store GPS proof
          if (ctx?.authUser) {
            // Upsert quest progress
            const { data: qp } = await supabase.from("quest_progress").upsert({
              user_id: ctx.authUser.id, quest_definition_id: m.id,
              current_value: 1, target_value: m.goal || 1,
              status: "completed", completed_at: new Date().toISOString(),
              period_start: new Date().toISOString(),
            }, { onConflict: "user_id,quest_definition_id", ignoreDuplicates: false }).select().single();
            if (qp) {
              await supabase.from("quest_proofs").insert({
                user_id: ctx.authUser.id, quest_progress_id: qp.id,
                proof_type: "gps_checkin", latitude: pos.coords.latitude, longitude: pos.coords.longitude,
              });
            }
          }
          const ae = m.aether_reward || 0;
          const xp = m.xp_reward || 0;
          if (ctx?.completeMission) ctx.completeMission(m.id, ae, xp);
          setSubmitting(false);
          setCompleted(true);
          showToast(`✓ ${m.title} — GPS verified! +${ae} AE +${xp} XP`, "success");
        },
        (err) => {
          setGpsVerifying(false);
          showToast(`⚠ GPS failed: ${err.message}. Enable location access.`, "error");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGpsVerifying(false);
      showToast("⚠ GPS not available on this device.", "error");
    }
  };

  const handlePhotoUpload = async (file) => {
    if (!file || !ctx?.authUser) return;
    setSubmitting(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${ctx.authUser.id}/${m.id}_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("quest-proofs").upload(filePath, file);
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("quest-proofs").getPublicUrl(filePath);

      // Create/update quest progress
      const { data: qp } = await supabase.from("quest_progress").upsert({
        user_id: ctx.authUser.id, quest_definition_id: m.id,
        current_value: Math.min((m.progress || 0) + 1, m.goal || 1),
        target_value: m.goal || 1,
        status: ((m.progress || 0) + 1) >= (m.goal || 1) ? "completed" : "active",
        completed_at: ((m.progress || 0) + 1) >= (m.goal || 1) ? new Date().toISOString() : null,
        period_start: new Date().toISOString(),
      }, { onConflict: "user_id,quest_definition_id", ignoreDuplicates: false }).select().single();

      if (qp) {
        await supabase.from("quest_proofs").insert({
          user_id: ctx.authUser.id, quest_progress_id: qp.id,
          proof_type: "photo", proof_url: urlData?.publicUrl,
        });
      }

      setSubmitting(false);
      setProofSubmitted(true);

      // For photo quests, submit proof for admin review (no instant reward)
      if (ctx?.submitProof) {
        ctx.submitProof({
          id: "P" + Date.now(),
          userId: ctx.authUser.id,
          userName: ctx?.sharedUser?.name || "Player",
          missionId: m.id, missionTitle: m.title, cat: m.cat,
          reward: m.aether_reward || 0, xp: m.xp_reward || 0,
          submittedAt: new Date().toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" }),
          imgUrl: urlData?.publicUrl || "/assets/proof_placeholder.jpg",
          note: "Photo proof submitted.", status: "pending",
        });
      }
      showToast(`📷 Proof submitted for "${m.title}" — awaiting review`, "info");
    } catch (err) {
      setSubmitting(false);
      showToast(`❌ Upload failed: ${err.message}`, "error");
    }
  };

  const handleAction = () => {
    if (completed || submitting || proofSubmitted) return;

    if (m.type === "gps" || m.type === "gps_timer") {
      handleGPSCheckIn();
      return;
    }

    if (m.type === "photo") {
      fileInputRef.current?.click();
      return;
    }

    // System/manual quests — complete directly
    if (m.type === "system" || m.type === "manual") {
      setSubmitting(true);
      setTimeout(() => {
        setSubmitting(false);
        setCompleted(true);
        const ae = m.aether_reward || 0;
        const xp = m.xp_reward || 0;
        if (ctx?.completeMission) ctx.completeMission(m.id, ae, xp);
        showToast(`✓ ${m.title} completed! +${ae} AE +${xp} XP`, "success");
      }, 800);
    }
  };

  const actionLabel = gpsVerifying ? "📡 Verifying GPS..." : submitting ? "⏳ Submitting..."
    : (m.type === "gps" || m.type === "gps_timer") ? "📍 Check In (GPS)"
    : m.type === "photo" ? "📷 Upload Photo"
    : m.type === "health_api" ? "📡 Sync Health"
    : "✓ Complete";

  const pct = m.goal > 1 ? Math.min(100, (m.progress / m.goal) * 100) : 0;

  return (
    <div className="card-entry" style={{
      background:S1, border:`1.5px solid ${completed ? TG+"60" : proofSubmitted ? TY+"60" : m.color+"35"}`,
      borderRadius:20, padding:0, overflow:"hidden",
      boxShadow:`0 4px 20px ${m.color}15`,
      animationDelay:`${idx * 0.07}s`,
      opacity: completed ? 0.7 : 1,
      transition:"opacity 0.3s, border-color 0.3s",
    }}>
      {/* Hidden file input for photo uploads */}
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }}
        onChange={(e) => { if (e.target.files?.[0]) handlePhotoUpload(e.target.files[0]); }} />

      <div style={{ height:4, background: completed ? `linear-gradient(90deg, ${TG}, ${TG}60)` : proofSubmitted ? `linear-gradient(90deg, ${TY}, ${TY}60)` : `linear-gradient(90deg, ${m.color}, ${m.color}60)` }} />
      <div style={{ display:"flex", gap:12, padding:"14px 14px 14px" }}>
        <div style={{
          width:52, height:52, borderRadius:16, flexShrink:0,
          background: completed ? `linear-gradient(135deg, ${TG}25, ${TG}10)` : `linear-gradient(135deg, ${m.color}25, ${m.color}10)`,
          border:`2px solid ${completed ? TG+"40" : m.color+"40"}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:24, boxShadow:`0 4px 12px ${m.color}25`,
        }}>
          {completed ? "✓" : proofSubmitted ? "⏳" : m.icon}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8, marginBottom:7 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color: completed ? TG : TX, marginBottom:4, textDecoration: completed ? "line-through" : "none" }}>{m.title}</div>
              <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
                <span style={{
                  fontSize:10, fontWeight:900, color:"#0D1117",
                  background: completed ? TG : m.color, borderRadius:99, padding:"2px 9px",
                  boxShadow:`0 2px 8px ${m.color}50`,
                }}>{m.cat}</span>
                <span style={{ fontSize:11, color:TM, fontWeight:700 }}>⏱ {m.timer}</span>
                {m.type === "health_api" && <span style={{ fontSize:9, color:TG, fontWeight:700, background:`${TG}15`, padding:"2px 6px", borderRadius:4 }}>📡 LIVE</span>}
                {m.type === "gps" && <span style={{ fontSize:9, color:TB, fontWeight:700, background:`${TB}15`, padding:"2px 6px", borderRadius:4 }}>📍 GPS</span>}
                {m.requires_clan && <span style={{ fontSize:9, color:TA, fontWeight:700, background:`${TA}15`, padding:"2px 6px", borderRadius:4 }}>⚔️ CLAN</span>}
              </div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontSize:14, fontWeight:900, color: completed ? TG : TY }}>{completed ? "✓ Done" : m.reward}</div>
              <div style={{ fontSize:11, color:TG, fontWeight:800 }}>{m.xp}</div>
              {m.shard_reward > 0 && <div style={{ fontSize:10, color:TL, fontWeight:700 }}>💎 {m.shard_reward}</div>}
            </div>
          </div>

          {m.description && !completed && (
            <div style={{ fontSize:11, color:TM, marginBottom:8, lineHeight:1.4 }}>{m.description}</div>
          )}

          {m.type === "health_api" ? (
            <div>
              <ProgressBar value={completed ? m.goal : simSteps} max={m.goal} color={completed ? TG : m.color} height={6} />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:4 }}>
                <span style={{ fontSize:10, color:TM, fontWeight:700 }}>{(completed ? m.goal : simSteps).toLocaleString()} / {m.goal.toLocaleString()}</span>
                {!completed && (
                  <button onClick={handleSyncHealth} disabled={syncing} style={{
                    padding:"4px 10px", borderRadius:8, border:`1px solid ${T}40`, background:`${T}10`,
                    color:T, fontSize:9, fontWeight:700, fontFamily:FONT, cursor: syncing ? "wait" : "pointer",
                  }}>
                    {syncing ? "📡 Syncing..." : "📡 Sync Steps"}
                  </button>
                )}
              </div>
              {!completed && fitConnected === false && (
                <button onClick={handleConnectGoogleFit} style={{
                  marginTop:6, padding:"8px 16px", borderRadius:12, border:`1.5px solid ${TG}50`,
                  background:`linear-gradient(135deg, ${TG}20, ${TG}08)`, width:"100%",
                  color:TG, fontSize:11, fontWeight:800, fontFamily:FONT, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                }}>
                  🏃 Connect Google Fit for auto-tracking
                </button>
              )}
            </div>
          ) : m.goal > 1 && !completed ? (
            <div>
              <ProgressBar value={m.progress} max={m.goal} color={m.color} height={5} />
              <div style={{ fontSize:10, color:TM, marginTop:4, fontWeight:700 }}>{m.progress} / {m.goal}</div>
            </div>
          ) : completed ? (
            <div style={{ padding:"8px 16px", borderRadius:12, background:`${TG}15`, border:`1px solid ${TG}40`, fontSize:12, fontWeight:700, color:TG, textAlign:"center" }}>
              ✓ Completed — Rewards credited
            </div>
          ) : proofSubmitted ? (
            <div style={{ padding:"8px 16px", borderRadius:12, background:`${TY}15`, border:`1px solid ${TY}40`, fontSize:12, fontWeight:700, color:TY, textAlign:"center" }}>
              ⏳ Proof submitted — Awaiting review
            </div>
          ) : m.requires_clan && !ctx?.sharedUser?.clan ? (
            <div style={{ padding:"8px 16px", borderRadius:12, background:`${TA}15`, border:`1px solid ${TA}40`, fontSize:12, fontWeight:700, color:TA, textAlign:"center" }}>
              ⚔️ Join a clan to unlock
            </div>
          ) : (
            <button onClick={handleAction} disabled={submitting || gpsVerifying} style={{
              padding:"8px 16px", borderRadius:12, border:"none", fontFamily:FONT, width:"100%",
              background: (submitting || gpsVerifying) ? `${TM}30` : `linear-gradient(135deg, ${m.color}CC, ${m.color}88)`,
              color: (submitting || gpsVerifying) ? TM : "#0D1117", fontSize:12, fontWeight:900,
              boxShadow: (submitting || gpsVerifying) ? "none" : `0 4px 12px ${m.color}40`,
              cursor: (submitting || gpsVerifying) ? "wait" : "pointer",
            }}>
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STORY CARD
// ═══════════════════════════════════════════════════════════════════════════════
function StoryCard({ story }: StoryCardProps) {
  const ctx = useContext(AppContext);
  const [investigating, setInvestigating] = useState(false);

  const handleInvestigate = () => {
    if (investigating || story.clues >= story.total) return;
    setInvestigating(true);
    setTimeout(() => {
      setInvestigating(false);
      const found = Math.random() > 0.3;
      if (found && ctx?.discoverClue) {
        ctx.discoverClue();
        showToast(`🔍 Clue ${story.clues + 1}/${story.total} discovered! +150 AE +80 XP`, "success");
      } else if (!found) {
        showToast("🔍 No clues found this time. Try a different zone...", "info");
      }
    }, 2000);
  };

  return (
    <div className="card-entry" style={{
      margin:"14px 16px 0", padding:16, borderRadius:22,
      background:`linear-gradient(135deg, #0A1A17, #0E201C)`,
      border:`1.5px solid ${T}40`,
      boxShadow:`0 8px 28px ${T}15`,
      position:"relative", overflow:"hidden",
    }}>
      <div style={{ position:"absolute", top:-30, right:-20, width:140, height:140, borderRadius:"50%", background:`radial-gradient(circle, ${T}20, transparent 70%)`, pointerEvents:"none" }} />
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10, position:"relative" }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:TG, animation:"pulse 1.5s ease-in-out infinite", boxShadow:`0 0 8px ${TG}` }} />
        <span style={{ fontSize:10, fontWeight:900, color:T, letterSpacing:"0.8px" }}>CHAPTER {story.ch} — {story.clues >= story.total ? "COMPLETE" : "ACTIVE"}</span>
      </div>
      <div style={{ fontSize:20, fontWeight:900, color:TX, marginBottom:6, letterSpacing:"-0.3px", position:"relative" }}>{story.title}</div>
      <div style={{ fontSize:12, color:TM, marginBottom:14, lineHeight:1.5, position:"relative" }}>{story.sub}</div>

      <div style={{ display:"flex", gap:5, marginBottom:12, position:"relative" }}>
        {Array.from({ length: story.total }).map((_: any, i: number) => (
          <div key={i} style={{
            flex:1, height:5, borderRadius:99,
            background: i < story.clues ? `linear-gradient(90deg, ${T}, ${TG})` : "rgba(255,255,255,0.08)",
            boxShadow: i < story.clues ? `0 0 8px ${T}70` : "none",
          }} />
        ))}
      </div>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative" }}>
        <span style={{ fontSize:11, color:TM }}>{story.clues}/{story.total} clues found</span>
        <button onClick={handleInvestigate} disabled={investigating || story.clues >= story.total} style={{
          padding:"9px 18px", border:"none", borderRadius:12, fontSize:12, fontWeight:900, fontFamily:FONT,
          background: investigating ? `${TM}30` : story.clues >= story.total ? `${TG}30` : `linear-gradient(135deg, ${T}, ${TG})`,
          color: investigating ? TM : story.clues >= story.total ? TG : "#0D1117",
          boxShadow: investigating || story.clues >= story.total ? "none" : `0 4px 16px ${T}40`,
          cursor: investigating || story.clues >= story.total ? "default" : "pointer",
        }}>
          {investigating ? "🔍 Searching..." : story.clues >= story.total ? "✓ All Found" : "Investigate →"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEN PREVIEW
// ═══════════════════════════════════════════════════════════════════════════════
function DenPreview() {
  const [bg, setBg] = useState("neon");
  return (
    <div className="card-entry" style={{ margin:"14px 16px 0", borderRadius:22, overflow:"hidden", border:`1.5px solid ${T}30`, boxShadow:`0 8px 28px rgba(0,0,0,0.3)` }}>
      <div style={{ height:120, background:`linear-gradient(135deg, #061210, #0D1F1C)`, backgroundImage:`url(${bg === "neon" ? IMG.denNeon : IMG.denRooftop})`, backgroundSize:"cover", backgroundPosition:"center", position:"relative" }}>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(13,17,23,0.92), rgba(13,17,23,0.2))" }} />
        <div style={{ position:"absolute", top:12, left:14 }}>
          <div style={{ fontSize:9, fontWeight:900, color:TG, letterSpacing:"0.8px", marginBottom:2 }}>YOUR DEN</div>
          <div style={{ fontSize:18, fontWeight:900, color:TX }}>Dorm Room</div>
        </div>
      </div>
      <div style={{ padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", background:S1 }}>
        <div style={{ display:"flex", gap:6 }}>
          {["neon","rooftop"].map((b: any) => (
            <button key={b} onClick={() => setBg(b)} style={{
              padding:"6px 12px", borderRadius:10, border:`1.5px solid ${bg===b ? T : BR}`,
              background: bg===b ? `${T}18` : "none", color: bg===b ? T : TM, fontSize:11, fontWeight:800, fontFamily:FONT,
              boxShadow: bg===b ? `0 2px 8px ${T}30` : "none",
            }}>
              {b === "neon" ? "🌙 Neon" : "🏙️ Rooftop"}
            </button>
          ))}
        </div>
        <button style={{ padding:"9px 16px", background:`linear-gradient(135deg, ${T}, ${TG})`, border:"none", borderRadius:12, color:"#0D1117", fontSize:12, fontWeight:900, fontFamily:FONT, boxShadow:`0 4px 12px ${T}40` }}>Enter →</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOTTOM NAV (uses TABS from constants.ts)
// ═══════════════════════════════════════════════════════════════════════════════

function BottomNav({ active, onSelect }: any) {
  return (
    <div style={{
      position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
      width:"100%", maxWidth:430, zIndex:50,
    }}>
      <div style={{
        margin:"0 10px 14px",
        background:"rgba(22,27,34,0.97)",
        backdropFilter:"blur(24px)",
        border:`1.5px solid ${BR}`,
        borderRadius:28,
        display:"flex", alignItems:"center",
        padding:"10px 6px",
        boxShadow:`0 -2px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)`,
      }}>
        {TABS.map((t: any) => {
          const on = active === t.id;
          if (t.center) return (
            <button key={t.id} onClick={() => onSelect(t.id)} style={{
              flex:1, display:"flex", justifyContent:"center", alignItems:"center",
              background:"none", border:"none",
            }}>
              <div style={{
                width:58, height:58, borderRadius:20,
                background: on
                  ? `linear-gradient(135deg, ${T}, ${TG})`
                  : `linear-gradient(135deg, ${T}90, ${TG}80)`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:26,
                boxShadow: on
                  ? `0 0 0 3px ${BG}, 0 0 0 5px ${T}50, 0 8px 24px ${T}50`
                  : `0 4px 16px ${T}30`,
                transform: on ? "scale(1.1) translateY(-4px)" : "scale(1) translateY(-2px)",
                transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
              }}>
                {t.icon}
              </div>
            </button>
          );
          return (
            <button key={t.id} onClick={() => onSelect(t.id)} style={{
              flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3,
              background:"none", border:"none", padding:"4px 0", fontFamily:FONT,
            }}>
              <span style={{
                fontSize:22, lineHeight:1,
                filter: on ? `drop-shadow(0 0 6px ${T})` : "none",
                transform: on ? "scale(1.15)" : "scale(1)",
                transition:"all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                display:"block",
              }}>{t.icon}</span>
              <span style={{ fontSize:10, fontWeight: on ? 900 : 600, color: on ? T : TD, transition:"color 0.2s" }}>{t.label}</span>
              {on && <div style={{ width:20, height:3, borderRadius:99, background:`linear-gradient(90deg, ${T}, ${TG})`, marginTop:1, boxShadow:`0 0 6px ${T}` }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLE EVENT GALLERY
// ═══════════════════════════════════════════════════════════════════════════════
function StyleEventGallery({ event, onBack }: StyleEventGalleryProps) {
  const ctx = useContext(AppContext);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [voteConfirm, setVoteConfirm] = useState(false);
  const [gallery, setGallery] = useState(event.gallery);
  const [seView, setSeView] = useState("gallery");
  const [submitTitle, setSubmitTitle] = useState("");
  const [submitNote, setSubmitNote] = useState("");
  const [submitDone, setSubmitDone] = useState(false);
  const [submitImage, setSubmitImage] = useState<any>(null);
  const [submitImagePreview, setSubmitImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast("❌ Image must be under 5MB", "error"); return; }
    setSubmitImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setSubmitImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };
  const [mySubmission, setMySubmission] = useState(event.gallery.find((g: any) => g.isMine) || null);

  useEffect(() => {
    setGallery(ctx?.sharedStyleEvent?.gallery || event.gallery);
  }, [ctx?.sharedStyleEvent?.gallery]);

  const handleVote = (id) => {
    if (myVote) return;
    setMyVote(id);
    setGallery(g => g.map((s: any) => s.id === id ? { ...s, votes: s.votes + 1 } : s));
    setVoteConfirm(true);
    setTimeout(() => setVoteConfirm(false), 2000);
  };

  const handleSubmit = async () => {
    if (!submitTitle.trim() || !submitImagePreview) return;
    const newSub = { id:"MY"+Date.now(), userName:"You", title:submitTitle.trim(), votes:0, isMine:true, imageUrl: submitImagePreview };
    setMySubmission(newSub);
    setSubmitDone(true);

    // Persist to database
    let imageUrl = submitImagePreview; // base64 fallback
    if (ctx?.authUser && ctx?.sharedStyleEvent) {
      try {
        // Upload image to storage if available
        if (submitImage) {
          const ext = submitImage.name.split('.').pop();
          const filePath = `style-submissions/${ctx.authUser.id}/${Date.now()}.${ext}`;
          const { data: uploaded, error: uploadErr } = await supabase.storage.from("designs").upload(filePath, submitImage, { contentType: submitImage.type, upsert: true });
          if (uploaded) {
            const { data: urlData } = supabase.storage.from("designs").getPublicUrl(filePath);
            imageUrl = urlData?.publicUrl || submitImagePreview;
          } else {
            console.warn("Image upload failed, using base64:", uploadErr?.message);
          }
        }

        const { data: dbStyleEvent } = await supabase.from("style_events").select("id").order("created_at", { ascending: false }).limit(1).single();
        if (dbStyleEvent) {
          const { data: inserted, error } = await supabase.from("style_submissions").insert({
            user_id: ctx.authUser.id,
            style_event_id: dbStyleEvent.id,
            title: submitTitle.trim(),
            design_data: { note: submitNote.trim(), imageUrl },
            status: "pending",
          }).select().single();
          if (inserted) {
            // Add to style subs for admin review
            if (ctx?.setSharedStyleSubs) {
              ctx.setSharedStyleSubs((ss: any) => [...ss, {
                id: inserted.id, userId: ctx.authUser.id, userName: ctx.sharedUser?.name || "You",
                title: submitTitle.trim(), votes: 0, status: "pending",
                submittedAt: new Date().toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
                flagged: false,
              }]);
            }
            showToast("👗 Design submitted for admin review!", "success");
          } else if (error) {
            showToast(`❌ Submission failed: ${error.message}`, "error");
          }
        }
      } catch (err) {
        console.warn("Style submission DB error:", err);
      }
    }

    setTimeout(() => { setSeView("gallery"); setSubmitDone(false); }, 2200);
  };

  const sorted = [...gallery].sort((a,b) => a.isMine ? -1 : b.isMine ? 1 : 0);
  const isVoting = event.phase === "voting";
  const isSubmission = event.phase === "submission";

  return (
    <div style={{ position:"relative", zIndex:1, height:"100dvh", overflowY:"auto", paddingBottom:90 }}>
      {/* Header */}
      <div style={{ padding:"16px 16px 0", display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
        <button onClick={onBack} style={{ width:36, height:36, borderRadius:12, background:S1, border:`1px solid ${BR}`, color:TM, fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:FONT }}>←</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:18, fontWeight:800, color:TX }}>Week #{event.weekId} Gallery</div>
          <div style={{ fontSize:11, color:TM }}>{isVoting ? "🗳️ Voting open" : "✏️ Submissions open"}</div>
        </div>
      </div>

      {/* Theme card */}
      <div style={{ margin:"0 16px 12px", padding:"14px 16px", background:`linear-gradient(135deg, ${TL}15, ${T}08)`, border:`1px solid ${TL}40`, borderRadius:16 }}>
        <div style={{ fontSize:10, fontWeight:800, color:TL, letterSpacing:"0.5px", marginBottom:6 }}>THIS WEEK'S THEME</div>
        <div style={{ fontSize:14, fontWeight:700, color:TX, lineHeight:1.5 }}>"{event.theme}"</div>
        {isVoting && (
          <div style={{ fontSize:11, color:TM, marginTop:8 }}>
            {myVote ? <span style={{ color:TG, fontWeight:700 }}>✓ Vote cast! Results {event.votingEnds}</span> : <span>One vote per player · closes {event.votingEnds}</span>}
          </div>
        )}
      </div>

      {voteConfirm && (
        <div style={{ margin:"0 16px 12px", padding:"12px 16px", background:`${TG}15`, border:`1px solid ${TG}40`, borderRadius:12, fontSize:13, fontWeight:700, color:TG, textAlign:"center" }}>
          ✓ Vote cast! Results revealed on {event.votingEnds}.
        </div>
      )}

      {(isSubmission || (isVoting && !mySubmission)) && (
        <div style={{ padding:"0 16px 12px" }}>
          <button onClick={() => setSeView("submit")} style={{ width:"100%", padding:"13px", background:`${TL}10`, border:`1px solid ${TL}50`, borderRadius:14, color:TL, fontSize:13, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            <span style={{ fontSize:16 }}>👗</span>
            {mySubmission ? "Edit My Submission →" : "Submit Your Design →"}
          </button>
        </div>
      )}

      {seView === "submit" ? (
        <div style={{ padding:"0 16px" }}>
          <button onClick={() => setSeView("gallery")} style={{ background:"none", border:"none", color:TM, fontSize:13, fontFamily:FONT, marginBottom:16 }}>← Back to Gallery</button>
          {submitDone ? (
            <div style={{ padding:"32px 20px", textAlign:"center", background:`${TG}10`, border:`1px solid ${TG}40`, borderRadius:16 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>✓</div>
              <div style={{ fontSize:16, fontWeight:700, color:TG }}>Design submitted!</div>
              <div style={{ fontSize:12, color:TM, marginTop:8 }}>Pending review — you'll be notified when it's live.</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <input type="file" ref={fileInputRef} accept="image/*" style={{ display:"none" }} onChange={handleImageSelect} />
              <div onClick={() => fileInputRef.current?.click()} style={{ height:180, background: submitImagePreview ? "none" : `${TL}05`, border:`2px dashed ${TL}30`, borderRadius:14, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, cursor:"pointer", overflow:"hidden", position:"relative" }}>
                {submitImagePreview ? (
                  <>
                    <img src={submitImagePreview} alt="Preview" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:12 }} />
                    <div style={{ position:"absolute", bottom:8, right:8, background:"rgba(0,0,0,0.7)", borderRadius:8, padding:"4px 10px", fontSize:11, color:"#fff", fontWeight:600 }}>Tap to change</div>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize:40 }}>📷</span>
                    <div style={{ fontSize:12, color:TM }}>Tap to upload your design artwork</div>
                    <div style={{ padding:"6px 14px", background:`${TL}15`, border:`1px solid ${TL}40`, borderRadius:8, color:TL, fontSize:12, fontWeight:700 }}>Choose Image →</div>
                  </>
                )}
              </div>
              <input style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:`1px solid ${BR}`, borderRadius:12, padding:"12px 14px", color:TX, fontSize:13 }} placeholder='Design name (e.g. "Midnight Architect")' value={submitTitle} onChange={e => setSubmitTitle(e.target.value)} maxLength={40} />
              <textarea style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:`1px solid ${BR}`, borderRadius:12, padding:"12px 14px", color:TX, fontSize:12, resize:"none", height:80, lineHeight:1.6 }} placeholder="Creator note (optional)..." value={submitNote} onChange={e => setSubmitNote(e.target.value)} maxLength={200} />
              <button disabled={!submitTitle.trim() || !submitImagePreview} onClick={handleSubmit} style={{ padding:"14px", background: (submitTitle.trim() && submitImagePreview) ? `linear-gradient(135deg, ${T}, ${TG})` : "rgba(255,255,255,0.05)", border:"none", borderRadius:12, color: (submitTitle.trim() && submitImagePreview) ? "#fff" : TM, fontSize:14, fontWeight:700 }}>Submit Design →</button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, padding:"0 16px" }}>
          {sorted.map((s: any) => {
            const hasVoted = !!myVote;
            const isMyVote = myVote === s.id;
            return (
              <div key={s.id} style={{
                background: s.isMine ? `${TL}10` : S1,
                border:`1px solid ${s.isMine ? `${TL}50` : isMyVote ? `${TG}50` : BR}`,
                borderRadius:16, overflow:"hidden",
              }}>
                <div style={{ height:120, background:`linear-gradient(135deg, ${TL}20, ${T}10)`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6 }}>
                  <span style={{ fontSize:44 }}>👗</span>
                  {s.isMine && <span style={{ fontSize:9, color:TL, fontWeight:700 }}>Your entry</span>}
                </div>
                <div style={{ padding:"10px 12px" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:TX, marginBottom:3 }}>"{s.title}"</div>
                  <div style={{ fontSize:11, color:TM, marginBottom:8 }}>{s.isMine ? "You" : s.userName}</div>
                  {isVoting && !s.isMine && (
                    <button disabled={hasVoted} onClick={() => handleVote(s.id)} style={{
                      width:"100%", padding:"8px", borderRadius:8, border:"none", fontSize:12, fontWeight:700,
                      background: isMyVote ? `${TG}20` : hasVoted ? "rgba(255,255,255,0.04)" : `linear-gradient(135deg, ${T}, ${TG})`,
                      color: isMyVote ? TG : hasVoted ? TD : "#fff",
                    }}>
                      {isMyVote ? "✓ Voted" : "Vote"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ height:40 }} />
    </div>
  );
}

export function HomeScreen() {
  const ctx = useContext(AppContext);
  const [tab, setTab] = useState("home");
  const [wellbeing, setWellbeing] = useState(true);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [styleTab, setStyleTab] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const user     = ctx?.sharedUser      || USER;
  const missions   = ctx?.sharedMissions   || MISSIONS;
  const liveEvents = ctx?.sharedEvents     || LIVE_EVENTS;
  const styleEvent = ctx?.sharedStyleEvent || STYLE_EVENT_LIVE;
  const notifs     = ctx?.playerNotifs     || [];

  useEffect(() => {
    document.body.style.overflow = wellbeing ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [wellbeing]);

  // ── 7-tap admin overlay (after all hooks) ──
  if (showAdmin) return <AdminRoot onExitAdmin={() => setShowAdmin(false)} />;

  const shell = (children) => (
    <>
      <GlobalStyles />
      {/* Background layers */}
      <div style={{ position:"fixed", inset:0, zIndex:0, background:`radial-gradient(ellipse 80% 50% at 20% 0%, ${T}18, transparent 55%), radial-gradient(ellipse 60% 40% at 85% 85%, ${TA}12, transparent 55%), radial-gradient(ellipse 50% 40% at 60% 50%, ${TG}08, transparent 60%), ${BG}` }} />
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", backgroundImage:`linear-gradient(${T}06 1px, transparent 1px), linear-gradient(90deg, ${T}06 1px, transparent 1px)`, backgroundSize:"56px 56px", opacity:0.7 }} />

      <div style={{ position:"relative", width:"100%", maxWidth:430, margin:"0 auto", minHeight:"100dvh", color:TX, fontFamily:FONT, overflowX:"hidden" }}>
        {wellbeing && <WellbeingOverlay onDone={async (moodScore, freeText, outreachRequested) => {
          setWellbeing(false);
          if (moodScore != null && ctx?.authUser?.id) {
            try {
              await saveMoodEntry({ data: { userId: ctx.authUser.id, moodScore, freeText, outreachRequested } });
            } catch (e) { console.error("Mood save error:", e); }
          }
        }} />}

        {/* Notification banner */}
        {notifs.length > 0 && !wellbeing && (
          <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:999, background: notifs[0].type==="rejected" ? `rgba(239,68,68,0.95)` : `rgba(16,185,129,0.95)`, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", backdropFilter:"blur(8px)", gap:12 }}>
            <span style={{ fontSize:12, fontWeight:700, color:"#fff", flex:1 }}>{notifs[0].msg}</span>
            <button onClick={() => ctx?.setPlayerNotifs((ns: any) => ns.slice(1))} style={{ background:"none", border:"none", color:"#fff", fontSize:14, cursor:"pointer", padding:0 }}>✕</button>
          </div>
        )}

        {styleTab && styleEvent
          ? <StyleEventGallery event={styleEvent} onBack={() => setStyleTab(false)} />
          : children
        }
        <BottomNav active={tab} onSelect={(t) => { setTab(t); setStyleTab(false); }} />
      </div>
    </>
  );

  if (tab === "home") return shell(
    <div style={{ position:"relative", zIndex:1, height:"100dvh", overflowY:"auto", paddingBottom:90 }}>
      <HudHeader user={user} onAdminAccess={() => setShowAdmin(true)} />
      <XpTrack user={user} />

      {/* ═══ HERO BANNER — Illustrated campus zone map ═══ */}
      <div style={{ margin:"14px 16px 0", borderRadius:26, overflow:"hidden", position:"relative", height:200 }}>
        {/* Sky gradient background */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(160deg, #0a1628 0%, #0d2240 40%, #102a1a 100%)" }} />

        {/* Stars */}
        {[...Array(28)].map((_: any, i: number) => (
          <div key={i} style={{
            position:"absolute",
            left:`${(i*37+11)%95}%`, top:`${(i*19+7)%55}%`,
            width: i%5===0?3:i%3===0?2:1.5, height: i%5===0?3:i%3===0?2:1.5,
            borderRadius:"50%", background:"#fff",
            opacity: 0.3 + (i%4)*0.15,
            animation:`pulse ${1.5 + (i%3)*0.7}s ease-in-out infinite`,
            animationDelay:`${(i%5)*0.3}s`,
          }} />
        ))}

        {/* Moon */}
        <div style={{ position:"absolute", top:14, right:28, width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg, #FFE566, #FFB830)", boxShadow:"0 0 20px rgba(255,220,80,0.5), 0 0 60px rgba(255,180,50,0.2)" }}>
          <div style={{ position:"absolute", top:6, right:4, width:14, height:14, borderRadius:"50%", background:"#D4910A", opacity:0.25 }} />
        </div>

        {/* Illustrated city skyline — SVG buildings */}
        <svg viewBox="0 0 400 120" style={{ position:"absolute", bottom:0, left:0, right:0, width:"100%", height:120 }} preserveAspectRatio="none">
          {/* Back buildings - dark */}
          <rect x="0" y="50" width="30" height="70" fill="#0d1f2d" />
          <rect x="5" y="35" width="20" height="85" fill="#0d1f2d" />
          <rect x="32" y="60" width="25" height="60" fill="#0d1f2d" />
          <rect x="60" y="45" width="18" height="75" fill="#0d1f2d" />
          <rect x="80" y="55" width="30" height="65" fill="#0d1f2d" />
          <rect x="330" y="40" width="22" height="80" fill="#0d1f2d" />
          <rect x="355" y="55" width="18" height="65" fill="#0d1f2d" />
          <rect x="375" y="45" width="25" height="75" fill="#0d1f2d" />

          {/* Mid buildings — slightly lighter */}
          <rect x="112" y="48" width="35" height="72" rx="2" fill="#112536" />
          <rect x="150" y="38" width="28" height="82" rx="2" fill="#122840" />
          <rect x="181" y="55" width="22" height="65" rx="1" fill="#0e2030" />
          <rect x="205" y="42" width="40" height="78" rx="2" fill="#112536" />
          <rect x="248" y="50" width="30" height="70" rx="2" fill="#122840" />
          <rect x="281" y="35" width="25" height="85" rx="2" fill="#112536" />
          <rect x="308" y="52" width="20" height="68" rx="1" fill="#0e2030" />

          {/* Building windows - teal glow */}
          {[[118,55],[118,68],[118,81],[127,55],[127,68],[127,81],[136,55],[136,68],
            [156,46],[156,59],[156,72],[163,46],[163,59],[163,72],
            [212,50],[212,63],[212,76],[221,50],[221,63],[230,50],[230,63],
            [255,58],[255,71],[264,58],[264,71],
            [287,43],[287,56],[287,69],[296,43],[296,56]].map(([x,y],i) => (
            <rect key={i} x={x} y={y} width="5" height="7" rx="1"
              fill={i%7===0?"#FF6B35":i%5===0?"#FFD166":i%3===0?"#00E8CC":"#00C9B1"}
              opacity={0.5+Math.random()*0.5} />
          ))}

          {/* Ground / road */}
          <rect x="0" y="112" width="400" height="8" fill="#0a1520" />
          <rect x="0" y="114" width="400" height="2" fill="#00C9B1" opacity="0.3" />

          {/* Highlighted center building — the library (capturable zone!) */}
          <rect x="168" y="30" width="50" height="90" rx="3" fill="#0e3028" />
          <rect x="170" y="28" width="46" height="5" rx="2" fill="#00C9B1" opacity="0.7" />
          {/* Library windows */}
          {[[173,38],[185,38],[197,38],[173,51],[185,51],[197,51],[173,64],[185,64],[197,64],[173,77],[185,77],[197,77]].map(([x,y],i) => (
            <rect key={i} x={x} y={y} width="8" height="10" rx="1" fill={i%3===0?"#06FF94":"#00C9B1"} opacity="0.8" />
          ))}
          {/* Capture ring on library */}
          <circle cx="193" cy="24" r="8" fill="none" stroke="#06FF94" strokeWidth="2" strokeDasharray="3 2" opacity="0.9">
            <animateTransform attributeName="transform" type="rotate" from="0 193 24" to="360 193 24" dur="8s" repeatCount="indefinite" />
          </circle>
          <circle cx="193" cy="24" r="4" fill="#06FF94" opacity="0.9">
            <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </svg>

        {/* Zone capture overlay text */}
        <div style={{ position:"absolute", top:14, left:16, display:"flex", flexDirection:"column", gap:4 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <div style={{ width:9, height:9, borderRadius:"50%", background:TG, boxShadow:`0 0 10px ${TG}`, animation:"pulse 1.2s ease-in-out infinite" }} />
            <span style={{ fontSize:11, fontWeight:900, color:TG, letterSpacing:"1px" }}>2 ZONES ACTIVE</span>
          </div>
          <div style={{ fontSize:19, fontWeight:900, color:"#fff", lineHeight:1.2, textShadow:"0 2px 12px rgba(0,0,0,0.8)" }}>
            Library Zone<br/>
            <span style={{ color:TG }}>is capturable!</span>
          </div>
        </div>

        {/* CTA button */}
        <button onClick={() => setTab("clan")} style={{
          position:"absolute", bottom:18, left:16,
          padding:"10px 20px", borderRadius:16, border:"none", fontFamily:FONT,
          background:`linear-gradient(135deg, ${TA}, #FF9F1C)`,
          color:"#0D1117", fontSize:13, fontWeight:900,
          boxShadow:`0 4px 20px ${TA}60`,
          display:"flex", alignItems:"center", gap:7,
        }}>
          <span>📍</span> Capture Now
        </button>

        {/* Participants badge */}
        <div style={{ position:"absolute", bottom:18, right:16, display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ display:"flex" }}>
            {["🟡","🔵","🟢"].map((e: any, i: number) => (
              <div key={i} style={{ width:22, height:22, borderRadius:"50%", background:S2, border:`2px solid ${BG}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, marginLeft:i>0?-8:0 }}>{e}</div>
            ))}
          </div>
          <span style={{ fontSize:11, color:TM, fontWeight:700 }}>84 competing</span>
        </div>
      </div>

      {/* ═══ STREAK + STATS ROW ═══ */}
      <div style={{ display:"flex", gap:10, margin:"12px 16px 0" }}>
        {/* Streak pill */}
        <div style={{
          flex:1, padding:"14px 16px", borderRadius:22, position:"relative", overflow:"hidden",
          background:"linear-gradient(135deg, #1A0E00, #221400)",
          border:`1.5px solid ${TA}45`,
          boxShadow:`0 6px 24px ${TA}18`,
        }}>
          <div style={{ position:"absolute", top:-20, right:-10, width:80, height:80, borderRadius:"50%", background:`radial-gradient(circle, ${TA}35, transparent 70%)`, pointerEvents:"none" }} />
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <span style={{ fontSize:26, animation:"streakBurn 1.5s ease-in-out infinite" }}>🔥</span>
            <div>
              <div style={{ fontSize:22, fontWeight:900, color:"#fff", lineHeight:1 }}>{user.streak}</div>
              <div style={{ fontSize:10, color:TM, fontWeight:700 }}>day streak</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:3 }}>
            {[1,2,3,4,5,6,7].map((d: any) => (
              <div key={d} style={{
                flex:1, height:5, borderRadius:99,
                background: d <= user.streak ? `linear-gradient(90deg,${TA},#FFB830)` : "rgba(255,255,255,0.08)",
                boxShadow: d <= user.streak ? `0 0 6px ${TA}70` : "none",
              }} />
            ))}
          </div>
        </div>

        {/* XP ring */}
        <div style={{
          width:90, padding:"10px", borderRadius:22,
          background:"linear-gradient(135deg, #0A1A0E, #0E221A)",
          border:`1.5px solid ${TG}40`,
          boxShadow:`0 6px 24px ${TG}15`,
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4,
        }}>
          {(() => {
            const r=28, circ=2*Math.PI*r, pct=user.xp/user.xpNext;
            return (
              <svg width={70} height={70}>
                <defs>
                  <linearGradient id="xpg" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={T} />
                    <stop offset="100%" stopColor={TG} />
                  </linearGradient>
                </defs>
                <circle cx={35} cy={35} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
                <circle cx={35} cy={35} r={r} fill="none" stroke="url(#xpg)" strokeWidth={6}
                  strokeDasharray={circ} strokeDashoffset={circ*(1-pct)}
                  strokeLinecap="round" transform="rotate(-90 35 35)"
                  style={{ filter:`drop-shadow(0 0 6px ${T}90)` }} />
                <text x={35} y={30} textAnchor="middle" dominantBaseline="middle" fill={TX} fontSize={11} fontWeight={900} fontFamily="Nunito">LV</text>
                <text x={35} y={43} textAnchor="middle" dominantBaseline="middle" fill={TG} fontSize={14} fontWeight={900} fontFamily="Nunito">{user.level}</text>
              </svg>
            );
          })()}
        </div>

        {/* AE coins */}
        <div style={{
          width:90, padding:"14px 12px", borderRadius:22,
          background:"linear-gradient(135deg, #1A1500, #221A00)",
          border:`1.5px solid ${TY}40`,
          boxShadow:`0 6px 24px ${TY}15`,
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4,
        }}>
          <span style={{ fontSize:26, animation:"float 2.5s ease-in-out infinite" }}>◎</span>
          <div style={{ fontSize:17, fontWeight:900, color:TY }}>{(user.ae/1000).toFixed(1)}k</div>
          <div style={{ fontSize:9, color:TM, fontWeight:700 }}>Campus AE</div>
        </div>
      </div>

      {/* ═══ TODAY'S MISSIONS — illustrated cards ═══ */}
      <div style={{ padding:"14px 16px 0" }}>
        <SectionHeader title="Today's Missions" action="See All →" onAction={() => setTab("missions")} />
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {missions.filter((m: any) => m.tier === "daily" && !m._disabled).slice(0, 5).map((m: any, i: number) => <MissionCard key={m.id} m={m} idx={i} />)}
        </div>
      </div>

      {/* ═══ LIVE EVENT — full illustrated card ═══ */}
      {liveEvents.length > 0 && (
        <div style={{ margin:"14px 16px 0" }}>
          <SectionHeader title="⚡ Live Events" action="See All →" onAction={() => setTab("missions")} />
          {liveEvents.map((ev: any) => (
            <div key={ev.id} style={{
              borderRadius:24, overflow:"hidden", position:"relative", height:140,
              boxShadow:`0 8px 32px ${ev.color}25`,
              border:`1.5px solid ${ev.color}50`,
            }}>
              {/* Illustrated background */}
              <div style={{ position:"absolute", inset:0, background:`linear-gradient(135deg, #0D1A26, #0A1520)` }} />
              {/* Geometric shapes as art */}
              <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} viewBox="0 0 400 140" preserveAspectRatio="none">
                <polygon points="350,0 400,0 400,140 200,140" fill={`${ev.color}12`} />
                <polygon points="310,0 400,0 400,80" fill={`${ev.color}08`} />
                {/* Swords / Territory icons */}
                <text x="320" y="90" fontSize="72" fill={ev.color} opacity="0.12" fontFamily="system-ui">⚔️</text>
                {/* Animated circle */}
                <circle cx="350" cy="70" r="50" fill="none" stroke={ev.color} strokeWidth="1" opacity="0.2" strokeDasharray="8 4">
                  <animateTransform attributeName="transform" type="rotate" from="0 350 70" to="-360 350 70" dur="15s" repeatCount="indefinite" />
                </circle>
                <circle cx="350" cy="70" r="35" fill="none" stroke={ev.color} strokeWidth="1" opacity="0.15" strokeDasharray="5 3">
                  <animateTransform attributeName="transform" type="rotate" from="0 350 70" to="360 350 70" dur="10s" repeatCount="indefinite" />
                </circle>
              </svg>

              <div style={{ position:"absolute", inset:0, padding:"18px 20px", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:ev.color, animation:"pulse 1s ease-in-out infinite", boxShadow:`0 0 10px ${ev.color}` }} />
                    <span style={{ fontSize:10, fontWeight:900, color:ev.color, letterSpacing:"1px" }}>LIVE · {ev.participants} JOINED</span>
                  </div>
                  <div style={{ fontSize:17, fontWeight:900, color:"#fff", lineHeight:1.3 }}>{ev.title}</div>
                  <div style={{ fontSize:11, color:TM, marginTop:3 }}>Ends {ev.endDate} · {ev.eligibility}</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:14, fontWeight:900, color:TY }}>🏆 {ev.reward.split(" + ")[0]}</span>
                    {ev.reward.split(" + ")[1] && <span style={{ fontSize:11, color:TM }}>+ {ev.reward.split(" + ")[1]}</span>}
                  </div>
                  <button onClick={() => { if (ctx?.joinEvent) ctx.joinEvent(ev.id); showToast(`⚡ Joined "${ev.title}"!`, "success"); }} disabled={ctx?.joinedEvents?.has(ev.id)} style={{ padding:"9px 20px", background: ctx?.joinedEvents?.has(ev.id) ? `${TG}30` : `linear-gradient(135deg, ${ev.color}, ${ev.color}CC)`, border:"none", borderRadius:14, color: ctx?.joinedEvents?.has(ev.id) ? TG : "#0D1117", fontSize:13, fontWeight:900, fontFamily:FONT, boxShadow: ctx?.joinedEvents?.has(ev.id) ? "none" : `0 4px 16px ${ev.color}50` }}>{ctx?.joinedEvents?.has(ev.id) ? "✓ Joined" : "Join →"}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ STORY CARD ═══ */}
      <div style={{ padding:"14px 16px 0" }}>
        <StoryCard story={STORY} />
      </div>

      {/* ═══ STYLE EVENT ═══ */}
      {styleEvent && styleEvent.phase !== null && (
        <StyleEventBanner event={styleEvent} onOpen={() => setStyleTab(true)} />
      )}

      {/* ═══ MARKET SHORTCUT ═══ */}
      <MarketShortcut onOpen={() => setTab("market")} />

      <div style={{ height:40 }} />
    </div>
  );

  if (tab === "missions") return shell(
    <QuestScreen missions={missions} events={liveEvents} styleEvent={styleEvent} onStyleEvent={() => setStyleTab(true)} />
  );

  if (tab === "market") return shell(<MarketScreen user={ctx?.sharedUser || USER} />);

  if (tab === "clan") return shell(<ClanScreen userOverride={user.clan ? { ...CL_USER, ...user, clan: user.clan } : user} onBack={() => setTab("home")} />);

  if (tab === "profile") return shell(
    <ProfileScreen user={ctx?.sharedUser || USER} onAdminAccess={() => setShowAdmin(true)} />
  );

  return shell(<div />);
}
