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
import type { ClanScreenProps, NoClanScreenProps, ClanHubProps, WarTabProps, TreasuryTabProps } from "../types";
import { ZoneMapScreen } from "./ZoneMapScreen";

export function ClanScreen({ userOverride, onBack }: ClanScreenProps) {
  const user = userOverride || CL_USER;
  const canCreate = user.level >= 5;
  const inClan = !!user.clan;
  if (!inClan) return <NoClanScreen user={user} canCreate={canCreate} onBack={onBack} />;
  return <ClanHub user={user} onBack={onBack} />;
}

const SUGGESTED_CLANS: any[] = [];

function NoClanScreen({ user, canCreate, onBack }: NoClanScreenProps) {
  const ctx = useContext(AppContext);
  const [joinQuery, setJoinQuery] = useState("");
  const lvlToGo = Math.max(0, 5 - user.level);

  return (
    <div style={{ position:"relative", zIndex:1, height:"100dvh", overflowY:"auto", paddingBottom:90 }}>
      {onBack && (
        <div style={{ padding:"16px 16px 0", marginBottom:4 }}>
          <button onClick={onBack} style={{ background:"none", border:"none", color:TM, fontSize:13, fontFamily:FONT, fontWeight:600 }}>← Back</button>
        </div>
      )}
      <div style={{ padding:"4px 16px 0" }}>
        <div style={{ fontSize:26, fontWeight:900, color:TX, letterSpacing:"-0.5px", marginBottom:4 }}>Clans</div>
        <div style={{ fontSize:13, color:TM, marginBottom:20 }}>Team up. Capture zones. Dominate campus.</div>

        {/* Join */}
        <Card style={{ marginBottom:12 }}>
          <div style={{ fontSize:15, fontWeight:800, color:TX, marginBottom:12 }}>Find a Clan</div>
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            <input style={{ flex:1, background:"rgba(255,255,255,0.04)", border:`1px solid ${BR}`, borderRadius:12, padding:"10px 14px", color:TX, fontSize:13 }} placeholder="Search name or tag..." value={joinQuery} onChange={e => setJoinQuery(e.target.value)} />
            <button style={{ padding:"10px 18px", background:`linear-gradient(135deg, ${T}, ${TG})`, border:"none", borderRadius:12, color:"#fff", fontSize:13, fontWeight:700 }}>Search</button>
          </div>
          <div style={{ fontSize:11, fontWeight:700, color:TM, marginBottom:10, textTransform:"uppercase", letterSpacing:"0.5px" }}>Suggested</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {SUGGESTED_CLANS.map((c: any) => (
              <div key={c.name} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"rgba(255,255,255,0.03)", border:`1px solid ${BR}`, borderRadius:12 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:`${c.color}20`, border:`1px solid ${c.color}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:c.color, fontFamily:MONO, flexShrink:0 }}>{c.tag}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:TX }}>{c.name}</div>
                  <div style={{ fontSize:11, color:TM }}>{c.members} members · {c.zones} zones · {c.open ? "Open" : "Invite only"}</div>
                </div>
                {c.open && (
                  <button onClick={() => {
                    if (ctx?.joinClan) ctx.joinClan(c.name, c.tag, c.color);
                    showToast(`⚔️ Joined ${c.name}! Welcome aboard.`, "success");
                  }} style={{ padding:"7px 14px", background:`linear-gradient(135deg, ${T}, ${TG})`, border:"none", borderRadius:10, color:"#fff", fontSize:12, fontWeight:700 }}>Join</button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Create */}
        <Card gradient={canCreate ? `linear-gradient(135deg, ${T}10, ${TL}05), ${S1}` : S1} style={{ position:"relative", overflow:"hidden" }}>
          {!canCreate && (
            <div style={{ position:"absolute", inset:0, background:"rgba(13,17,23,0.7)", backdropFilter:"blur(6px)", zIndex:5, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:20 }}>
              <div style={{ textAlign:"center", padding:24 }}>
                <div style={{ fontSize:36, marginBottom:12 }}>🔒</div>
                <div style={{ fontSize:16, fontWeight:800, color:TX, marginBottom:6 }}>Level 5 Required</div>
                <div style={{ fontSize:13, color:TM, marginBottom:16 }}>{lvlToGo} level{lvlToGo!==1?"s":""} to go</div>
                <div style={{ height:6, background:BR, borderRadius:99, overflow:"hidden", width:"100%" }}>
                  <div style={{ height:"100%", width:`${(user.level/5)*100}%`, background:`linear-gradient(90deg, ${T}, ${TG})`, borderRadius:99 }} />
                </div>
              </div>
            </div>
          )}
          <div style={{ fontSize:15, fontWeight:800, color:TX, marginBottom:4 }}>Create a Clan</div>
          <div style={{ fontSize:12, color:TM, marginBottom:14 }}>Found your own clan and start capturing zones</div>
          {(() => {
            const [clanName, setClanName] = useState("");
            const [clanTag, setClanTag] = useState("");
            const [clanMotto, setClanMotto] = useState("");
            const [creating, setCreating] = useState(false);
            const handleCreate = () => {
              if (!clanName.trim() || !clanTag.trim() || clanTag.length < 2) {
                showToast("⚠ Fill in clan name and tag (2-4 chars)", "error");
                return;
              }
              if ((ctx?.sharedUser?.ae || 0) < 500) {
                showToast("⚠ Need 500 AE to create a clan", "error");
                return;
              }
              setCreating(true);
              setTimeout(() => {
                if (ctx?.createClan) ctx.createClan(clanName.trim(), clanTag.trim().toUpperCase(), clanMotto.trim());
                showToast(`⚔️ Clan "${clanName}" [${clanTag.toUpperCase()}] founded! −500 AE`, "success");
                setCreating(false);
              }, 1000);
            };
            return (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <input style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${BR}`, borderRadius:12, padding:"10px 14px", color:TX, fontSize:13 }} placeholder="Clan name..." value={clanName} onChange={e => setClanName(e.target.value)} />
                <div style={{ display:"flex", gap:8 }}>
                  <input style={{ flex:1, background:"rgba(255,255,255,0.04)", border:`1px solid ${BR}`, borderRadius:12, padding:"10px 14px", color:TX, fontSize:13 }} placeholder="Tag (2-4 chars)..." maxLength={4} value={clanTag} onChange={e => setClanTag(e.target.value)} />
                  <input style={{ flex:1, background:"rgba(255,255,255,0.04)", border:`1px solid ${BR}`, borderRadius:12, padding:"10px 14px", color:TX, fontSize:13 }} placeholder="Motto..." value={clanMotto} onChange={e => setClanMotto(e.target.value)} />
                </div>
                <div style={{ fontSize:11, color:TM }}>Cost: <span style={{ color:TA, fontWeight:700 }}>500 AE</span> · Balance: <span style={{ color:TY, fontWeight:700 }}>{(ctx?.sharedUser?.ae || 0).toLocaleString()} AE</span></div>
                <button disabled={creating} onClick={handleCreate} style={{ padding:"13px", background: creating ? `${TM}30` : `linear-gradient(135deg, ${T}, ${TG})`, border:"none", borderRadius:12, color: creating ? TM : "#fff", fontSize:14, fontWeight:700, boxShadow: creating ? "none" : `0 4px 20px ${T}40` }}>{creating ? "⏳ Founding..." : "Found Clan →"}</button>
              </div>
            );
          })()}
        </Card>
      </div>
    </div>
  );
}

