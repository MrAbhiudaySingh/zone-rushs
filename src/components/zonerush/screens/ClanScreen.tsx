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
  const canCreate = user.level >= GAME_RULES.CLAN_CREATE_MIN_LEVEL;
  const inClan = !!user.clan;
  if (!inClan) return <NoClanScreen user={user} canCreate={canCreate} onBack={onBack} />;
  return <ClanHub user={user} onBack={onBack} />;
}



function NoClanScreen({ user, canCreate, onBack }: NoClanScreenProps) {
  const ctx = useContext(AppContext);
  const [joinQuery, setJoinQuery] = useState("");
  const [suggested, setSuggested] = useState<any[]>([]);
  const [loadingSuggest, setLoadingSuggest] = useState(true);
  const lvlToGo = Math.max(0, GAME_RULES.CLAN_CREATE_MIN_LEVEL - user.level);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("clans")
          .select("id, name, tag, color, member_count, max_members, motto, cpr_score, is_open")
          .order("cpr_score", { ascending: false })
          .limit(10);
        if (cancelled) return;
        if (data?.length) {
          setSuggested(data.map((c: any) => ({
            id: c.id,
            name: c.name,
            tag: c.tag,
            color: c.color || TL,
            members: c.member_count ?? 0,
            maxMembers: c.max_members ?? 20,
            motto: c.motto || "",
            cpr: Number(c.cpr_score || 0),
            open: c.is_open !== false,
          })));
        } else {
          setSuggested(SUGGESTED_CLANS);
        }
      } catch { if (!cancelled) setSuggested(SUGGESTED_CLANS); }
      if (!cancelled) setLoadingSuggest(false);
    })();
    return () => { cancelled = true; };
  }, []);

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
            {joinQuery && <button onClick={() => setJoinQuery("")} style={{ padding:"10px 14px", background:"rgba(255,255,255,0.06)", border:`1px solid ${BR}`, borderRadius:12, color:TM, fontSize:13, fontWeight:700 }}>Clear</button>}
          </div>
          <div style={{ fontSize:11, fontWeight:700, color:TM, marginBottom:10, textTransform:"uppercase", letterSpacing:"0.5px" }}>
            {joinQuery ? `Results for "${joinQuery}"` : "Suggested"}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {(() => {
              const q = joinQuery.trim().toLowerCase();
              const filtered = q
                ? suggested.filter((c: any) => c.name.toLowerCase().includes(q) || (c.tag || "").toLowerCase().includes(q))
                : suggested;
              if (loadingSuggest) return (
                <div style={{ padding:"24px 16px", textAlign:"center", color:TM, fontSize:12 }}>Loading clans…</div>
              );
              if (q && filtered.length === 0) return (
                <div style={{ padding:"24px 16px", textAlign:"center", color:TM, fontSize:12 }}>No clans match "{joinQuery}"</div>
              );
              if (!q && filtered.length === 0) return (
                <div style={{ padding:"24px 16px", textAlign:"center", color:TM, fontSize:12 }}>No suggested clans yet — try creating one!</div>
              );
              return filtered.map((c: any) => (
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
            ));
            })()}
          </div>
        </Card>

        {/* Create */}
        <Card gradient={canCreate ? `linear-gradient(135deg, ${T}10, ${TL}05), ${S1}` : S1} style={{ position:"relative", overflow:"hidden" }}>
          {!canCreate && (
            <div style={{ position:"absolute", inset:0, background:"rgba(13,17,23,0.7)", backdropFilter:"blur(6px)", zIndex:5, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:20 }}>
              <div style={{ textAlign:"center", padding:24 }}>
                <div style={{ fontSize:36, marginBottom:12 }}>🔒</div>
                <div style={{ fontSize:16, fontWeight:800, color:TX, marginBottom:6 }}>Level {GAME_RULES.CLAN_CREATE_MIN_LEVEL} Required</div>
                <div style={{ fontSize:13, color:TM, marginBottom:16 }}>{lvlToGo} level{lvlToGo!==1?"s":""} to go</div>
                <div style={{ height:6, background:BR, borderRadius:99, overflow:"hidden", width:"100%" }}>
                  <div style={{ height:"100%", width:`${(user.level/GAME_RULES.CLAN_CREATE_MIN_LEVEL)*100}%`, background:`linear-gradient(90deg, ${T}, ${TG})`, borderRadius:99 }} />
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
            const [bannerEmoji, setBannerEmoji] = useState("⚔️");
            const [isOpen, setIsOpen] = useState(true);
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
                if (ctx?.createClan) ctx.createClan(clanName.trim(), clanTag.trim().toUpperCase(), clanMotto.trim(), { isOpen, bannerEmoji });
                showToast(`⚔️ Clan "${clanName}" [${clanTag.toUpperCase()}] founded! −500 AE`, "success");
                setCreating(false);
              }, 1000);
            };
            const EMOJI_OPTIONS = ["⚔️", "🛡️", "🏆", "🔥", "⚡", "🌙", "🌟", "🐉", "🦅", "🐺", "🦁", "🌳"];
            return (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <input style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${BR}`, borderRadius:12, padding:"10px 14px", color:TX, fontSize:13, fontFamily:FONT }} placeholder="Clan name..." value={clanName} onChange={e => setClanName(e.target.value)} />
                <div style={{ display:"flex", gap:8 }}>
                  <input style={{ flex:1, background:"rgba(255,255,255,0.04)", border:`1px solid ${BR}`, borderRadius:12, padding:"10px 14px", color:TX, fontSize:13, fontFamily:FONT }} placeholder="Tag (2-4 chars)..." maxLength={4} value={clanTag} onChange={e => setClanTag(e.target.value)} />
                  <input style={{ flex:1, background:"rgba(255,255,255,0.04)", border:`1px solid ${BR}`, borderRadius:12, padding:"10px 14px", color:TX, fontSize:13, fontFamily:FONT }} placeholder="Motto..." value={clanMotto} onChange={e => setClanMotto(e.target.value)} />
                </div>
                {/* Banner emoji */}
                <div>
                  <div style={{ fontSize:11, color:TM, fontWeight:700, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.5px" }}>Banner</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {EMOJI_OPTIONS.map(em => (
                      <button key={em} onClick={() => setBannerEmoji(em)} aria-label={`Banner ${em}`} style={{
                        width:36, height:36, borderRadius:10,
                        background: bannerEmoji === em ? `${T}20` : "rgba(255,255,255,0.04)",
                        border:`1.5px solid ${bannerEmoji === em ? T : BR}`,
                        fontSize:18, cursor:"pointer", padding:0,
                      }}>{em}</button>
                    ))}
                  </div>
                </div>
                {/* Open vs Invite-only */}
                <div style={{ display:"flex", gap:6 }}>
                  {[
                    { v: true,  label: "🟢 Open",        sub: "Anyone Lv 3+ can join instantly" },
                    { v: false, label: "🔒 Invite-only", sub: "Officers approve each join" },
                  ].map(o => (
                    <button key={String(o.v)} onClick={() => setIsOpen(o.v)} style={{
                      flex:1, padding:"10px 12px", borderRadius:12, textAlign:"left",
                      background: isOpen === o.v ? `${T}10` : "rgba(255,255,255,0.03)",
                      border:`1.5px solid ${isOpen === o.v ? T : BR}`,
                      cursor:"pointer", fontFamily:FONT,
                    }}>
                      <div style={{ fontSize:12, fontWeight:800, color: isOpen === o.v ? T : TX, marginBottom:2 }}>{o.label}</div>
                      <div style={{ fontSize:10, color:TM, lineHeight:1.4 }}>{o.sub}</div>
                    </button>
                  ))}
                </div>
                <div style={{ fontSize:11, color:TM }}>Cost: <span style={{ color:TA, fontWeight:700 }}>500 AE</span> · Balance: <span style={{ color:TY, fontWeight:700 }}>{(ctx?.sharedUser?.ae || 0).toLocaleString()} AE</span></div>
                <button disabled={creating} onClick={handleCreate} style={{ padding:"13px", background: creating ? `${TM}30` : `linear-gradient(135deg, ${T}, ${TG})`, border:"none", borderRadius:12, color: creating ? TM : "#fff", fontSize:14, fontWeight:700, boxShadow: creating ? "none" : `0 4px 20px ${T}40`, cursor: creating ? "wait" : "pointer", fontFamily:FONT }}>{creating ? "⏳ Founding..." : "Found Clan →"}</button>
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
  const ctx = useContext(AppContext);
  const [topClans, setTopClans] = useState<any[]>([]);
  const [loadingBoard, setLoadingBoard] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("clans")
          .select("id, name, tag, color, rank, cpr_score, zones_held")
          .order("cpr_score", { ascending: false })
          .limit(10);
        if (data?.length) {
          setTopClans(data.map((c: any, i: number) => ({
            id: c.id, name: c.name, tag: c.tag,
            color: c.color || TL,
            rank: c.rank || i + 1,
            cpr: Number(c.cpr_score || 0),
            zones: c.zones_held || 0,
            isUs: c.id === clan.id,
          })));
        } else if (ENEMY_CLANS.length) {
          setTopClans(ENEMY_CLANS);
        }
      } catch {}
      setLoadingBoard(false);
    })();
  }, [clan.id]);

  const board = topClans.length ? topClans : ENEMY_CLANS;
  const cprSafe = Number.isFinite(clan.cpr) ? clan.cpr : 0;
  const weeklyXpSafe = Number.isFinite(clan.weeklyXP) ? clan.weeklyXP : 0;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {/* Stats grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
        {[
          { val:clan.rank || "—",           lbl:"Rank",    icon:"🏆" },
          { val:clan.zonesHeld ?? 0,        lbl:"Zones",   icon:"◈" },
          { val:String(cprSafe),            lbl:"CPR",     icon:"⚡" },
          { val:`${((clan.treasury || 0)/1000).toFixed(1)}k`, lbl:"AE", icon:"◎" },
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
          <span style={{ fontSize:16, fontWeight:800, color:clan.color, fontFamily:MONO }}>{weeklyXpSafe.toLocaleString()}</span>
        </div>
        <ProgressBar value={weeklyXpSafe} max={20000} color={clan.color} height={5} />
        <div style={{ fontSize:11, color:TM, marginTop:6 }}>This week</div>
      </Card>

      {/* Leaderboard */}
      <Card>
        <div style={{ fontSize:14, fontWeight:700, color:TX, marginBottom:12 }}>Campus Leaderboard</div>
        {loadingBoard && (
          <div style={{ padding:"24px 12px", textAlign:"center", color:TM, fontSize:12 }}>Loading leaderboard…</div>
        )}
        {!loadingBoard && board.length === 0 && (
          <div style={{ padding:"24px 12px", textAlign:"center", color:TM, fontSize:12 }}>Leaderboard will populate as clans form on campus.</div>
        )}
        {!loadingBoard && board.map((ec: any) => (
          <div key={ec.id || ec.name} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background: ec.isUs ? `${clan.color}0A` : "rgba(255,255,255,0.02)", border:`1px solid ${ec.isUs ? `${clan.color}30` : BR}`, borderRadius:12, marginBottom:6 }}>
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

      {isLeader && <LeaderControls clan={clan} />}
    </div>
  );
}

function LeaderControls({ clan }: any) {
  const ctx = useContext(AppContext);
  const [showEdit, setShowEdit] = useState(false);
  const [showAnnounce, setShowAnnounce] = useState(false);
  const [showDisband, setShowDisband] = useState(false);
  const [editMotto, setEditMotto] = useState(clan.motto || "");
  const [announceText, setAnnounceText] = useState("");

  const saveMotto = async () => {
    const newMotto = editMotto.trim();
    if (!newMotto) { showToast("⚠ Motto can't be empty", "error"); return; }
    if (ctx?.setSharedUser) ctx.setSharedUser((u: any) => u.clan ? { ...u, clan: { ...u.clan, motto: newMotto } } : u);
    if (ctx?.authUser && clan.id) {
      try { await supabase.from("clans").update({ motto: newMotto }).eq("id", clan.id); } catch {}
    }
    showToast("✏️ Clan motto updated", "success");
    setShowEdit(false);
  };

  const sendAnnouncement = async () => {
    const txt = announceText.trim();
    if (!txt) { showToast("⚠ Announcement can't be empty", "error"); return; }
    if (ctx?.authUser && clan.id) {
      try { await supabase.from("notifications").insert({ user_id: ctx.authUser.id, type: "clan_announcement", message: `[${clan.tag}] ${txt}` }); } catch {}
    }
    showToast("📢 Announcement sent to all clan members", "success");
    setAnnounceText("");
    setShowAnnounce(false);
  };

  const confirmDisband = async () => {
    if (ctx?.authUser && clan.id) {
      try {
        await supabase.from("clan_members").delete().eq("clan_id", clan.id);
        await supabase.from("clans").delete().eq("id", clan.id);
      } catch {}
    }
    if (ctx?.setSharedUser) ctx.setSharedUser((u: any) => ({ ...u, clan: null }));
    showToast(`💥 ${clan.name} has been disbanded`, "warning");
    setShowDisband(false);
  };

  return (
    <>
      <Card>
        <div style={{ fontSize:14, fontWeight:700, color:TX, marginBottom:12 }}>⚙️ Leader Controls</div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <button onClick={() => setShowEdit(true)} style={{ padding:"11px 16px", background:"rgba(255,255,255,0.03)", border:`1px solid ${BR}`, borderRadius:12, color:TX, fontSize:13, fontWeight:600, fontFamily:FONT, textAlign:"left" }}>✏️ Edit Clan Info</button>
          <button onClick={() => setShowAnnounce(true)} style={{ padding:"11px 16px", background:"rgba(255,255,255,0.03)", border:`1px solid ${BR}`, borderRadius:12, color:TX, fontSize:13, fontWeight:600, fontFamily:FONT, textAlign:"left" }}>📢 Post Announcement</button>
          <button onClick={() => setShowDisband(true)} style={{ padding:"11px 16px", background:"rgba(239,68,68,0.06)", border:`1px solid rgba(239,68,68,0.3)`, borderRadius:12, color:TR, fontSize:13, fontWeight:600, fontFamily:FONT, textAlign:"left" }}>🚪 Disband Clan</button>
        </div>
      </Card>

      {showEdit && (
        <div onClick={() => setShowEdit(false)} style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(13,17,23,0.9)", backdropFilter:"blur(16px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:S1, border:`1px solid ${BR}`, borderRadius:20, padding:24, maxWidth:380, width:"100%" }}>
            <div style={{ fontSize:18, fontWeight:800, color:TX, marginBottom:16 }}>✏️ Edit Clan Info</div>
            <div style={{ fontSize:11, fontWeight:700, color:TM, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.5px" }}>Motto</div>
            <input value={editMotto} onChange={e => setEditMotto(e.target.value)} maxLength={60} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:`1px solid ${BR}`, borderRadius:12, padding:"10px 14px", color:TX, fontSize:13, marginBottom:16, fontFamily:FONT }} />
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setShowEdit(false)} style={{ flex:1, padding:"12px", borderRadius:12, background:"rgba(255,255,255,0.06)", border:`1px solid ${BR}`, color:TX, fontSize:13, fontWeight:700, fontFamily:FONT }}>Cancel</button>
              <button onClick={saveMotto} style={{ flex:1, padding:"12px", borderRadius:12, background:`linear-gradient(135deg, ${T}, ${TG})`, border:"none", color:"#0D1117", fontSize:13, fontWeight:800, fontFamily:FONT }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showAnnounce && (
        <div onClick={() => setShowAnnounce(false)} style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(13,17,23,0.9)", backdropFilter:"blur(16px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:S1, border:`1px solid ${BR}`, borderRadius:20, padding:24, maxWidth:380, width:"100%" }}>
            <div style={{ fontSize:18, fontWeight:800, color:TX, marginBottom:16 }}>📢 Post Announcement</div>
            <textarea value={announceText} onChange={e => setAnnounceText(e.target.value)} maxLength={240} placeholder="Share news with all clan members..." style={{ width:"100%", height:100, background:"rgba(255,255,255,0.04)", border:`1px solid ${BR}`, borderRadius:12, padding:"10px 14px", color:TX, fontSize:13, resize:"none", marginBottom:8, fontFamily:FONT, lineHeight:1.5 }} />
            <div style={{ fontSize:11, color:TM, marginBottom:16, textAlign:"right" }}>{announceText.length}/240</div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setShowAnnounce(false)} style={{ flex:1, padding:"12px", borderRadius:12, background:"rgba(255,255,255,0.06)", border:`1px solid ${BR}`, color:TX, fontSize:13, fontWeight:700, fontFamily:FONT }}>Cancel</button>
              <button onClick={sendAnnouncement} disabled={!announceText.trim()} style={{ flex:1, padding:"12px", borderRadius:12, background: announceText.trim() ? `linear-gradient(135deg, ${T}, ${TG})` : "rgba(255,255,255,0.06)", border: announceText.trim() ? "none" : `1px solid ${BR}`, color: announceText.trim() ? "#0D1117" : TM, fontSize:13, fontWeight:800, fontFamily:FONT }}>Send</button>
            </div>
          </div>
        </div>
      )}

      {showDisband && (
        <div onClick={() => setShowDisband(false)} style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(13,17,23,0.9)", backdropFilter:"blur(16px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:S1, border:`1px solid ${TR}40`, borderRadius:20, padding:24, maxWidth:380, width:"100%" }}>
            <div style={{ fontSize:32, marginBottom:12, textAlign:"center" }}>💥</div>
            <div style={{ fontSize:18, fontWeight:800, color:TX, marginBottom:8, textAlign:"center" }}>Disband {clan.name}?</div>
            <div style={{ fontSize:13, color:TM, marginBottom:20, lineHeight:1.6, textAlign:"center" }}>
              All members will be removed, zones will revert to unclaimed, and the treasury will be lost. <strong style={{ color:TR }}>This cannot be undone.</strong>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setShowDisband(false)} style={{ flex:1, padding:"12px", borderRadius:12, background:"rgba(255,255,255,0.06)", border:`1px solid ${BR}`, color:TX, fontSize:13, fontWeight:700, fontFamily:FONT }}>Cancel</button>
              <button onClick={confirmDisband} style={{ flex:1, padding:"12px", borderRadius:12, background:TR, border:"none", color:"#fff", fontSize:13, fontWeight:800, fontFamily:FONT }}>Disband</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MembersTab({ clan, isLeader, isOfficer }: any) {
  const ctx = useContext(AppContext);
  const [sort, setSort] = useState("xp");
  const [confirmKick, setConfirmKick] = useState<any>(null);
  const [inviteName, setInviteName] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clan?.id) { setMembers(MEMBERS); setLoading(false); return; }
    (async () => {
      try {
        const { data } = await supabase
          .from("clan_members")
          .select("user_id, clan_role, profiles!inner(user_id, display_name, level, xp, aether)")
          .eq("clan_id", clan.id);
        if (data?.length) {
          const currentUid = ctx?.authUser?.id;
          setMembers(data.map((m: any) => ({
            id: m.user_id,
            name: m.profiles?.display_name || "Player",
            role: (m.clan_role || "member").replace(/^./, (c: string) => c.toUpperCase()),
            level: m.profiles?.level || 1,
            xp: m.profiles?.xp || 0,
            zones: 0,
            status: "online",
            avatar: (m.profiles?.display_name || "?").charAt(0).toUpperCase(),
            isMe: m.user_id === currentUid,
          })));
        } else {
          setMembers(MEMBERS);
        }
      } catch {
        setMembers(MEMBERS);
      }
      setLoading(false);
    })();
  }, [clan?.id, ctx?.authUser?.id]);

  const sorted = [...members].sort((a,b) => sort==="xp" ? b.xp-a.xp : sort==="level" ? b.level-a.level : b.zones-a.zones);
  const statusColor = { online:TG, away:TA, offline:TD };

  const handleKick = async (member: any) => {
    if (ctx?.authUser && clan.id && member.id) {
      try { await supabase.from("clan_members").delete().eq("clan_id", clan.id).eq("user_id", member.id); } catch {}
    }
    setMembers(ms => ms.filter(m => m.id !== member.id));
    showToast(`👋 ${member.name} removed from clan`, "info");
    setConfirmKick(null);
  };

  const handleInvite = () => {
    const name = inviteName.trim();
    if (!name) { showToast("⚠ Enter a player name", "error"); return; }
    showToast(`📨 Invite sent to ${name}`, "success");
    setInviteName("");
  };

  const handleRoleChange = async (member: any, newRole: "officer" | "member") => {
    if (!isLeader) { showToast("⚠ Only the leader can change roles", "error"); return; }
    if (ctx?.authUser && clan.id && member.id) {
      try { await supabase.from("clan_members").update({ clan_role: newRole }).eq("clan_id", clan.id).eq("user_id", member.id); } catch {}
    }
    setMembers(ms => ms.map(x => x.id === member.id ? { ...x, role: newRole === "officer" ? "Officer" : "Member" } : x));
    showToast(newRole === "officer" ? `↑ ${member.name} promoted to Officer` : `↓ ${member.name} demoted to Member`, "success");
  };

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
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:TG }}><span style={{ color:TG }}>◈</span> {m.zones}</div>
            {!m.isMe && m.role !== "Leader" && (
              <div style={{ display:"flex", gap:6 }}>
                {isLeader && m.role === "Member" && (
                  <button onClick={() => handleRoleChange(m, "officer")} title={`Promote ${m.name} to Officer`} style={{ padding:"3px 8px", borderRadius:8, background:`${clan.color}10`, border:`1px solid ${clan.color}40`, color: clan.color, fontSize:10, fontWeight:800, cursor:"pointer", fontFamily:FONT }}>↑ Officer</button>
                )}
                {isLeader && m.role === "Officer" && (
                  <button onClick={() => handleRoleChange(m, "member")} title={`Demote ${m.name} to Member`} style={{ padding:"3px 8px", borderRadius:8, background:"rgba(255,255,255,0.04)", border:`1px solid ${BR}`, color: TM, fontSize:10, fontWeight:800, cursor:"pointer", fontFamily:FONT }}>↓ Member</button>
                )}
                {isOfficer && (
                  <button onClick={() => setConfirmKick(m)} title={`Remove ${m.name} from clan`} style={{ width:24, height:24, borderRadius:"50%", background:`${TR}10`, border:`1px solid ${TR}30`, color:TR, fontSize:11, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontFamily:FONT, padding:0 }}>✕</button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      {sorted.length === 0 && (
        <Card style={{ textAlign:"center", padding:"32px 20px" }}>
          <div style={{ fontSize:36, marginBottom:10 }}>👥</div>
          <div style={{ fontSize:14, fontWeight:700, color:TX, marginBottom:6 }}>No members yet</div>
          <div style={{ fontSize:12, color:TM }}>Invite friends to start building your clan!</div>
        </Card>
      )}

      {isOfficer && (
        <Card>
          <div style={{ fontSize:14, fontWeight:700, color:TX, marginBottom:12 }}>➕ Invite Member</div>
          <div style={{ display:"flex", gap:8 }}>
            <input value={inviteName} onChange={e => setInviteName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleInvite()} style={{ flex:1, background:"rgba(255,255,255,0.04)", border:`1px solid ${BR}`, borderRadius:12, padding:"10px 14px", color:TX, fontSize:13, fontFamily:FONT }} placeholder="Search player name..." />
            <button onClick={handleInvite} disabled={!inviteName.trim()} style={{ padding:"10px 18px", background: inviteName.trim() ? `linear-gradient(135deg, ${T}, ${TG})` : "rgba(255,255,255,0.05)", border: inviteName.trim() ? "none" : `1px solid ${BR}`, borderRadius:12, color: inviteName.trim() ? "#0D1117" : TM, fontSize:13, fontWeight:800, fontFamily:FONT }}>Invite</button>
          </div>
        </Card>
      )}

      {confirmKick && (
        <div onClick={() => setConfirmKick(null)} style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(13,17,23,0.9)", backdropFilter:"blur(16px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:S1, border:`1px solid ${BR}`, borderRadius:20, padding:24, maxWidth:340, width:"100%" }}>
            <div style={{ fontSize:18, fontWeight:800, color:TX, marginBottom:8 }}>Remove {confirmKick.name}?</div>
            <div style={{ fontSize:13, color:TM, marginBottom:20, lineHeight:1.6 }}>They'll lose access to clan zones and treasury. They can be re-invited later.</div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setConfirmKick(null)} style={{ flex:1, padding:"12px", borderRadius:12, background:"rgba(255,255,255,0.06)", border:`1px solid ${BR}`, color:TX, fontSize:13, fontWeight:700, fontFamily:FONT }}>Cancel</button>
              <button onClick={() => handleKick(confirmKick)} style={{ flex:1, padding:"12px", borderRadius:12, background:TR, border:"none", color:"#fff", fontSize:13, fontWeight:800, fontFamily:FONT }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ZonesTab({ clan, isLeader, isOfficer }: any) {
  const ctx = useContext(AppContext);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clan?.id) { setZones(ZONES); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("zones")
          .select("id, name, type, contest_status, control_strength, aether_rate_per_hour, bonus_type, contesting_clan_tag")
          .eq("owner_clan_id", clan.id);
        if (cancelled) return;
        if (data?.length) {
          setZones(data.map((z: any) => ({
            id: z.id, name: z.name, type: z.type || "library",
            bonusType: z.bonus_type || "Standard",
            defense: z.control_strength ?? 50,
            income: Math.round((z.aether_rate_per_hour ?? 0) * 24),
            contested: z.contest_status === "contested",
            capturedBy2: z.contesting_clan_tag,
          })));
        } else {
          setZones(ZONES);
        }
      } catch { if (!cancelled) setZones(ZONES); }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [clan?.id]);

  const totalIncome = zones.reduce((s: any, z: any) => s + (z.income || 0), 0);

  const spendTreasury = async (amount: number, description: string) => {
    const current = ctx?.sharedUser?.clan?.treasury || 0;
    if (current < amount) { showToast(`⚠ Clan treasury needs ${amount} AE (has ${current})`, "error"); return false; }
    if (ctx?.setSharedUser) {
      ctx.setSharedUser((u: any) => u.clan ? { ...u, clan: { ...u.clan, treasury: (u.clan.treasury || 0) - amount } } : u);
    }
    if (ctx?.authUser && clan.id) {
      try {
        await supabase.from("clans").update({ treasury: current - amount }).eq("id", clan.id);
        await supabase.from("treasury_log").insert({ clan_id: clan.id, type: "spend", description, amount, created_by: ctx.authUser.id });
      } catch {}
    }
    return true;
  };

  const handleReinforce = async (zone: any) => {
    if (acting) return;
    setActing(`r${zone.id}`);
    const ok = await spendTreasury(200, `Reinforced ${zone.name}`);
    if (ok) showToast(`🛡️ ${zone.name} reinforced — defense up 10%`, "success");
    setActing(null);
  };

  const handleUpgrade = async (zone: any) => {
    if (!isOfficer) { showToast("⚠ Only officers can upgrade zones", "error"); return; }
    if (acting) return;
    setActing(`u${zone.id}`);
    const ok = await spendTreasury(800, `Upgraded ${zone.name}`);
    if (ok) showToast(`⬆️ ${zone.name} upgraded — +15% AE/hr`, "success");
    setActing(null);
  };

  const handleDefend = (zone: any) => {
    if (ctx?.defendZone) ctx.defendZone();
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:`${TA}08`, border:`1px solid ${TA}30`, borderRadius:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:24 }}>◎</span>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:TA, fontFamily:MONO }}>+{totalIncome} AE / day</div>
            <div style={{ fontSize:11, color:TM }}>Passive income from {zones.length} zones</div>
          </div>
        </div>
        <button onClick={() => showToast("🗺️ Head to the Map tab to attack a zone", "info")} style={{ padding:"10px 16px", background:`linear-gradient(135deg, ${T}, ${TG})`, border:"none", borderRadius:12, color:"#0D1117", fontSize:13, fontWeight:800, fontFamily:FONT }}>Attack Zone</button>
      </div>

      {loading && (
        <Card style={{ textAlign:"center", padding:"24px 20px", color:TM, fontSize:12 }}>Loading zones…</Card>
      )}

      {!loading && zones.length === 0 && (
        <Card style={{ textAlign:"center", padding:"40px 20px" }}>
          <div style={{ fontSize:36, marginBottom:10 }}>📍</div>
          <div style={{ fontSize:14, fontWeight:700, color:TX, marginBottom:6 }}>No zones held yet</div>
          <div style={{ fontSize:12, color:TM }}>Capture a zone from the Map tab to start earning AE</div>
        </Card>
      )}

      {!loading && zones.map((z: any) => (
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
              <button onClick={(e) => { e.stopPropagation(); handleReinforce(z); }} disabled={acting === `r${z.id}`} style={{ padding:"8px 12px", background:"rgba(255,255,255,0.03)", border:`1px solid ${BR}`, borderRadius:10, fontSize:12, fontWeight:700, color: acting === `r${z.id}` ? TM : TX, fontFamily:FONT, cursor: acting ? "wait" : "pointer" }}>{acting === `r${z.id}` ? "⏳ ..." : "🛡️ Reinforce (200 AE)"}</button>
              {isOfficer && <button onClick={(e) => { e.stopPropagation(); handleUpgrade(z); }} disabled={acting === `u${z.id}`} style={{ padding:"8px 12px", background:"rgba(255,255,255,0.03)", border:`1px solid ${BR}`, borderRadius:10, fontSize:12, fontWeight:700, color: acting === `u${z.id}` ? TM : TX, fontFamily:FONT, cursor: acting ? "wait" : "pointer" }}>{acting === `u${z.id}` ? "⏳ ..." : "⬆️ Upgrade (800 AE)"}</button>}
              {z.contested && <button onClick={(e) => { e.stopPropagation(); handleDefend(z); }} style={{ padding:"8px 12px", background:`${TR}10`, border:`1px solid ${TR}30`, borderRadius:10, fontSize:12, fontWeight:800, color:TR, fontFamily:FONT }}>⚔️ Defend Now!</button>}
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
  const [attackableZones, setAttackableZones] = useState<any[]>([]);
  const [contestedZones, setContestedZones] = useState<any[]>([]);
  const [warLog, setWarLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const canDeclare = selectedZone && !clanZoneOnCooldown(selectedZone);

  useEffect(() => {
    if (!clan?.id) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const [attackable, contested, log] = await Promise.all([
          // Other clans' zones we could attack
          supabase.from("zones")
            .select("id, name, type, control_strength, owner_clan_id, last_attacked_at, clans:owner_clan_id(name, tag, color)")
            .neq("owner_clan_id", clan.id)
            .not("owner_clan_id", "is", null)
            .limit(20),
          // Our zones currently being contested
          supabase.from("zones")
            .select("id, name, control_strength, contesting_clan_tag, contest_status")
            .eq("owner_clan_id", clan.id)
            .eq("contest_status", "contested"),
          // War history from treasury log
          supabase.from("treasury_log")
            .select("id, type, description, amount, created_at")
            .eq("clan_id", clan.id)
            .ilike("description", "%war%")
            .order("created_at", { ascending: false })
            .limit(15),
        ]);
        if (cancelled) return;
        if (attackable.data?.length) {
          setAttackableZones(attackable.data.map((z: any) => ({
            id: z.id, name: z.name, type: z.type || "library",
            defense: z.control_strength ?? 50,
            ownerName: z.clans?.name || "Unknown",
            ownerTag: z.clans?.tag || "—",
            ownerColor: z.clans?.color || TR,
            lastAttackedAt: z.last_attacked_at,
          })));
        } else { setAttackableZones(ATTACKABLE_ZONES); }
        if (contested.data?.length) {
          setContestedZones(contested.data.map((z: any) => ({
            id: z.id, name: z.name,
            defense: z.control_strength ?? 50,
            capturedBy2: z.contesting_clan_tag,
            contested: true,
          })));
        }
        if (log.data?.length) {
          setWarLog(log.data.map((l: any) => ({
            id: l.id, label: l.description,
            outcome: l.type === "spend" ? "declared" : "won",
            time: new Date(l.created_at).toLocaleDateString("en-GB", { day:"numeric", month:"short" }),
          })));
        } else { setWarLog(WAR_LOG); }
      } catch { /* fall back to constants which are already empty */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [clan?.id]);

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
          <span style={{ fontSize:11, color:TR, fontWeight:700 }}>{contestedZones.length} live</span>
        </div>
        {contestedZones.length === 0 && (
          <div style={{ padding:"16px 12px", textAlign:"center", color:TM, fontSize:12 }}>No active contests. All your zones are safe.</div>
        )}
        {contestedZones.map((z: any) => (
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
            {loading && <div style={{ padding:"20px 12px", textAlign:"center", color:TM, fontSize:12 }}>Loading attackable zones…</div>}
            {!loading && attackableZones.length === 0 && (
              <div style={{ padding:"20px 12px", textAlign:"center", color:TM, fontSize:12, background:"rgba(255,255,255,0.02)", border:`1px dashed ${BR}`, borderRadius:10 }}>
                No attackable zones available right now. Check again after the next reset.
              </div>
            )}
            {!loading && attackableZones.map((z: any) => {
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
                      <div style={{ fontSize:11, color:TM }}>Held by <span style={{ color: z.ownerColor || TL }}>{z.owner || z.ownerName}</span>{z.income != null && ` · +${z.income} AE/day`}</div>
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
            <button disabled={!canDeclare} onClick={async () => {
              if (!canDeclare) return;
              const cost = GAME_RULES.WAR_DECLARE_COST_AE;
              const treasury = ctx?.sharedUser?.clan?.treasury || 0;
              if (treasury < cost) { showToast(`⚠ Treasury needs ${cost} AE (has ${treasury})`, "error"); return; }
              if (ctx?.setSharedUser) ctx.setSharedUser((u: any) => u.clan ? { ...u, clan: { ...u.clan, treasury: (u.clan.treasury || 0) - cost } } : u);
              if (ctx?.authUser && clan.id) {
                try {
                  await supabase.from("clans").update({ treasury: treasury - cost }).eq("id", clan.id);
                  await supabase.from("treasury_log").insert({ clan_id: clan.id, type: "spend", description: `War declared on ${selectedZone.name}`, amount: cost, created_by: ctx.authUser.id });
                } catch {}
              }
              showToast(`⚔️ War declared on ${selectedZone.name}! −${cost} AE`, "success");
              setDeclared(true);
            }} style={{ padding:"10px 16px", background: canDeclare ? TR : TM, border:"none", borderRadius:10, color:"#fff", fontSize:13, fontWeight:700, fontFamily:FONT, boxShadow: canDeclare ? `0 4px 16px ${TR}50` : "none" }}>
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
        {loading && <div style={{ padding:"16px 12px", textAlign:"center", color:TM, fontSize:12 }}>Loading…</div>}
        {!loading && warLog.length === 0 && (
          <div style={{ padding:"24px 12px", textAlign:"center", color:TM, fontSize:12 }}>No war history yet. Declare an attack to build your legacy.</div>
        )}
        {!loading && warLog.map((w: any) => (
          <div key={w.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:`1px solid ${BR}` }}>
            <div style={{ width:38, height:38, borderRadius:10, background: w.outcome==="won" ? `${TG}15` : `${TR}15`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <span style={{ fontSize:16 }}>{w.outcome==="won" ? "🛡️" : "⚔️"}</span>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:TX, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{w.label || w.zone}</div>
              <div style={{ fontSize:11, color:TM }}>{w.time}</div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, background: w.outcome==="won" ? `${TG}20` : `${TR}20`, color: w.outcome==="won" ? TG : TR, border:`1px solid ${w.outcome==="won" ? `${TG}40` : `${TR}40`}` }}>
                {w.outcome === "declared" ? "Declared" : w.outcome === "won" ? "Victory" : "Defeat"}
              </div>
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
  const [treasuryLog, setTreasuryLog] = useState<any[]>([]);
  const [logLoading, setLogLoading] = useState(true);
  const [zoneIncome, setZoneIncome] = useState(0);
  const clanData = ctx?.sharedUser?.clan || clan;

  useEffect(() => {
    if (!clan?.id) { setLogLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const [logRes, zonesRes] = await Promise.all([
          supabase.from("treasury_log")
            .select("id, type, description, amount, created_at, profiles:created_by(display_name)")
            .eq("clan_id", clan.id)
            .order("created_at", { ascending: false })
            .limit(20),
          supabase.from("zones")
            .select("aether_rate_per_hour")
            .eq("owner_clan_id", clan.id),
        ]);
        if (cancelled) return;
        if (logRes.data?.length) {
          setTreasuryLog(logRes.data.map((l: any) => ({
            id: l.id, type: l.type, label: l.description,
            amount: l.amount, by: l.profiles?.display_name || "—",
            time: new Date(l.created_at).toLocaleString("en-GB", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" }),
          })));
        } else {
          setTreasuryLog(TREASURY_LOG);
        }
        const totalRate = (zonesRes.data || []).reduce((s: number, z: any) => s + (z.aether_rate_per_hour || 0), 0);
        setZoneIncome(Math.round(totalRate * 24));
      } catch { /* keep defaults */ }
      if (!cancelled) setLogLoading(false);
    })();
    return () => { cancelled = true; };
  }, [clan?.id]);
  const totalIncome = zoneIncome;
  const treasuryBalance = clanData.treasury || 0;

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
            {[
              { icon:"🛡️", lbl:"Reinforce Zone", cost:200, desc:"Boost a zone's defense +10%" },
              { icon:"⬆️", lbl:"Upgrade Zone",   cost:800, desc:"+15% AE/hr on one zone" },
              { icon:"⚔️", lbl:"War Declaration",cost:200, desc:"Start a raid on an enemy zone" },
              { icon:"📢", lbl:"Clan Broadcast",  cost:100, desc:"Send all members a notification" },
            ].map(({ icon, lbl, cost, desc }) => {
              const canAfford = treasuryBalance >= cost;
              return (
                <button
                  key={lbl}
                  disabled={!canAfford}
                  onClick={async () => {
                    if (!canAfford) { showToast(`⚠ Need ${cost} AE (have ${treasuryBalance})`, "error"); return; }
                    if (ctx?.setSharedUser) ctx.setSharedUser((u: any) => u.clan ? { ...u, clan: { ...u.clan, treasury: (u.clan.treasury || 0) - cost } } : u);
                    if (ctx?.authUser && clan.id) {
                      try {
                        await supabase.from("clans").update({ treasury: treasuryBalance - cost }).eq("id", clan.id);
                        await supabase.from("treasury_log").insert({ clan_id: clan.id, type: "spend", description: lbl, amount: cost, created_by: ctx.authUser.id });
                      } catch {}
                    }
                    showToast(`${icon} ${lbl} — ${desc} (−${cost} AE)`, "success");
                  }}
                  title={desc}
                  style={{
                    display:"flex", flexDirection:"column", alignItems:"flex-start", gap:4, padding:"12px",
                    background: canAfford ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.015)",
                    border:`1px solid ${canAfford ? BR : `${TR}30`}`, borderRadius:12, fontFamily:FONT,
                    opacity: canAfford ? 1 : 0.5, cursor: canAfford ? "pointer" : "not-allowed", textAlign:"left",
                  }}
                >
                  <span style={{ fontSize:20 }}>{icon}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:TX }}>{lbl}</span>
                  <span style={{ fontSize:11, color: canAfford ? TA : TR, fontWeight:700 }}>{cost} AE</span>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <Card>
        <div style={{ fontSize:14, fontWeight:700, color:TX, marginBottom:12 }}>📋 Transactions</div>
        {logLoading && <div style={{ padding:"16px 12px", textAlign:"center", color:TM, fontSize:12 }}>Loading…</div>}
        {!logLoading && treasuryLog.length === 0 && (
          <div style={{ padding:"24px 12px", textAlign:"center", color:TM, fontSize:12 }}>No treasury activity yet. Donate or spend to see the log here.</div>
        )}
        {!logLoading && treasuryLog.map((t: any) => (
          <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:`1px solid ${BR}` }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background: t.type==="income" ? TG : TR, flexShrink:0 }} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:600, color:TX, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.label || t.desc}</div>
              <div style={{ fontSize:11, color:TM }}>{t.time}{t.by ? ` · ${t.by}` : ""}</div>
            </div>
            <div style={{ fontSize:13, fontWeight:700, color: t.type==="income" ? TG : TR, flexShrink:0 }}>
              {t.type==="income" ? "+" : "−"}{Math.abs(t.amount).toLocaleString()} AE
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
