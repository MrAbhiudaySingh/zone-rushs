// @ts-nocheck
// ═══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD SCREEN — 4 boards: Players (ER) / Clans (CPR) / Style / Campus Rep
// Reachable from a header icon on Home; back-navigation via onBack prop.
// ═══════════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppContext } from "../AppContext";
import { Card, TabBar } from "../ui/Primitives";
import {
  BG, S1, S2, BR, T, TL, TG, TA, TY, TR, TX, TM, TD, FONT, MONO,
} from "../constants";

interface LeaderboardScreenProps { onBack: () => void; }

const BOARDS = [
  ["players",    "Players",    "👥"],
  ["clans",      "Clans",      "⚔️"],
  ["style",      "Style",      "👗"],
  ["reputation", "Reputation", "🌟"],
];

export function LeaderboardScreen({ onBack }: LeaderboardScreenProps) {
  const ctx = useContext(AppContext);
  const [board, setBoard] = useState<"players"|"clans"|"style"|"reputation">("players");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<"all"|"week">("all");
  const myUid = ctx?.authUser?.id;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        let result: any[] = [];
        if (board === "players") {
          // ER = XP 40% + completion 25% + story 20% + recency 15%
          const { data } = await supabase
            .from("profiles")
            .select("user_id, display_name, level, xp, combat_rank, story_clues, missions_completed, updated_at")
            .order("xp", { ascending: false })
            .limit(50);
          const now = Date.now();
          result = (data || []).map((p: any) => {
            const xpScore = Math.min(1, (p.xp || 0) / 50000);
            const completionScore = Math.min(1, (p.missions_completed || 0) / 200);
            const storyScore = Math.min(1, (p.story_clues || 0) / 30);
            const daysAgo = p.updated_at ? Math.max(0, (now - new Date(p.updated_at).getTime()) / 86400000) : 30;
            const recencyScore = Math.max(0, 1 - daysAgo / 14);
            const er = Math.round((xpScore * 40 + completionScore * 25 + storyScore * 20 + recencyScore * 15) * 100) / 100;
            return {
              id: p.user_id,
              name: p.display_name || "Player",
              meta: `Lv ${p.level || 1}`,
              score: er,
              metric: "ER",
              isMe: p.user_id === myUid,
            };
          }).sort((a, b) => b.score - a.score);
        } else if (board === "clans") {
          // CPR = missions 35% + territory 30% + story 20% + avg ER 15%
          const { data: clans } = await supabase
            .from("clans")
            .select("id, name, tag, color, member_count, zones_held, story_clues_total, missions_total")
            .limit(50);
          result = (clans || []).map((c: any) => {
            const missions = Math.min(1, (c.missions_total || 0) / 1000);
            const territory = Math.min(1, (c.zones_held || 0) / 10);
            const story = Math.min(1, (c.story_clues_total || 0) / 100);
            const avgEr = 0.5; // Placeholder until per-member ER aggregation lands
            const sizeFactor = c.member_count ? Math.min(1, 8 / Math.max(1, c.member_count)) : 1;
            const cpr = Math.round((missions * 35 + territory * 30 + story * 20 + avgEr * 15) * sizeFactor * 100) / 100;
            return {
              id: c.id,
              name: c.name,
              tag: c.tag,
              color: c.color,
              meta: `${c.member_count || 0} members`,
              score: cpr,
              metric: "CPR",
              isMe: ctx?.sharedUser?.clan?.id === c.id,
            };
          }).sort((a, b) => b.score - a.score);
        } else if (board === "style") {
          // Designers ranked by total wins / submissions
          const { data } = await supabase
            .from("style_submissions")
            .select("user_id, profiles!inner(display_name, level), votes, is_winner")
            .order("votes", { ascending: false })
            .limit(50);
          const grouped: Record<string, any> = {};
          (data || []).forEach((s: any) => {
            const k = s.user_id;
            if (!grouped[k]) grouped[k] = { id: k, name: s.profiles?.display_name || "Designer", meta: `Lv ${s.profiles?.level || 1}`, votes: 0, wins: 0 };
            grouped[k].votes += s.votes || 0;
            if (s.is_winner) grouped[k].wins += 1;
          });
          result = Object.values(grouped).map((g: any) => ({
            id: g.id, name: g.name, meta: `${g.wins} wins · ${g.votes} votes`,
            score: g.wins * 100 + g.votes,
            metric: "PTS",
            isMe: g.id === myUid,
          })).sort((a: any, b: any) => b.score - a.score);
        } else {
          // Campus Reputation = sum of influence-bearing actions
          const { data } = await supabase
            .from("profiles")
            .select("user_id, display_name, level, influence_points, influence_rank")
            .order("influence_points", { ascending: false })
            .limit(50);
          result = (data || []).map((p: any) => ({
            id: p.user_id,
            name: p.display_name || "Player",
            meta: p.influence_rank || `Lv ${p.level || 1}`,
            score: p.influence_points || 0,
            metric: "IP",
            isMe: p.user_id === myUid,
          }));
        }
        if (!cancelled) {
          // Add ranks
          result = result.map((r: any, i: number) => ({ ...r, rank: i + 1 }));
          setRows(result);
        }
      } catch (err) {
        if (!cancelled) setRows([]);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [board, scope, myUid]);

  const myRow = rows.find((r: any) => r.isMe);
  const podium = rows.slice(0, 3);
  const list = rows.slice(3, 50);

  // "Players near me" — 3 above + 3 below my rank
  const myIdx = rows.findIndex((r: any) => r.isMe);
  const nearMe = myIdx >= 0
    ? rows.slice(Math.max(0, myIdx - 3), Math.min(rows.length, myIdx + 4))
    : [];

  return (
    <div style={{ minHeight:"100vh", background:BG, paddingBottom:120 }}>
      <div style={{ position:"sticky", top:0, zIndex:30, background:BG, borderBottom:`1px solid ${BR}`, padding:"14px 16px 10px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <button onClick={onBack} aria-label="Back" style={{ width:38, height:38, borderRadius:12, background:S1, border:`1px solid ${BR}`, color:TX, fontSize:16, cursor:"pointer", fontFamily:FONT }}>←</button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:18, fontWeight:900, color:TX, letterSpacing:"-0.3px" }}>Leaderboards</div>
            <div style={{ fontSize:11, color:TM }}>Top 50 — updates live</div>
          </div>
        </div>
        <TabBar
          tabs={BOARDS.map(([id, lbl, icon]: any) => [id, `${icon} ${lbl}`])}
          active={board}
          onSelect={(id: any) => setBoard(id)}
        />
      </div>

      <div style={{ padding:"16px" }}>
        {loading && <div style={{ padding:"40px 20px", textAlign:"center", color:TM, fontSize:13 }}>Loading…</div>}

        {!loading && rows.length === 0 && (
          <Card style={{ textAlign:"center", padding:"40px 20px" }}>
            <div style={{ fontSize:36, marginBottom:10 }}>📊</div>
            <div style={{ fontSize:14, fontWeight:700, color:TX, marginBottom:6 }}>Leaderboard is just getting started</div>
            <div style={{ fontSize:12, color:TM }}>Be the first to make the cut!</div>
          </Card>
        )}

        {/* Podium */}
        {!loading && podium.length > 0 && (
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"center", gap:8, marginBottom:16, padding:"8px 0" }}>
            {podium.length >= 2 && <PodiumPlace place={2} row={podium[1]} board={board} />}
            {podium.length >= 1 && <PodiumPlace place={1} row={podium[0]} board={board} />}
            {podium.length >= 3 && <PodiumPlace place={3} row={podium[2]} board={board} />}
          </div>
        )}

        {/* Players Near Me */}
        {!loading && nearMe.length > 0 && myIdx >= 3 && (
          <Card style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:TM, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:10 }}>Near You</div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {nearMe.map((r: any) => <Row key={r.id} row={r} board={board} compact />)}
            </div>
          </Card>
        )}

        {/* Full top-50 (excluding the podium 3) */}
        {!loading && list.length > 0 && (
          <Card>
            <div style={{ fontSize:11, color:TM, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:10 }}>Rank 4 – {Math.min(50, rows.length)}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {list.map((r: any) => <Row key={r.id} row={r} board={board} />)}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function PodiumPlace({ place, row, board }: any) {
  const heights = { 1: 96, 2: 76, 3: 64 };
  const colors = { 1: TA, 2: "#94A3B8", 3: "#CD7F32" };
  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
  return (
    <div style={{ flex:1, maxWidth:110, display:"flex", flexDirection:"column", alignItems:"center" }}>
      <div style={{ fontSize:24, marginBottom:4 }}>{medals[place]}</div>
      <div style={{ width:46, height:46, borderRadius:"50%", background: row.color ? `${row.color}20` : `${T}20`, border:`2px solid ${row.color || colors[place]}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color: row.color || colors[place], marginBottom:6, fontFamily:MONO }}>
        {row.tag || (row.name || "?").charAt(0).toUpperCase()}
      </div>
      <div style={{ fontSize:11, fontWeight:800, color: row.isMe ? T : TX, textAlign:"center", maxWidth:100, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        {row.name}{row.isMe ? " (You)" : ""}
      </div>
      <div style={{ fontSize:10, color:TM, marginBottom:4 }}>{row.meta}</div>
      <div style={{ width:"100%", height:heights[place], background:`linear-gradient(180deg, ${colors[place]}40, ${colors[place]}10)`, border:`1px solid ${colors[place]}50`, borderRadius:"10px 10px 0 0", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2 }}>
        <div style={{ fontSize:18, fontWeight:900, color:colors[place], fontFamily:MONO }}>{Number(row.score).toLocaleString()}</div>
        <div style={{ fontSize:9, color:colors[place], fontWeight:700 }}>{row.metric}</div>
      </div>
    </div>
  );
}

function Row({ row, board, compact }: any) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:10,
      padding: compact ? "8px 10px" : "10px 12px",
      background: row.isMe ? `${T}12` : "rgba(255,255,255,0.02)",
      border: `1px solid ${row.isMe ? `${T}40` : BR}`,
      borderRadius:12,
    }}>
      <div style={{ width:28, fontSize:13, fontWeight:800, color: row.rank <= 3 ? TA : TM, fontFamily:MONO }}>#{row.rank}</div>
      <div style={{ width:32, height:32, borderRadius:10, background: row.color ? `${row.color}20` : `${T}15`, border:`1px solid ${row.color || `${T}40`}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color: row.color || T, fontFamily:MONO, flexShrink:0 }}>
        {row.tag || (row.name || "?").charAt(0).toUpperCase()}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color: row.isMe ? T : TX, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {row.name}{row.isMe ? " (You)" : ""}
        </div>
        <div style={{ fontSize:11, color:TM }}>{row.meta}</div>
      </div>
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <div style={{ fontSize:14, fontWeight:800, color:TX, fontFamily:MONO }}>{Number(row.score).toLocaleString()}</div>
        <div style={{ fontSize:9, color:TM, fontWeight:700 }}>{row.metric}</div>
      </div>
    </div>
  );
}