function ClanHub({ user, onBack }: ClanHubProps) {
  const ctx = useContext(AppContext);
  const clan = user.clan!;
  const isLeader = clan.memberRole === "Leader";
  const isOfficer = isLeader || clan.memberRole === "Officer";
  const [cTab, setCTab] = useState("overview");
  const [confirmLeave, setConfirmLeave] = useState(false);

  const CLAN_TABS = [
    { id:"overview", icon:"📊", label:"Overview" },
    { id:"members",  icon:"👥", label:"Members" },
    { id:"map",      icon:"🗺️", label:"Map" },
    { id:"zones",    icon:"📍", label:"Zones" },
    { id:"war",      icon:"⚔️", label:"War" },
    { id:"treasury", icon:"◎",  label:"Treasury" },
  ];

  return (
    <div style={{ position:"relative", zIndex:1, height:"100dvh", overflowY:"hidden", display:"flex", flexDirection:"column" }}>
      {/* Clan banner */}
      <div style={{ padding:"16px 16px 0", borderBottom:`1px solid ${BR}`, background:S1, flexShrink:0 }}>
        <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse 80% 100% at 50% 0%, ${clan.color}15, transparent 70%)`, pointerEvents:"none" }} />
        <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:12, position:"relative" }}>
          <div style={{ width:54, height:54, borderRadius:16, background:`${clan.color}20`, border:`2px solid ${clan.color}60`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:800, fontFamily:MONO, color:clan.color, flexShrink:0 }}>{clan.tag}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:20, fontWeight:900, color:TX, letterSpacing:"-0.3px" }}>{clan.name}</div>
            <div style={{ fontSize:12, color:TM, fontStyle:"italic" }}>"{clan.motto}"</div>
          </div>
          <div style={{ display:"flex", gap:16, flexShrink:0 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:18, fontWeight:800, color:clan.color, fontFamily:MONO }}>#{clan.rank}</div>
              <div style={{ fontSize:9, color:TD, textTransform:"uppercase", letterSpacing:"0.5px" }}>Rank</div>
            </div>
            <div style={{ width:1, background:BR }} />
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:18, fontWeight:800, color:TX, fontFamily:MONO }}>{clan.zonesHeld}</div>
              <div style={{ fontSize:9, color:TD, textTransform:"uppercase", letterSpacing:"0.5px" }}>Zones</div>
            </div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:TG }} />
            <span style={{ fontSize:11, color:TM }}>
              <span style={{ color:clan.color, fontWeight:700 }}>{clan.memberRole}</span> · {clan.totalMembers}/{clan.maxMembers} members
            </span>
          </div>
          <button onClick={() => setConfirmLeave(true)} style={{
            background:"none", border:`1px solid ${TR}40`, borderRadius:8, padding:"4px 10px",
            color:TR, fontSize:10, fontWeight:700, fontFamily:FONT, cursor:"pointer",
          }}>Leave</button>
        </div>

        {/* Tab bar */}
        <div style={{ display:"flex", borderTop:`1px solid ${BR}`, overflowX:"auto" }}>
          {CLAN_TABS.map((t: any) => (
            <button key={t.id} onClick={() => setCTab(t.id)} style={{
              flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3,
              padding:"10px 4px 0", background:"none", border:"none", fontFamily:FONT, minWidth:52,
              borderBottom: cTab===t.id ? `2px solid ${clan.color}` : "2px solid transparent",
              paddingBottom:8,
            }}>
              <span style={{ fontSize:14 }}>{t.icon}</span>
              <span style={{ fontSize:9, fontWeight:700, color: cTab===t.id ? clan.color : TM, letterSpacing:"0.3px" }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex:1, overflowY:"auto", padding:"14px 14px 90px" }}>
        {cTab === "overview" && <OverviewTab clan={clan} isLeader={isLeader} />}
        {cTab === "members" && <MembersTab clan={clan} isLeader={isLeader} isOfficer={isOfficer} />}
        {cTab === "map" && <ZoneMapScreen />}
        {cTab === "zones" && <ZonesTab clan={clan} isLeader={isLeader} isOfficer={isOfficer} />}
        {cTab === "war" && <WarTab clan={clan} isLeader={isLeader} isOfficer={isOfficer} />}
        {cTab === "treasury" && <TreasuryTab clan={clan} isLeader={isLeader} />}
      </div>

      {/* Leave clan confirmation modal */}
      {confirmLeave && (
        <div onClick={() => setConfirmLeave(false)} style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(13,17,23,0.9)", backdropFilter:"blur(16px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:S1, border:`1px solid ${BR}`, borderRadius:20, padding:24, maxWidth:340, width:"100%" }}>
            <div style={{ fontSize:18, fontWeight:800, color:TX, marginBottom:8 }}>Leave {clan.name}?</div>
            <div style={{ fontSize:13, color:TM, marginBottom:20, lineHeight:1.6 }}>
              You'll lose access to clan zones, treasury, and war participation. You can rejoin later if the clan is open.
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setConfirmLeave(false)} style={{ flex:1, padding:"12px", borderRadius:12, background:"rgba(255,255,255,0.06)", border:`1px solid ${BR}`, color:TX, fontSize:13, fontWeight:700, fontFamily:FONT }}>Cancel</button>
              <button onClick={() => { if (ctx?.leaveClan) ctx.leaveClan(); setConfirmLeave(false); }} style={{ flex:1, padding:"12px", borderRadius:12, background:TR, border:"none", color:"#fff", fontSize:13, fontWeight:700, fontFamily:FONT }}>Leave Clan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewTab({ clan, isLeader }: any) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {/* Stats grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
        {[
          { val:clan.rank,                  lbl:"Rank",    icon:"🏆" },
          { val:clan.zonesHeld,             lbl:"Zones",   icon:"◈" },
          { val:`${clan.cpr}`,              lbl:"CPR",     icon:"⚡" },
          { val:`${(clan.treasury/1000).toFixed(1)}k`, lbl:"AE", icon:"◎" },
        ].map((s: any) => (
          <div key={s.lbl} style={{ background:S1, border:`1px solid ${BR}`, borderRadius:14, padding:"12px 8px", display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <span style={{ fontSize:16 }}>{s.icon}</span>
            <span style={{ fontSize:16, fontWeight:800, color:TX, fontFamily:MONO }}>{s.val}</span>
            <span style={{ fontSize:9, color:TM, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.3px" }}>{s.lbl}</span>
          </div>
        ))}
      </div>

      {/* Weekly XP */}
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <span style={{ fontSize:13, fontWeight:700, color:TX }}>Weekly XP</span>
          <span style={{ fontSize:16, fontWeight:800, color:clan.color, fontFamily:MONO }}>{clan.weeklyXP.toLocaleString()}</span>
        </div>
        <ProgressBar value={clan.weeklyXP} max={20000} color={clan.color} height={5} />
        <div style={{ fontSize:11, color:TM, marginTop:6 }}>This month</div>
      </Card>

      {/* Leaderboard */}
      <Card>
        <div style={{ fontSize:14, fontWeight:700, color:TX, marginBottom:12 }}>Campus Leaderboard</div>
        {ENEMY_CLANS.map((ec: any) => (
          <div key={ec.name} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background: ec.isUs ? `${clan.color}0A` : "rgba(255,255,255,0.02)", border:`1px solid ${ec.isUs ? `${clan.color}30` : BR}`, borderRadius:12, marginBottom:6 }}>
            <span style={{ fontSize:13, fontWeight:800, color: ec.rank<=2 ? TA : TM, fontFamily:MONO, width:22 }}>#{ec.rank}</span>
            <div style={{ width:36, height:36, borderRadius:10, background:`${ec.color}20`, border:`1px solid ${ec.color}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:ec.color, fontFamily:MONO }}>{ec.tag}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color: ec.isUs ? clan.color : TX }}>{ec.name}{ec.isUs ? " ← You" : ""}</div>
              <div style={{ fontSize:11, color:TM }}>{ec.zones} zones</div>
            </div>
            <span style={{ fontSize:14, fontWeight:800, color: ec.isUs ? clan.color : TM, fontFamily:MONO }}>{ec.cpr}</span>
          </div>
        ))}
      </Card>

      {isLeader && (
        <Card>
          <div style={{ fontSize:14, fontWeight:700, color:TX, marginBottom:12 }}>⚙️ Leader Controls</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {["✏️ Edit Clan Info", "📢 Post Announcement"].map((l: any) => (
              <button key={l} style={{ padding:"11px 16px", background:"rgba(255,255,255,0.03)", border:`1px solid ${BR}`, borderRadius:12, color:TM, fontSize:13, fontWeight:600, fontFamily:FONT, textAlign:"left" }}>{l}</button>
            ))}
            <button style={{ padding:"11px 16px", background:"rgba(239,68,68,0.06)", border:`1px solid rgba(239,68,68,0.3)`, borderRadius:12, color:TR, fontSize:13, fontWeight:600, fontFamily:FONT, textAlign:"left" }}>🚪 Disband Clan</button>
          </div>
        </Card>
      )}
    </div>
  );
}

