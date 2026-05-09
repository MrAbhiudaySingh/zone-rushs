// @ts-nocheck
// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS SCREEN — accessed from the bell icon on Home header.
// Real-time subscribed; mark-as-read; group by today/this week/older.
// ═══════════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppContext } from "../AppContext";
import { showToast } from "../toast";
import { Card } from "../ui/Primitives";
import { BG, S1, BR, T, TG, TA, TR, TX, TM, TD, FONT, MONO } from "../constants";

interface NotificationsScreenProps { onBack: () => void; }

const TYPE_META: any = {
  clan_announcement:   { icon:"📢", color:TA, label:"Clan" },
  zone_under_attack:   { icon:"⚔️",  color:TR, label:"Defense" },
  mission_complete:    { icon:"✓",   color:TG, label:"Mission" },
  level_up:            { icon:"⬆️",  color:T,  label:"Level" },
  story_clue:          { icon:"🔍", color:TA, label:"Story" },
  admin_message:       { icon:"📬", color:T,  label:"Admin" },
  wellbeing_outreach:  { icon:"💙", color:"#A78BFA", label:"Wellbeing" },
  invite:              { icon:"📨", color:TG, label:"Invite" },
  warning:             { icon:"⚠️",  color:TR, label:"Warning" },
};

export function NotificationsScreen({ onBack }: NotificationsScreenProps) {
  const ctx = useContext(AppContext);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const uid = ctx?.authUser?.id;

  const load = async () => {
    if (!uid) { setLoading(false); return; }
    try {
      const { data } = await supabase
        .from("notifications")
        .select("id, type, message, read, created_at, action_url")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(100);
      setItems(data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!uid) return;
    // Real-time subscription so new notifications appear immediately.
    const chan = supabase
      .channel("notif-screen-" + uid)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` },
        (payload: any) => setItems(prev => [payload.new, ...prev]))
      .subscribe();
    return () => { supabase.removeChannel(chan); };
  }, [uid]);

  const markRead = async (id: string) => {
    setItems(arr => arr.map(n => n.id === id ? { ...n, read: true } : n));
    try { await supabase.from("notifications").update({ read: true }).eq("id", id); } catch {}
  };

  const markAllRead = async () => {
    const ids = items.filter(n => !n.read).map(n => n.id);
    if (ids.length === 0) return;
    setItems(arr => arr.map(n => ({ ...n, read: true })));
    try { await supabase.from("notifications").update({ read: true }).in("id", ids); } catch {}
    showToast(`✓ Marked ${ids.length} notification${ids.length>1?"s":""} as read`, "success");
  };

  const clearOld = async () => {
    const cutoff = Date.now() - 7 * 86400000;
    const ids = items.filter(n => new Date(n.created_at).getTime() < cutoff).map(n => n.id);
    if (ids.length === 0) { showToast("Nothing older than a week to clear", "info"); return; }
    setItems(arr => arr.filter(n => !ids.includes(n.id)));
    try { await supabase.from("notifications").delete().in("id", ids); } catch {}
    showToast(`🗑 Cleared ${ids.length} old notification${ids.length>1?"s":""}`, "success");
  };

  // Group by recency
  const now = Date.now();
  const groups: Record<string, any[]> = { today: [], week: [], older: [] };
  items.forEach((n: any) => {
    const ageH = (now - new Date(n.created_at).getTime()) / 3600000;
    if (ageH < 24) groups.today.push(n);
    else if (ageH < 24 * 7) groups.week.push(n);
    else groups.older.push(n);
  });

  const unreadCount = items.filter(n => !n.read).length;

  return (
    <div style={{ minHeight:"100vh", background:BG, paddingBottom:120 }}>
      <div style={{ position:"sticky", top:0, zIndex:30, background:BG, borderBottom:`1px solid ${BR}`, padding:"14px 16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={onBack} aria-label="Back" style={{ width:38, height:38, borderRadius:12, background:S1, border:`1px solid ${BR}`, color:TX, fontSize:16, cursor:"pointer", fontFamily:FONT }}>←</button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:18, fontWeight:900, color:TX, letterSpacing:"-0.3px" }}>Notifications</div>
            <div style={{ fontSize:11, color:TM }}>
              {unreadCount > 0 ? <><span style={{ color:T, fontWeight:700 }}>{unreadCount}</span> unread · {items.length} total</> : `All caught up · ${items.length} total`}
            </div>
          </div>
          {unreadCount > 0 && <button onClick={markAllRead} style={{ padding:"8px 12px", background:S1, border:`1px solid ${BR}`, borderRadius:10, color:T, fontSize:11, fontWeight:700, fontFamily:FONT, cursor:"pointer" }}>Mark all read</button>}
        </div>
      </div>

      <div style={{ padding:"16px" }}>
        {loading && <div style={{ padding:"40px 20px", textAlign:"center", color:TM, fontSize:13 }}>Loading…</div>}

        {!loading && items.length === 0 && (
          <Card style={{ textAlign:"center", padding:"48px 20px" }}>
            <div style={{ fontSize:42, marginBottom:12 }}>🔔</div>
            <div style={{ fontSize:15, fontWeight:700, color:TX, marginBottom:6 }}>You're all caught up</div>
            <div style={{ fontSize:12, color:TM }}>Notifications about quests, zones, and your clan will appear here.</div>
          </Card>
        )}

        {(["today", "week", "older"] as const).map(key => groups[key].length > 0 && (
          <div key={key} style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, color:TM, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:8, padding:"0 4px" }}>
              {key === "today" ? "Last 24 hours" : key === "week" ? "This week" : "Older"}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {groups[key].map((n: any) => {
                const meta = TYPE_META[n.type] || { icon:"🔔", color:T, label:"Update" };
                const ageMin = (now - new Date(n.created_at).getTime()) / 60000;
                const ago = ageMin < 1 ? "just now"
                  : ageMin < 60 ? `${Math.floor(ageMin)}m ago`
                  : ageMin < 1440 ? `${Math.floor(ageMin / 60)}h ago`
                  : `${Math.floor(ageMin / 1440)}d ago`;
                return (
                  <div key={n.id} onClick={() => !n.read && markRead(n.id)} style={{
                    display:"flex", gap:11, padding:"12px 14px",
                    background: n.read ? "rgba(255,255,255,0.02)" : `${meta.color}10`,
                    border:`1px solid ${n.read ? BR : `${meta.color}30`}`,
                    borderRadius:14, cursor: n.read ? "default" : "pointer",
                  }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:`${meta.color}20`, border:`1px solid ${meta.color}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{meta.icon}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                        <span style={{ fontSize:10, fontWeight:800, color:meta.color, textTransform:"uppercase", letterSpacing:"0.4px" }}>{meta.label}</span>
                        {!n.read && <span style={{ width:6, height:6, borderRadius:"50%", background:meta.color }} />}
                        <span style={{ marginLeft:"auto", fontSize:10, color:TM, fontFamily:MONO }}>{ago}</span>
                      </div>
                      <div style={{ fontSize:13, color: n.read ? TM : TX, lineHeight:1.4, fontWeight: n.read ? 500 : 600 }}>{n.message}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {groups.older.length > 0 && (
          <button onClick={clearOld} style={{ width:"100%", padding:"12px", background:"rgba(239,68,68,0.06)", border:`1px solid rgba(239,68,68,0.25)`, borderRadius:12, color:TR, fontSize:12, fontWeight:700, fontFamily:FONT, cursor:"pointer", marginTop:8 }}>🗑 Clear notifications older than 1 week</button>
        )}
      </div>
    </div>
  );
}

// Bell icon for the Home header — exported so HomeScreen can drop it into HudHeader.
export function NotificationBell({ onClick }: { onClick: () => void }) {
  const ctx = useContext(AppContext);
  const [unread, setUnread] = useState(0);
  const uid = ctx?.authUser?.id;

  useEffect(() => {
    if (!uid) return;
    const fetchCount = async () => {
      try {
        const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("read", false);
        setUnread(count || 0);
      } catch {}
    };
    fetchCount();
    const chan = supabase
      .channel("notif-bell-" + uid)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` },
        () => fetchCount())
      .subscribe();
    return () => { supabase.removeChannel(chan); };
  }, [uid]);

  return (
    <button onClick={onClick} aria-label={`Notifications, ${unread} unread`} style={{
      position:"relative", width:38, height:38, borderRadius:12, background:S1,
      border:`1px solid ${BR}`, color:TX, fontSize:17, cursor:"pointer", fontFamily:FONT,
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      🔔
      {unread > 0 && (
        <div style={{
          position:"absolute", top:-3, right:-3,
          minWidth:18, height:18, padding:"0 5px", borderRadius:99,
          background:TR, border:`2px solid ${BG}`,
          color:"#fff", fontSize:10, fontWeight:800, fontFamily:MONO,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>{unread > 99 ? "99+" : unread}</div>
      )}
    </button>
  );
}
