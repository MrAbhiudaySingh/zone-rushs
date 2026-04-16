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
import type { QuestScreenProps } from "../types";
import { MissionCard } from "./HomeScreen";

export function QuestScreen({ missions, events, styleEvent, onStyleEvent }: QuestScreenProps) {
  const ctx = useContext(AppContext);
  const [qTab, setQTab] = useState("daily");

  const daily  = missions.filter((m: any) => m.tier === "daily" && !m._disabled);
  const weekly = missions.filter((m: any) => m.tier === "weekly" && !m._disabled);
  const monthly = missions.filter((m: any) => m.tier === "monthly" && !m._disabled);

  const dailyCompleted = daily.filter((m: any) => ctx?.completedMissions?.has(m.id)).length;
  const weeklyCompleted = weekly.filter((m: any) => ctx?.completedMissions?.has(m.id)).length;
  const monthlyCompleted = monthly.filter((m: any) => ctx?.completedMissions?.has(m.id)).length;

  // Calculate time remaining
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const hoursLeft = Math.max(0, Math.floor((endOfDay - now) / 3600000));
  const dayOfWeek = now.getDay();
  const daysToSunday = (7 - dayOfWeek) % 7 || 7;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeftMonth = Math.max(0, daysInMonth - now.getDate());

  // Group quests by category
  const groupByCategory = (quests) => {
    const groups = {};
    quests.forEach((q: any) => {
      const cat = q.cat || "general";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(q);
    });
    return groups;
  };

  const CATEGORY_LABELS = {
    movement: "🚶 Movement & Presence",
    photo_proof: "📸 Quick Photo Proof",
    territory: "⚔️ Territory Hooks",
    health: "💪 Health & Activity",
    content: "🖼️ Content Creation",
    sustainability: "♻️ Sustainability",
    exploration: "🧭 Exploration",
    consistency: "🏆 Consistency & Discipline",
    social: "👑 Social Status",
    contribution: "📖 Contribution",
    creator: "🎨 Creator / Builder",
    legend: "⚡ Legend Quests",
    general: "📋 General",
  };

  const renderGroup = (quests) => {
    const groups = groupByCategory(quests);
    return Object.entries(groups).map((cat: any, items: any) => (
      <div key={cat} style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:800, color:TX, marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
          {CATEGORY_LABELS[cat] || cat}
          <span style={{ fontSize:11, color:TM, fontWeight:600 }}>({items.filter((m: any) => ctx?.completedMissions?.has(m.id)).length}/{items.length})</span>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {items.map((m: any, i: number) => <MissionCard key={m.id} m={m} idx={i} />)}
        </div>
      </div>
    ));
  };

  return (
    <div style={{ position:"relative", zIndex:1, height:"100dvh", overflowY:"auto", paddingBottom:90 }}>
      <div style={{ padding:"20px 16px 0" }}>
        <div style={{ fontSize:26, fontWeight:900, color:TX, letterSpacing:"-0.5px", marginBottom:2 }}>Quests</div>
        <div style={{ fontSize:13, color:TM, marginBottom:16 }}>Complete quests · earn AE + XP + 💎</div>
        <TabBar
          tabs={[
            ["daily","Daily", daily.length],
            ["weekly","Weekly", weekly.length],
            ["monthly","Monthly", monthly.length],
            ["events","Events", events.length],
          ]}
          active={qTab}
          onSelect={setQTab}
        />
      </div>

      <div style={{ padding:"16px 16px 0" }}>
        {/* DAILY */}
        {qTab === "daily" && (
          <div>
            <Card gradient={`linear-gradient(135deg, ${T}12, ${TG}06), ${S1}`} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:14, fontWeight:700, color:TX }}>📅 Today's Progress</span>
                <span style={{ fontSize:14, fontWeight:800, color:TG }}>{dailyCompleted}/{daily.length}</span>
              </div>
              <ProgressBar value={dailyCompleted} max={daily.length || 1} color={`linear-gradient(90deg, ${T}, ${TG})`} height={6} />
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
                <span style={{ fontSize:11, color:TM }}>Resets in {hoursLeft}h</span>
                <span style={{ fontSize:11, color:TG, fontWeight:700 }}>All done → +50 AE bonus</span>
              </div>
            </Card>
            {renderGroup(daily)}
          </div>
        )}

        {/* WEEKLY */}
        {qTab === "weekly" && (
          <div>
            <Card gradient={`linear-gradient(135deg, ${TB}12, ${T}06), ${S1}`} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:14, fontWeight:700, color:TX }}>📅 Weekly Progress</span>
                <span style={{ fontSize:14, fontWeight:800, color:TB }}>{weeklyCompleted}/{weekly.length}</span>
              </div>
              <ProgressBar value={weeklyCompleted} max={weekly.length || 1} color={`linear-gradient(90deg, ${TB}, ${TG})`} height={6} />
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
                <span style={{ fontSize:11, color:TM }}>Resets in {daysToSunday}d</span>
                <span style={{ fontSize:11, color:TB, fontWeight:700 }}>All done → +300 AE bonus</span>
              </div>
            </Card>
            {renderGroup(weekly)}
          </div>
        )}

        {/* MONTHLY */}
        {qTab === "monthly" && (
          <div>
            <Card gradient={`linear-gradient(135deg, ${TL}12, ${TY}06), ${S1}`} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:14, fontWeight:700, color:TX }}>📆 {now.toLocaleDateString("en-US", { month:"long", year:"numeric" })}</span>
                <span style={{ fontSize:14, fontWeight:800, color:TL }}>{monthlyCompleted}/{monthly.length}</span>
              </div>
              <ProgressBar value={monthlyCompleted} max={monthly.length || 1} color={`linear-gradient(90deg, ${TL}, ${TG})`} height={6} />
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
                <span style={{ fontSize:11, color:TM }}>{daysLeftMonth} days left</span>
                <span style={{ fontSize:11, color:TL, fontWeight:700 }}>All done → +2,000 AE 🏆</span>
              </div>
            </Card>
            {renderGroup(monthly)}
          </div>
        )}

        {/* EVENTS */}
        {qTab === "events" && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {styleEvent && styleEvent.phase !== null && (
              <div onClick={onStyleEvent} style={{
                padding:"14px 16px", background:`linear-gradient(135deg, ${TL}15, ${T}08)`, border:`1px solid ${TL}40`, borderRadius:16, cursor:"pointer",
                display:"flex", alignItems:"center", gap:12,
              }}>
                <span style={{ fontSize:28 }}>👗</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:TX, marginBottom:2 }}>Style Challenge — Week #{styleEvent.weekId}</div>
                  <div style={{ fontSize:12, color:TM }}>
                    {styleEvent.phase==="voting" ? `Vote on ${styleEvent.gallery.length} designs · closes ${styleEvent.votingEnds}` : `Submit your design · closes ${styleEvent.submissionEnds}`}
                  </div>
                </div>
                <span style={{ color:TL }}>›</span>
              </div>
            )}
            {events.map((ev: any) => {
              const pct = ev.maxParticipants ? (ev.participants / ev.maxParticipants) * 100 : 30;
              return (
                <div key={ev.id} style={{ background:S1, border:`1px solid ${ev.color}40`, borderRadius:16, padding:"14px 16px", borderLeft:`3px solid ${ev.color}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:TX, marginBottom:3 }}>{ev.title}</div>
                      <span style={{ fontSize:10, fontWeight:700, color:ev.color, background:`${ev.color}15`, borderRadius:99, padding:"2px 8px" }}>{ev.type.toUpperCase()}</span>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:12, fontWeight:800, color:ev.color }}>{ev.reward?.split(" + ")?.[0]}</div>
                      <div style={{ fontSize:10, color:TM }}>Ends {ev.endDate}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:12, color:TM, marginBottom:10, lineHeight:1.5 }}>{ev.desc}</div>
                  <ProgressBar value={pct} max={100} color={ev.color} height={4} />
                  <div style={{ fontSize:10, color:TM, marginTop:4, marginBottom:10 }}>{ev.participants}/{ev.maxParticipants} participants · {ev.eligibility}</div>
                  <button onClick={() => { if (ctx?.joinEvent) ctx.joinEvent(ev.id); showToast(`⚡ Joined "${ev.title}"!`, "success"); }} disabled={ctx?.joinedEvents?.has(ev.id)} style={{ padding:"9px 16px", background: ctx?.joinedEvents?.has(ev.id) ? `${TG}30` : ev.color, border:"none", borderRadius:10, color: ctx?.joinedEvents?.has(ev.id) ? TG : "#fff", fontSize:12, fontWeight:700, fontFamily:FONT }}>{ctx?.joinedEvents?.has(ev.id) ? "✓ Joined" : "Join Event →"}</button>
                </div>
              );
            })}
            {events.length === 0 && (!styleEvent || styleEvent.phase === null) && (
              <div style={{ padding:"60px 20px", textAlign:"center", color:TM }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🎯</div>
                <div style={{ fontSize:16, fontWeight:700, color:TX, marginBottom:6 }}>No live events right now</div>
                <div style={{ fontSize:13 }}>Events drop periodically — check back soon</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