function MembersTab({ clan, isLeader, isOfficer }: any) {
  const [sort, setSort] = useState("xp");
  const sorted = [...MEMBERS].sort((a,b) => sort==="xp" ? b.xp-a.xp : sort==="level" ? b.level-a.level : b.zones-a.zones);
  const statusColor = { online:TG, away:TA, offline:TD };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <Card style={{ padding:"12px 14px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
          <span style={{ fontSize:12, fontWeight:700, color:TX }}>Members</span>
          <span style={{ fontSize:12, color:TM }}>{clan.totalMembers} / {clan.maxMembers}</span>
        </div>
        <ProgressBar value={clan.totalMembers} max={clan.maxMembers} color={clan.color} height={5} />
      </Card>

      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:11, color:TM, fontWeight:700 }}>Sort:</span>
        {[["xp","XP"],["level","Level"],["zones","Zones"]].map((k: any, l: any) => (
          <button key={k} onClick={() => setSort(k)} style={{ padding:"5px 12px", background: sort===k ? `${TG}15` : "rgba(255,255,255,0.03)", border:`1px solid ${sort===k ? `${TG}50` : BR}`, borderRadius:99, fontSize:11, fontWeight:600, color: sort===k ? TG : TM, fontFamily:FONT }}>{l}</button>
        ))}
      </div>

      {sorted.map((m: any, i: number) => (
        <div key={m.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", background: m.isMe ? `${TG}05` : S1, border:`1px solid ${m.isMe ? `${TG}30` : BR}`, borderRadius:16 }}>
          <span style={{ fontSize:12, fontWeight:800, color: i<3 ? TA : TM, fontFamily:MONO, width:22, textAlign:"center" }}>#{i+1}</span>
          <div style={{ position:"relative", flexShrink:0 }}>
            <div style={{ width:38, height:38, borderRadius:12, background:S2, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{m.avatar}</div>
            <div style={{ position:"absolute", bottom:0, right:0, width:9, height:9, borderRadius:"50%", background:statusColor[m.status], border:`2px solid ${S1}` }} />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:TX, display:"flex", alignItems:"center", gap:6 }}>
              {m.name}
              {m.isMe && <span style={{ fontSize:9, fontWeight:700, color:TG, background:`${TG}15`, borderRadius:99, padding:"1px 6px" }}>You</span>}
            </div>
            <div style={{ display:"flex", gap:8, marginTop:3 }}>
              <span style={{ fontSize:9, fontWeight:700, border:`1px solid`, borderRadius:99, padding:"1px 7px", color: m.role==="Leader" ? TA : m.role==="Officer" ? clan.color : TM, borderColor: m.role==="Leader" ? `${TA}60` : m.role==="Officer" ? `${clan.color}60` : BR }}>{m.role}</span>
              <span style={{ fontSize:11, color:TM }}>Lv {m.level} · {m.xp.toLocaleString()} XP</span>
            </div>
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:TG }}><span style={{ color:TG }}>◈</span> {m.zones}</div>
            {isOfficer && !m.isMe && m.role !== "Leader" && (
              <button style={{ width:24, height:24, borderRadius:"50%", background:`${TR}10`, border:`1px solid ${TR}30`, color:TR, fontSize:11, display:"flex", alignItems:"center", justifyContent:"center", marginTop:4, marginLeft:"auto" }}>✕</button>
            )}
          </div>
        </div>
      ))}

      {isOfficer && (
        <Card>
          <div style={{ fontSize:14, fontWeight:700, color:TX, marginBottom:12 }}>➕ Invite Member</div>
          <div style={{ display:"flex", gap:8 }}>
            <input style={{ flex:1, background:"rgba(255,255,255,0.04)", border:`1px solid ${BR}`, borderRadius:12, padding:"10px 14px", color:TX, fontSize:13 }} placeholder="Search player name..." />
            <button style={{ padding:"10px 18px", background:`linear-gradient(135deg, ${T}, ${TG})`, border:"none", borderRadius:12, color:"#fff", fontSize:13, fontWeight:700 }}>Invite</button>
          </div>
        </Card>
      )}
    </div>
  );
}

