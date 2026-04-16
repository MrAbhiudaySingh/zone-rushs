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

function getDistanceMetres(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export function ZoneMapScreen() {
  const ctx = useContext(AppContext);
  const [zones, setZones] = useState([]);
  const [userPos, setUserPos] = useState<any>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [capturing, setCapturing] = useState<any>(null);
  const [elapsed, setElapsed] = useState(0);
  const [filter, setFilter] = useState("all");
  const watchRef = useRef(null);
  const timerRef = useRef(null);

  const CAPTURE_TIME_SECONDS = 30 * 60;
  const GEO_RADIUS = 100;

  useEffect(() => {
    const fetchZones = async () => {
      const { data } = await supabase.from("zones").select("*, owner_clan:clans!zones_owner_clan_id_fkey(name, tag, color)");
      if (data) setZones(data);
      else setZones((window as any).__zr_zones || []);
    };
    fetchZones();
    const checkActive = async () => {
      if (!ctx?.authUser) return;
      const { data: active } = await supabase.from("zone_captures")
        .select("*").eq("attacker_user_id", ctx.authUser.id).eq("status", "capturing").maybeSingle();
      if (active) {
        setCapturing({
          zoneId: active.zone_id, startedAt: new Date(active.timer_started_at).getTime(),
          pausedAt: active.timer_paused_at ? new Date(active.timer_paused_at).getTime() : null,
          totalPaused: active.total_paused_seconds || 0, captureId: active.id,
        });
      }
    };
    checkActive();
  }, [ctx?.authUser]);

  useEffect(() => {
    if (!navigator.geolocation) { setGpsError("GPS not available"); return; }
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => { setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy }); setGpsError(null); },
      (err) => setGpsError(err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    return () => { if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current); };
  }, []);

  useEffect(() => {
    if (!capturing || capturing.pausedAt) return;
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const active = Math.floor((now - capturing.startedAt) / 1000) - capturing.totalPaused;
      setElapsed(active);
      if (active >= CAPTURE_TIME_SECONDS) { clearInterval(timerRef.current); completeCapture(); }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [capturing]);

  useEffect(() => {
    if (!capturing || !userPos) return;
    const zone = zones.find((z: any) => z.id === capturing.zoneId);
    if (!zone) return;
    const dist = getDistanceMetres(userPos.lat, userPos.lng, zone.latitude, zone.longitude);
    const inRange = dist <= GEO_RADIUS;
    if (!inRange && !capturing.pausedAt) {
      const now = Date.now();
      setCapturing(c => ({ ...c, pausedAt: now }));
      showToast("⚠ Left zone radius — timer paused!", "warning");
      if (ctx?.authUser && capturing.captureId) {
        supabase.from("zone_captures").update({ timer_paused_at: new Date(now).toISOString() }).eq("id", capturing.captureId).then(() => {});
      }
    } else if (inRange && capturing.pausedAt) {
      const pauseDuration = Math.floor((Date.now() - capturing.pausedAt) / 1000);
      setCapturing(c => ({ ...c, pausedAt: null, totalPaused: c.totalPaused + pauseDuration }));
      showToast("✓ Back in zone — timer resumed!", "success");
      if (ctx?.authUser && capturing.captureId) {
        supabase.from("zone_captures").update({ timer_paused_at: null, total_paused_seconds: capturing.totalPaused + pauseDuration }).eq("id", capturing.captureId).then(() => {});
      }
    }
  }, [userPos, capturing?.zoneId]);

  const completeCapture = async () => {
    if (!capturing) return;
    const zone = zones.find((z: any) => z.id === capturing.zoneId);
    const userClan = ctx?.sharedUser?.clan;
    if (ctx?.authUser && userClan) {
      await supabase.from("zones").update({ owner_clan_id: userClan.id, contest_status: "peaceful", last_capture_at: new Date().toISOString(), control_strength: 50 }).eq("id", capturing.zoneId);
      await supabase.from("zone_captures").update({ status: "completed" }).eq("id", capturing.captureId);
      const { count } = await supabase.from("zones").select("id", { count: "exact", head: true }).eq("owner_clan_id", userClan.id);
      await supabase.from("clans").update({ zones_held: count || 0 }).eq("id", userClan.id);
    }
    setZones(zs => zs.map((z: any) => z.id === capturing.zoneId ? { ...z, owner_clan_id: userClan?.id, owner_clan: userClan ? { name: userClan.name, tag: userClan.tag, color: userClan.color } : null, contest_status: "peaceful", last_capture_at: new Date().toISOString() } : z));
    if (ctx?.setSharedUser) {
      ctx.setSharedUser((u: any) => {
        const aeReward = zone?.aether_rate_per_hour || 25;
        let newXp = u.xp + 150, newLevel = u.level, newXpNext = u.xpNext;
        while (newXp >= newXpNext) { newXp -= newXpNext; newLevel++; newXpNext = Math.floor(newXpNext * 1.25); }
        return { ...u, ae: u.ae + aeReward, xp: newXp, level: newLevel, xpNext: newXpNext, clan: u.clan ? { ...u.clan, zonesHeld: (u.clan.zonesHeld || 0) + 1 } : u.clan };
      });
    }
    showToast(`📍 ${zone?.name || "Zone"} captured! +${zone?.aether_rate_per_hour || 25} AE +150 XP`, "success");
    setCapturing(null); setElapsed(0); setSelectedZone(null);
  };

  const startCapture = async (zone) => {
    const userClan = ctx?.sharedUser?.clan;
    if (!userClan) { showToast("⚠ Join a clan first to capture zones!", "error"); return; }
    if (zone.owner_clan_id === userClan.id) { showToast("⚠ Your clan already owns this zone!", "error"); return; }
    if (zone.recapture_cooldown_until && new Date(zone.recapture_cooldown_until) > new Date()) { showToast("⚠ Zone is on cooldown!", "error"); return; }
    const now = Date.now();
    let captureId = null;
    if (ctx?.authUser) {
      const { data, error } = await supabase.from("zone_captures").insert({ zone_id: zone.id, attacking_clan_id: userClan.id, attacker_user_id: ctx.authUser.id, timer_started_at: new Date(now).toISOString(), status: "capturing" }).select().single();
      if (error) { showToast(`❌ ${error.message}`, "error"); return; }
      captureId = data?.id;
      await supabase.from("zones").update({ contest_status: "contested" }).eq("id", zone.id);
    }
    setCapturing({ zoneId: zone.id, startedAt: now, pausedAt: null, totalPaused: 0, captureId });
    setZones(zs => zs.map((z: any) => z.id === zone.id ? { ...z, contest_status: "contested" } : z));
    showToast("⚔️ Capture started! Stay within 100m for 30 minutes.", "success");
  };

  const cancelCapture = async () => {
    if (capturing?.captureId && ctx?.authUser) {
      await supabase.from("zone_captures").update({ status: "cancelled" }).eq("id", capturing.captureId);
      await supabase.from("zones").update({ contest_status: "peaceful" }).eq("id", capturing.zoneId);
    }
    setZones(zs => zs.map((z: any) => z.id === capturing?.zoneId ? { ...z, contest_status: "peaceful" } : z));
    setCapturing(null); setElapsed(0);
    showToast("Capture cancelled.", "info");
  };

  const zonesWithDist = zones.map((z: any) => ({
    ...z,
    distance: userPos ? getDistanceMetres(userPos.lat, userPos.lng, z.latitude, z.longitude) : null,
    inRange: userPos ? getDistanceMetres(userPos.lat, userPos.lng, z.latitude, z.longitude) <= GEO_RADIUS : false,
  })).sort((a, b) => (a.distance ?? 9999999) - (b.distance ?? 9999999));

  const filtered = filter === "all" ? zonesWithDist
    : filter === "nearby" ? zonesWithDist.filter((z: any) => z.distance !== null && z.distance <= 500)
    : filter === "capturable" ? zonesWithDist.filter((z: any) => z.inRange && z.owner_clan_id !== ctx?.sharedUser?.clan?.id)
    : zonesWithDist.filter((z: any) => z.zone_type === filter);

  const ZONE_ICONS = { landmark:"🏛️", arena:"🏟️", residential:"🏠", standard:"📍" };
  const ZONE_COLORS = { landmark:TY, arena:TA, residential:T, standard:TB };
  const remaining = Math.max(0, CAPTURE_TIME_SECONDS - elapsed);
  const capMM = String(Math.floor(remaining / 60)).padStart(2, "0");
  const capSS = String(remaining % 60).padStart(2, "0");
  const capPct = (elapsed / CAPTURE_TIME_SECONDS) * 100;

  return (
    <div style={{ position:"relative", zIndex:1, height:"100dvh", overflowY:"auto", paddingBottom:90 }}>
      <div style={{ padding:"16px 16px 0" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div>
            <div style={{ fontSize:22, fontWeight:900, color:TX, letterSpacing:"-0.5px" }}>Zone Map</div>
            <div style={{ fontSize:12, color:TM }}>{zones.length} zones · {zonesWithDist.filter((z: any) => z.inRange).length} in range</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:10, height:10, borderRadius:"50%", background: userPos ? TG : gpsError ? TR : TY, boxShadow: userPos ? `0 0 8px ${TG}` : "none", animation: !userPos && !gpsError ? "pulse 1.5s infinite" : "none" }} />
            <span style={{ fontSize:11, color: userPos ? TG : TM, fontWeight:700 }}>
              {userPos ? `GPS ±${Math.round(userPos.acc)}m` : gpsError ? "GPS Error" : "Locating..."}
            </span>
          </div>
        </div>

        {capturing && (
          <div style={{ padding:"16px", borderRadius:20, marginBottom:12, position:"relative", overflow:"hidden", background:`linear-gradient(135deg, ${TA}15, ${TR}10)`, border:`2px solid ${capturing.pausedAt ? `${TY}60` : `${TA}60`}`, boxShadow:`0 8px 32px ${TA}20`, animation: capturing.pausedAt ? "none" : "contestPulse 2.5s ease-in-out infinite" }}>
            <div style={{ position:"absolute", top:0, left:0, bottom:0, width:`${capPct}%`, background:`${TA}12`, transition:"width 1s linear" }} />
            <div style={{ position:"relative" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:20 }}>⚔️</span>
                  <div>
                    <div style={{ fontSize:14, fontWeight:800, color:TX }}>{zones.find((z: any) => z.id === capturing.zoneId)?.name || "Zone"}</div>
                    <div style={{ fontSize:11, color: capturing.pausedAt ? TY : TA, fontWeight:700 }}>{capturing.pausedAt ? "⏸ PAUSED — Return to zone" : "CAPTURING..."}</div>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:28, fontWeight:900, color: capturing.pausedAt ? TY : "#fff", fontFamily:MONO, letterSpacing:2 }}>{capMM}:{capSS}</div>
                  <div style={{ fontSize:10, color:TM }}>remaining</div>
                </div>
              </div>
              <div style={{ height:6, background:"rgba(255,255,255,0.08)", borderRadius:99, overflow:"hidden", marginBottom:10 }}>
                <div style={{ height:"100%", width:`${capPct}%`, borderRadius:99, background:`linear-gradient(90deg, ${T}, ${TG})`, transition:"width 1s linear", boxShadow:`0 0 8px ${TG}60` }} />
              </div>
              <button onClick={cancelCapture} style={{ padding:"8px 16px", background:"rgba(255,71,87,0.15)", border:`1px solid ${TR}40`, borderRadius:10, color:TR, fontSize:12, fontWeight:700, fontFamily:FONT }}>✕ Cancel Capture</button>
            </div>
          </div>
        )}

        <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:8 }}>
          {[
            { id:"all", label:"All", icon:"🌐" },
            { id:"nearby", label:"Nearby", icon:"📡" },
            { id:"capturable", label:"Capturable", icon:"⚔️" },
            { id:"landmark", label:"Landmarks", icon:"🏛️" },
            { id:"arena", label:"Arenas", icon:"🏟️" },
            { id:"residential", label:"Residential", icon:"🏠" },
          ].map((f: any) => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding:"7px 14px", borderRadius:99, border:`1.5px solid ${filter === f.id ? `${T}60` : BR}`,
              background: filter === f.id ? `${T}15` : "rgba(255,255,255,0.03)",
              color: filter === f.id ? T : TM, fontSize:12, fontWeight:700, fontFamily:FONT,
              whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:5, flexShrink:0,
            }}>
              <span style={{ fontSize:13 }}>{f.icon}</span> {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:"0 16px", display:"flex", flexDirection:"column", gap:8 }}>
        {filtered.map((z: any) => {
          const isOwned = z.owner_clan_id === ctx?.sharedUser?.clan?.id;
          const isSel = selectedZone?.id === z.id;
          const zColor = ZONE_COLORS[z.zone_type] || TB;
          const ownerName = z.owner_clan?.name || (z.owner_clan_id ? "Unknown" : null);
          return (
            <div key={z.id} onClick={() => setSelectedZone(isSel ? null : z)} style={{
              background: isSel ? `${zColor}08` : S1, border:`1.5px solid ${z.inRange ? `${TG}50` : z.contest_status === "contested" ? `${TR}50` : isSel ? `${zColor}40` : BR}`,
              borderRadius:18, padding:"14px 16px", cursor:"pointer", position:"relative", overflow:"hidden", transition:"all 0.2s",
              animation: z.contest_status === "contested" ? "contestPulse 2.5s ease-in-out infinite" : "none",
            }}>
              {z.inRange && <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg, ${TG}, ${T})`, boxShadow:`0 0 8px ${TG}60` }} />}
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:48, height:48, borderRadius:14, flexShrink:0, background:`${zColor}15`, border:`1.5px solid ${zColor}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>
                  {ZONE_ICONS[z.zone_type] || "📍"}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:TX, marginBottom:3 }}>{z.name}</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, alignItems:"center" }}>
                    <span style={{ fontSize:10, fontWeight:700, color:zColor, background:`${zColor}12`, borderRadius:99, padding:"2px 8px", textTransform:"capitalize" }}>{z.zone_type}</span>
                    {z.distance !== null && <span style={{ fontSize:10, fontWeight:700, color: z.inRange ? TG : TM }}>{z.distance < 1000 ? `${Math.round(z.distance)}m` : `${(z.distance/1000).toFixed(1)}km`}{z.inRange && " ✓"}</span>}
                    {ownerName && <span style={{ fontSize:10, fontWeight:700, color: z.owner_clan?.color || TM }}>🏴 {z.owner_clan?.tag || "??"}</span>}
                    {z.contest_status === "contested" && <span style={{ fontSize:10, fontWeight:800, color:TR, animation:"pulse 1s infinite" }}>⚔️ CONTESTED</span>}
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontSize:16, fontWeight:900, color: isOwned ? TG : TY, fontFamily:MONO }}>+{z.aether_rate_per_hour}</div>
                  <div style={{ fontSize:9, color:TM }}>AE/hr</div>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:10 }}>
                <span style={{ fontSize:10, color:TM, width:90 }}>Strength: {z.control_strength}%</span>
                <div style={{ flex:1, height:4, background:"rgba(255,255,255,0.06)", borderRadius:99, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${z.control_strength}%`, borderRadius:99, background: z.control_strength > 75 ? TG : z.control_strength > 40 ? TA : TR }} />
                </div>
              </div>
              {isSel && (
                <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${BR}` }}>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                    <span style={{ fontSize:11, color:TM }}>Tier {z.tier}</span>
                    <span style={{ fontSize:11, color:TM }}>·</span>
                    <span style={{ fontSize:11, color:TM }}>Dev Lv {z.development_level}</span>
                    {ownerName ? <><span style={{ fontSize:11, color:TM }}>·</span><span style={{ fontSize:11, color: z.owner_clan?.color || TM }}>Owned by {ownerName}</span></> : <span style={{ fontSize:11, color:TG, fontWeight:700 }}>Unclaimed!</span>}
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    {z.inRange && !capturing && !isOwned && (
                      <button onClick={(e) => { e.stopPropagation(); startCapture(z); }} style={{ flex:1, padding:"12px", borderRadius:14, border:"none", fontFamily:FONT, background:`linear-gradient(135deg, ${TA}, #FF9F1C)`, color:"#0D1117", fontSize:14, fontWeight:900, boxShadow:`0 4px 20px ${TA}50`, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                        ⚔️ Capture Zone
                      </button>
                    )}
                    {z.inRange && isOwned && (
                      <button style={{ flex:1, padding:"12px", borderRadius:14, border:`1.5px solid ${TG}40`, background:`${TG}10`, color:TG, fontSize:13, fontWeight:700, fontFamily:FONT }}>🛡️ Your Zone</button>
                    )}
                    {!z.inRange && (
                      <div style={{ flex:1, padding:"12px", borderRadius:14, background:"rgba(255,255,255,0.03)", border:`1px solid ${BR}`, textAlign:"center" }}>
                        <span style={{ fontSize:12, color:TM }}>📡 Get within {GEO_RADIUS}m to capture</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign:"center", padding:"40px 20px" }}>
            <span style={{ fontSize:40 }}>🗺️</span>
            <div style={{ fontSize:14, fontWeight:700, color:TM, marginTop:12 }}>No zones match this filter</div>
          </div>
        )}
      </div>
      <div style={{ height:40 }} />
    </div>
  );
}