function ZonesTab({ clan, isLeader, isOfficer }: any) {
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const totalIncome = ZONES.reduce((s: any, z: number) => s + z.income, 0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:`${TA}08`, border:`1px solid ${TA}30`, borderRadius:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:24 }}>◎</span>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:TA, fontFamily:MONO }}>+{totalIncome} AE / day</div>
            <div style={{ fontSize:11, color:TM }}>Passive income from {ZONES.length} zones</div>
          </div>
        </div>
        <button style={{ padding:"10px 16px", background:`linear-gradient(135deg, ${T}, ${TG})`, border:"none", borderRadius:12, color:"#fff", fontSize:13, fontWeight:700 }}>Attack Zone</button>
      </div>

      {ZONES.map((z: any) => (
        <div key={z.id} onClick={() => setSelectedZone(selectedZone?.id===z.id ? null : z)} style={{
          background:S1, border:`1px solid ${z.contested ? "rgba(239,68,68,0.4)" : BR}`, borderRadius:16, padding:14, cursor:"pointer", position:"relative", overflow:"hidden",
          animation: z.contested ? "contestPulse 2.5s ease-in-out infinite" : "none",
        }}>
          {z.contested && (
            <div style={{ position:"absolute", top:0, left:0, right:0, background:"rgba(239,68,68,0.15)", padding:"4px 14px", fontSize:9, fontWeight:800, color:TR, letterSpacing:"1px", borderBottom:"1px solid rgba(239,68,68,0.3)", display:"flex", alignItems:"center", gap:6 }}>
              ⚔️ CONTESTED
            </div>
          )}
          <div style={{ display:"flex", alignItems:"center", gap:10, marginTop: z.contested ? 22 : 0 }}>
            <div style={{ width:44, height:44, background:S2, border:`1px solid ${BR}`, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
              {{"library":"📚","arena":"🏆","social":"☕","outdoor":"🌳","academic":"🎓"}[z.type]}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:700, color:TX, marginBottom:4 }}>{z.name}</div>
              <div style={{ display:"flex", gap:8 }}>
                <span style={{ fontSize:10, fontWeight:700, color:TG, background:`${TG}15`, borderRadius:99, padding:"2px 8px" }}>{z.bonusType}</span>
                {z.contested && <span style={{ fontSize:10, color:TR, fontWeight:700 }}>← {z.capturedBy2}</span>}
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:16, fontWeight:800, color: z.contested ? TR : TG, fontFamily:MONO }}>+{z.income}</div>
              <div style={{ fontSize:10, color:TM }}>AE/day</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:10 }}>
            <span style={{ fontSize:10, color:TM, width:80 }}>Defense: {z.defense}%</span>
            <div style={{ flex:1, height:4, background:"rgba(255,255,255,0.06)", borderRadius:99, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${z.defense}%`, borderRadius:99, background: z.defense>75 ? TG : z.defense>50 ? TA : TR }} />
            </div>
          </div>
          {selectedZone?.id===z.id && (
            <div style={{ display:"flex", gap:8, marginTop:12, paddingTop:10, borderTop:`1px solid ${BR}`, flexWrap:"wrap" }}>
              {["🛡️ Reinforce (+10 AE)", "⬆️ Upgrade Zone", ...(z.contested ? ["⚔️ Defend Now!"] : [])].map((l: any) => (
                <button key={l} style={{ padding:"8px 12px", background: l.includes("Defend") ? `${TR}10` : "rgba(255,255,255,0.03)", border:`1px solid ${l.includes("Defend") ? `${TR}30` : BR}`, borderRadius:10, fontSize:12, fontWeight:600, color: l.includes("Defend") ? TR : TM, fontFamily:FONT }}>{l}</button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function WarTab({ clan, isLeader, isOfficer }: WarTabProps) {
  const ctx = useContext(AppContext);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [declared, setDeclared] = useState(false);
  const [defending, setDefending] = useState(new Set());
  const canDeclare = selectedZone && !clanZoneOnCooldown(selectedZone);

  const handleDefend = (zoneId) => {
    if (defending.has(zoneId)) return;
    setDefending(d => new Set([...d, zoneId]));
    showToast("🛡️ GPS verifying defense position...", "info");
    setTimeout(() => {
      if (ctx?.defendZone) ctx.defendZone();
      setDefending(d => { const n = new Set(d); n.delete(zoneId); return n; });
    }, 4000);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {/* Active contests */}
      <Card gradient={`linear-gradient(135deg, rgba(239,68,68,0.08), rgba(220,38,38,0.04)), ${S1}`} style={{ border:`1px solid rgba(239,68,68,0.3)` }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:16 }}>🔴</span>
            <span style={{ fontSize:14, fontWeight:700, color:TX }}>Active Contests</span>
          </div>
          <span style={{ fontSize:11, color:TR, fontWeight:700 }}>{ZONES.filter(z=>z.contested).length} live</span>
        </div>
        {ZONES.filter(z=>z.contested).map((z: any) => (
          <div key={z.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:12, marginBottom:8, animation:"contestPulse 2.5s ease-in-out infinite" }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:TX, marginBottom:2 }}>{z.name}</div>
              <div style={{ fontSize:11, color:TR, fontWeight:700 }}>vs {z.capturedBy2}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <ContestTimer />
              <button onClick={() => handleDefend(z.id)} disabled={defending.has(z.id)} style={{ marginTop:6, padding:"6px 12px", background: defending.has(z.id) ? `${TM}30` : TR, border:"none", borderRadius:8, color: defending.has(z.id) ? TM : "#fff", fontSize:11, fontWeight:700, display:"block", boxShadow: defending.has(z.id) ? "none" : `0 4px 12px ${TR}50`, fontFamily:FONT }}>
                {defending.has(z.id) ? "📡 Defending..." : "🛡️ Defend"}
              </button>
            </div>
          </div>
        ))}
      </Card>

      {/* Declare war */}
      {isOfficer && !declared && (
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
            <div style={{ display:"flex", gap:8 }}>
              <span style={{ fontSize:16 }}>🎯</span>
              <span style={{ fontSize:14, fontWeight:700, color:TX }}>Attack a Zone</span>
            </div>
            <span style={{ fontSize:11, color:TM }}>−{GAME_RULES.WAR_DECLARE_COST_AE} AE · once/zone/day</span>
          </div>
          <div style={{ padding:"10px 12px", background:`${TA}08`, border:`1px solid ${TA}25`, borderRadius:10, fontSize:12, color:TM, lineHeight:1.5, marginBottom:12 }}>
            🛡️ Each zone has one attack slot per 24 hours. <strong style={{ color:TA }}>If another clan already attacked today, you must wait.</strong>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
            {ATTACKABLE_ZONES.map((z: any) => {
              const onCd = clanZoneOnCooldown(z);
              const rem = clanCooldownRemaining(z);
              const isSel = selectedZone?.id===z.id;
              return (
                <button key={z.id} disabled={onCd} onClick={() => setSelectedZone(isSel ? null : z)} style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, padding:"11px 12px",
                  background: isSel && !onCd ? `${TR}08` : "rgba(255,255,255,0.02)",
                  border:`1.5px solid ${isSel && !onCd ? `${TR}60` : BR}`,
                  borderRadius:12, cursor: onCd ? "not-allowed" : "pointer", fontFamily:FONT, textAlign:"left",
                  opacity: onCd ? 0.55 : 1,
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:18 }}>{{ landmark:"🏛️",outdoor:"🌳",social:"☕",academic:"🎓",arena:"🏆" }[z.type] || "📍"}</span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color: onCd ? TM : TX }}>{z.name}</div>
                      <div style={{ fontSize:11, color:TM }}>Held by <span style={{ color:TL }}>{z.owner}</span> · +{z.income} AE/day</div>
                    </div>
                  </div>
                  <div style={{ flexShrink:0, textAlign:"right", padding:"6px 10px", background: onCd ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)", border:`1px solid ${onCd ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`, borderRadius:8 }}>
                    <div style={{ fontSize:10, fontWeight:800, color: onCd ? TR : TG }}>{onCd ? "🔒 Taken" : "✓ Open"}</div>
                    {onCd && <div style={{ fontSize:9, color:TM }}>{z.attackedTodayBy}</div>}
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", background:`${TR}06`, border:`1px solid ${TR}25`, borderRadius:12, opacity: canDeclare ? 1 : 0.4, transition:"opacity 0.2s" }}>
            <div style={{ fontSize:12, color:TM }}>
              {selectedZone ? <><span style={{ color:TX, fontWeight:700 }}>{selectedZone.name}</span> selected</> : <span>Select an open zone above</span>}
            </div>
            <button disabled={!canDeclare} onClick={() => canDeclare && setDeclared(true)} style={{ padding:"10px 16px", background: canDeclare ? TR : TM, border:"none", borderRadius:10, color:"#fff", fontSize:13, fontWeight:700, fontFamily:FONT, boxShadow: canDeclare ? `0 4px 16px ${TR}50` : "none" }}>
              ⚔️ Attack! −{GAME_RULES.WAR_DECLARE_COST_AE} AE
            </button>
          </div>
        </Card>
      )}

      {isOfficer && declared && (
        <Card gradient={`linear-gradient(135deg, ${TR}10, ${TR}05), ${S1}`} style={{ border:`1px solid ${TR}40`, textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:8 }}>⚔️</div>
          <div style={{ fontSize:16, fontWeight:800, color:TX, marginBottom:4 }}>Attack declared on {selectedZone?.name}</div>
          <div style={{ fontSize:12, color:TM, marginBottom:16, lineHeight:1.5 }}>Head to the zone now. Attack slot locked for 24 hours.</div>
          <button onClick={() => { setDeclared(false); setSelectedZone(null); }} style={{ padding:"12px 24px", background:`linear-gradient(135deg, ${T}, ${TG})`, border:"none", borderRadius:12, color:"#fff", fontSize:13, fontWeight:700 }}>Done</button>
        </Card>
      )}

      {/* War log */}
      <Card>
        <div style={{ fontSize:14, fontWeight:700, color:TX, marginBottom:12 }}>📜 War Log</div>
        {WAR_LOG.map((w: any) => (
          <div key={w.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:`1px solid ${BR}` }}>
            <div style={{ width:38, height:38, borderRadius:10, background: w.result==="victory" ? `${TG}15` : w.result==="ongoing" ? `${TR}15` : "rgba(100,116,139,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <span style={{ fontSize:16 }}>{w.type==="attack" ? "⚔️" : "🛡️"}</span>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:TX }}>{w.zone}</div>
              <div style={{ fontSize:11, color:TM }}>{w.type==="attack" ? "vs" : "defended vs"} {w.enemy} · {w.time}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, background: w.result==="victory" ? `${TG}20` : w.result==="ongoing" ? `${TR}20` : "rgba(100,116,139,0.2)", color: w.result==="victory" ? TG : w.result==="ongoing" ? TR : TM, border:`1px solid ${w.result==="victory" ? `${TG}40` : w.result==="ongoing" ? `${TR}40` : "rgba(100,116,139,0.4)"}` }}>
                {w.result==="victory" ? "Victory" : w.result==="defeat" ? "Defeat" : "⚔️ Live"}
              </div>
              {w.xpGain > 0 && <div style={{ fontSize:11, fontWeight:700, color:TG, marginTop:3 }}>+{w.xpGain} XP</div>}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function TreasuryTab({ clan, isLeader }: TreasuryTabProps) {
  const ctx = useContext(AppContext);
  const [donateAmt, setDonateAmt] = useState("");
  const totalIncome = ZONES.reduce((s: any, z: number) => s + z.income, 0);
  const clanData = ctx?.sharedUser?.clan || clan;
  const treasuryBalance = clanData.treasury || TREASURY_LOG.reduce((s: any, t: number) => s + t.amount, 0);

  const handleDonate = () => {
    const amt = parseInt(donateAmt);
    if (!amt || amt <= 0) return;
    if (ctx?.donateToClan) ctx.donateToClan(amt);
    setDonateAmt("");
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <Card gradient={`linear-gradient(135deg, ${TA}10, ${TA}04), ${S1}`} style={{ border:`1px solid ${TA}30` }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
          <div>
            <div style={{ fontSize:11, color:TM, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>Treasury Balance</div>
            <div style={{ fontSize:30, fontWeight:900, color:TX, fontFamily:MONO }}>{treasuryBalance.toLocaleString()} <span style={{ fontSize:18, color:TA }}>AE</span></div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:18, fontWeight:800, color:TA, fontFamily:MONO }}>+{totalIncome}/day</div>
            <div style={{ fontSize:10, color:TM }}>Zone income</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <input type="number" style={{ flex:1, background:"rgba(255,255,255,0.06)", border:`1px solid ${BR}`, borderRadius:12, padding:"10px 14px", color:TX, fontSize:13 }} placeholder="Amount to donate..." value={donateAmt} onChange={e => setDonateAmt(e.target.value)} />
          <button onClick={handleDonate} style={{ padding:"10px 18px", background:`linear-gradient(135deg, ${T}, ${TG})`, border:"none", borderRadius:12, color:"#fff", fontSize:13, fontWeight:700 }}>Donate ◎</button>
        </div>
        <div style={{ fontSize:11, color:TM, marginTop:8 }}>Donations count toward your weekly contribution score.</div>
      </Card>

      {isLeader && (
        <Card>
          <div style={{ fontSize:14, fontWeight:700, color:TX, marginBottom:12 }}>⚙️ Spend Treasury</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[["🛡️","Reinforce Zone",200],["⬆️","Upgrade Zone",800],["⚔️","War Declaration",200],["📢","Clan Broadcast",100]].map((icon: any, lbl: any, cost: any) => (
              <button key={lbl} style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", gap:4, padding:"12px", background:"rgba(255,255,255,0.03)", border:`1px solid ${BR}`, borderRadius:12, fontFamily:FONT }}>
                <span style={{ fontSize:20 }}>{icon}</span>
                <span style={{ fontSize:12, fontWeight:700, color:TX }}>{lbl}</span>
                <span style={{ fontSize:11, color:TA, fontWeight:700 }}>{cost} AE</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <div style={{ fontSize:14, fontWeight:700, color:TX, marginBottom:12 }}>📋 Transactions</div>
        {TREASURY_LOG.map((t: any) => (
          <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:`1px solid ${BR}` }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background: t.type==="income" ? TG : TR, flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:600, color:TX }}>{t.desc}</div>
              <div style={{ fontSize:11, color:TM }}>{t.time}</div>
            </div>
            <div style={{ fontSize:13, fontWeight:700, color: t.type==="income" ? TG : TR }}>
              {t.type==="income" ? "+" : ""}{t.amount.toLocaleString()} AE
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function ContestTimer() {
  const [s, setS] = useState(1340 + Math.floor(Math.random() * 400));
  useEffect(() => {
    const t = setInterval(() => setS(x => Math.max(0, x-1)), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(s/60)).padStart(2,"0");
  const ss = String(s%60).padStart(2,"0");
  return <span style={{ fontSize:18, fontWeight:900, color:"#FF8888", fontFamily:MONO, letterSpacing:2 }}>{mm}:{ss}</span>;
}

// ═══════════════════════════════════════════════════════════════════════════════
