import { useState, useEffect, useRef, createContext, useContext, useCallback } from "react";
import type { CSSProperties, ReactNode, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { saveMoodEntry } from "@/server/mood";
import type {
  AppContextType, ZRUser, ZRMission, ZRShopItem, ZREvent, ZRStyleEvent, ZRStyleSub,
  ZRProof, ZRNotif, ZRClan, ZRZone, ZRGalleryItem, Toast, ToastHandler, Mood,
  WellbeingOverlayProps, ZoneAlertProps, HudHeaderProps, XpTrackProps, StatStripProps,
  ChipProps, CardProps, SectionHeaderProps, ProgressBarProps, TabBarProps,
  MissionCardProps, StoryCardProps, StyleEventGalleryProps, QuestScreenProps,
  MarketScreenProps, ClanScreenProps, NoClanScreenProps, ClanHubProps,
  WarTabProps, TreasuryTabProps, PlayerModalProps, AuthScreenProps,
  AdminSectionTitleProps, KpiCardProps, StatusPillProps, StrengthBarProps,
  AdminTableProps, MiniLineChartProps, DualLineChartProps, DonutChartProps,
} from "./types";

// ═══════════════════════════════════════════════════════════════════════════════
// ZONERUSH — Full Functional App (Player + Admin)
// All interactions wired up with shared state management
// ═══════════════════════════════════════════════════════════════════════════════

const AppContext = createContext<AppContextType | null>(null);

// ─── TOAST SYSTEM ──────────────────────────────────────────────────────────────
let _toastId = 0;
const _toastListeners: ToastHandler[] = [];
function showToast(msg: string, type="success", duration=3000) {
  const t: Toast = { id:++_toastId, msg, type, duration };
  _toastListeners.forEach(fn => fn(t));
}

function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const handler = (t) => {
      setToasts(ts => [...ts, t]);
      setTimeout(() => setToasts(ts => ts.filter(x => x.id !== t.id)), t.duration);
    };
    _toastListeners.push(handler);
    return () => { const i = _toastListeners.indexOf(handler); if (i>=0) _toastListeners.splice(i,1); };
  }, []);
  if (!toasts.length) return null;
  return (
    <div style={{ position:"fixed", top:16, left:"50%", transform:"translateX(-50%)", zIndex:9999, display:"flex", flexDirection:"column", gap:8, maxWidth:380, width:"100%", padding:"0 16px", pointerEvents:"none" }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding:"14px 18px", borderRadius:16,
          background: t.type==="success" ? "rgba(6,255,148,0.95)" : t.type==="error" ? "rgba(255,71,87,0.95)" : t.type==="info" ? "rgba(0,180,255,0.95)" : "rgba(255,209,102,0.95)",
          color: "#0D1117", fontSize:13, fontWeight:700, fontFamily:"'Nunito',sans-serif",
          boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
          animation:"fadeUp 0.3s ease",
          pointerEvents:"auto",
        }}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── ASSET PATHS ───────────────────────────────────────────────────────────────
const IMG = {
  storyArt:   "/assets/story_chapter1.png",
  denNeon:    "/assets/den_neon.png",
  denRooftop: "/assets/den_rooftop.png",
};

// ─── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const BG   = "#0D1117";       // deep charcoal
const S1   = "#161B22";       // card bg
const S2   = "#1C2330";       // elevated surface
const BR   = "#2A3441";       // border
const T    = "#00C9B1";       // primary teal
const TL   = "#00E8CC";       // teal light / glow
const TG   = "#06FF94";       // electric lime (XP/success)
const TA   = "#FF6B35";       // coral orange (action CTAs)
const TY   = "#FFD166";       // sunshine yellow (gold/rewards)
const TR   = "#FF4757";       // red (danger)
const TB   = "#00B4FF";       // sky blue (info/zones)
const TX   = "#F0F6FC";       // text primary
const TM   = "#8B9AB0";       // text muted
const TD   = "#3D4F63";       // text dim
const FONT  = "'Nunito',system-ui,sans-serif";
const MONO  = "'Nunito','Nunito',monospace";

// Rarity colors — vibrant, distinct
const RARITY_COLOR = { common:"#8B9AB0", uncommon:TG, rare:TB, epic:TA, legendary:TY };

// ─── DEFAULT DATA (empty — real data comes from DB) ──────────────────────────
const USER = {
  name:"Player", level:1,
  xp:0, xpNext:1000,
  ae:0, shards:0,
  streak:0, shields:0,
  combatRank:"Unranked", influenceRank:"Unranked",
  clan:null,
};

const MISSIONS = [];

const MONTHLY_MISSIONS = [];

const LIVE_EVENTS = [];

// Sprite preview images bundled locally from LPC repo
const SPRITE_IMG: Record<string,string> = {
  lpc_gloves:       "/sprites/torso_sleeveless.png",
  lpc_armplate:     "/sprites/torso_plate.png",
  lpc_chainmail:    "/sprites/torso_chainmail.png",
  lpc_jacket:       "/sprites/torso_longsleeve.png",
  lpc_leggings:     "/sprites/legs_pants.png",
  lpc_shorts:       "/sprites/legs_shorts.png",
  lpc_armleg:       "/sprites/legs_armor.png",
  lpc_sandals:      "/sprites/feet_sandals.png",
  lpc_longsw:       "/sprites/weapon_longsword.png",
  lpc_dagger:       "/sprites/weapon_dagger.png",
  lpc_mace:         "/sprites/weapon_warhammer.png",
  lpc_halberd:      "/sprites/weapon_spear.png",
  lpc_spear:        "/sprites/weapon_spear.png",
  lpc_bow:          "/sprites/weapon_bow.png",
  lpc_staff:        "/sprites/weapon_staff.png",
  lpc_shield_round: "/sprites/torso_plate.png",
};

const ITEM_ICONS: Record<string,string> = { clothing:"👕", armor:"🛡️", arms:"🧤", footwear:"👢", headgear:"⛑️", weapon:"⚔️", shield:"🛡️", consumable:"🧪" };

const SHOP_ITEMS = [
  // ─── Arms ────
  { id:"lpc_gloves",       name:"Leather Gloves",        cat:"arms",     price:120,  rarity:"common",   img:null, icon:"🧤", owned:false, featured:false, avatarSlot:"arms", avatarOptionId:"gloves" },
  { id:"lpc_armplate",     name:"Plate Gauntlets",       cat:"arms",     price:350,  rarity:"uncommon", img:null, icon:"🛡", owned:false, featured:false, avatarSlot:"arms", avatarOptionId:"plate" },
  // ─── Torso ────
  { id:"lpc_chainmail",    name:"Chainmail Shirt",       cat:"clothing", price:220,  rarity:"uncommon", img:null, icon:"⛓️", owned:false, featured:true,  avatarSlot:"torso", avatarOptionId:"chainmail" },
  { id:"lpc_jacket",       name:"Collared Jacket",       cat:"clothing", price:180,  rarity:"uncommon", img:null, icon:"🎩", owned:false, featured:false, avatarSlot:"torso", avatarOptionId:"jacket" },
  // ─── Legs ────
  { id:"lpc_leggings",     name:"Reinforced Leggings",   cat:"clothing", price:150,  rarity:"common",   img:null, icon:"🩱", owned:false, featured:false, avatarSlot:"legs", avatarOptionId:"leggings" },
  { id:"lpc_shorts",       name:"Campus Shorts",         cat:"clothing", price:80,   rarity:"common",   img:null, icon:"🩳", owned:false, featured:false, avatarSlot:"legs", avatarOptionId:"shorts" },
  { id:"lpc_armleg",       name:"Armored Leggings",      cat:"armor",    price:300,  rarity:"uncommon", img:null, icon:"🛡", owned:false, featured:false, avatarSlot:"legs", avatarOptionId:"armour" },
  // ─── Feet ────
  { id:"lpc_sandals",      name:"Campus Sandals",        cat:"footwear", price:60,   rarity:"common",   img:null, icon:"🩴", owned:false, featured:false, avatarSlot:"feet", avatarOptionId:"sandals" },
  // ─── Weapons ────
  { id:"lpc_dagger",       name:"Iron Dagger",           cat:"weapon",   price:150,  rarity:"common",   img:null, icon:"🗡️", owned:false, featured:false, weaponType:"sword" },
  { id:"lpc_longsw",       name:"Longsword",             cat:"weapon",   price:350,  rarity:"uncommon", img:null, icon:"⚔️", owned:false, featured:true,  weaponType:"sword" },
  { id:"lpc_mace",         name:"War Mace",              cat:"weapon",   price:280,  rarity:"uncommon", img:null, icon:"🪓", owned:false, featured:false, weaponType:"blunt" },
  { id:"lpc_halberd",      name:"Halberd",               cat:"weapon",   price:450,  rarity:"rare",     img:null, icon:"⚔️", owned:false, featured:false, weaponType:"polearm" },
  { id:"lpc_spear",        name:"Battle Spear",          cat:"weapon",   price:280,  rarity:"uncommon", img:null, icon:"🏹", owned:false, featured:false, weaponType:"polearm" },
  { id:"lpc_bow",          name:"Hunter's Bow",          cat:"weapon",   price:320,  rarity:"uncommon", img:null, icon:"🏹", owned:false, featured:false, weaponType:"ranged" },
  { id:"lpc_staff",        name:"Arcane Staff",          cat:"weapon",   price:400,  rarity:"rare",     img:null, icon:"🪄", owned:false, featured:false, weaponType:"magic" },
  // ─── Shield ────
  { id:"lpc_shield_round", name:"Round Shield",          cat:"shield",   price:250,  rarity:"uncommon", img:null, icon:"🛡", owned:false, featured:false, avatarSlot:"shield", avatarOptionId:"round" },
  // ─── Consumables ────
  { id:"lpc_xpboost",      name:"XP Boost Potion",       cat:"consumable",price:150, rarity:"uncommon", img:null, icon:"🧪", owned:false, featured:false },
  { id:"lpc_shield_item",  name:"Zone Shield (1h)",      cat:"consumable",price:250, rarity:"rare",     img:null, icon:"🔰", owned:false, featured:false },
];

const INIT_SHOP_ITEMS = SHOP_ITEMS.map(item => ({
  ...item,
  priceAE: item.price,
  type: item.rarity === "legendary" ? "limited" : "general",
  stock: item.rarity === "legendary" ? 5 : item.rarity === "epic" ? 15 : null,
  sold: Math.floor(Math.random() * 20),
  active: true,
  soulBound: item.cat === "consumable",
}));

const PROOF_SUBMISSIONS = [];

const COMMUNITY_ITEMS = [];

const STORY = { ch:0, title:"Coming Soon", sub:"Story quests are not yet available.", clues:0, total:0 };
const WEEKLY = { done:0, total:0, days:0 };

const STYLE_SUBMISSIONS_INIT = [];

const STYLE_EVENT_LIVE = {
  phase:"submission", weekId:1,
  theme:"No active style event.",
  submissionEnds:"TBD", votingEnds:"TBD",
  gallery:[],
};

// ─── CLAN DATA ─────────────────────────────────────────────────────────────────
const CL_USER = {
  name:"Player", level:1, ae:0, shards:0,
  clan:null,
};

const MEMBERS = [];

const GAME_RULES = { ZONE_ATTACK_COOLDOWN_HOURS:24, WAR_DECLARE_COST_AE:200, ZONE_GEO_RADIUS_METRES:100 };
const _now = Date.now();
const _hAgo = (h) => new Date(_now - h * 3600000).toISOString();

function clanZoneOnCooldown(zone) {
  if (!zone.lastAttackedAt) return false;
  return (_now - new Date(zone.lastAttackedAt).getTime()) < GAME_RULES.ZONE_ATTACK_COOLDOWN_HOURS * 3600000;
}
function clanCooldownRemaining(zone) {
  if (!zone.lastAttackedAt) return null;
  const rem = GAME_RULES.ZONE_ATTACK_COOLDOWN_HOURS * 3600000 - (_now - new Date(zone.lastAttackedAt).getTime());
  if (rem <= 0) return null;
  const h = Math.floor(rem / 3600000), m = Math.floor((rem % 3600000) / 60000);
  return `${h}h ${m}m`;
}

const ZONES = [];
const ATTACKABLE_ZONES = [];
const WAR_LOG = [];
const ENEMY_CLANS = [];
const TREASURY_LOG = [];

// Moods for wellbeing overlay
const MOODS = [
  { s:5, e:"😄", l:"Great", c:TG },
  { s:4, e:"🙂", l:"Good",  c:"#34D399" },
  { s:3, e:"😐", l:"Okay",  c:TA },
  { s:2, e:"😔", l:"Low",   c:"#F97316" },
  { s:1, e:"😞", l:"Bad",   c:TR },
];

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL STYLES
// ═══════════════════════════════════════════════════════════════════════════════
function GlobalStyles() {
  useEffect(() => {
    const id = "zr-global";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900;1000&display=swap');
      *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
      html { height:100%; background:${BG}; }
      body { height:100%; background:${BG}; font-family:${FONT}; overflow:hidden; color:${TX}; }
      input, textarea { outline:none; -webkit-appearance:none; font-family:${FONT}; }
      button { cursor:pointer; -webkit-tap-highlight-color:transparent; font-family:${FONT}; }
      ::-webkit-scrollbar { width:0px; }
      input::placeholder, textarea::placeholder { color:${TD}; }

      @keyframes fadeUp {
        from { opacity:0; transform:translateY(24px) scale(0.97); }
        to   { opacity:1; transform:translateY(0) scale(1); }
      }
      @keyframes fadeIn {
        from { opacity:0; }
        to   { opacity:1; }
      }
      @keyframes slideInRight {
        from { opacity:0; transform:translateX(32px); }
        to   { opacity:1; transform:translateX(0); }
      }
      @keyframes bounceIn {
        0%   { opacity:0; transform:scale(0.6); }
        60%  { opacity:1; transform:scale(1.08); }
        80%  { transform:scale(0.96); }
        100% { transform:scale(1); }
      }
      @keyframes pulse {
        0%,100% { opacity:1; transform:scale(1); }
        50%      { opacity:0.7; transform:scale(1.15); }
      }
      @keyframes shimmer {
        0%   { transform:translateX(-100%); }
        100% { transform:translateX(250%); }
      }
      @keyframes float {
        0%,100% { transform:translateY(0px); }
        50%      { transform:translateY(-8px); }
      }
      @keyframes spin {
        to { transform:rotate(360deg); }
      }
      @keyframes contestPulse {
        0%,100% { border-color:rgba(255,71,87,0.4); box-shadow:0 0 0 0 rgba(255,71,87,0.2); }
        50%      { border-color:rgba(255,71,87,0.9); box-shadow:0 0 0 6px rgba(255,71,87,0); }
      }
      @keyframes tealGlow {
        0%,100% { box-shadow:0 0 20px rgba(0,201,177,0.3), 0 4px 24px rgba(0,0,0,0.4); }
        50%      { box-shadow:0 0 40px rgba(0,201,177,0.6), 0 4px 32px rgba(0,0,0,0.4); }
      }
      @keyframes streakBurn {
        0%,100% { filter:drop-shadow(0 0 4px rgba(255,107,53,0.5)); }
        50%      { filter:drop-shadow(0 0 12px rgba(255,200,0,0.9)); }
      }
      @keyframes xpFill {
        from { width:0%; }
        to   { width:var(--xp-width); }
      }
      @keyframes cardEntry {
        from { opacity:0; transform:translateY(16px); }
        to   { opacity:1; transform:translateY(0); }
      }
      @keyframes orbFloat {
        0%   { transform:translate(0,0) scale(1); }
        33%  { transform:translate(20px,-15px) scale(1.05); }
        66%  { transform:translate(-10px,10px) scale(0.97); }
        100% { transform:translate(0,0) scale(1); }
      }
      @keyframes tabSlide {
        from { opacity:0; transform:translateX(12px); }
        to   { opacity:1; transform:translateX(0); }
      }
      @keyframes rewardPop {
        0%   { transform:scale(0) rotate(-10deg); opacity:0; }
        60%  { transform:scale(1.2) rotate(4deg); opacity:1; }
        100% { transform:scale(1) rotate(0deg); opacity:1; }
      }

      .card-entry { animation: cardEntry 0.35s ease both; }
      .card-entry:nth-child(1) { animation-delay:0.05s; }
      .card-entry:nth-child(2) { animation-delay:0.1s; }
      .card-entry:nth-child(3) { animation-delay:0.15s; }
      .card-entry:nth-child(4) { animation-delay:0.2s; }
      .card-entry:nth-child(5) { animation-delay:0.25s; }

      .tab-content { animation: tabSlide 0.25s ease both; }

      button:active { transform:scale(0.96); transition:transform 0.1s; }
    `;
    document.head.appendChild(el);
  }, []);
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════════

// Pill chip — currency / tags
function Chip({ color, bg, icon, label, onClick, style }) {
  return (
    <div
      onClick={onClick}
      style={{
        display:"flex", alignItems:"center", gap:5,
        padding:"7px 14px", borderRadius:99,
        background: bg || `${color}22`,
        border:`1.5px solid ${color}50`,
        fontSize:13, fontWeight:800, color,
        boxShadow:`0 2px 12px ${color}25`,
        ...(onClick ? { cursor:"pointer" } : {}),
        ...style,
      }}
    >
      {icon && <span style={{ fontSize:14 }}>{icon}</span>}
      <span>{label}</span>
    </div>
  );
}

// Colourful card — each one gets a vibrant top gradient stripe
function Card({ children, style, accent, gradient, onClick, className }) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: gradient || S1,
        border:`1.5px solid ${BR}`,
        borderRadius:22,
        padding:16,
        position:"relative",
        overflow:"hidden",
        ...(onClick ? { cursor:"pointer" } : {}),
        ...(accent ? { borderTop:`3px solid ${accent}`, boxShadow:`0 4px 24px ${accent}18` } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Section header
function SectionHeader({ title, action, onAction }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
      <span style={{ fontSize:17, fontWeight:900, color:TX, letterSpacing:"-0.3px" }}>{title}</span>
      {action && (
        <button onClick={onAction} style={{ background:"none", border:"none", color:T, fontSize:13, fontWeight:800, padding:0 }}>
          {action}
        </button>
      )}
    </div>
  );
}

// Animated progress bar with shimmer
function ProgressBar({ value, max, color, height=6 }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ height, background:"rgba(255,255,255,0.06)", borderRadius:99, overflow:"hidden", position:"relative" }}>
      <div style={{
        height:"100%", width:`${pct}%`, borderRadius:99,
        background: color || `linear-gradient(90deg, ${T}, ${TG})`,
        transition:"width 0.8s cubic-bezier(0.34,1.56,0.64,1)",
        position:"relative", overflow:"hidden",
        boxShadow:`0 0 8px ${color || T}60`,
      }}>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)", animation:"shimmer 2s ease-in-out infinite" }} />
      </div>
    </div>
  );
}

// Segmented tab control — colourful active state
function TabBar({ tabs, active, onSelect, style }) {
  return (
    <div style={{
      display:"flex", gap:4,
      background:"rgba(255,255,255,0.04)",
      borderRadius:16, padding:4,
      border:`1.5px solid ${BR}`,
      ...style,
    }}>
      {tabs.map(([id, label, badge]) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          style={{
            flex:1, padding:"9px 4px",
            borderRadius:12, border:"none",
            background: active===id ? `linear-gradient(135deg, ${T}CC, ${TL}AA)` : "none",
            color: active===id ? "#0D1117" : TM,
            fontSize:13, fontWeight: active===id ? 900 : 600,
            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            boxShadow: active===id ? `0 4px 16px ${T}40` : "none",
            transition:"all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
            transform: active===id ? "scale(1.02)" : "scale(1)",
          }}
        >
          {label}
          {badge > 0 && (
            <span style={{ background:TR, color:"#fff", fontSize:9, fontWeight:900, borderRadius:99, minWidth:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 4px" }}>
              {badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WELLBEING OVERLAY
// ═══════════════════════════════════════════════════════════════════════════════
function WellbeingOverlay({ onDone }) {
  const [phase, setPhase] = useState("ask");
  const [mood, setMood] = useState(null);
  const [freeText, setFreeText] = useState("");
  const [wantTalk, setWantTalk] = useState(false);
  const [outreach, setOutreach] = useState(false);
  const [consentShare, setConsentShare] = useState(false);

  const pickMood = (score) => {
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
          {MOODS.map(m => (
            <button key={m.s} onClick={() => pickMood(m.s)} style={{
              display:"flex", flexDirection:"column", alignItems:"center", gap:8,
              padding:"16px 12px", background:S1, border:`1.5px solid ${mood===m.s ? m.c : BR}`,
              borderRadius:16, fontFamily:FONT, minWidth:60, transition:"all 0.2s",
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
function ZoneAlert({ onDismiss }) {
  const ctx = useContext(AppContext);
  const [secs, setSecs] = useState(1458);
  useEffect(() => {
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
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
function HudHeader({ user, onAdminAccess }) {
  const tapRef = useRef(0);
  const tapTimer = useRef(null);
  const handleLogoTap = () => {
    tapRef.current += 1;
    clearTimeout(tapTimer.current);
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
function XpTrack({ user }) {
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
function StatStrip({ weekly }) {
  const ctx = useContext(AppContext);
  const user = ctx?.sharedUser || USER;
  const completedCount = ctx?.completedMissions?.size || 0;
  const userZones = user.clan ? (ZONES.filter(z => z.capturedBy === user.clan?.name).length) : 0;

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
      {STATS.map((s, i) => (
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
function StreakCard({ user }) {
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
        {[1,2,3,4,5,6,7].map(d => {
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
function SquadUpCard({ user, onNavigateClan }) {
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
function LiveEventsStrip({ events, onViewAll }) {
  return (
    <div style={{ margin:"14px 16px 0" }}>
      <SectionHeader title="⚡ Live Events" action="See All →" onAction={onViewAll} />
      {events.map((ev, i) => (
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
function StyleEventBanner({ event, onOpen }) {
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
function MarketShortcut({ onOpen }) {
  const featured = SHOP_ITEMS.filter(i => i.featured).slice(0, 3);
  return (
    <div style={{ margin:"14px 16px 0" }}>
      <SectionHeader title="🏪 Market" action="Browse →" onAction={onOpen} />
      <div style={{ display:"flex", gap:8 }}>
        {featured.map((item, i) => {
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
function MissionCard({ m, idx=0 }) {
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
    supabase.from("google_fit_tokens").select("connected").eq("user_id", ctx.authUser.id).maybeSingle().then(({ data }) => {
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
function StoryCard({ story }) {
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
        {Array.from({ length: story.total }).map((_, i) => (
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
          {["neon","rooftop"].map(b => (
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
// BOTTOM NAV
// ═══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id:"market",   icon:"🛒", label:"Market" },
  { id:"missions", icon:"🎯", label:"Quests" },
  { id:"home",     icon:"⚡", label:"Home",  center:true },
  { id:"clan",     icon:"⚔️", label:"Clan" },
  { id:"profile",  icon:"👤", label:"Profile" },
];

function BottomNav({ active, onSelect }) {
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
        {TABS.map(t => {
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
function StyleEventGallery({ event, onBack }) {
  const ctx = useContext(AppContext);
  const [myVote, setMyVote] = useState(null);
  const [voteConfirm, setVoteConfirm] = useState(false);
  const [gallery, setGallery] = useState(event.gallery);
  const [seView, setSeView] = useState("gallery");
  const [submitTitle, setSubmitTitle] = useState("");
  const [submitNote, setSubmitNote] = useState("");
  const [submitDone, setSubmitDone] = useState(false);
  const [submitImage, setSubmitImage] = useState(null);
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
  const [mySubmission, setMySubmission] = useState(event.gallery.find(g => g.isMine) || null);

  useEffect(() => {
    setGallery(ctx?.sharedStyleEvent?.gallery || event.gallery);
  }, [ctx?.sharedStyleEvent?.gallery]);

  const handleVote = (id) => {
    if (myVote) return;
    setMyVote(id);
    setGallery(g => g.map(s => s.id === id ? { ...s, votes: s.votes + 1 } : s));
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
              ctx.setSharedStyleSubs(ss => [...ss, {
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
          {sorted.map(s => {
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

// ═══════════════════════════════════════════════════════════════════════════════
// QUEST SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function QuestScreen({ missions, events, styleEvent, onStyleEvent }) {
  const ctx = useContext(AppContext);
  const [qTab, setQTab] = useState("daily");

  const daily  = missions.filter(m => m.tier === "daily" && !m._disabled);
  const weekly = missions.filter(m => m.tier === "weekly" && !m._disabled);
  const monthly = missions.filter(m => m.tier === "monthly" && !m._disabled);

  const dailyCompleted = daily.filter(m => ctx?.completedMissions?.has(m.id)).length;
  const weeklyCompleted = weekly.filter(m => ctx?.completedMissions?.has(m.id)).length;
  const monthlyCompleted = monthly.filter(m => ctx?.completedMissions?.has(m.id)).length;

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
    quests.forEach(q => {
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
    return Object.entries(groups).map(([cat, items]) => (
      <div key={cat} style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:800, color:TX, marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
          {CATEGORY_LABELS[cat] || cat}
          <span style={{ fontSize:11, color:TM, fontWeight:600 }}>({items.filter(m => ctx?.completedMissions?.has(m.id)).length}/{items.length})</span>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {items.map((m, i) => <MissionCard key={m.id} m={m} idx={i} />)}
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
            {events.map(ev => {
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

// ═══════════════════════════════════════════════════════════════════════════════
// MARKET SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function MarketScreen({ user }) {
  const ctx = useContext(AppContext);
  const [mTab, setMTab] = useState("shop");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const allShopItems = ctx?.sharedShopItems || SHOP_ITEMS;
  const activeShop = allShopItems.filter(i => i.active !== false);
  const [owned, setOwned] = useState(new Set(
    activeShop.filter(i => i.owned).map(i => i.id).concat(COMMUNITY_ITEMS.filter(i => i.owned).map(i => i.id))
  ));
  const [cart, setCart] = useState(null);
  const [sellModal, setSellModal] = useState(null);
  const [sellPrice, setSellPrice] = useState("");
  const marketplaceListings = ctx?.marketplaceListings || [];

  const shopItems = activeShop.filter(i => !i.designer && !i._isMarketListing && (i.rarity === "common" || i.rarity === "uncommon") && (!search || i.name.toLowerCase().includes(search.toLowerCase())) && (catFilter === "all" || i.cat === catFilter || (catFilter === "armor" && (i.cat === "armor" || i.cat === "arms")) || (catFilter === "clothing" && (i.cat === "clothing" || i.cat === "armor")) ));
  const community = [
    ...COMMUNITY_ITEMS,
    ...allShopItems.filter(i => i.designer && i.active !== false),
    ...marketplaceListings.filter(l => l.seller !== (ctx?.sharedUser?.name || ""))
  ].filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()));
  const inventory = [...activeShop.filter(i => owned.has(i.id)), ...COMMUNITY_ITEMS.filter(i => owned.has(i.id))];

  const buy = (item) => {
    const price = item.price || item.priceAE || 0;
    if (price > (ctx?.sharedUser?.ae || user.ae)) {
      showToast(`⚠ Not enough AE to buy ${item.name}`, "error");
      setCart(null);
      return;
    }
    // If it's a marketplace listing, handle differently
    if (item._isMarketListing && ctx?.buyMarketplaceListing) {
      ctx.buyMarketplaceListing(item._inventoryId, item.id, price, item._sellerId);
      setOwned(o => new Set([...o, item.id]));
      setCart(null);
      showToast(`🛍️ Purchased ${item.name} from ${item.seller} for ◎${price} AE!`, "success");
      return;
    }
    if (ctx?.purchaseItem) ctx.purchaseItem(item.id, price);
    setOwned(o => new Set([...o, item.id]));
    setCart(null);
    showToast(`🛍️ Purchased ${item.name} for ◎${price} AE!`, "success");
  };

  const handleListForSale = (item) => {
    const price = parseInt(sellPrice);
    if (!price || price <= 0) {
      showToast("⚠ Enter a valid price", "error");
      return;
    }
    if (ctx?.listItemForSale) ctx.listItemForSale(item.id, price);
    setSellModal(null);
    setSellPrice("");
    showToast(`🏷️ ${item.name} listed for ◎${price} AE on the marketplace!`, "success");
  };

  const handleUnlist = (item) => {
    if (ctx?.unlistItem) ctx.unlistItem(item.id);
    showToast(`✓ ${item.name} removed from marketplace`, "info");
  };

  return (
    <div style={{ position:"relative", zIndex:1, height:"100dvh", overflowY:"auto", paddingBottom:90 }}>
      {/* Header with gradient */}
      <div style={{ padding:"20px 16px 0", marginBottom:12 }}>
        <div style={{ fontSize:26, fontWeight:900, color:TX, letterSpacing:"-0.5px", marginBottom:2 }}>Market</div>
        <div style={{ fontSize:13, color:TM, marginBottom:12 }}>
          Balance: <span style={{ color:TA, fontWeight:700 }}>◎ {(ctx?.sharedUser?.ae || user.ae).toLocaleString()} AE</span>
          <span style={{ color:TD }}> · {user.shards} shards</span>
        </div>
        <TabBar
          tabs={[["shop","Shop"], ["community","Community", marketplaceListings.length], ["inventory","Inventory", inventory.length]]}
          active={mTab}
          onSelect={setMTab}
          style={{ marginBottom:12 }}
        />
        {/* Search */}
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:"rgba(255,255,255,0.04)", border:`1px solid ${BR}`, borderRadius:14 }}>
          <span style={{ color:TM, fontSize:14 }}>🔍</span>
          <input style={{ flex:1, background:"none", border:"none", color:TX, fontSize:13, fontFamily:FONT }} placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch("")} style={{ background:"none", border:"none", color:TM, cursor:"pointer", padding:0 }}>✕</button>}
        </div>
      </div>

      <div style={{ padding:"0 16px" }}>
        {mTab === "shop" && (
          <>
            {/* Category filter chips */}
            <div style={{ display:"flex", gap:6, overflowX:"auto", marginBottom:12, paddingBottom:4 }}>
              {[["all","All"],["clothing","Clothing"],["armor","Armor"],["arms","Arms"],["weapon","Weapons"],["shield","Shields"],["footwear","Footwear"],["consumable","Items"]].map(([k,l]) => (
                <button key={k} onClick={() => setCatFilter(k)} style={{
                  padding:"6px 14px", borderRadius:99, fontSize:11, fontWeight:700, fontFamily:FONT, whiteSpace:"nowrap",
                  background: catFilter===k ? T : "rgba(255,255,255,0.06)", border: catFilter===k ? `1px solid ${T}` : `1px solid ${BR}`,
                  color: catFilter===k ? "#000" : TM,
                }}>{l}</button>
              ))}
            </div>
            {shopItems.filter(i=>i.featured).length > 0 && (
              <>
                <div style={{ fontSize:14, fontWeight:700, color:TX, marginBottom:10 }}>⭐ Featured</div>
                <div style={{ display:"flex", gap:8, overflowX:"auto", marginBottom:16 }}>
                  {shopItems.filter(i=>i.featured).map(item => (
                    <ShopItemCard key={item.id} item={item} owned={owned.has(item.id)} onBuy={() => setCart(item)} featured />
                  ))}
                </div>
              </>
            )}
            <div style={{ fontSize:14, fontWeight:700, color:TX, marginBottom:10 }}>All Items</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {shopItems.filter(i=>!i.featured).map(item => (
                <ShopItemCard key={item.id} item={item} owned={owned.has(item.id)} onBuy={() => setCart(item)} />
              ))}
            </div>
          </>
        )}

        {mTab === "community" && (
          <>
            <div style={{ padding:"12px 14px", background:`${TL}08`, border:`1px solid ${TL}25`, borderRadius:12, fontSize:12, color:TM, marginBottom:12, lineHeight:1.6 }}>
              👗 Community designs + player marketplace. Designers earn 10% of Style Challenge sales. Players set their own prices on resales.
            </div>
            {/* List your own design CTA */}
            <button onClick={() => {
              if (ctx?.sharedStyleEvent?.phase === "submission" || ctx?.sharedStyleEvent?.phase === "voting") {
                showToast("👗 Head to the Style Event (Quests → Events) to submit your design!", "info");
              } else {
                showToast("👗 Style Event submissions are currently closed. Check back next week!", "info");
              }
            }} style={{
              width:"100%", padding:"14px", marginBottom:12, borderRadius:14,
              background:`linear-gradient(135deg, ${TL}15, ${T}08)`,
              border:`1.5px dashed ${TL}50`, color:TL, fontSize:13, fontWeight:700,
              display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontFamily:FONT,
            }}>
              <span style={{ fontSize:18 }}>✨</span> Submit Your Own Design
            </button>

            {/* Player marketplace listings */}
            {marketplaceListings.filter(l => l.seller !== (ctx?.sharedUser?.name || "")).length > 0 && (
              <>
                <div style={{ fontSize:14, fontWeight:700, color:TA, marginBottom:10, display:"flex", alignItems:"center", gap:6 }}>
                  <span>🏷️</span> Player Marketplace
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                  {marketplaceListings.filter(l => l.seller !== (ctx?.sharedUser?.name || "")).map(item => (
                    <MarketplaceListingCard key={item._inventoryId || item.id} item={item} onBuy={() => setCart(item)} />
                  ))}
                </div>
              </>
            )}

            {/* Community designs */}
            <div style={{ fontSize:14, fontWeight:700, color:TX, marginBottom:10 }}>👗 Style Challenge Winners</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[...COMMUNITY_ITEMS, ...allShopItems.filter(i => i.designer && i.active !== false)].filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase())).map(item => (
                <CommunityItemCard key={item.id} item={item} owned={owned.has(item.id)} onBuy={() => setCart({ ...item, price: item.price || item.priceAE || 200 })} />
              ))}
            </div>
            {[...COMMUNITY_ITEMS, ...allShopItems.filter(i => i.designer && i.active !== false)].length === 0 && marketplaceListings.length === 0 && (
              <div style={{ padding:"60px 20px", textAlign:"center", color:TM }}>
                <div style={{ fontSize:40, marginBottom:12 }}>👗</div>
                <div style={{ fontSize:15, fontWeight:700, color:TX, marginBottom:6 }}>No community designs yet</div>
                <div style={{ fontSize:12 }}>First Style Event winner coming soon</div>
              </div>
            )}
          </>
        )}

        {mTab === "inventory" && (
          inventory.length === 0 ? (
            <div style={{ padding:"60px 20px", textAlign:"center", color:TM }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🎒</div>
              <div style={{ fontSize:15, fontWeight:700, color:TX, marginBottom:6 }}>Nothing owned yet</div>
              <div style={{ fontSize:12 }}>Purchase items from the Shop</div>
            </div>
          ) : (
            <>
              <div style={{ padding:"10px 14px", background:`${TA}08`, border:`1px solid ${TA}25`, borderRadius:12, fontSize:12, color:TM, marginBottom:12, lineHeight:1.6 }}>
                🏷️ Sell items you own on the marketplace! Set your own price and other players can buy them.
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {inventory.map(item => {
                  const isListed = ctx?.listedItems?.has(item.id);
                  const listingPrice = ctx?.listingPrices?.[item.id];
                  return (
                    <div key={item.id} style={{
                      background:S1, border:`1px solid ${isListed ? `${TA}50` : RARITY_COLOR[item.rarity]+"30"}`, borderRadius:16, overflow:"hidden",
                    }}>
                      <div style={{ height:3, background: isListed ? TA : RARITY_COLOR[item.rarity] }} />
                      <div style={{ padding:"14px 12px 12px", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                        <div style={{ fontSize:32 }}>{item.icon}</div>
                        <div style={{ fontSize:12, fontWeight:700, color:TX, textAlign:"center", lineHeight:1.3 }}>{item.name}</div>
                        <div style={{ fontSize:10, color:RARITY_COLOR[item.rarity], fontWeight:700 }}>{item.rarity} · {item.cat}</div>
                        <div style={{ padding:"5px 12px", background:`${TG}15`, border:`1px solid ${TG}40`, borderRadius:99, fontSize:11, fontWeight:700, color:TG }}>✓ Owned</div>
                        {isListed ? (
                          <div style={{ display:"flex", flexDirection:"column", gap:4, width:"100%" }}>
                            <div style={{ fontSize:11, fontWeight:700, color:TA, textAlign:"center" }}>🏷️ Listed: ◎{listingPrice} AE</div>
                            <button onClick={() => handleUnlist(item)} style={{ padding:"6px 12px", background:`${TR}10`, border:`1px solid ${TR}30`, borderRadius:99, color:TR, fontSize:11, fontWeight:700, fontFamily:FONT }}>Remove Listing</button>
                          </div>
                        ) : (
                          <button onClick={() => { setSellModal(item); setSellPrice(""); }} style={{ padding:"7px 14px", background:`${TA}15`, border:`1px solid ${TA}40`, borderRadius:99, color:TA, fontSize:11, fontWeight:700, fontFamily:FONT, display:"flex", alignItems:"center", gap:4 }}>
                            🏷️ Sell
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )
        )}
      </div>

      {/* Purchase modal */}
      {cart && (() => {
        const cartPrice = cart.price || cart.priceAE || 0;
        const currentAE = ctx?.sharedUser?.ae ?? user.ae;
        return (
        <div onClick={() => setCart(null)} style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(13,17,23,0.9)", backdropFilter:"blur(16px)", display:"flex", alignItems:"flex-end", justifyContent:"center", padding:"0 0 16px" }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:400, background:S2, border:`1px solid ${BR}`, borderRadius:"24px 24px 20px 20px", padding:"28px 24px 20px", display:"flex", flexDirection:"column", alignItems:"center" }}>
            <div style={{ fontSize:52, marginBottom:8 }}>{cart.icon || "🎁"}</div>
            <div style={{ fontSize:20, fontWeight:800, color:TX, marginBottom:4 }}>{cart.name}</div>
            <div style={{ fontSize:11, fontWeight:700, color:RARITY_COLOR[cart.rarity] || TM, marginBottom:8 }}>{(cart.rarity||"common").toUpperCase()}</div>
            {cart.designer && <div style={{ fontSize:11, color:TL, marginBottom:4 }}>by {cart.designer}</div>}
            {cart.seller && <div style={{ fontSize:11, color:TA, marginBottom:4 }}>Sold by {cart.seller}</div>}
            <div style={{ fontSize:28, fontWeight:900, color:TA, margin:"4px 0 8px", fontFamily:MONO }}>◎ {cartPrice}</div>
            <div style={{ fontSize:12, color:TM, marginBottom:24 }}>Balance after: ◎ {Math.max(0, currentAE - cartPrice).toLocaleString()} AE</div>
            {currentAE >= cartPrice ? (
              <button onClick={() => buy(cart)} style={{ width:"100%", padding:"15px", borderRadius:16, border:"none", background:`linear-gradient(135deg, ${T}, ${TG})`, color:"#0D1117", fontSize:15, fontWeight:800, fontFamily:FONT, marginBottom:10, boxShadow:`0 8px 24px ${T}50` }}>
                Confirm Purchase
              </button>
            ) : (
              <div style={{ fontSize:13, color:TR, fontWeight:700, textAlign:"center", marginBottom:10 }}>
                Not enough AE (need {cartPrice - currentAE} more)
              </div>
            )}
            <button onClick={() => setCart(null)} style={{ width:"100%", padding:"13px", borderRadius:14, background:"none", border:`1px solid ${BR}`, color:TM, fontSize:13, fontFamily:FONT }}>Cancel</button>
          </div>
        </div>
        );
      })()}

      {/* Sell modal */}
      {sellModal && (
        <div onClick={() => setSellModal(null)} style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(13,17,23,0.9)", backdropFilter:"blur(16px)", display:"flex", alignItems:"flex-end", justifyContent:"center", padding:"0 0 16px" }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:400, background:S2, border:`1px solid ${BR}`, borderRadius:"24px 24px 20px 20px", padding:"28px 24px 20px", display:"flex", flexDirection:"column", alignItems:"center" }}>
            <div style={{ fontSize:52, marginBottom:8 }}>{sellModal.icon || "🎁"}</div>
            <div style={{ fontSize:20, fontWeight:800, color:TX, marginBottom:4 }}>{sellModal.name}</div>
            <div style={{ fontSize:11, fontWeight:700, color:RARITY_COLOR[sellModal.rarity] || TM, marginBottom:16 }}>{(sellModal.rarity||"common").toUpperCase()}</div>
            <div style={{ fontSize:14, fontWeight:700, color:TX, marginBottom:12 }}>Set Your Price</div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, width:"100%" }}>
              <span style={{ fontSize:18, color:TA }}>◎</span>
              <input type="number" value={sellPrice} onChange={e => setSellPrice(e.target.value)} placeholder="e.g. 300" style={{ flex:1, background:"rgba(255,255,255,0.06)", border:`1px solid ${BR}`, borderRadius:12, padding:"12px 14px", color:TX, fontSize:16, fontWeight:700, fontFamily:FONT }} autoFocus />
              <span style={{ fontSize:14, color:TM, fontWeight:700 }}>AE</span>
            </div>
            <div style={{ fontSize:11, color:TM, marginBottom:20, textAlign:"center", lineHeight:1.5 }}>
              Your item will appear in the Community marketplace.<br/>
              A 5% marketplace fee applies on sale.
            </div>
            <button onClick={() => handleListForSale(sellModal)} disabled={!sellPrice || parseInt(sellPrice) <= 0} style={{ width:"100%", padding:"15px", borderRadius:16, border:"none", background: sellPrice && parseInt(sellPrice) > 0 ? `linear-gradient(135deg, ${TA}, #FF9F1C)` : "rgba(255,255,255,0.05)", color: sellPrice && parseInt(sellPrice) > 0 ? "#0D1117" : TM, fontSize:15, fontWeight:800, fontFamily:FONT, marginBottom:10, boxShadow: sellPrice && parseInt(sellPrice) > 0 ? `0 8px 24px ${TA}50` : "none" }}>
              🏷️ List for Sale
            </button>
            <button onClick={() => setSellModal(null)} style={{ width:"100%", padding:"13px", borderRadius:14, background:"none", border:`1px solid ${BR}`, color:TM, fontSize:13, fontFamily:FONT }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ height:20 }} />
    </div>
  );
}

// Marketplace listing card for community tab
function MarketplaceListingCard({ item, onBuy }) {
  const rc = RARITY_COLOR[item.rarity] || TM;
  return (
    <div style={{ background:S1, border:`1px solid ${TA}30`, borderRadius:16, overflow:"hidden" }}>
      <div style={{ height:3, background:TA }} />
      <div style={{ padding:"14px 12px 12px", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
        <div style={{ fontSize:32 }}>{item.icon}</div>
        <div style={{ fontSize:12, fontWeight:700, color:TX, textAlign:"center", lineHeight:1.3 }}>{item.name}</div>
        <div style={{ fontSize:10, color:rc, fontWeight:700 }}>{item.rarity} · {item.cat}</div>
        <div style={{ fontSize:10, color:TA }}>Sold by {item.seller}</div>
        <button onClick={onBuy} style={{ padding:"7px 16px", background:`${TA}15`, border:`1px solid ${TA}40`, borderRadius:99, color:TA, fontSize:12, fontWeight:700, fontFamily:FONT }}>◎ {item.price}</button>
      </div>
    </div>
  );
}

function SpritePreview({ src, size=48 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!src || !canvasRef.current) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, size, size);
      // LPC spritesheets: 64x64 per frame, row 2 = facing down (south), first column
      ctx.drawImage(img, 0, 128, 64, 64, 0, 0, size, size);
    };
    img.onerror = () => {};
    img.src = src;
  }, [src, size]);
  if (!src) return null;
  return <canvas ref={canvasRef} width={size} height={size} style={{ imageRendering:"pixelated", width:size, height:size }} />;
}

function ShopItemCard({ item, owned, onBuy, featured, forceOwned }) {
  const isOwned = owned || forceOwned;
  const rc = RARITY_COLOR[item.rarity];
  const RARITY_LABEL = { common:"Common", uncommon:"Uncommon", rare:"Rare", epic:"Epic", legendary:"Legendary" };
  const CAT_ICONS = { clothing:"👕", armor:"🛡️", footwear:"👢", headgear:"⛑️", weapon:"⚔️", consumable:"🧪" };
  const spriteImg = SPRITE_IMG[item.id];
  return (
    <div style={{
      background:S1, border:`1px solid ${rc}30`, borderRadius:16, overflow:"hidden",
      ...(featured ? { flex:"0 0 140px", minWidth:140 } : {}),
    }}>
      <div style={{ height:3, background:rc }} />
      <div style={{ padding:"14px 12px 12px", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
        <div style={{ width:56, height:56, background:`${rc}10`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
          {spriteImg ? (
            <SpritePreview src={spriteImg} size={56} />
          ) : (
            <span style={{ fontSize:28 }}>{item.icon || ITEM_ICONS[item.cat] || "📦"}</span>
          )}
        </div>
        <div style={{ fontSize:12, fontWeight:700, color:TX, textAlign:"center", lineHeight:1.3 }}>{item.name}</div>
        <div style={{ fontSize:10, color:rc, fontWeight:700 }}>{RARITY_LABEL[item.rarity]} · {CAT_ICONS[item.cat] || ""} {item.cat}</div>
        {item.weaponType && <div style={{ fontSize:9, color:TM }}>Type: {item.weaponType}</div>}
        {isOwned ? (
          <div style={{ padding:"5px 12px", background:`${TG}15`, border:`1px solid ${TG}40`, borderRadius:99, fontSize:11, fontWeight:700, color:TG }}>✓ Owned</div>
        ) : (
          <button onClick={onBuy} style={{ padding:"7px 16px", background:`${rc}15`, border:`1px solid ${rc}40`, borderRadius:99, color:rc, fontSize:12, fontWeight:700, fontFamily:FONT }}>◎ {item.price || item.priceAE}</button>
        )}
      </div>
    </div>
  );
}

function CommunityItemCard({ item, owned, onBuy }) {
  return (
    <div style={{ background:S1, border:`1px solid ${TL}30`, borderRadius:16, overflow:"hidden" }}>
      <div style={{ height:3, background:TL }} />
      <div style={{ padding:"14px 12px 12px", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
        <div style={{ fontSize:32 }}>{item.icon}</div>
        <div style={{ fontSize:12, fontWeight:700, color:TX, textAlign:"center" }}>{item.name}</div>
        <div style={{ fontSize:10, color:TL }}>by {item.designer}</div>
        <div style={{ fontSize:10, color:TM }}>⭐ {item.votes} · Week #{item.weekId}</div>
        {owned ? (
          <div style={{ padding:"5px 12px", background:`${TG}15`, border:`1px solid ${TG}40`, borderRadius:99, fontSize:11, fontWeight:700, color:TG }}>✓ Owned</div>
        ) : (
          <button onClick={onBuy} style={{ padding:"7px 16px", background:`${TL}15`, border:`1px solid ${TL}40`, borderRadius:99, color:TL, fontSize:12, fontWeight:700, fontFamily:FONT }}>◎ {item.price}</button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLAN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function ClanScreen({ userOverride, onBack }) {
  const user = userOverride || CL_USER;
  const canCreate = user.level >= 5;
  const inClan = !!user.clan;
  if (!inClan) return <NoClanScreen user={user} canCreate={canCreate} onBack={onBack} />;
  return <ClanHub user={user} onBack={onBack} />;
}

const SUGGESTED_CLANS = [];

function NoClanScreen({ user, canCreate, onBack }) {
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
            {SUGGESTED_CLANS.map(c => (
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

function ClanHub({ user, onBack }) {
  const ctx = useContext(AppContext);
  const clan = user.clan;
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
          {CLAN_TABS.map(t => (
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

function OverviewTab({ clan, isLeader }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {/* Stats grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
        {[
          { val:clan.rank,                  lbl:"Rank",    icon:"🏆" },
          { val:clan.zonesHeld,             lbl:"Zones",   icon:"◈" },
          { val:`${clan.cpr}`,              lbl:"CPR",     icon:"⚡" },
          { val:`${(clan.treasury/1000).toFixed(1)}k`, lbl:"AE", icon:"◎" },
        ].map(s => (
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
        {ENEMY_CLANS.map(ec => (
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
            {["✏️ Edit Clan Info", "📢 Post Announcement"].map(l => (
              <button key={l} style={{ padding:"11px 16px", background:"rgba(255,255,255,0.03)", border:`1px solid ${BR}`, borderRadius:12, color:TM, fontSize:13, fontWeight:600, fontFamily:FONT, textAlign:"left" }}>{l}</button>
            ))}
            <button style={{ padding:"11px 16px", background:"rgba(239,68,68,0.06)", border:`1px solid rgba(239,68,68,0.3)`, borderRadius:12, color:TR, fontSize:13, fontWeight:600, fontFamily:FONT, textAlign:"left" }}>🚪 Disband Clan</button>
          </div>
        </Card>
      )}
    </div>
  );
}

function MembersTab({ clan, isLeader, isOfficer }) {
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
        {[["xp","XP"],["level","Level"],["zones","Zones"]].map(([k,l]) => (
          <button key={k} onClick={() => setSort(k)} style={{ padding:"5px 12px", background: sort===k ? `${TG}15` : "rgba(255,255,255,0.03)", border:`1px solid ${sort===k ? `${TG}50` : BR}`, borderRadius:99, fontSize:11, fontWeight:600, color: sort===k ? TG : TM, fontFamily:FONT }}>{l}</button>
        ))}
      </div>

      {sorted.map((m, i) => (
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

function ZonesTab({ clan, isLeader, isOfficer }) {
  const [selectedZone, setSelectedZone] = useState(null);
  const totalIncome = ZONES.reduce((s, z) => s + z.income, 0);

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

      {ZONES.map(z => (
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
              {["🛡️ Reinforce (+10 AE)", "⬆️ Upgrade Zone", ...(z.contested ? ["⚔️ Defend Now!"] : [])].map(l => (
                <button key={l} style={{ padding:"8px 12px", background: l.includes("Defend") ? `${TR}10` : "rgba(255,255,255,0.03)", border:`1px solid ${l.includes("Defend") ? `${TR}30` : BR}`, borderRadius:10, fontSize:12, fontWeight:600, color: l.includes("Defend") ? TR : TM, fontFamily:FONT }}>{l}</button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function WarTab({ clan, isLeader, isOfficer }) {
  const ctx = useContext(AppContext);
  const [selectedZone, setSelectedZone] = useState(null);
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
        {ZONES.filter(z=>z.contested).map(z => (
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
            {ATTACKABLE_ZONES.map(z => {
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
        {WAR_LOG.map(w => (
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

function TreasuryTab({ clan, isLeader }) {
  const ctx = useContext(AppContext);
  const [donateAmt, setDonateAmt] = useState("");
  const totalIncome = ZONES.reduce((s, z) => s + z.income, 0);
  const clanData = ctx?.sharedUser?.clan || clan;
  const treasuryBalance = clanData.treasury || TREASURY_LOG.reduce((s, t) => s + t.amount, 0);

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
            {[["🛡️","Reinforce Zone",200],["⬆️","Upgrade Zone",800],["⚔️","War Declaration",200],["📢","Clan Broadcast",100]].map(([icon,lbl,cost]) => (
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
        {TREASURY_LOG.map(t => (
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
// ADMIN DASHBOARD — Tokens, Styles, Components
// ═══════════════════════════════════════════════════════════════════════════════

// ─── TOKENS ────────────────────────────────────────────────────────────────────
const ADM_BG  = "#060A10";
const ADM_S1  = "#0A0F1C";
const ADM_S2  = "#0F1828";
const ADM_BR  = "#14203A";
const ADM_TX  = "#C8D8E8";
const C   = {
  teal:  "#00D4A8",
  amber: "#F5A623",
  red:   "#E74C3C",
  purple:"#A78BFA",
  dim:   "#445566",
  bg:ADM_BG, s1:ADM_S1, s2:ADM_S2, br:ADM_BR, tx:ADM_TX,
};
const ADM_FONT = "'IBM Plex Sans',system-ui,sans-serif";
const ADM_MONO = "'IBM Plex Mono',monospace";

// ─── STYLES ────────────────────────────────────────────────────────────────────
const AA = {
  // ── LOGIN ──
  loginRoot: { position:"relative", minHeight:"100dvh", background:ADM_BG, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:ADM_FONT, overflow:"hidden" },
  loginBg:   { position:"fixed", inset:0, background:`radial-gradient(ellipse 60% 60% at 50% 0%, rgba(0,212,168,0.05), transparent 60%), ${ADM_BG}` },
  loginGrid: { position:"fixed", inset:0, backgroundImage:`linear-gradient(rgba(0,212,168,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,168,0.04) 1px,transparent 1px)`, backgroundSize:"32px 32px", pointerEvents:"none" },
  loginScan: { position:"fixed", left:0, right:0, height:2, background:"linear-gradient(90deg, transparent, rgba(0,212,168,0.15), transparent)", animation:"scanline 4s linear infinite", pointerEvents:"none" },
  loginBox:  { position:"relative", zIndex:1, width:"100%", maxWidth:480, background:ADM_S1, border:`1px solid ${ADM_BR}`, borderRadius:4, overflow:"hidden" },
  loginShake:{ animation:"shake 0.5s ease" },
  termBar:   { background:ADM_S2, borderBottom:`1px solid ${ADM_BR}`, padding:"10px 16px", display:"flex", alignItems:"center", gap:12 },
  termDots:  { display:"flex", gap:6 },
  termDot:   { width:12, height:12, borderRadius:"50%" },
  termTitle: { fontSize:11, color:C.dim, fontFamily:ADM_MONO, letterSpacing:"0.05em" },
  asciiLogo: { fontFamily:ADM_MONO, fontSize:9.5, color:C.teal, padding:"20px 24px 8px", lineHeight:1.4, letterSpacing:"0.02em" },
  loginPrompt:{ padding:"0 24px 20px", display:"flex", alignItems:"center", gap:0 },
  loginPromptGt:{ color:C.teal, fontFamily:ADM_MONO, fontSize:13 },
  loginPromptTxt:{ color:ADM_TX, fontFamily:ADM_MONO, fontSize:13, letterSpacing:"0.08em" },
  cursor:    { color:C.teal, fontFamily:ADM_MONO, fontSize:13, transition:"opacity 0.1s" },
  loginForm: { padding:"0 24px 24px", display:"flex", flexDirection:"column", gap:16 },
  fieldWrap: { display:"flex", flexDirection:"column", gap:6 },
  fieldLabel:{ fontFamily:ADM_MONO, fontSize:10, color:C.dim, letterSpacing:"0.1em" },
  fieldInput:{ background:ADM_S2, border:`1px solid ${ADM_BR}`, borderRadius:3, padding:"12px 14px", color:ADM_TX, fontSize:13, fontFamily:ADM_MONO, outline:"none", transition:"border-color 0.15s" },
  loginErr:  { fontFamily:ADM_MONO, fontSize:11, color:C.red, letterSpacing:"0.05em", background:"rgba(231,76,60,0.08)", border:"1px solid rgba(231,76,60,0.25)", borderRadius:3, padding:"8px 12px" },
  loginBtn:  { padding:"13px 20px", background:`linear-gradient(135deg, #007A62, #00D4A8)`, border:"none", borderRadius:3, color:ADM_BG, fontSize:13, fontWeight:700, fontFamily:ADM_MONO, letterSpacing:"0.08em", cursor:"pointer", boxShadow:"0 0 24px rgba(0,212,168,0.25)" },
  loginFooter:{ padding:"12px 24px", borderTop:`1px solid ${ADM_BR}`, fontFamily:ADM_MONO, fontSize:10, color:C.dim, letterSpacing:"0.04em" },

  // ── DASHBOARD ──
  dashRoot:  { display:"flex", height:"100dvh", background:ADM_BG, color:ADM_TX, fontFamily:ADM_FONT, overflow:"hidden" },
  dashBg:    { position:"fixed", inset:0, background:ADM_BG, zIndex:0 },
  dashGrid:  { position:"fixed", inset:0, backgroundImage:`linear-gradient(rgba(0,212,168,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,168,0.02) 1px,transparent 1px)`, backgroundSize:"40px 40px", pointerEvents:"none", zIndex:0 },

  // ── SIDEBAR ──
  sidebar:   { flexShrink:0, background:ADM_S1, borderRight:`1px solid ${ADM_BR}`, display:"flex", flexDirection:"column", position:"relative", zIndex:2, transition:"width 0.2s ease", overflow:"hidden" },
  sidebarHead:{ padding:"16px", borderBottom:`1px solid ${ADM_BR}`, display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexShrink:0 },
  sidebarLogo:{ display:"flex", alignItems:"center", gap:10 },
  sidebarLogoIco:{ width:32, height:32, background:`linear-gradient(135deg, #007A62, #00D4A8)`, borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:ADM_BG, fontFamily:ADM_MONO, flexShrink:0 },
  sidebarLogoTxt:{ fontSize:12, fontWeight:800, color:ADM_TX, letterSpacing:"0.1em", fontFamily:ADM_MONO, lineHeight:1 },
  sidebarLogoSub:{ fontSize:9, color:C.dim, letterSpacing:"0.05em", fontFamily:ADM_MONO },
  collapseBtn:{ background:"none", border:`1px solid ${ADM_BR}`, borderRadius:3, color:C.dim, fontSize:10, padding:"4px 8px", fontFamily:ADM_MONO, flexShrink:0 },
  roleBadge:  { margin:"8px 12px 4px", padding:"4px 10px", borderRadius:3, fontSize:9, fontWeight:700, fontFamily:ADM_MONO, letterSpacing:"0.08em", textAlign:"center" },
  roleBadgeAdmin:   { background:"rgba(0,212,168,0.1)", border:"1px solid rgba(0,212,168,0.3)", color:C.teal },
  roleBadgeResearch:{ background:"rgba(167,139,250,0.1)", border:"1px solid rgba(167,139,250,0.3)", color:C.purple },
  roleBadgeMod:     { background:"rgba(245,166,35,0.1)", border:"1px solid rgba(245,166,35,0.3)", color:C.amber },
  sidebarNav: { flex:1, overflowY:"auto", padding:"4px 8px" },
  navItem:    { display:"flex", alignItems:"center", gap:10, padding:"9px 10px", borderRadius:3, background:"none", border:"none", color:C.dim, cursor:"pointer", fontFamily:ADM_FONT, width:"100%", position:"relative", transition:"all 0.15s", marginBottom:1, whiteSpace:"nowrap" },
  navItemOn:  { background:"rgba(0,212,168,0.07)", color:ADM_TX },
  navIcon:    { fontSize:14, flexShrink:0, width:18, textAlign:"center" },
  navLabel:   { fontSize:12, fontWeight:600, letterSpacing:"0.01em" },
  navPip:     { position:"absolute", left:0, top:"50%", transform:"translateY(-50%)", width:2, height:16, background:C.teal, borderRadius:99 },
  sidebarFoot:{ padding:"12px", borderTop:`1px solid ${ADM_BR}`, flexShrink:0 },
  sidebarTime:{ fontFamily:ADM_MONO, fontSize:10, color:C.dim, marginBottom:8, letterSpacing:"0.06em" },
  logoutBtn:  { display:"flex", alignItems:"center", padding:"8px 10px", background:"none", border:`1px solid ${ADM_BR}`, borderRadius:3, color:C.dim, fontSize:12, fontFamily:ADM_FONT, width:"100%", transition:"all 0.15s" },

  // ── MAIN ──
  main:      { flex:1, display:"flex", flexDirection:"column", overflow:"hidden", position:"relative", zIndex:1 },
  topStrip:  { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px", borderBottom:`1px solid ${ADM_BR}`, background:ADM_S1, flexShrink:0 },
  topLeft:   { display:"flex", flexDirection:"column" },
  topSection:{ fontSize:16, fontWeight:700, color:ADM_TX, letterSpacing:"-0.2px" },
  topBreadcrumb:{ fontSize:10, color:C.dim, fontFamily:ADM_MONO, letterSpacing:"0.04em", marginTop:2 },
  topRight:  { display:"flex", alignItems:"center", gap:16 },
  liveBadge: { display:"flex", alignItems:"center", gap:7, fontSize:11, color:C.teal, fontFamily:ADM_MONO, letterSpacing:"0.04em" },
  liveDot:   { width:7, height:7, borderRadius:"50%", background:C.teal, transition:"opacity 0.3s" },
  topTime:   { fontSize:11, color:C.dim, fontFamily:ADM_MONO },
  content:   { flex:1, overflowY:"auto", padding:"20px 20px 0" },

  // ── SECTION ──
  secWrap:   { paddingBottom:40 },
  sectionTitle:{ marginBottom:20 },
  sectionTitleTxt:{ fontSize:20, fontWeight:700, color:ADM_TX, letterSpacing:"-0.3px", marginBottom:4 },
  sectionSub:{ fontSize:11, color:C.dim, fontFamily:ADM_MONO, letterSpacing:"0.03em" },

  // ── KPI ──
  kpiGrid:   { display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:10, marginBottom:16 },
  kpiCard:   { background:ADM_S1, border:`1px solid ${ADM_BR}`, borderRadius:4, padding:"14px 16px" },
  kpiVal:    { fontSize:22, fontWeight:700, fontFamily:ADM_MONO, letterSpacing:"-0.5px", marginBottom:4 },
  kpiLabel:  { fontSize:11, color:ADM_TX, fontWeight:600, marginBottom:4 },
  kpiDelta:  { fontSize:10, fontFamily:ADM_MONO, letterSpacing:"0.03em" },

  // ── CHARTS ──
  chartsRow: { display:"flex", gap:12, marginBottom:12 },
  chartCard: { background:ADM_S1, border:`1px solid ${ADM_BR}`, borderRadius:4, padding:"14px 16px", flex:1 },
  chartTitle:{ fontSize:12, fontWeight:700, color:ADM_TX, marginBottom:10, letterSpacing:"-0.1px" },

  // ── TABLE ──
  tableWrap: { background:ADM_S1, border:`1px solid ${ADM_BR}`, borderRadius:4, overflow:"auto", marginBottom:12 },
  table:     { width:"100%", borderCollapse:"collapse", fontSize:12 },
  th:        { padding:"10px 12px", textAlign:"left", fontFamily:ADM_MONO, fontSize:10, color:C.dim, letterSpacing:"0.08em", borderBottom:`1px solid ${ADM_BR}`, whiteSpace:"nowrap" },
  tr:        { borderBottom:`1px solid ${ADM_BR}` },
  td:        { padding:"10px 12px", color:ADM_TX, verticalAlign:"middle" },
  playerName:{ fontWeight:600, color:ADM_TX },
  mono:      { fontFamily:ADM_MONO, fontSize:12 },
  monoSm:    { fontFamily:ADM_MONO, fontSize:10, color:C.dim },
  actionBtns:{ display:"flex", gap:6, alignItems:"center" },
  tinyBtn:   { padding:"4px 10px", background:ADM_S2, border:`1px solid ${ADM_BR}`, borderRadius:3, fontSize:10, fontWeight:600, color:ADM_TX, fontFamily:ADM_MONO, whiteSpace:"nowrap" },
  tinyBtnRed:   { borderColor:"rgba(231,76,60,0.4)", color:C.red, background:"rgba(231,76,60,0.06)" },
  tinyBtnAmber: { borderColor:"rgba(245,166,35,0.4)", color:C.amber, background:"rgba(245,166,35,0.06)" },
  tinyBtnGreen: { borderColor:"rgba(0,212,168,0.4)", color:C.teal, background:"rgba(0,212,168,0.06)" },
  statusPillEl: { fontSize:10, fontWeight:700, fontFamily:ADM_MONO, border:"1px solid", borderRadius:99, padding:"2px 8px", textTransform:"uppercase", letterSpacing:"0.05em" },
  toolBar:   { display:"flex", alignItems:"center", gap:10, marginBottom:12, flexWrap:"wrap" },
  searchInput:{ flex:1, minWidth:200, background:ADM_S2, border:`1px solid ${ADM_BR}`, borderRadius:3, padding:"9px 12px", color:ADM_TX, fontSize:12, fontFamily:ADM_MONO, outline:"none" },
  filterRow: { display:"flex", gap:6 },
  filterBtn: { padding:"7px 12px", background:ADM_S2, border:`1px solid ${ADM_BR}`, borderRadius:3, fontSize:10, fontWeight:700, color:C.dim, fontFamily:ADM_MONO, letterSpacing:"0.06em" },
  filterBtnOn:{ background:"rgba(0,212,168,0.08)", borderColor:"rgba(0,212,168,0.4)", color:C.teal },
  exportBtn: { padding:"8px 14px", background:ADM_S2, border:`1px solid ${ADM_BR}`, borderRadius:3, fontSize:11, fontWeight:600, color:ADM_TX, fontFamily:ADM_FONT, whiteSpace:"nowrap" },

  // ── MODAL ──
  modalOverlay:{ position:"fixed", inset:0, background:"rgba(6,10,16,0.88)", backdropFilter:"blur(8px)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" },
  modal:     { background:ADM_S1, border:`1px solid ${ADM_BR}`, borderRadius:4, padding:24, width:"100%", maxWidth:520, position:"relative" },
  modalHdr:  { display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20 },
  modalTitle:{ fontSize:16, fontWeight:700, color:ADM_TX },
  modalSub:  { fontSize:11, color:C.dim, fontFamily:ADM_MONO, marginTop:4 },
  modalClose:{ background:"none", border:`1px solid ${ADM_BR}`, borderRadius:3, color:C.dim, fontSize:12, padding:"4px 10px", fontFamily:ADM_MONO },
  modalGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 },
  modalStat: { background:ADM_S2, border:`1px solid ${ADM_BR}`, borderRadius:4, padding:"10px 12px" },
  modalStatLbl:{ fontSize:9, color:C.dim, fontFamily:ADM_MONO, letterSpacing:"0.08em", marginBottom:4 },
  modalStatVal:{ fontSize:14, fontWeight:700, color:ADM_TX, fontFamily:ADM_MONO },
  modalActions:{ display:"flex", flexDirection:"column", gap:8 },
  modalBtn:  { padding:"10px 14px", background:ADM_S2, border:`1px solid ${ADM_BR}`, borderRadius:3, fontSize:12, fontWeight:600, color:ADM_TX, fontFamily:ADM_FONT, textAlign:"left" },
  modalBtnRed:{ borderColor:"rgba(231,76,60,0.4)", color:C.red, background:"rgba(231,76,60,0.06)" },

  // ── WELLBEING ──
  crisisBox: { background:"rgba(231,76,60,0.04)", border:"1px solid rgba(231,76,60,0.3)", borderRadius:4, marginBottom:16 },
  crisisHdr: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderBottom:"1px solid rgba(231,76,60,0.2)" },
  crisisTitle:{ fontSize:12, fontWeight:700, color:C.red, fontFamily:ADM_MONO, letterSpacing:"0.05em" },
  crisisCount:{ fontSize:11, color:C.red, fontFamily:ADM_MONO },
  crisisRow: { display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderBottom:"1px solid rgba(231,76,60,0.1)" },
  crisisRowResolved:{ opacity:0.5 },
  crisisLeft:{ flex:1, minWidth:0 },
  crisisAnon:{ fontSize:12, fontWeight:700, color:C.red, fontFamily:ADM_MONO, marginBottom:4 },
  crisisText:{ fontSize:13, color:ADM_TX, marginBottom:4, fontStyle:"italic" },
  crisisMeta:{ fontSize:10, color:C.dim, fontFamily:ADM_MONO },
  crisisActions:{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 },
  crisisContactBtn:{ padding:"8px 12px", background:C.red, border:"none", borderRadius:3, color:"#fff", fontSize:11, fontWeight:700, fontFamily:ADM_FONT, whiteSpace:"nowrap" },
  crisisResolveBtn: { padding:"8px 12px", background:ADM_S2, border:`1px solid ${ADM_BR}`, borderRadius:3, color:ADM_TX, fontSize:11, fontFamily:ADM_FONT },
  resolvedBadge:    { fontSize:11, color:C.teal, fontFamily:ADM_MONO },
  moodBars:  { display:"flex", flexDirection:"column", gap:8, marginTop:4 },
  moodBar:   { display:"flex", alignItems:"center", gap:10 },
  moodBarLbl:{ fontSize:11, color:C.dim, width:70, flexShrink:0 },
  moodBarTrack:{ flex:1, height:6, background:"#1A2438", borderRadius:99, overflow:"hidden" },
  moodBarFill: { height:"100%", borderRadius:99, transition:"width 0.6s ease" },
  moodNote:  { fontSize:11, color:C.amber, marginTop:12, fontFamily:ADM_MONO, lineHeight:1.5 },
  privacyBox:{ background:"rgba(0,212,168,0.03)", border:`1px solid rgba(0,212,168,0.15)`, borderRadius:4, padding:"12px 16px" },
  privacyTitle:{ fontSize:11, fontWeight:700, color:C.teal, fontFamily:ADM_MONO, marginBottom:6 },
  privacyBody: { fontSize:11, color:C.dim, lineHeight:1.6 },

  // ── HEALTH ──
  healthRow: { display:"flex", gap:12, marginBottom:12 },
  healthGrid:{ display:"flex", flexDirection:"column", gap:8, marginTop:4 },
  healthRow2:{ display:"flex", alignItems:"center", gap:10 },
  statusPip: { width:7, height:7, borderRadius:"50%", flexShrink:0 },
  healthSvc: { flex:1, fontSize:12, color:ADM_TX },
  healthMs:  { fontFamily:ADM_MONO, fontSize:11 },

  // ── FEED ──
  feedList:  { display:"flex", flexDirection:"column", gap:1, maxHeight:200, overflowY:"auto" },
  feedRow:   { display:"flex", alignItems:"center", gap:8, padding:"6px 0", borderBottom:`1px solid ${ADM_BR}` },
  feedRowAlert:{ background:"rgba(231,76,60,0.04)", padding:"6px 6px" },
  feedTime:  { fontFamily:ADM_MONO, fontSize:10, color:C.dim, flexShrink:0, width:36 },
  feedDot:   { width:6, height:6, borderRadius:"50%", flexShrink:0 },
  feedTxt:   { fontSize:11, color:ADM_TX, flex:1, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  feedFlagPill:{ fontSize:9, fontWeight:700, color:C.red, border:"1px solid rgba(231,76,60,0.4)", borderRadius:99, padding:"1px 6px", fontFamily:ADM_MONO, flexShrink:0 },

  // ── ECONOMY ──
  ecoControls:{ display:"flex", flexDirection:"column", gap:10 },
  ecoControlRow:{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${ADM_BR}` },
  ecoControlLabel:{ fontSize:12, color:ADM_TX },
  ecoControlRight:{ display:"flex", alignItems:"center", gap:12 },

  // ── STORY ──
  chapterRow:{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${ADM_BR}` },
  chapterLeft:{ display:"flex", alignItems:"center", gap:12 },
  chapterTitle:{ fontSize:13, fontWeight:600, color:ADM_TX, marginBottom:3 },
  chapterMeta: { fontSize:11, color:C.dim, fontFamily:ADM_MONO },
  clueRow:   { display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${ADM_BR}` },

  // ── ZONE COOLDOWN ──
  ruleCallout:    { display:"flex", alignItems:"flex-start", gap:10, padding:"12px 14px", background:"rgba(245,166,35,0.05)", border:"1px solid rgba(245,166,35,0.2)", borderRadius:4, marginBottom:12 },
  ruleCalloutIcon:{ fontSize:16, flexShrink:0, marginTop:1 },
  ruleCalloutTitle:{ fontSize:12, fontWeight:700, color:C.amber },
  ruleCalloutBody: { fontSize:11, color:C.dim, lineHeight:1.6 },
  cdUsed:  { fontSize:11, fontWeight:700, color:C.red, fontFamily:ADM_MONO },
  cdTimer: { fontSize:10, color:C.dim, fontFamily:ADM_MONO, marginTop:2 },
  cdOpen:  { fontSize:11, fontWeight:700, color:C.teal, fontFamily:ADM_MONO },
  modalCdBox:   { display:"flex", alignItems:"flex-start", gap:10, padding:"12px 14px", background:"rgba(231,76,60,0.06)", border:"1px solid rgba(231,76,60,0.25)", borderRadius:4, marginBottom:16 },
  modalCdIcon:  { fontSize:18, flexShrink:0 },
  modalCdTitle: { fontSize:12, fontWeight:700, color:C.red, marginBottom:4 },
  modalCdSub:   { fontSize:11, color:C.dim, lineHeight:1.5 },

  // ── INNER TABS ──
  innerTabBar: { display:"flex", gap:4, marginBottom:16, borderBottom:`1px solid ${ADM_BR}`, paddingBottom:0 },
  innerTab: {
    padding:"8px 16px 10px", background:"none", border:"none", borderBottom:"2px solid transparent",
    color:C.dim, fontSize:12, fontWeight:600, fontFamily:ADM_FONT, cursor:"pointer",
    display:"flex", alignItems:"center", gap:8, position:"relative", marginBottom:-1,
    transition:"color 0.15s",
  },
  innerTabOn: { color:ADM_TX, borderBottomColor:C.teal },
  innerTabBadge: {
    background:C.red, color:"#fff", fontSize:9, fontWeight:800, fontFamily:ADM_MONO,
    padding:"2px 6px", borderRadius:99, lineHeight:1,
  },

  // ── PROOF REVIEW ──
  proofNote: {
    marginTop:12, padding:"10px 14px", background:"rgba(245,166,35,0.05)",
    border:"1px solid rgba(245,166,35,0.2)", borderRadius:4,
    fontSize:11, color:C.dim, lineHeight:1.6,
  },
  proofQueueLabel: {
    fontSize:10, fontWeight:700, color:C.amber, letterSpacing:"0.08em",
    textTransform:"uppercase", marginBottom:8, marginTop:4,
    fontFamily:ADM_MONO,
  },
  proofCard: {
    display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
    background:ADM_S1, border:`1px solid ${ADM_BR}`, borderRadius:4, marginBottom:8,
  },
  proofThumb: {
    width:52, height:52, background:ADM_S2, border:`1px solid ${ADM_BR}`, borderRadius:4,
    display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:22, flexShrink:0,
  },
  proofCardInfo: { flex:1, minWidth:0 },
  proofCardTitle:{ fontSize:13, fontWeight:700, color:ADM_TX, marginBottom:3 },
  proofCardMeta: { fontSize:11, color:C.dim, marginBottom:6, fontFamily:ADM_MONO },
  proofCardReward:{ display:"flex", alignItems:"center", gap:10, fontSize:11, fontWeight:700 },
  proofImgWrap:  { background:ADM_S2, border:`1px solid ${ADM_BR}`, borderRadius:4, overflow:"hidden", marginBottom:16 },
  proofImgPlaceholder: {
    height:180, display:"flex", flexDirection:"column", alignItems:"center",
    justifyContent:"center", fontSize:36, color:C.dim,
  },
  proofFlagBanner: {
    background:"rgba(231,76,60,0.1)", borderTop:"1px solid rgba(231,76,60,0.3)",
    color:C.red, fontSize:11, fontWeight:700, padding:"8px 14px", fontFamily:ADM_MONO,
  },
  proofUserNote: {
    padding:"10px 14px", background:ADM_S2, border:`1px solid ${ADM_BR}`, borderRadius:4,
    fontSize:12, color:ADM_TX, lineHeight:1.5, marginBottom:12,
  },
  proofRewardRow: { display:"flex", gap:8, flexWrap:"wrap", marginBottom:4 },
  proofRewardChip: {
    padding:"4px 12px", background:ADM_S2, border:`1px solid ${ADM_BR}`, borderRadius:99,
    fontSize:11, fontWeight:700, color:ADM_TX, display:"flex", alignItems:"center", gap:6,
  },

  // ── EVENTS ──
  eventCard: {
    background:ADM_S1, border:`1px solid ${ADM_BR}`, borderLeft:"3px solid",
    borderRadius:4, padding:"14px 16px", marginBottom:10,
  },
  eventCardTop:  { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 },
  eventCardLeft: { flex:1, minWidth:0 },
  eventCardRight:{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0, marginLeft:12 },
  eventTypePill: { fontSize:9, fontWeight:800, border:"1px solid", borderRadius:99, padding:"2px 8px", letterSpacing:"0.06em", display:"inline-block", marginBottom:6 },
  eventCardTitle:{ fontSize:14, fontWeight:700, color:ADM_TX, marginBottom:4 },
  eventCardDesc: { fontSize:11, color:C.dim, lineHeight:1.5 },
  eventStatusDot:{ width:8, height:8, borderRadius:"50%" },
  eventCardMeta: {
    display:"flex", flexWrap:"wrap", gap:"6px 16px",
    fontSize:11, color:C.dim, fontFamily:ADM_MONO, marginBottom:10,
  },

  // ── REWARD BUILDER ──
  rewardBuilderWrap: { padding:"14px 16px", background:ADM_S2, border:`1px solid ${ADM_BR}`, borderRadius:4, marginTop:4 },
  rewardRuleRow: { display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:ADM_BG, border:`1px solid ${ADM_BR}`, borderRadius:4 },
  rewardRuleIcon:{ fontSize:16, flexShrink:0 },
  rewardRuleChip:{ fontSize:10, fontWeight:700, padding:"3px 10px", background:ADM_S2, border:`1px solid ${ADM_BR}`, borderRadius:99, color:ADM_TX, whiteSpace:"nowrap" },

  // ── MODERATION LADDER ──
  modLadder: { display:"flex", alignItems:"center", gap:0, padding:"12px 16px", background:ADM_S2, border:`1px solid ${ADM_BR}`, borderRadius:4, marginBottom:16 },
  modLadderItem: { display:"flex", alignItems:"center", gap:8, flex:1 },
  modLadderIcon: { width:34, height:34, borderRadius:8, border:"1px solid", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 },
  modLadderLabel:{ fontSize:12, fontWeight:800, color:ADM_TX },
  modLadderNote: { fontSize:10, color:C.dim, marginLeft:4 },
  modLadderArrow:{ fontSize:16, color:C.dim, margin:"0 12px", flexShrink:0 },

  // ── STYLE EVENT LEADERBOARD ──
  standingRow:   { display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${ADM_BR}` },
  standingRank:  { fontFamily:ADM_MONO, fontSize:13, fontWeight:800, width:28, flexShrink:0 },
  standingInfo:  { flex:1, minWidth:0 },
  standingName:  { fontSize:12, fontWeight:700, color:ADM_TX, display:"block" },
  standingMeta:  { fontSize:10, color:C.dim },

  // ── STYLE EVENT ──
  chartTop: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 },
};

// ─── ADMIN GLOBAL STYLES ───────────────────────────────────────────────────────
function AdminGlobalStyles() {
  useEffect(() => {
    const id = "ce-admin-global";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
      @keyframes shake {
        0%,100%{ transform:translateX(0); }
        20%    { transform:translateX(-8px); }
        40%    { transform:translateX(8px); }
        60%    { transform:translateX(-5px); }
        80%    { transform:translateX(5px); }
      }
      @keyframes scanline {
        0%   { transform:translateY(-100%); }
        100% { transform:translateY(100vh); }
      }
    `;
    document.head.appendChild(el);
  }, []);
  return null;
}

// ─── ADMIN HELPER COMPONENTS ───────────────────────────────────────────────────
function AdminSectionTitle({ title, sub }) {
  return (
    <div style={AA.sectionTitle}>
      <div style={AA.sectionTitleTxt}>{title}</div>
      <div style={AA.sectionSub}>{sub}</div>
    </div>
  );
}
// Alias for backward compat
const SectionTitle = AdminSectionTitle;

function KpiCard({ label, val, delta, color }) {
  return (
    <div style={AA.kpiCard}>
      <div style={{ ...AA.kpiVal, color }}>{val}</div>
      <div style={AA.kpiLabel}>{label}</div>
      <div style={{ ...AA.kpiDelta, color: delta.includes("⚠") ? C.red : C.dim }}>{delta}</div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = { active:C.teal, flagged:C.red, warned:C.amber, inactive:C.dim, pending:C.amber, reviewing:C.amber, resolved:C.teal };
  return <span style={{ ...AA.statusPillEl, color:map[status]||C.dim, borderColor:(map[status]||C.dim)+"44" }}>{status}</span>;
}

function StrengthBar({ val }) {
  const c = val > 70 ? C.teal : val > 40 ? C.amber : C.red;
  return (
    <div style={{ width:80 }}>
      <div style={{ height:4, background:"#1A2438", borderRadius:99, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${val}%`, background:c, borderRadius:99 }} />
      </div>
      <div style={{ ...AA.monoSm, color:c, marginTop:2 }}>{val}%</div>
    </div>
  );
}

function AdminTable({ cols, rows }) {
  return (
    <div style={AA.tableWrap}>
      <table style={AA.table}>
        <thead>
          <tr>
            {cols.map(c => <th key={c} style={AA.th}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={AA.tr}>
              {row.map((cell, j) => <td key={j} style={AA.td}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
// Alias
const Table = AdminTable;

// ─── CHART COMPONENTS ──────────────────────────────────────────────────────────
function MiniLineChart({ data, color, min, max, label }) {
  const h = 80, w = 400, pad = 10;
  const lo = min ?? Math.min(...data), hi = max ?? Math.max(...data);
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - lo) / (hi - lo || 1)) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  const fillPts = `${pad},${h} ` + pts + ` ${w - pad},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width:"100%", height:80 }}>
      <defs>
        <linearGradient id={`g${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill={`url(#g${color.replace("#","")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DualLineChart({ data1, data2, color1, color2 }) {
  const h = 80, w = 400, pad = 10;
  const allVals = [...data1, ...data2];
  const lo = Math.min(...allVals), hi = Math.max(...allVals);
  const pts = (data) => data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - lo) / (hi - lo || 1)) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width:"100%", height:80 }}>
        <polyline points={pts(data1)} fill="none" stroke={color1} strokeWidth={1.8} strokeLinecap="round" />
        <polyline points={pts(data2)} fill="none" stroke={color2} strokeWidth={1.8} strokeLinecap="round" strokeDasharray="4 2" />
      </svg>
      <div style={{ display:"flex", gap:16, marginTop:4 }}>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ width:16, height:2, background:color1 }} />
          <span style={{ fontSize:10, color:C.dim }}>Supply</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ width:16, height:2, background:color2, borderTop:`2px dashed ${color2}` }} />
          <span style={{ fontSize:10, color:C.dim }}>Sinks</span>
        </div>
      </div>
    </div>
  );
}

function polarToCartesian(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function DonutChart({ segments }) {
  const total = segments.reduce((s, seg) => s + seg.val, 0);
  let acc = -90;
  const r = 60, cx = 90, cy = 90;
  const slices = segments.map(seg => {
    const angle = (seg.val / total) * 360;
    const start = acc;
    acc += angle;
    const s = polarToCartesian(cx, cy, r, start);
    const e = polarToCartesian(cx, cy, r, start + angle - 1);
    const large = angle > 180 ? 1 : 0;
    return { ...seg, d:`M${cx},${cy} L${s.x},${s.y} A${r},${r} 0 ${large},1 ${e.x},${e.y} Z` };
  });
  return (
    <div style={{ display:"flex", alignItems:"center", gap:16 }}>
      <svg width={180} height={180} viewBox="0 0 180 180">
        {slices.map((sl,i) => <path key={i} d={sl.d} fill={sl.color} opacity={0.85} />)}
        <circle cx={cx} cy={cy} r={38} fill="#0A0F1C" />
        <text x={cx} y={cy-5} textAnchor="middle" fill={ADM_TX} fontSize={11} fontWeight={800}>{total}%</text>
        <text x={cx} y={cy+12} textAnchor="middle" fill={C.dim} fontSize={9}>total</text>
      </svg>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {segments.map(s => (
          <div key={s.label} style={{ display:"flex", alignItems:"center", gap:7 }}>
            <div style={{ width:8, height:8, borderRadius:2, background:s.color, flexShrink:0 }} />
            <span style={{ fontSize:11, color:C.dim }}>{s.label}</span>
            <span style={{ ...AA.mono, fontSize:11, color:s.color, marginLeft:"auto" }}>{s.val}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.val));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:8 }}>
      {data.map(d => (
        <div key={d.label} style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:11, color:C.dim, width:80, flexShrink:0 }}>{d.label}</span>
          <div style={{ flex:1, height:6, background:"#1A2438", borderRadius:99, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${(d.val/max)*100}%`, background:d.color, borderRadius:99 }} />
          </div>
          <span style={{ ...AA.mono, fontSize:11, color:d.color, width:50, textAlign:"right" }}>{d.val} AE</span>
        </div>
      ))}
    </div>
  );
}

// ─── ACCESS GATE ───────────────────────────────────────────────────────────────
const DEMO_CREDS = [
  { user:"admin@campus.ac.uk",      pass:"CE_ADMIN_2026",  role:"admin"      },
  { user:"research@campus.ac.uk",   pass:"CE_RESEARCH",    role:"researcher" },
  { user:"mod@campus.ac.uk",        pass:"CE_MOD_2026",    role:"moderator"  },
];

function AdminRoot({ onExitAdmin }) {
  const [authed, setAuthed]   = useState(false);
  const [role,   setRole]     = useState(null);
  const handleLogout = () => { setAuthed(false); setRole(null); if (onExitAdmin) onExitAdmin(); };
  return authed
    ? <AdminDashboard role={role} onLogout={handleLogout} />
    : <AdminLogin onAuth={(r) => { setRole(r); setAuthed(true); }} onCancel={onExitAdmin} />;
}

function AdminLogin({ onAuth, onCancel }) {
  const [email, setEmail]   = useState("");
  const [pass,  setPass]    = useState("");
  const [err,   setErr]     = useState("");
  const [shake, setShake]   = useState(false);
  const [blink, setBlink]   = useState(true);

  useEffect(() => {
    const t = setInterval(() => setBlink(b => !b), 530);
    return () => clearInterval(t);
  }, []);

  const attempt = () => {
    const match = DEMO_CREDS.find(c => c.user === email && c.pass === pass);
    if (match) {
      onAuth(match.role);
    } else {
      setErr("ACCESS DENIED — invalid credentials");
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <>
      <AdminGlobalStyles />
      <div style={AA.loginRoot}>
        <div style={AA.loginBg} />
        <div style={AA.loginGrid} />
        <div style={AA.loginScan} />

        <div style={{ ...AA.loginBox, ...(shake ? AA.loginShake : {}) }}>
          <div style={AA.termBar}>
            <div style={AA.termDots}>
              <div style={{ ...AA.termDot, background:"#FF5F57" }} />
              <div style={{ ...AA.termDot, background:"#FFBD2E" }} />
              <div style={{ ...AA.termDot, background:"#28C840" }} />
            </div>
            <span style={AA.termTitle}>ZONERUSH // ADMIN TERMINAL</span>
          </div>

          <pre style={AA.asciiLogo}>{`
  ██████╗███████╗
 ██╔════╝██╔════╝
 ██║     █████╗  
 ██║     ██╔══╝  
 ╚██████╗███████╗
  ╚═════╝╚══════╝  STAFF PORTAL`}</pre>

          <div style={AA.loginPrompt}>
            <span style={AA.loginPromptGt}>&gt;</span>
            <span style={AA.loginPromptTxt}> AUTHENTICATION REQUIRED</span>
            <span style={{ ...AA.cursor, opacity: blink ? 1 : 0 }}>█</span>
          </div>

          <div style={AA.loginForm}>
            <div style={AA.fieldWrap}>
              <label style={AA.fieldLabel}>USER IDENTIFIER</label>
              <input style={AA.fieldInput} type="email" value={email} onChange={e => { setEmail(e.target.value); setErr(""); }} placeholder="staff@campus.ac.uk" onKeyDown={e => e.key === "Enter" && attempt()} autoComplete="off" />
            </div>
            <div style={AA.fieldWrap}>
              <label style={AA.fieldLabel}>PASSPHRASE</label>
              <input style={AA.fieldInput} type="password" value={pass} onChange={e => { setPass(e.target.value); setErr(""); }} placeholder="••••••••••••••" onKeyDown={e => e.key === "Enter" && attempt()} />
            </div>
            {err && <div style={AA.loginErr}>⚠ {err}</div>}
            <button style={AA.loginBtn} onClick={attempt}>AUTHENTICATE →</button>
          </div>

          <div style={AA.loginFooter}>
            Demo: admin@campus.ac.uk / CE_ADMIN_2026
            {onCancel && (
              <button onClick={onCancel} style={{ display:"block", marginTop:8, background:"none", border:"none", color:C.dim, fontFamily:ADM_MONO, fontSize:10, cursor:"pointer", textDecoration:"underline", padding:0 }}>
                ← Back to app
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── MAIN DASHBOARD ────────────────────────────────────────────────────────────
const SECTIONS = [
  { id:"overview",    icon:"◈",  label:"Overview",      roles:["admin","researcher","moderator"] },
  { id:"players",     icon:"👤", label:"Players",       roles:["admin","moderator"] },
  { id:"wellbeing",   icon:"💚", label:"Wellbeing",     roles:["admin","researcher"] },
  { id:"zones",       icon:"🗺️", label:"Zones",         roles:["admin","moderator"] },
  { id:"economy",     icon:"◎",  label:"Economy",       roles:["admin","researcher"] },
  { id:"shop",        icon:"🛒", label:"Shop",          roles:["admin"] },
  { id:"missions",    icon:"🎯", label:"Missions",      roles:["admin"] },
  { id:"events",      icon:"⚡", label:"Events",        roles:["admin"] },
  { id:"styleevent",  icon:"👗", label:"Style Event",   roles:["admin","moderator"] },
  { id:"combat",      icon:"⚔️", label:"Combat",        roles:["admin","moderator"] },
  { id:"clans",       icon:"🛡️", label:"Clans",         roles:["admin","moderator"] },
  { id:"story",       icon:"📖", label:"Story Quest",   roles:["admin"] },
  { id:"moderation",  icon:"🚩", label:"Moderation",    roles:["admin","moderator"] },
  { id:"research",    icon:"📊", label:"Research",      roles:["admin","researcher"] },
  { id:"config",      icon:"⚙️", label:"Config",        roles:["admin"] },
];

function AdminDashboard({ role, onLogout }) {
  const [section, setSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const visibleSections = SECTIONS.filter(s => s.roles.includes(role));
  const current = visibleSections.find(s => s.id === section) || visibleSections[0];

  return (
    <>
      <AdminGlobalStyles />
      <div style={AA.dashRoot}>
        <div style={AA.dashBg} />
        <div style={AA.dashGrid} />

        <aside style={{ ...AA.sidebar, width: sidebarOpen ? 220 : 56 }}>
          <div style={AA.sidebarHead}>
            <div style={AA.sidebarLogo}>
              <span style={AA.sidebarLogoIco}>ZR</span>
              {sidebarOpen && <div>
                <div style={AA.sidebarLogoTxt}>ZONERUSH</div>
                <div style={AA.sidebarLogoSub}>Admin Portal</div>
              </div>}
            </div>
            <button style={AA.collapseBtn} onClick={() => setSidebarOpen(o => !o)}>
              {sidebarOpen ? "◄" : "►"}
            </button>
          </div>

          {sidebarOpen && (
            <div style={{ ...AA.roleBadge, ...(role === "admin" ? AA.roleBadgeAdmin : role === "researcher" ? AA.roleBadgeResearch : AA.roleBadgeMod) }}>
              {role === "admin" ? "⚡ ADMIN" : role === "researcher" ? "🔬 RESEARCHER" : "🛡 MODERATOR"}
            </div>
          )}

          <nav style={AA.sidebarNav}>
            {visibleSections.map(s => (
              <button key={s.id} style={{ ...AA.navItem, ...(section === s.id ? AA.navItemOn : {}) }} onClick={() => setSection(s.id)} title={s.label}>
                <span style={AA.navIcon}>{s.icon}</span>
                {sidebarOpen && <span style={AA.navLabel}>{s.label}</span>}
                {section === s.id && <div style={AA.navPip} />}
              </button>
            ))}
          </nav>

          <div style={AA.sidebarFoot}>
            {sidebarOpen && <div style={AA.sidebarTime}>{time.toLocaleTimeString("en-GB")}</div>}
            <button style={AA.logoutBtn} onClick={onLogout} title="Logout">
              <span>⏏</span>
              {sidebarOpen && <span style={{ marginLeft:6 }}>Logout</span>}
            </button>
          </div>
        </aside>

        <main style={AA.main}>
          <div style={AA.topStrip}>
            <div style={AA.topLeft}>
              <span style={AA.topSection}>{current.icon} {current.label}</span>
              <span style={AA.topBreadcrumb}>Campus Engage / Admin / {current.label}</span>
            </div>
            <div style={AA.topRight}>
              <LiveBadge />
              <div style={AA.topTime}>{time.toLocaleDateString("en-GB", { weekday:"short", day:"numeric", month:"short" })}</div>
            </div>
          </div>

          <div style={AA.content}>
            {section === "overview"   && <OverviewSection />}
            {section === "players"    && <PlayersSection />}
            {section === "wellbeing"  && <WellbeingSection />}
            {section === "zones"      && <ZonesSection />}
            {section === "economy"    && <EconomySection />}
            {section === "shop"       && <ShopSection />}
            {section === "missions"   && <MissionsSection />}
            {section === "events"     && <EventsSection />}
            {section === "styleevent" && <StyleEventSection />}
            {section === "combat"     && <CombatSection />}
            {section === "clans"      && <ClansSection />}
            {section === "story"      && <StorySection />}
            {section === "moderation" && <ModerationSection />}
            {section === "research"   && <ResearchSection />}
            {section === "config"     && <ConfigSection />}
          </div>
        </main>
      </div>
    </>
  );
}

function LiveBadge() {
  const [pulse, setPulse] = useState(true);
  useEffect(() => { const t = setInterval(() => setPulse(p => !p), 1200); return () => clearInterval(t); }, []);
  return (
    <div style={AA.liveBadge}>
      <div style={{ ...AA.liveDot, opacity: pulse ? 1 : 0.3 }} />
      <span>LIVE — 284 active</span>
    </div>
  );
}

// ─── OVERVIEW SECTION ──────────────────────────────────────────────────────────
function OverviewSection() {
  return (
    <div style={AA.secWrap}>
      <SectionTitle title="Platform Overview" sub="Real-time snapshot · refreshes every 60s" />
      <div style={AA.kpiGrid}>
        {[
          { label:"Registered Users",  val:"1,247",  delta:"+23 today",   color:C.teal,  icon:"👤" },
          { label:"Daily Active",       val:"284",    delta:"22.8% DAU",   color:C.amber, icon:"⚡" },
          { label:"Zones Active",       val:"18/24",  delta:"3 contested", color:C.red,   icon:"◈" },
          { label:"AE in Circulation",  val:"2.4M",   delta:"+48K today",  color:C.amber, icon:"◎" },
          { label:"Missions Today",     val:"892",    delta:"+12% vs avg", color:C.teal,  icon:"🎯" },
          { label:"Crisis Flags",       val:"2",      delta:"⚠ Review now",color:C.red,   icon:"💚" },
        ].map(k => <KpiCard key={k.label} {...k} />)}
      </div>
      <div style={AA.chartsRow}>
        <div style={{ ...AA.chartCard, flex:2 }}>
          <div style={AA.chartTitle}>Daily Active Users — Last 14 Days</div>
          <MiniLineChart data={[180,210,195,240,260,230,284,270,290,310,284,300,284,284]} color={C.teal} />
        </div>
        <div style={{ ...AA.chartCard, flex:1 }}>
          <div style={AA.chartTitle}>Player Motivation Split</div>
          <DonutChart segments={[
            { label:"Territory",  val:32, color:C.amber },
            { label:"Social",     val:24, color:C.teal  },
            { label:"Builder",    val:18, color:"#A78BFA"},
            { label:"Competitor", val:16, color:C.red   },
            { label:"Explorer",   val:10, color:"#4DA6FF"},
          ]} />
        </div>
      </div>
      <div style={AA.healthRow}>
        <div style={AA.chartCard}>
          <div style={AA.chartTitle}>System Health</div>
          <div style={AA.healthGrid}>
            {[
              { svc:"API Gateway",       status:"ok",   ms:42   },
              { svc:"Supabase DB",       status:"ok",   ms:18   },
              { svc:"Geo Engine",        status:"ok",   ms:67   },
              { svc:"Push (FCM)",        status:"warn", ms:210  },
              { svc:"Health API",        status:"ok",   ms:89   },
              { svc:"Media CDN",         status:"ok",   ms:31   },
            ].map(h => (
              <div key={h.svc} style={AA.healthRow2}>
                <div style={{ ...AA.statusPip, background: h.status === "ok" ? C.teal : C.amber }} />
                <span style={AA.healthSvc}>{h.svc}</span>
                <span style={{ ...AA.healthMs, color: h.ms > 150 ? C.amber : C.teal }}>{h.ms}ms</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ ...AA.chartCard, flex:1 }}>
          <div style={AA.chartTitle}>Recent Activity Feed</div>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}

function ActivityFeed() {
  const events = [
    { t:"14:32", txt:"Nocturne captured Engineering Dept",  c:C.red   },
    { t:"14:28", txt:"User #4821 mood: Bad — crisis flag",  c:C.red, flag:true },
    { t:"14:21", txt:"Style Event voting opened (Week 12)", c:C.teal  },
    { t:"14:15", txt:"IronVeil declared war on Library",    c:C.amber },
    { t:"14:09", txt:"Story clue #7 solved (23 players)",  c:"#A78BFA"},
    { t:"14:01", txt:"Marketplace: Rare cap listed 800 AE", c:C.amber },
    { t:"13:55", txt:"15,000-step mission surge (+40 comp)",c:C.teal  },
    { t:"13:48", txt:"User reported: toxic clan message",   c:C.red   },
  ];
  return (
    <div style={AA.feedList}>
      {events.map((e,i) => (
        <div key={i} style={{ ...AA.feedRow, ...(e.flag ? AA.feedRowAlert : {}) }}>
          <span style={AA.feedTime}>{e.t}</span>
          <div style={{ ...AA.feedDot, background:e.color }} />
          <span style={{ ...AA.feedTxt, ...(e.flag ? { color:C.red, fontWeight:700 } : {}) }}>{e.txt}</span>
          {e.flag && <span style={AA.feedFlagPill}>REVIEW</span>}
        </div>
      ))}
    </div>
  );
}

// ─── PLAYERS SECTION ───────────────────────────────────────────────────────────
const MOCK_PLAYERS = [];

function PlayersSection() {
  const ctx = useContext(AppContext);
  const [players,  setPlayers]  = useState(MOCK_PLAYERS);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all");
  const [selected, setSelected] = useState(null);
  const [confirmBan, setConfirmBan] = useState(null);

  const filtered = players.filter(p => {
    const q = search.toLowerCase();
    const matchQ = !q || p.name.toLowerCase().includes(q) || String(p.id).includes(q);
    const matchF = filter === "all" || (filter === "flagged" && p.flag) || (filter === "inactive" && p.status === "inactive");
    return matchQ && matchF;
  });

  const banPlayer = (id) => { setPlayers(ps => ps.map(p => p.id === id ? { ...p, status:"banned", flag:false } : p)); setConfirmBan(null); setSelected(null); };
  const warnPlayer = (id) => { setPlayers(ps => ps.map(p => p.id === id ? { ...p, status:"warned" } : p)); setSelected(null); };
  const unflagPlayer = (id) => { setPlayers(ps => ps.map(p => p.id === id ? { ...p, flag:false, status:"active" } : p)); };

  return (
    <div style={AA.secWrap}>
      <SectionTitle title="Player Management" sub={`${players.length} registered · ${players.filter(p=>p.flag).length} flagged`} />
      <div style={AA.toolBar}>
        <input style={AA.searchInput} placeholder="Search name or ID..." value={search} onChange={e=>setSearch(e.target.value)} />
        <div style={AA.filterRow}>
          {["all","flagged","inactive"].map(f => (
            <button key={f} style={{ ...AA.filterBtn, ...(filter===f?AA.filterBtnOn:{}) }} onClick={() => setFilter(f)}>{f.toUpperCase()}</button>
          ))}
        </div>
        <button style={AA.exportBtn}>↓ Export CSV</button>
      </div>
      <Table cols={["ID","Name","Level","XP","AE","Streak","Clan","Status","Actions"]} rows={filtered.map(p => [
        <span style={AA.monoSm}>#{p.id}</span>,
        <span style={AA.playerName}>{p.name}</span>,
        <span style={{ ...AA.mono, color:C.teal }}>Lv {p.level}</span>,
        <span style={AA.mono}>{p.xp.toLocaleString()}</span>,
        <span style={{ ...AA.mono, color:C.amber }}>{p.ae.toLocaleString()}</span>,
        <span style={AA.mono}>{p.streak}d</span>,
        <span style={{ color:C.dim }}>{p.clan || "—"}</span>,
        <StatusPill status={p.status} />,
        <div style={AA.actionBtns}>
          <button style={AA.tinyBtn} onClick={()=>setSelected(p)}>View</button>
          {p.flag && <button style={{ ...AA.tinyBtn, ...AA.tinyBtnAmber }} onClick={()=>warnPlayer(p.id)}>Warn</button>}
          {p.flag && <button style={{ ...AA.tinyBtn, ...AA.tinyBtnRed }} onClick={()=>setConfirmBan(p)}>Ban</button>}
          {p.flag && <button style={{ ...AA.tinyBtn }} onClick={()=>unflagPlayer(p.id)}>Clear Flag</button>}
        </div>,
      ])} />
      {selected && <PlayerModal player={selected} onClose={()=>setSelected(null)} onWarn={()=>warnPlayer(selected.id)} onBan={()=>setConfirmBan(selected)} />}
      {confirmBan && (
        <div style={AA.modalOverlay} onClick={() => setConfirmBan(null)}>
          <div style={{ ...AA.modal, maxWidth:400 }} onClick={e=>e.stopPropagation()}>
            <div style={AA.modalHdr}>
              <div style={AA.modalTitle}>Ban {confirmBan.name}?</div>
              <button style={AA.modalClose} onClick={() => setConfirmBan(null)}>✕</button>
            </div>
            <div style={{ fontSize:12, color:C.dim, marginBottom:20 }}>Player will be immediately suspended and cannot access the app.</div>
            <button style={{ ...AA.exportBtn, width:"100%", borderColor:C.red+"66", color:C.red, background:"rgba(231,76,60,0.08)", padding:"12px" }} onClick={() => banPlayer(confirmBan.id)}>✕ Confirm Ban</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerModal({ player, onClose, onWarn, onBan }) {
  const ctx = useContext(AppContext);
  return (
    <div style={AA.modalOverlay} onClick={onClose}>
      <div style={AA.modal} onClick={e=>e.stopPropagation()}>
        <div style={AA.modalHdr}>
          <div>
            <div style={AA.modalTitle}>{player.name} <span style={AA.monoSm}>#{player.id}</span></div>
            <div style={AA.modalSub}>{player.email} · Joined {player.joinDate}</div>
          </div>
          <button style={AA.modalClose} onClick={onClose}>✕</button>
        </div>
        <div style={AA.modalGrid}>
          {[["Level",`Lv ${player.level}`],["XP",player.xp.toLocaleString()],["AE Balance",player.ae.toLocaleString()],["Streak",`${player.streak} days`],["Clan",player.clan||"None"],["Status",player.status]].map(([k,v]) => (
            <div key={k} style={AA.modalStat}><div style={AA.modalStatLbl}>{k}</div><div style={AA.modalStatVal}>{v}</div></div>
          ))}
        </div>
        <div style={AA.modalActions}>
          <button style={AA.modalBtn} onClick={() => { showToast(`📋 Activity log for ${player.name} opened`, "info"); onClose(); }}>🔍 View Full Activity Log</button>
          <button style={AA.modalBtn} onClick={() => { showToast(`✉️ Message sent to ${player.name}`, "success"); onClose(); }}>✉️ Send Direct Message</button>
          <button style={{ ...AA.modalBtn, borderColor:"rgba(245,166,35,0.4)", color:C.amber }} onClick={() => { ctx?.warnPlayer(player.name); onWarn?.(); onClose(); }}>⚠ Issue Formal Warning</button>
          <button style={{ ...AA.modalBtn, ...AA.modalBtnRed }} onClick={() => { ctx?.banPlayer(player.name); onBan?.(); onClose(); }}>🚫 Ban Player</button>
        </div>
      </div>
    </div>
  );
}

// ─── WELLBEING SECTION ─────────────────────────────────────────────────────────
const MOOD_DIST = [
  { label:"Great (5)", count:84,  pct:30, color:"#00D4A8" },
  { label:"Good (4)",  count:98,  pct:35, color:"#27AE60" },
  { label:"Okay (3)",  count:56,  pct:20, color:"#F5A623" },
  { label:"Low (2)",   count:31,  pct:11, color:"#E67E22" },
  { label:"Bad (1)",   count:15,  pct:5,  color:"#E74C3C" },
];

const CRISIS_FLAGS = [
  { id:"A", anon:"User #5501", mood:1, text:"I don't see the point anymore", time:"14:28", outreach:true,  consentShare:true, resolved:false },
  { id:"B", anon:"User #3382", mood:2, text:"Really struggling with exams and feeling isolated", time:"11:04", outreach:false, consentShare:false, resolved:false },
  { id:"C", anon:"User #1847", mood:1, text:"[free text logged, encrypted]", time:"09:15", outreach:true,  consentShare:true, resolved:true  },
];

function WellbeingSection() {
  const [crisisFlags, setCrisisFlags] = useState(CRISIS_FLAGS);
  const resolve = (id) => setCrisisFlags(fs => fs.map(f => f.id === id ? { ...f, resolved:true } : f));
  return (
    <div style={AA.secWrap}>
      <SectionTitle title="Wellbeing Dashboard" sub="All data anonymised — no user identification without outreach consent" />
      <div style={AA.crisisBox}>
        <div style={AA.crisisHdr}><span style={AA.crisisTitle}>⚠ CRISIS FLAGS — Immediate Review Required</span><span style={AA.crisisCount}>{crisisFlags.filter(f=>!f.resolved).length} unresolved</span></div>
        {crisisFlags.map(f => (
          <div key={f.id} style={{ ...AA.crisisRow, ...(f.resolved ? AA.crisisRowResolved : {}) }}>
            <div style={AA.crisisLeft}>
              <div style={{ ...AA.crisisAnon, ...(f.resolved ? { color:C.dim } : {}) }}>{f.anon}</div>
              {f.consentShare ? (
                <div style={AA.crisisText}>"{f.text}"</div>
              ) : (
                <div style={{ ...AA.crisisText, fontStyle:"italic", color:C.dim }}>🔒 [Free text encrypted — user did not consent to share content]</div>
              )}
              <div style={AA.crisisMeta}>Mood: {f.mood}/5 · {f.time} · {f.outreach ? "🙋 Outreach requested" : "No outreach opt-in"}{!f.consentShare && " · 🔒 Text hidden"}</div>
            </div>
            <div style={AA.crisisActions}>
              {!f.resolved && f.outreach && <button style={AA.crisisContactBtn}>Contact Student Support</button>}
              {!f.resolved && <button style={AA.crisisResolveBtn} onClick={() => resolve(f.id)}>Mark Resolved</button>}
              {f.resolved && <span style={AA.resolvedBadge}>✓ Resolved</span>}
            </div>
          </div>
        ))}
      </div>
      <div style={AA.chartsRow}>
        <div style={{ ...AA.chartCard, flex:1 }}>
          <div style={AA.chartTitle}>Today's Mood Distribution (284 check-ins)</div>
          <div style={AA.moodBars}>{MOOD_DIST.map(m => (<div key={m.label} style={AA.moodBar}><div style={AA.moodBarLbl}>{m.label}</div><div style={AA.moodBarTrack}><div style={{ ...AA.moodBarFill, width:`${m.pct}%`, background:m.color }} /></div><div style={{ ...AA.mono, fontSize:11, color:m.color, width:40 }}>{m.count}</div></div>))}</div>
        </div>
        <div style={{ ...AA.chartCard, flex:1 }}>
          <div style={AA.chartTitle}>7-Day Mood Trend</div>
          <MiniLineChart data={[3.6, 3.4, 3.7, 3.5, 3.2, 3.4, 3.3]} color={C.amber} min={1} max={5} label="Avg mood" />
          <div style={AA.moodNote}>⬇ Slight downward trend — exam period begins next week.</div>
        </div>
      </div>
      <div style={AA.privacyBox}><div style={AA.privacyTitle}>🔒 Privacy Architecture Active</div><div style={AA.privacyBody}>All mood entries stored with anonymised hash only. Free text encrypted at rest (AES-256).</div></div>
    </div>
  );
}

// ─── ZONES SECTION ─────────────────────────────────────────────────────────────
const ADMIN_GAME_RULES = { ZONE_ATTACK_COOLDOWN_HOURS:24, ZONE_CAPTURE_MINS_STANDARD:3, ZONE_CAPTURE_MINS_LANDMARK:5, CLAN_CREATE_MIN_LEVEL:5, CLAN_MAX_MEMBERS:20, CLAN_CREATE_COST_AE:500, WAR_DECLARE_COST_AE:200, COMBAT_OPPONENT_COOLDOWN_HOURS:4, COMBAT_MAX_INCOMING:3, COMBAT_LEVEL_RANGE:5 };

function zoneOnCooldown(zone) {
  if (!zone.lastAttackedAt) return false;
  return Date.now() - new Date(zone.lastAttackedAt).getTime() < ADMIN_GAME_RULES.ZONE_ATTACK_COOLDOWN_HOURS * 3600000;
}
function cooldownRemaining(zone) {
  if (!zone.lastAttackedAt) return null;
  const remainMs = ADMIN_GAME_RULES.ZONE_ATTACK_COOLDOWN_HOURS * 3600000 - (Date.now() - new Date(zone.lastAttackedAt).getTime());
  if (remainMs <= 0) return null;
  return `${Math.floor(remainMs / 3600000)}h ${Math.floor((remainMs % 3600000) / 60000)}m`;
}

const NOW = Date.now();
const hAgo = (h) => new Date(NOW - h * 3600000).toISOString();
const MOCK_ZONES = [
  { id:1, name:"Main Library",     type:"library",  owner:"Nocturne",   strength:82, income:50,  tier:2, contested:false, lastCapture:"3d",    lastAttackedAt: hAgo(30),  attackedTodayBy: null },
  { id:2, name:"Sports Arena",     type:"arena",    owner:"Nocturne",   strength:65, income:80,  tier:3, contested:true,  lastCapture:"6h",    lastAttackedAt: hAgo(3),   attackedTodayBy: "BlazeThorn" },
  { id:3, name:"Cafeteria Block",  type:"social",   owner:"Nocturne",   strength:90, income:40,  tier:1, contested:false, lastCapture:"1d",    lastAttackedAt: hAgo(48),  attackedTodayBy: null },
  { id:4, name:"Engineering Dept", type:"academic", owner:"Nocturne",   strength:58, income:70,  tier:2, contested:true,  lastCapture:"2h",    lastAttackedAt: hAgo(1),   attackedTodayBy: "IronVeil" },
  { id:5, name:"Clock Tower",      type:"landmark", owner:"IronVeil",   strength:91, income:100, tier:3, contested:false, lastCapture:"5d",    lastAttackedAt: hAgo(72),  attackedTodayBy: null },
  { id:6, name:"North Quad",       type:"outdoor",  owner:"BlazeThorn", strength:74, income:60,  tier:2, contested:false, lastCapture:"4d",    lastAttackedAt: hAgo(26),  attackedTodayBy: null },
  { id:7, name:"Student Union",    type:"social",   owner:"SolarEdge",  strength:63, income:55,  tier:2, contested:false, lastCapture:"2d",    lastAttackedAt: hAgo(50),  attackedTodayBy: null },
  { id:8, name:"Science Block",    type:"academic", owner:null,         strength:0,  income:65,  tier:2, contested:false, lastCapture:"Never", lastAttackedAt: null,      attackedTodayBy: null },
];

function ZonesSection() {
  const [sel, setSel] = useState(null);
  return (
    <div style={AA.secWrap}>
      <SectionTitle title="Zone Control" sub={`${MOCK_ZONES.filter(z=>z.contested).length} contested · ${MOCK_ZONES.filter(z=>!z.owner).length} unclaimed`} />
      <div style={AA.chartsRow}>
        <div style={{ ...AA.chartCard, flex:1 }}><div style={AA.chartTitle}>Zone Ownership</div><DonutChart segments={[{ label:"Nocturne",val:3,color:"#A78BFA" },{ label:"IronVeil",val:2,color:"#95A5A6" },{ label:"BlazeThorn",val:1,color:"#E74C3C" },{ label:"SolarEdge",val:1,color:"#F5A623" },{ label:"Unclaimed",val:1,color:C.dim }]} /></div>
        <div style={{ ...AA.chartCard, flex:2 }}><div style={AA.chartTitle}>Zone Income by Owner (AE/day)</div><BarChart data={[{ label:"Nocturne",val:240,color:"#A78BFA" },{ label:"IronVeil",val:160,color:"#95A5A6" },{ label:"BlazeThorn",val:60,color:C.red },{ label:"SolarEdge",val:55,color:C.amber }]} /></div>
      </div>
      <div style={AA.ruleCallout}><span style={AA.ruleCalloutIcon}>🛡️</span><div><span style={AA.ruleCalloutTitle}>Attack cooldown: </span><span style={AA.ruleCalloutBody}>Each zone can only be attacked once every {ADMIN_GAME_RULES.ZONE_ATTACK_COOLDOWN_HOURS}h.</span></div></div>
      <Table cols={["ID","Zone","Type","Owner","Strength","Income","Tier","Status","Attack Slot","Actions"]} rows={MOCK_ZONES.map(z => { const onCd = zoneOnCooldown(z); const remaining = cooldownRemaining(z); return [
        <span style={AA.monoSm}>Z{z.id}</span>,<span style={AA.playerName}>{z.name}</span>,<span style={{ color:C.dim, textTransform:"capitalize" }}>{z.type}</span>,<span style={{ color:z.owner?"#A78BFA":C.dim }}>{z.owner||"Unclaimed"}</span>,<StrengthBar val={z.strength} />,<span style={{ ...AA.mono, color:C.amber }}>+{z.income}</span>,<span style={AA.mono}>T{z.tier}</span>,<span style={{ color:z.contested?C.red:C.teal, fontSize:11, fontWeight:700 }}>{z.contested?"CONTESTED":"Active"}</span>,
        onCd ? <div><div style={AA.cdUsed}>🔒 {z.attackedTodayBy||"Attacked"}</div><div style={AA.cdTimer}>{remaining} left</div></div> : <span style={AA.cdOpen}>✓ Open</span>,
        <div style={AA.actionBtns}><button style={AA.tinyBtn} onClick={()=>setSel(z)}>Manage</button>{onCd && <button style={{ ...AA.tinyBtn, ...AA.tinyBtnAmber }}>Reset CD</button>}</div>,
      ]; })} />
      {sel && (
        <div style={AA.modalOverlay} onClick={()=>setSel(null)}>
          <div style={AA.modal} onClick={e=>e.stopPropagation()}>
            <div style={AA.modalHdr}><div><div style={AA.modalTitle}>{sel.name}</div><div style={AA.modalSub}>Zone #{sel.id} · Tier {sel.tier}</div></div><button style={AA.modalClose} onClick={()=>setSel(null)}>✕</button></div>
            <div style={AA.modalActions}>
              <button style={AA.modalBtn}>📍 View on Map</button><button style={AA.modalBtn}>🔄 Force Unclaim</button><button style={AA.modalBtn}>⬆ Upgrade Tier</button>
              <button style={{ ...AA.modalBtn, ...AA.modalBtnRed }}>🗑 Delete Zone</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ECONOMY SECTION ───────────────────────────────────────────────────────────
function EconomySection() {
  return (
    <div style={AA.secWrap}>
      <SectionTitle title="Economy Monitor" sub="Anti-inflation surveillance · no real-money transactions" />
      <div style={AA.kpiGrid}>{[
        { label:"Total AE Supply",val:"2,418,340",delta:"+48,200 today",color:C.amber },
        { label:"AE Sinks (spent)",val:"1,890,100",delta:"78% sink ratio",color:C.teal },
        { label:"Shards in Circ.",val:"4,281",delta:"+12 this week",color:"#A78BFA" },
        { label:"Marketplace Volume",val:"38,400 AE",delta:"47 trades today",color:C.amber },
        { label:"Avg Player Balance",val:"1,940 AE",delta:"Healthy range",color:C.teal },
        { label:"Rich:Poor Ratio",val:"8.2:1",delta:"⚠ Monitor",color:C.amber },
      ].map(k => <KpiCard key={k.label} {...k} />)}</div>
      <div style={AA.chartsRow}>
        <div style={{ ...AA.chartCard, flex:2 }}><div style={AA.chartTitle}>AE Supply vs Sinks — 14 Days</div><DualLineChart data1={[2100,2180,2200,2240,2280,2300,2330,2350,2370,2390,2400,2410,2415,2418]} data2={[1600,1680,1720,1780,1820,1850,1870,1900,1920,1940,1960,1970,1980,1890]} color1={C.amber} color2={C.teal} /></div>
        <div style={{ ...AA.chartCard, flex:1 }}><div style={AA.chartTitle}>AE Source Breakdown</div><DonutChart segments={[{ label:"Daily missions",val:44,color:C.teal },{ label:"Zone income",val:22,color:C.amber },{ label:"Weekly missions",val:18,color:"#A78BFA" },{ label:"Combat wins",val:10,color:C.red },{ label:"Story rewards",val:6,color:"#4DA6FF" }]} /></div>
      </div>
      <div style={AA.chartCard}><div style={AA.chartTitle}>Admin Economy Controls</div><div style={AA.ecoControls}>
        {[{ label:"Daily mission AE multiplier",val:"1.0×" },{ label:"Shop price floor",val:"100 AE" },{ label:"Marketplace fee",val:"5%" },{ label:"Max player AE balance",val:"50,000 AE" }].map(c => (
          <div key={c.label} style={AA.ecoControlRow}><span style={AA.ecoControlLabel}>{c.label}</span><div style={AA.ecoControlRight}><span style={{ ...AA.mono, color:C.amber }}>{c.val}</span><button style={AA.tinyBtn}>Edit</button></div></div>
        ))}
      </div></div>
    </div>
  );
}

// ─── SHOP SECTION ──────────────────────────────────────────────────────────────
const RARITY_COL = { common:C.dim, uncommon:"#27AE60", rare:"#4DA6FF", epic:"#A78BFA", legendary:"#F5A623" };
const BLANK_ITEM = { name:"", cat:"headwear", priceAE:"", rarity:"common", type:"general", stock:"", soulBound:false };
const CATS = ["headwear","eyewear","outerwear","equipment","furniture","clan","consumable","cosmetic"];
const RARITIES = ["common","uncommon","rare","epic","legendary"];

function ShopSection() {
  const ctx = useContext(AppContext);
  const items = ctx?.sharedShopItems || INIT_SHOP_ITEMS;
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(BLANK_ITEM);
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? items : items.filter(i => i.type === filter || (filter==="active" && i.active) || (filter==="inactive" && !i.active));

  const toggle = (id) => { if (ctx) ctx.toggleShopItem(id); };

  const addItem = () => {
    if (!form.name.trim() || !form.priceAE) return;
    const stockNum = form.type === "limited" && form.stock ? parseInt(form.stock) : null;
    const newItem = { id:"s"+Date.now(), name:form.name, cat:form.cat, priceAE:parseInt(form.priceAE), price:parseInt(form.priceAE), rarity:form.rarity, type:form.type, stock:stockNum, sold:0, active:true, soulBound:form.soulBound, icon:"🎁", owned:false, featured:false };
    if (ctx) ctx.addShopItem(newItem);
    setForm(BLANK_ITEM);
    setShowAdd(false);
  };

  return (
    <div style={AA.secWrap}>
      <SectionTitle title="Shop Manager" sub={`${items.filter(i=>i.active).length} active · ${items.filter(i=>i.type==="limited").length} limited`} />
      <div style={AA.toolBar}>
        <div style={AA.filterRow}>{[["all","All"],["general","General"],["limited","Limited"],["active","Active"],["inactive","Inactive"]].map(([f,l]) => (<button key={f} style={{ ...AA.filterBtn, ...(filter===f?AA.filterBtnOn:{}) }} onClick={() => setFilter(f)}>{l}</button>))}</div>
        <button style={{ ...AA.exportBtn, marginLeft:"auto" }} onClick={() => setShowAdd(true)}>+ Add Item</button>
      </div>
      <Table cols={["Name","Cat","Price","Rarity","Type","Stock","Sold","Status","Actions"]} rows={filtered.map(item => { const stockOut = item.type==="limited" && item.stock !== null && item.sold >= item.stock; return [
        <span style={AA.playerName}>{item.name}</span>,<span style={{ color:C.dim, textTransform:"capitalize" }}>{item.cat}</span>,<span style={{ ...AA.mono, color:C.amber }}>{item.priceAE} AE</span>,
        <span style={{ fontSize:11, fontWeight:700, color:RARITY_COL[item.rarity]||C.dim }}>{item.rarity}</span>,
        <span style={{ fontSize:11, fontWeight:700, color:item.type==="limited"?C.amber:C.teal }}>{item.type==="limited"?"🔒 Limited":"∞ General"}</span>,
        item.type==="limited" ? <span style={{ ...AA.mono, color:stockOut?C.red:ADM_TX }}>{item.sold}/{item.stock??"∞"}</span> : <span style={AA.monoSm}>∞</span>,
        <span style={{ ...AA.mono, color:C.teal }}>{item.sold}</span>,
        <span style={{ color:item.active&&!stockOut?C.teal:C.red, fontSize:11, fontWeight:700 }}>{stockOut?"SOLD OUT":item.active?"ACTIVE":"OFF"}</span>,
        <div style={AA.actionBtns}>{!stockOut && <button style={{ ...AA.tinyBtn, ...(item.active?AA.tinyBtnRed:AA.tinyBtnGreen) }} onClick={() => toggle(item.id)}>{item.active?"Delist":"List"}</button>}<button style={AA.tinyBtn}>Edit</button></div>,
      ]; })} />
      {showAdd && (
        <div style={AA.modalOverlay} onClick={() => setShowAdd(false)}>
          <div style={{ ...AA.modal, maxWidth:560 }} onClick={e => e.stopPropagation()}>
            <div style={AA.modalHdr}><div><div style={AA.modalTitle}>🛒 Add Shop Item</div></div><button style={AA.modalClose} onClick={() => setShowAdd(false)}>✕</button></div>
            <div style={{ display:"flex", flexDirection:"column", gap:12, marginTop:4 }}>
              <div style={AA.fieldWrap}><label style={AA.fieldLabel}>ITEM NAME</label><input style={AA.fieldInput} placeholder="e.g. Midnight Jacket" value={form.name} onChange={e => setForm(f=>({...f, name:e.target.value}))} /></div>
              <div style={{ display:"flex", gap:10 }}>
                <div style={{ ...AA.fieldWrap, flex:1 }}><label style={AA.fieldLabel}>CATEGORY</label><select style={{ ...AA.fieldInput, color:ADM_TX }} value={form.cat} onChange={e => setForm(f=>({...f, cat:e.target.value}))}>{CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}</select></div>
                <div style={{ ...AA.fieldWrap, flex:1 }}><label style={AA.fieldLabel}>RARITY</label><select style={{ ...AA.fieldInput, color:ADM_TX }} value={form.rarity} onChange={e => setForm(f=>({...f, rarity:e.target.value}))}>{RARITIES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}</select></div>
              </div>
              <div style={AA.fieldWrap}><label style={AA.fieldLabel}>PRICE (AE)</label><input style={AA.fieldInput} type="number" placeholder="e.g. 350" value={form.priceAE} onChange={e => setForm(f=>({...f, priceAE:e.target.value}))} /></div>
              <div style={{ display:"flex", gap:10, marginTop:4 }}>
                <button style={{ ...AA.exportBtn, flex:1 }} onClick={() => { setShowAdd(false); setForm(BLANK_ITEM); }}>Cancel</button>
                <button style={{ ...AA.exportBtn, flex:2, background:`linear-gradient(135deg, ${C.teal}, #0088BB)`, color:"#050810", fontWeight:700, border:"none", opacity: form.name&&form.priceAE ? 1 : 0.5 }} onClick={addItem} disabled={!form.name || !form.priceAE}>✓ Add to Shop</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MISSIONS SECTION ──────────────────────────────────────────────────────────
const MISSION_TEMPLATES = [
  { id:1, title:"Morning Walk", cat:"Health", type:"steps", reward:80, xp:40, active:true, completions:47 },
  { id:2, title:"Visit the Library", cat:"Territory", type:"checkin", reward:120, xp:60, active:true, completions:23 },
  { id:3, title:"Document Campus Art", cat:"Social", type:"photo", reward:100, xp:50, active:true, completions:18 },
  { id:4, title:"Meditation Session", cat:"Wellness", type:"photo", reward:45, xp:20, active:true, completions:31 },
  { id:5, title:"Litter Collection", cat:"Sustainability", type:"photo", reward:180, xp:60, active:false, completions:0 },
  { id:6, title:"Department Selfie", cat:"Social", type:"photo", reward:160, xp:60, active:true, completions:12 },
];

function MissionsSection() {
  const ctx = useContext(AppContext);
  const [mTab, setMTab] = useState("templates");
  const [showNew, setShowNew] = useState(false);
  const [viewProof, setViewProof] = useState(null);
  const [rejectNote, setRejectNote] = useState("");
  const proofs = ctx?.sharedProofs || PROOF_SUBMISSIONS;
  const pending = proofs.filter(p => p.status === "pending" || p.status === "flagged");
  const resolved = proofs.filter(p => p.status === "approved" || p.status === "rejected");
  const missions = ctx?.sharedMissions || MISSIONS;

  const approve = (id) => { if (ctx) ctx.approveProof(id); setViewProof(null); };
  const reject = (id, reason) => { if (ctx) ctx.rejectProof(id, reason); setViewProof(null); setRejectNote(""); };
  const toggleTemplate = (id) => { if (ctx) ctx.toggleMission(id); };

  return (
    <div style={AA.secWrap}>
      <SectionTitle title="Missions" sub="Mission templates · proof image review · reward release" />
      <div style={AA.innerTabBar}>
        <button style={{ ...AA.innerTab, ...(mTab==="templates"?AA.innerTabOn:{}) }} onClick={() => setMTab("templates")}>📋 Templates</button>
        <button style={{ ...AA.innerTab, ...(mTab==="proof"?AA.innerTabOn:{}) }} onClick={() => setMTab("proof")}>📷 Proof Review{pending.length > 0 && <span style={AA.innerTabBadge}>{pending.length}</span>}</button>
      </div>
      {mTab === "templates" && <>
        <div style={AA.toolBar}><span style={{ color:C.dim, fontSize:12 }}>{MISSION_TEMPLATES.filter(m=>m.active).length} active · changes reflect instantly</span><button style={AA.exportBtn} onClick={() => setShowNew(true)}>+ New Mission</button></div>
        <Table cols={["ID","Title","Category","Type","AE","XP","Completions","Status","Actions"]} rows={MISSION_TEMPLATES.map(m => { const liveM = missions.find(lm => lm.title === m.title); const isDisabled = liveM?._disabled || !m.active; return [
          <span style={AA.monoSm}>M{m.id}</span>,<span style={AA.playerName}>{m.title}</span>,<span style={{ color:C.dim }}>{m.cat}</span>,<span style={{ color:C.teal, textTransform:"capitalize", fontSize:11 }}>{m.type}</span>,<span style={{ ...AA.mono, color:C.amber }}>{m.reward}</span>,<span style={AA.mono}>{m.xp}</span>,<span style={{ ...AA.mono, color:C.teal }}>{m.completions}</span>,
          <span style={{ color:isDisabled?C.dim:C.teal, fontSize:11, fontWeight:700 }}>{isDisabled?"OFF":"ACTIVE"}</span>,
          <div style={AA.actionBtns}><button style={AA.tinyBtn}>Edit</button><button style={{ ...AA.tinyBtn, ...(!isDisabled?AA.tinyBtnRed:AA.tinyBtnGreen) }} onClick={() => liveM && toggleTemplate(liveM.id)}>{!isDisabled?"Disable":"Enable"}</button></div>,
        ]; })} />
      </>}
      {mTab === "proof" && <>
        {pending.length > 0 && <><div style={AA.proofQueueLabel}>⏳ Awaiting Review — {pending.length}</div>{pending.map(s => <ProofCard key={s.id} sub={s} onView={() => { setViewProof(s); setRejectNote(""); }} />)}</>}
        {resolved.length > 0 && <><div style={{ ...AA.proofQueueLabel, color:C.dim, marginTop:16 }}>✓ Resolved — {resolved.length}</div>{resolved.map(s => <ProofCard key={s.id} sub={s} resolved />)}</>}
      </>}
      {viewProof && (
        <div style={AA.modalOverlay} onClick={() => setViewProof(null)}>
          <div style={{ ...AA.modal, maxWidth:560 }} onClick={e => e.stopPropagation()}>
            <div style={AA.modalHdr}><div><div style={AA.modalTitle}>{viewProof.missionTitle}</div><div style={AA.modalSub}>{viewProof.userName} · {viewProof.submittedAt}</div></div><button style={AA.modalClose} onClick={() => setViewProof(null)}>✕</button></div>
            <div style={AA.proofImgWrap}><div style={AA.proofImgPlaceholder}>📷</div></div>
            {viewProof.note && <div style={AA.proofUserNote}><span style={{ color:C.dim, fontSize:10, fontWeight:700 }}>USER NOTE: </span>{viewProof.note}</div>}
            <div style={AA.proofRewardRow}><div style={AA.proofRewardChip}><span style={{ color:C.amber }}>◎</span> {viewProof.reward} AE</div><div style={AA.proofRewardChip}><span style={{ color:C.teal }}>⚡</span> {viewProof.xp} XP</div></div>
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:16 }}>
              <button style={{ ...AA.modalBtn, background:"rgba(0,212,168,0.08)", borderColor:"rgba(0,212,168,0.4)", color:C.teal, fontWeight:700 }} onClick={() => approve(viewProof.id)}>✓ Approve — release rewards</button>
              <input style={AA.fieldInput} placeholder="Rejection reason (required)" value={rejectNote} onChange={e => setRejectNote(e.target.value)} />
              <button style={{ ...AA.modalBtn, ...AA.modalBtnRed, opacity: rejectNote.trim() ? 1 : 0.4 }} disabled={!rejectNote.trim()} onClick={() => reject(viewProof.id, rejectNote)}>✕ Reject submission</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProofCard({ sub, resolved, onView }) {
  const statusColor = { pending:C.amber, flagged:C.red, approved:C.teal, rejected:C.dim };
  const statusLabel = { pending:"Pending", flagged:"⚠ Flagged", approved:"✓ Approved", rejected:"Rejected" };
  return (
    <div style={{ ...AA.proofCard, ...(sub.status==="flagged"?{ borderColor:"rgba(231,76,60,0.4)", background:"rgba(231,76,60,0.04)" }:{}), ...(resolved?{ opacity:0.65 }:{}) }}>
      <div style={AA.proofThumb}>📷</div>
      <div style={AA.proofCardInfo}>
        <div style={AA.proofCardTitle}>{sub.missionTitle}</div>
        <div style={AA.proofCardMeta}>{sub.userName} · {sub.submittedAt}</div>
        <div style={AA.proofCardReward}><span style={{ color:C.amber }}>◎ {sub.reward} AE</span><span style={{ color:C.teal }}>⚡ {sub.xp} XP</span><span style={{ ...AA.statusPillEl, color:statusColor[sub.status], borderColor:statusColor[sub.status]+"44" }}>{statusLabel[sub.status]}</span></div>
      </div>
      {!resolved && <button style={{ ...AA.tinyBtn, flexShrink:0 }} onClick={onView}>Review →</button>}
    </div>
  );
}

// ─── EVENTS SECTION ────────────────────────────────────────────────────────────
const REWARD_TYPES = [
  { id:"ae", label:"AE (Aether)", icon:"◎" },{ id:"xp", label:"XP", icon:"⚡" },{ id:"badge", label:"Exclusive Badge", icon:"🏅" },{ id:"item", label:"Shop Item Unlock", icon:"🎁" },{ id:"title", label:"Player Title", icon:"👑" },
];
const EVENT_TYPE_COLOR = { territory:C.amber, sustainability:"#27AE60", social:"#4DA6FF", wellness:"#A78BFA", combat:C.red };
const RECIPIENT_LABELS = { all:"All completers", top1:"1st place only", top3:"Top 3", top10:"Top 10" };

const MOCK_EVENTS_ADMIN = [
  { id:1, title:"Freshers Capture Blitz", type:"territory", status:"active", desc:"Freshers-only zone capture competition.", startDate:"Feb 20", endDate:"Feb 27", eligibility:"Level 1–5 only", participants:84, maxParticipants:200, rewardRules:[{ type:"ae",amount:500,recipients:"top1",label:"500 AE → 1st" },{ type:"badge",badgeSlug:"fresher_champion",recipients:"top3",label:"Fresher Champion badge → top 3" }], granted:false },
  { id:2, title:"Campus Clean-Up Sprint", type:"sustainability", status:"scheduled", desc:"Complete 5 litter collection missions in 48 hours.", startDate:"Mar 1", endDate:"Mar 3", eligibility:"All players", participants:0, maxParticipants:null, rewardRules:[{ type:"ae",amount:300,recipients:"all",label:"300 AE → all completers" }], granted:false },
  { id:3, title:"Valentine's Social Surge", type:"social", status:"ended", desc:"Cross-department selfie challenge.", startDate:"Feb 13", endDate:"Feb 15", eligibility:"All players", participants:142, maxParticipants:null, rewardRules:[{ type:"ae",amount:200,recipients:"top1",label:"200 AE → most submissions" }], granted:true },
];

function EventsSection() {
  const ctx = useContext(AppContext);
  const [showCreate, setShowCreate] = useState(false);
  const [adminEvents, setAdminEvents] = useState(MOCK_EVENTS_ADMIN);
  const [grantingId, setGrantingId] = useState(null);
  const [form, setForm] = useState({ title:"", type:"territory", desc:"", startDate:"", endDate:"", eligibility:"All players", maxParticipants:"", rewardRules:[] });

  const active = adminEvents.filter(e => e.status === "active");
  const scheduled = adminEvents.filter(e => e.status === "scheduled");
  const ended = adminEvents.filter(e => e.status === "ended");

  const grantEvent = (id) => { setAdminEvents(evs => evs.map(e => e.id === id ? { ...e, granted:true } : e)); setGrantingId(null); };
  const endEventNow = (id) => { setAdminEvents(evs => evs.map(e => e.id === id ? { ...e, status:"ended" } : e)); if (ctx) ctx.endEvent(id); };
  const createEvent = () => {
    if (!form.title.trim()) return;
    const newEv = { id:Date.now(), ...form, status:"active", participants:0, granted:false, color:EVENT_TYPE_COLOR[form.type]||C.amber };
    setAdminEvents(evs => [...evs, newEv]);
    if (ctx) ctx.addEvent({ id:newEv.id, title:form.title, type:form.type, status:"active", desc:form.desc, endDate:form.endDate, eligibility:form.eligibility, participants:0, maxParticipants:form.maxParticipants?parseInt(form.maxParticipants):null, reward:form.rewardRules.map(r=>r.label).join(" + ")||"TBD", color:EVENT_TYPE_COLOR[form.type]||C.amber });
    setForm({ title:"", type:"territory", desc:"", startDate:"", endDate:"", eligibility:"All players", maxParticipants:"", rewardRules:[] });
    setShowCreate(false);
  };

  return (
    <div style={AA.secWrap}>
      <SectionTitle title="Limited Time Events" sub="Create and manage timed campus-wide events" />
      <div style={AA.toolBar}>
        <div style={{ ...AA.kpiGrid, gridTemplateColumns:"repeat(3,1fr)", width:"100%" }}>
          {[{ label:"Active now",val:active.length,color:C.teal },{ label:"Scheduled",val:scheduled.length,color:C.amber },{ label:"Ended",val:ended.length,color:C.dim }].map(k => (<div key={k.label} style={AA.kpiCard}><div style={{ ...AA.kpiVal, color:k.color }}>{k.val}</div><div style={AA.kpiLabel}>{k.label}</div></div>))}
        </div>
        <button style={{ ...AA.exportBtn, whiteSpace:"nowrap", alignSelf:"flex-start" }} onClick={() => setShowCreate(true)}>+ Create Event</button>
      </div>
      {active.length > 0 && <><div style={AA.proofQueueLabel}>⚡ Active Now</div>{active.map(ev => <EventCard key={ev.id} ev={ev} onGrant={() => setGrantingId(ev.id)} onEnd={() => endEventNow(ev.id)} />)}</>}
      {scheduled.length > 0 && <><div style={{ ...AA.proofQueueLabel, color:C.amber, marginTop:12 }}>📅 Scheduled</div>{scheduled.map(ev => <EventCard key={ev.id} ev={ev} onEnd={() => endEventNow(ev.id)} />)}</>}
      {ended.length > 0 && <><div style={{ ...AA.proofQueueLabel, color:C.dim, marginTop:12 }}>✓ Ended</div>{ended.map(ev => <EventCard key={ev.id} ev={ev} dim onGrant={() => setGrantingId(ev.id)} />)}</>}
      {showCreate && (
        <div style={AA.modalOverlay} onClick={() => setShowCreate(false)}>
          <div style={{ ...AA.modal, maxWidth:580, maxHeight:"92vh", overflowY:"auto" }} onClick={e => e.stopPropagation()}>
            <div style={AA.modalHdr}><div style={AA.modalTitle}>⚡ Create Event</div><button style={AA.modalClose} onClick={() => setShowCreate(false)}>✕</button></div>
            <div style={{ display:"flex", flexDirection:"column", gap:14, marginTop:12 }}>
              <div style={AA.fieldWrap}><label style={AA.fieldLabel}>TITLE</label><input style={AA.fieldInput} placeholder="e.g. Freshers Capture Blitz" value={form.title} onChange={e => setForm(f=>({...f, title:e.target.value}))} /></div>
              <div style={AA.fieldWrap}><label style={AA.fieldLabel}>DESCRIPTION</label><textarea style={{ ...AA.fieldInput, resize:"none", height:70 }} value={form.desc} onChange={e => setForm(f=>({...f, desc:e.target.value}))} /></div>
              <div style={{ display:"flex", gap:10 }}>
                <button style={{ ...AA.exportBtn, flex:1 }} onClick={() => setShowCreate(false)}>Cancel</button>
                <button style={{ ...AA.exportBtn, flex:2, background:`linear-gradient(135deg, ${C.teal}, #0088BB)`, color:"#050810", fontWeight:700, border:"none" }} onClick={createEvent}>⚡ Schedule Event</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EventCard({ ev, dim, onGrant, onEnd }) {
  const tc = EVENT_TYPE_COLOR[ev.type] || C.dim;
  return (
    <div style={{ ...AA.eventCard, ...(dim?{ opacity:0.75 }:{}), borderLeftColor:tc }}>
      <div style={AA.eventCardTop}>
        <div style={AA.eventCardLeft}><span style={{ ...AA.eventTypePill, color:tc, borderColor:tc+"55" }}>{ev.type.toUpperCase()}</span><div style={AA.eventCardTitle}>{ev.title}</div><div style={AA.eventCardDesc}>{ev.desc}</div></div>
        <div style={AA.eventCardRight}><div style={{ ...AA.eventStatusDot, background:ev.status==="active"?C.teal:ev.status==="scheduled"?C.amber:C.dim }} /><span style={{ fontSize:10, color:C.dim, fontFamily:ADM_MONO, textTransform:"uppercase" }}>{ev.status}</span></div>
      </div>
      {ev.rewardRules && <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>{ev.rewardRules.map((r,i) => <span key={i} style={AA.rewardRuleChip}>{REWARD_TYPES.find(t=>t.id===r.type)?.icon} {r.label}</span>)}</div>}
      <div style={AA.eventCardMeta}><span>📅 {ev.startDate} → {ev.endDate}</span><span>👥 {ev.participants}{ev.maxParticipants?`/${ev.maxParticipants}`:""}</span>{ev.granted && <span style={{ color:C.teal, fontWeight:700 }}>✓ Rewards granted</span>}</div>
      <div style={AA.actionBtns}>
        {ev.status==="active" && <button style={{ ...AA.tinyBtn, ...AA.tinyBtnRed }} onClick={onEnd}>End Now</button>}
        {ev.status==="ended" && !ev.granted && onGrant && <button style={{ ...AA.tinyBtn, ...AA.tinyBtnGreen }} onClick={onGrant}>🎁 Grant Rewards</button>}
      </div>
    </div>
  );
}

// ─── STYLE EVENT SECTION ───────────────────────────────────────────────────────
const STYLE_WEEKS = [
  { id:12, status:"voting", theme:"Design a look for someone who just captured the library at midnight.", startDate:"Feb 17", voteEnd:"Feb 24", submissions:23, votes:184 },
  { id:11, status:"closed", theme:"What does the campus ghost wear?", startDate:"Feb 10", voteEnd:"Feb 17", submissions:31, votes:287, winner:"Priya M." },
];

function StyleEventSection() {
  const ctx = useContext(AppContext);
  const [seTab, setSeTab] = useState("current");
  const [viewSub, setViewSub] = useState(null);
  const [rejectNote, setRejectNote] = useState("");
  const [confirmPublish, setConfirmPublish] = useState(false);

  const subs = ctx?.sharedStyleSubs || STYLE_SUBMISSIONS_INIT;
  const pending = subs.filter(s => s.status === "pending" || s.status === "flagged");
  const approved = subs.filter(s => s.status === "approved");
  const rejected = subs.filter(s => s.status === "rejected");

  const approveSub = (id) => { ctx?.approveStyleSub(id); setViewSub(null); };
  const rejectSub = (id, reason) => { ctx?.rejectStyleSub(id, reason); setViewSub(null); setRejectNote(""); };

  const winner = [...approved].sort((a,b) => b.votes - a.votes)[0];
  const currentPhase = ctx?.sharedStyleEvent?.phase || STYLE_WEEKS[0].status;
  const currentWeek = STYLE_WEEKS[0];

  return (
    <div style={AA.secWrap}>
      <SectionTitle title="Style Event Manager" sub="Weekly fashion challenge · submission approval · winner selection" />
      <div style={AA.innerTabBar}>
        <button style={{ ...AA.innerTab, ...(seTab==="current"?AA.innerTabOn:{}) }} onClick={() => setSeTab("current")}>📊 Current Week</button>
        <button style={{ ...AA.innerTab, ...(seTab==="submissions"?AA.innerTabOn:{}) }} onClick={() => setSeTab("submissions")}>👗 Submissions{pending.length>0 && <span style={AA.innerTabBadge}>{pending.length}</span>}</button>
      </div>
      {seTab === "current" && <>
        <div style={{ ...AA.chartCard, borderColor:"rgba(167,139,250,0.3)", marginBottom:12 }}>
          <div style={AA.chartTop}><div style={AA.chartTitle}>Week #{currentWeek.id} — {currentPhase?.toUpperCase()}</div></div>
          <div style={{ fontSize:13, color:ADM_TX, fontStyle:"italic", margin:"12px 0" }}>"{currentWeek.theme}"</div>
        </div>
        <div style={{ ...AA.chartCard, marginBottom:12, borderColor:"rgba(0,212,168,0.2)" }}>
          <div style={AA.chartTitle}>⚡ Phase Control</div>
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            {[{ id:"submission",label:"✏️ Submissions",color:C.amber },{ id:"voting",label:"🗳️ Voting",color:C.teal },{ id:"closed",label:"✓ Closed",color:C.dim }].map(p => (
              <button key={p.id} onClick={() => ctx?.setStylePhase(p.id)} style={{ flex:1, padding:"9px 6px", borderRadius:4, fontSize:11, fontWeight:700, background:currentPhase===p.id?`${p.color}22`:ADM_S2, border:`1px solid ${currentPhase===p.id?p.color+"66":ADM_BR}`, color:currentPhase===p.id?p.color:C.dim }}>{p.label}</button>
            ))}
          </div>
        </div>
        <div style={AA.chartCard}>
          <div style={AA.chartTitle}>⚡ Admin Controls</div>
          <div style={AA.ecoControls}>
            <div style={AA.ecoControlRow}><div><div style={AA.ecoControlLabel}>Publish winner to Market</div><div style={{ fontSize:10, color:C.dim }}>Winner: {winner?`"${winner.title}" by ${winner.userName}`:"None"}</div></div>
              <button style={{ ...AA.tinyBtn, ...AA.tinyBtnGreen, opacity:winner?1:0.4 }} disabled={!winner} onClick={() => winner && setConfirmPublish(true)}>Publish</button>
            </div>
          </div>
        </div>
      </>}
      {seTab === "submissions" && <>
        {pending.length > 0 && <><div style={AA.proofQueueLabel}>⏳ Awaiting Review — {pending.length}</div>{pending.map(s => <StyleSubCard key={s.id} sub={s} onView={() => { setViewSub(s); setRejectNote(""); }} />)}</>}
        {approved.length > 0 && <><div style={{ ...AA.proofQueueLabel, color:C.teal, marginTop:12 }}>✓ Approved ({approved.length})</div>{approved.map(s => <StyleSubCard key={s.id} sub={s} resolved />)}</>}
      </>}
      {viewSub && (
        <div style={AA.modalOverlay} onClick={() => setViewSub(null)}>
          <div style={{ ...AA.modal, maxWidth:520 }} onClick={e => e.stopPropagation()}>
            <div style={AA.modalHdr}><div><div style={AA.modalTitle}>"{viewSub.title}"</div><div style={AA.modalSub}>{viewSub.userName} · {viewSub.submittedAt}</div></div><button style={AA.modalClose} onClick={() => setViewSub(null)}>✕</button></div>
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:16 }}>
              <button style={{ ...AA.modalBtn, background:"rgba(0,212,168,0.08)", borderColor:"rgba(0,212,168,0.4)", color:C.teal, fontWeight:700 }} onClick={() => approveSub(viewSub.id)}>✓ Approve</button>
              <input style={AA.fieldInput} placeholder="Rejection reason" value={rejectNote} onChange={e => setRejectNote(e.target.value)} />
              <button style={{ ...AA.modalBtn, ...AA.modalBtnRed, opacity:rejectNote.trim()?1:0.4 }} disabled={!rejectNote.trim()} onClick={() => rejectSub(viewSub.id, rejectNote)}>✕ Reject</button>
            </div>
          </div>
        </div>
      )}
      {confirmPublish && winner && (
        <div style={AA.modalOverlay} onClick={() => setConfirmPublish(false)}>
          <div style={{ ...AA.modal, maxWidth:440 }} onClick={e => e.stopPropagation()}>
            <div style={AA.modalHdr}><div style={AA.modalTitle}>Publish Winner to Market?</div><button style={AA.modalClose} onClick={() => setConfirmPublish(false)}>✕</button></div>
            <div style={{ fontSize:12, color:C.dim, marginBottom:16 }}>"{winner.title}" by {winner.userName} will appear in the Community tab at 200 AE.</div>
            <button style={{ ...AA.exportBtn, width:"100%", background:"rgba(0,212,168,0.15)", borderColor:"rgba(0,212,168,0.4)", color:C.teal, padding:"12px" }} onClick={() => { ctx?.publishWinnerToShop(winner); setConfirmPublish(false); }}>✓ Publish to Market Now</button>
          </div>
        </div>
      )}
    </div>
  );
}

function StyleSubCard({ sub, resolved, onView }) {
  const statusColor = { pending:C.amber, flagged:C.red, approved:C.teal, rejected:C.dim };
  const statusLabel = { pending:"Pending", flagged:"⚠ Flagged", approved:"✓ Live", rejected:"Rejected" };
  return (
    <div style={{ ...AA.proofCard, ...(sub.flagged?{ borderColor:"rgba(231,76,60,0.4)" }:{}), ...(resolved?{ opacity:0.7 }:{}) }}>
      <div style={{ ...AA.proofThumb, fontSize:24 }}>👗</div>
      <div style={AA.proofCardInfo}><div style={AA.proofCardTitle}>"{sub.title}"</div><div style={AA.proofCardMeta}>{sub.userName} · {sub.submittedAt}</div><div style={AA.proofCardReward}><span style={{ color:"#A78BFA" }}>⭐ {sub.votes} votes</span><span style={{ ...AA.statusPillEl, color:statusColor[sub.status], borderColor:statusColor[sub.status]+"44" }}>{statusLabel[sub.status]}</span></div></div>
      {!resolved && <button style={{ ...AA.tinyBtn, flexShrink:0 }} onClick={onView}>Review →</button>}
    </div>
  );
}

// ─── COMBAT SECTION ────────────────────────────────────────────────────────────
const COMBAT_LOG = [
  { id:8821, challenger:"Vikram K.", defender:"Karan T.", mode:"open", winner:"Vikram K.", wager:200, time:"14:22", itemDrop:false },
  { id:8820, challenger:"Priya M.", defender:"Meera K.", mode:"zone_raid", winner:"Meera K.", wager:0, time:"13:58", itemDrop:true },
  { id:8819, challenger:"BlazeThorn", defender:"Nocturne", mode:"clan_war", winner:"BlazeThorn", wager:0, time:"12:30", itemDrop:false },
];

function CombatSection() {
  return (
    <div style={AA.secWrap}>
      <SectionTitle title="Combat Log" sub="All duels, zone raids, and clan wars" />
      <div style={{ ...AA.kpiGrid, gridTemplateColumns:"repeat(4,1fr)", marginBottom:16 }}>{[{ label:"Fights Today",val:"47",delta:"+8 vs avg",color:C.red },{ label:"Zone Raids",val:"12",delta:"4 zones changed",color:C.amber },{ label:"Clan Wars",val:"2",delta:"1 ongoing",color:C.red },{ label:"Items Dropped",val:"6",delta:"3 rare",color:"#A78BFA" }].map(k => <KpiCard key={k.label} {...k} />)}</div>
      <Table cols={["ID","Challenger","Defender","Mode","Winner","Wager","Time"]} rows={COMBAT_LOG.map(c => [<span style={AA.monoSm}>#{c.id}</span>,<span style={AA.playerName}>{c.challenger}</span>,<span style={AA.playerName}>{c.defender}</span>,<span style={{ color:C.teal, fontSize:11, textTransform:"uppercase" }}>{c.mode.replace("_"," ")}</span>,<span style={{ color:C.amber, fontWeight:700 }}>{c.winner}</span>,<span style={AA.mono}>{c.wager>0?`${c.wager} AE`:"—"}</span>,<span style={AA.monoSm}>{c.time}</span>])} />
    </div>
  );
}

// ─── CLANS SECTION ─────────────────────────────────────────────────────────────
const CLAN_DATA = [];

function ClansSection() {
  const [clans, setClans] = useState(CLAN_DATA);
  const [confirmDissolve, setConfirmDissolve] = useState(null);

  const dissolveClan = (tag) => {
    setClans(cs => cs.filter(c => c.tag !== tag));
    setConfirmDissolve(null);
    showToast(`🛡️ Clan [${tag}] dissolved`, "error");
  };

  return (
    <div style={AA.secWrap}>
      <SectionTitle title="Clan Management" sub={`${clans.length} active clans`} />
      <Table cols={["Tag","Name","Leader","Members","Zones","CPR","Treasury","Flags","Actions"]} rows={clans.map(c => [
        <span style={{ ...AA.mono, color:"#A78BFA" }}>[{c.tag}]</span>,<span style={AA.playerName}>{c.name}</span>,<span style={{ color:C.dim }}>{c.leader}</span>,<span style={AA.mono}>{c.members}</span>,<span style={{ ...AA.mono, color:C.teal }}>{c.zones}</span>,<span style={{ ...AA.mono, color:C.amber }}>{c.cpr}</span>,<span style={{ ...AA.mono, color:C.amber }}>{c.treasury.toLocaleString()} AE</span>,<span style={{ color:c.flags>0?C.red:C.dim, fontWeight:700 }}>{c.flags>0?`⚠ ${c.flags}`:"—"}</span>,
        <div style={AA.actionBtns}><button style={AA.tinyBtn} onClick={() => showToast(`📊 ${c.name}: ${c.members} members, ${c.zones} zones, CPR ${c.cpr}`, "info")}>View</button><button style={{ ...AA.tinyBtn, ...AA.tinyBtnRed }} onClick={() => setConfirmDissolve(c)}>Dissolve</button></div>,
      ])} />
      {confirmDissolve && (
        <div style={AA.modalOverlay} onClick={() => setConfirmDissolve(null)}>
          <div style={AA.modal} onClick={e => e.stopPropagation()}>
            <div style={AA.modalHdr}><div style={AA.modalTitle}>Dissolve [{confirmDissolve.tag}] {confirmDissolve.name}?</div><button style={AA.modalClose} onClick={() => setConfirmDissolve(null)}>✕</button></div>
            <div style={{ fontSize:12, color:C.dim, marginBottom:16, lineHeight:1.6 }}>This will disband the clan, release all zones, and return treasury ({confirmDissolve.treasury.toLocaleString()} AE) to members. This action cannot be undone.</div>
            <div style={{ display:"flex", gap:8 }}>
              <button style={{ ...AA.exportBtn, flex:1 }} onClick={() => setConfirmDissolve(null)}>Cancel</button>
              <button style={{ ...AA.exportBtn, flex:1, background:"rgba(231,76,60,0.15)", borderColor:"rgba(231,76,60,0.4)", color:C.red }} onClick={() => dissolveClan(confirmDissolve.tag)}>⚠ Dissolve Clan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── STORY SECTION ─────────────────────────────────────────────────────────────
const CHAPTERS = [
  { id:1, title:"The Missing Ledger", status:"active", cluesSolved:2, totalClues:5, players:84 },
  { id:2, title:"The Hidden Room", status:"locked", cluesSolved:0, totalClues:6, players:0 },
  { id:3, title:"Voices in the Archive", status:"locked", cluesSolved:0, totalClues:7, players:0 },
  { id:4, title:"The Founder's Secret", status:"draft", cluesSolved:0, totalClues:8, players:0 },
];

function StorySection() {
  const [chapters, setChapters] = useState(CHAPTERS);

  const unlockChapter = (id) => {
    setChapters(chs => chs.map(ch => ch.id === id ? { ...ch, status:"active" } : ch));
    showToast(`📖 Chapter ${id} unlocked! Players can now discover clues.`, "success");
  };

  return (
    <div style={AA.secWrap}>
      <SectionTitle title="Story Quest Manager" sub="The Campus Chronicle — Season 1" />
      <div style={AA.chartsRow}>
        <div style={{ ...AA.chartCard, flex:1 }}><div style={AA.chartTitle}>Chapter Progress</div>
          {chapters.map(ch => (<div key={ch.id} style={AA.chapterRow}><div style={AA.chapterLeft}><span style={{ ...AA.mono, color:ch.status==="active"?C.teal:ch.status==="draft"?C.amber:C.dim }}>Ch{ch.id}</span><div><div style={AA.chapterTitle}>{ch.title}</div><div style={AA.chapterMeta}>{ch.status==="active"?`${ch.cluesSolved}/${ch.totalClues} clues · ${ch.players} players`:ch.status==="locked"?"Locked":"Draft"}</div></div></div>
            <div style={AA.actionBtns}>
              {ch.status==="active" && <button style={AA.tinyBtn} onClick={() => showToast(`📊 Ch${ch.id}: ${ch.cluesSolved}/${ch.totalClues} clues solved by ${ch.players} players`, "info")}>Monitor</button>}
              {ch.status==="locked" && <button style={{ ...AA.tinyBtn, ...AA.tinyBtnGreen }} onClick={() => unlockChapter(ch.id)}>Unlock</button>}
              {ch.status==="draft" && <button style={AA.tinyBtn} onClick={() => showToast("📝 Story editor would open here", "info")}>Edit</button>}
            </div>
          </div>))}
        </div>
      </div>
    </div>
  );
}

// ─── MODERATION SECTION ────────────────────────────────────────────────────────
const REPORTS = [
  { id:1, reporter:"User #2203", reported:"Vikram K.", reason:"Toxic message in clan chat", time:"13:45", severity:"high", status:"pending", priorActions:[] },
  { id:2, reporter:"User #7743", reported:"User #5501", reason:"Suspicious mission exploit", time:"12:30", severity:"medium", status:"pending", priorActions:["warn"] },
  { id:3, reporter:"User #3317", reported:"User #8821", reason:"Harassment in zone chat", time:"11:00", severity:"high", status:"reviewing", priorActions:["warn","timeout"] },
];

function ModerationSection() {
  const [reports, setReports] = useState(REPORTS);
  const PRIOR_ICONS = { warn:"⚠️", timeout:"⏱", ban:"🚫" };
  const nextAction = (priorActions) => { if (priorActions.includes("timeout")) return "ban"; if (priorActions.includes("warn")) return "timeout"; return "warn"; };
  const ACTION_LABELS = { warn:"⚠️ Warn", timeout:"⏱ Timeout", ban:"🚫 Ban" };

  const takeAction = (reportId, action) => {
    setReports(rs => rs.map(r => r.id === reportId ? {
      ...r,
      status: "resolved",
      priorActions: [...r.priorActions, action],
    } : r));
    showToast(`${ACTION_LABELS[action]} applied to report #${reportId}`, action === "ban" ? "error" : "warning");
  };

  const resolveReport = (reportId) => {
    setReports(rs => rs.map(r => r.id === reportId ? { ...r, status:"resolved" } : r));
    showToast(`✓ Report #${reportId} resolved — no action taken`, "success");
  };

  return (
    <div style={AA.secWrap}>
      <SectionTitle title="Moderation Queue" sub={`${reports.filter(r=>r.status!=="resolved").length} open · Warn → Timeout → Ban`} />
      <div style={AA.modLadder}>
        {[{ step:1, icon:"⚠️", label:"Warn", color:C.amber },{ step:2, icon:"⏱", label:"Timeout", color:C.red },{ step:3, icon:"🚫", label:"Ban", color:C.red }].map((s,i) => (
          <div key={s.step} style={AA.modLadderItem}><div style={{ ...AA.modLadderIcon, borderColor:s.color+"44", color:s.color }}>{s.icon}</div><div style={AA.modLadderLabel}>{s.label}</div>{i<2 && <div style={AA.modLadderArrow}>→</div>}</div>
        ))}
      </div>
      <Table cols={["#","Reporter","Reported","Reason","Severity","History","Status","Actions"]} rows={reports.map(r => {
        const next = nextAction(r.priorActions);
        return [
          <span style={AA.monoSm}>R{r.id}</span>,<span style={AA.monoSm}>{r.reporter}</span>,<span style={AA.playerName}>{r.reported}</span>,<span style={{ color:C.dim, fontSize:11 }}>{r.reason}</span>,
          <span style={{ color:{high:C.red,medium:C.amber,low:C.teal}[r.severity], fontSize:10, fontWeight:700, textTransform:"uppercase" }}>{r.severity}</span>,
          <div style={{ display:"flex", gap:3 }}>{r.priorActions.length===0?<span style={{ color:C.dim, fontSize:10 }}>None</span>:r.priorActions.map((a,i) => <span key={i} style={{ fontSize:12 }}>{PRIOR_ICONS[a]}</span>)}</div>,
          <StatusPill status={r.status} />,
          r.status !== "resolved" ? (
            <div style={AA.actionBtns}>
              <button style={{ ...AA.tinyBtn, ...(next==="ban"?AA.tinyBtnRed:AA.tinyBtnAmber) }} onClick={() => takeAction(r.id, next)}>{ACTION_LABELS[next]}</button>
              <button style={AA.tinyBtn} onClick={() => resolveReport(r.id)}>Dismiss</button>
            </div>
          ) : <span style={{ fontSize:10, color:C.teal }}>✓ Resolved</span>,
        ];
      })} />
    </div>
  );
}

// ─── RESEARCH SECTION ──────────────────────────────────────────────────────────
function ResearchSection() {
  return (
    <div style={AA.secWrap}>
      <SectionTitle title="Research Dashboard" sub="IRB-approved anonymised data" />
      <div style={AA.kpiGrid}>{[
        { label:"DAU Rate",val:"22.8%",delta:"Target: 30%",color:C.amber },{ label:"Cross-Dept Connect",val:"142",delta:"4.1/user",color:C.teal },{ label:"Avg Mood (30d)",val:"3.4/5",delta:"Slight decline",color:C.amber },
        { label:"Steps Logged/Day",val:"12,400",delta:"+34% vs control",color:C.teal },{ label:"Sustainability Acts",val:"891",delta:"This month",color:C.teal },{ label:"Story Engagement",val:"67%",delta:"Of active users",color:"#A78BFA" },
      ].map(k => <KpiCard key={k.label} {...k} />)}</div>
      <div style={AA.chartsRow}>
        <div style={{ ...AA.chartCard, flex:2 }}><div style={AA.chartTitle}>Cross-Department Social Connections</div><MiniLineChart data={[12,18,24,31,40,52,68,80,96,112,126,142]} color="#A78BFA" /></div>
        <div style={{ ...AA.chartCard, flex:1 }}><div style={AA.chartTitle}>Wellbeing vs Engagement</div><div style={{ color:C.dim, fontSize:12, lineHeight:1.6 }}>Mood 4-5: avg 8.4 missions/week<br/>Mood 3: avg 5.2<br/>Mood 1-2: avg 2.1<br/><span style={{ color:C.amber }}>↑ r=0.71</span></div></div>
      </div>
    </div>
  );
}

// ─── CONFIG SECTION ────────────────────────────────────────────────────────────
function ConfigSection() {
  const initSettings = [
    { group:"Game Balance", settings:[{ key:"xp_multiplier",label:"XP Multiplier",val:"1.0×" },{ key:"ae_earn_cap",label:"Max AE/day",val:"500 AE" },{ key:"zone_cooldown",label:"Zone attack cooldown",val:`${ADMIN_GAME_RULES.ZONE_ATTACK_COOLDOWN_HOURS}h` }] },
    { group:"Clan Rules", settings:[{ key:"clan_min_level",label:"Min level to create",val:"3" },{ key:"clan_max",label:"Max clan size",val:"20" },{ key:"clan_cost",label:"Creation cost",val:"500 AE" }] },
    { group:"Feature Flags", settings:[{ key:"combat",label:"Combat system",val:"ON" },{ key:"marketplace",label:"Marketplace",val:"ON" },{ key:"style_event",label:"Style events",val:"ON" },{ key:"maintenance",label:"Maintenance mode",val:"OFF" }] },
  ];
  const [groups, setGroups] = useState(initSettings);
  const [editKey, setEditKey] = useState(null);
  const [editVal, setEditVal] = useState("");

  const startEdit = (key, val) => { setEditKey(key); setEditVal(val); };
  const saveEdit = () => {
    if (!editKey) return;
    setGroups(gs => gs.map(g => ({
      ...g,
      settings: g.settings.map(s => s.key === editKey ? { ...s, val: editVal } : s),
    })));
    showToast(`✓ ${editKey} updated to "${editVal}"`, "success");
    setEditKey(null);
    setEditVal("");
  };

  const toggleFlag = (key) => {
    setGroups(gs => gs.map(g => ({
      ...g,
      settings: g.settings.map(s => s.key === key ? { ...s, val: s.val === "ON" ? "OFF" : "ON" } : s),
    })));
    const setting = groups.flatMap(g => g.settings).find(s => s.key === key);
    const newVal = setting?.val === "ON" ? "OFF" : "ON";
    showToast(`⚙️ ${key} set to ${newVal}`, newVal === "ON" ? "success" : "warning");
  };

  return (
    <div style={AA.secWrap}>
      <SectionTitle title="Platform Config" sub="Global settings — changes apply immediately" />
      {groups.map(group => (
        <div key={group.group} style={{ ...AA.chartCard, marginBottom:12 }}>
          <div style={AA.chartTitle}>{group.group}</div>
          {group.settings.map(s => (
            <div key={s.key} style={AA.ecoControlRow}>
              <div><div style={AA.ecoControlLabel}>{s.label}</div><div style={{ ...AA.monoSm, color:C.dim }}>{s.key}</div></div>
              <div style={AA.actionBtns}>
                <span style={{ ...AA.mono, color:s.val==="ON"?C.teal:s.val==="OFF"?C.red:C.amber }}>{s.val}</span>
                {(s.val === "ON" || s.val === "OFF") ? (
                  <button style={{ ...AA.tinyBtn, ...(s.val==="ON"?AA.tinyBtnRed:AA.tinyBtnGreen) }} onClick={() => toggleFlag(s.key)}>{s.val==="ON"?"Disable":"Enable"}</button>
                ) : (
                  <button style={AA.tinyBtn} onClick={() => startEdit(s.key, s.val)}>Edit</button>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
      {editKey && (
        <div style={AA.modalOverlay} onClick={() => setEditKey(null)}>
          <div style={{ ...AA.modal, maxWidth:400 }} onClick={e => e.stopPropagation()}>
            <div style={AA.modalHdr}><div style={AA.modalTitle}>Edit: {editKey}</div><button style={AA.modalClose} onClick={() => setEditKey(null)}>✕</button></div>
            <div style={AA.fieldWrap}><label style={AA.fieldLabel}>NEW VALUE</label><input style={AA.fieldInput} value={editVal} onChange={e => setEditVal(e.target.value)} autoFocus /></div>
            <div style={{ display:"flex", gap:8, marginTop:16 }}>
              <button style={{ ...AA.exportBtn, flex:1 }} onClick={() => setEditKey(null)}>Cancel</button>
              <button style={{ ...AA.exportBtn, flex:1, background:"rgba(0,212,168,0.15)", borderColor:"rgba(0,212,168,0.4)", color:C.teal }} onClick={saveEdit}>✓ Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ZONE MAP SCREEN — Real GPS capture system
// ═══════════════════════════════════════════════════════════════════════════════

function getDistanceMetres(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function ZoneMapScreen() {
  const ctx = useContext(AppContext);
  const [zones, setZones] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [capturing, setCapturing] = useState(null);
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
      else setZones(window.__zr_zones || []);
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
    const zone = zones.find(z => z.id === capturing.zoneId);
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
    const zone = zones.find(z => z.id === capturing.zoneId);
    const userClan = ctx?.sharedUser?.clan;
    if (ctx?.authUser && userClan) {
      await supabase.from("zones").update({ owner_clan_id: userClan.id, contest_status: "peaceful", last_capture_at: new Date().toISOString(), control_strength: 50 }).eq("id", capturing.zoneId);
      await supabase.from("zone_captures").update({ status: "completed" }).eq("id", capturing.captureId);
      const { count } = await supabase.from("zones").select("id", { count: "exact", head: true }).eq("owner_clan_id", userClan.id);
      await supabase.from("clans").update({ zones_held: count || 0 }).eq("id", userClan.id);
    }
    setZones(zs => zs.map(z => z.id === capturing.zoneId ? { ...z, owner_clan_id: userClan?.id, owner_clan: userClan ? { name: userClan.name, tag: userClan.tag, color: userClan.color } : null, contest_status: "peaceful", last_capture_at: new Date().toISOString() } : z));
    if (ctx?.setSharedUser) {
      ctx.setSharedUser(u => {
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
    setZones(zs => zs.map(z => z.id === zone.id ? { ...z, contest_status: "contested" } : z));
    showToast("⚔️ Capture started! Stay within 100m for 30 minutes.", "success");
  };

  const cancelCapture = async () => {
    if (capturing?.captureId && ctx?.authUser) {
      await supabase.from("zone_captures").update({ status: "cancelled" }).eq("id", capturing.captureId);
      await supabase.from("zones").update({ contest_status: "peaceful" }).eq("id", capturing.zoneId);
    }
    setZones(zs => zs.map(z => z.id === capturing?.zoneId ? { ...z, contest_status: "peaceful" } : z));
    setCapturing(null); setElapsed(0);
    showToast("Capture cancelled.", "info");
  };

  const zonesWithDist = zones.map(z => ({
    ...z,
    distance: userPos ? getDistanceMetres(userPos.lat, userPos.lng, z.latitude, z.longitude) : null,
    inRange: userPos ? getDistanceMetres(userPos.lat, userPos.lng, z.latitude, z.longitude) <= GEO_RADIUS : false,
  })).sort((a, b) => (a.distance ?? 9999999) - (b.distance ?? 9999999));

  const filtered = filter === "all" ? zonesWithDist
    : filter === "nearby" ? zonesWithDist.filter(z => z.distance !== null && z.distance <= 500)
    : filter === "capturable" ? zonesWithDist.filter(z => z.inRange && z.owner_clan_id !== ctx?.sharedUser?.clan?.id)
    : zonesWithDist.filter(z => z.zone_type === filter);

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
            <div style={{ fontSize:12, color:TM }}>{zones.length} zones · {zonesWithDist.filter(z => z.inRange).length} in range</div>
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
                    <div style={{ fontSize:14, fontWeight:800, color:TX }}>{zones.find(z => z.id === capturing.zoneId)?.name || "Zone"}</div>
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
          ].map(f => (
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
        {filtered.map(z => {
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

// ═══════════════════════════════════════════════════════════════════════════════
// HOME SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function HomeScreen() {
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
            <button onClick={() => ctx?.setPlayerNotifs(ns => ns.slice(1))} style={{ background:"none", border:"none", color:"#fff", fontSize:14, cursor:"pointer", padding:0 }}>✕</button>
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
        {[...Array(28)].map((_,i) => (
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
            {["🟡","🔵","🟢"].map((e,i) => (
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
            {[1,2,3,4,5,6,7].map(d => (
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
          {missions.filter(m => m.tier === "daily" && !m._disabled).slice(0, 5).map((m, i) => <MissionCard key={m.id} m={m} idx={i} />)}
        </div>
      </div>

      {/* ═══ LIVE EVENT — full illustrated card ═══ */}
      {liveEvents.length > 0 && (
        <div style={{ margin:"14px 16px 0" }}>
          <SectionHeader title="⚡ Live Events" action="See All →" onAction={() => setTab("missions")} />
          {liveEvents.map(ev => (
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

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function ProfileScreen({ user, onAdminAccess }) {
  const ctx = useContext(AppContext);
  const tapRef = useRef(0);
  const tapTimer = useRef(null);
  const iframeRef = useRef(null);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [avatarDataUrl, setAvatarDataUrl] = useState(null);
  const handleAdminTap = () => {
    tapRef.current += 1;
    clearTimeout(tapTimer.current);
    if (tapRef.current >= 7) { tapRef.current = 0; if (onAdminAccess) onAdminAccess(); return; }
    tapTimer.current = setTimeout(() => { tapRef.current = 0; }, 2000);
  };

  // Collect owned item IDs from shop context
  const getOwnedIds = () => {
    const allItems = ctx?.sharedShopItems || SHOP_ITEMS;
    return allItems.filter(i => i.owned).map(i => i.id);
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
        ].map(s => (
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

            setAchievements(prev => prev.map(a => ({ ...a, unlocked: unlocked.has(a.key) })));
          })();
        }, [ctx?.authUser]);

        return (
          <div style={{ padding:"0 16px", marginBottom:16 }}>
            <SectionHeader title="🏆 Achievements" />
            <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4 }}>
              {achievements.map(a => (
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
                const [fitConnected, setFitConnected] = useState(false);
                const [fitLoading, setFitLoading] = useState(true);
                const ctx = useContext(AppContext);
                useEffect(() => {
                  if (!ctx?.authUser) return;
                  supabase.from("google_fit_tokens").select("connected").eq("user_id", ctx.authUser.id).maybeSingle().then(({ data }) => {
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

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// AUTH SCREEN — Signup / Login
// ═══════════════════════════════════════════════════════════════════════════════
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("signup"); // "signup" | "login"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [year, setYear] = useState("");
  const [course, setCourse] = useState("");
  const [specialisation, setSpecialisation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !rollNumber.trim() || !year || !course.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const { data, error: signErr } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (signErr) { setError(signErr.message); setLoading(false); return; }
      if (data?.user) {
        // Create profile with student info
        await supabase.from("profiles").upsert({
          user_id: data.user.id,
          display_name: name.trim(),
          roll_number: rollNumber.trim(),
          year,
          course: course.trim(),
          specialisation: specialisation.trim() || null,
        }, { onConflict: "user_id" });
        showToast("✅ Account created! Check your email to verify.", "success");
      }
    } catch (err) {
      setError(err.message || "Signup failed");
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
      if (loginErr) { setError(loginErr.message); setLoading(false); return; }
    } catch (err) {
      setError(err.message || "Login failed");
    }
    setLoading(false);
  };

  const inputStyle = {
    width:"100%", padding:"12px 14px", background:S1, border:`1.5px solid ${BR}`,
    borderRadius:10, color:TX, fontSize:15, fontFamily:FONT, outline:"none",
    transition:"border-color 0.2s",
  };
  const labelStyle = { fontSize:12, fontWeight:700, color:TM, marginBottom:4, display:"block", letterSpacing:0.5 };

  return (
    <div style={{ minHeight:"100dvh", background:BG, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:FONT, padding:16 }}>
      <div style={{ width:"100%", maxWidth:420, background:S2, borderRadius:18, border:`1.5px solid ${BR}`, padding:"36px 28px", boxShadow:`0 0 60px ${T}15` }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:36, marginBottom:6 }}>⚡</div>
          <div style={{ fontSize:24, fontWeight:900, color:TX, letterSpacing:-0.5 }}>ZoneRush</div>
          <div style={{ fontSize:13, color:TM, marginTop:4 }}>Campus Gamification Platform</div>
        </div>

        {/* Tab toggle */}
        <div style={{ display:"flex", gap:0, marginBottom:24, borderRadius:10, overflow:"hidden", border:`1.5px solid ${BR}` }}>
          {["signup","login"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
              flex:1, padding:"10px 0", background:mode===m ? T : "transparent",
              color:mode===m ? BG : TM, fontWeight:800, fontSize:13, border:"none",
              cursor:"pointer", fontFamily:FONT, letterSpacing:0.5, transition:"all 0.2s",
            }}>
              {m === "signup" ? "SIGN UP" : "LOG IN"}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background:`${TR}15`, border:`1px solid ${TR}40`, borderRadius:8, padding:"10px 14px", marginBottom:16, color:TR, fontSize:13 }}>
            {error}
          </div>
        )}

        <form onSubmit={mode === "signup" ? handleSignup : handleLogin}>
          {mode === "signup" && (
            <>
              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>Full Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Arjun Sharma" style={inputStyle} required />
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>Roll Number *</label>
                <input value={rollNumber} onChange={e => setRollNumber(e.target.value)} placeholder="e.g. 22BCS045" style={inputStyle} required />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
                <div>
                  <label style={labelStyle}>Year *</label>
                  <select value={year} onChange={e => setYear(e.target.value)} style={{ ...inputStyle, cursor:"pointer" }} required>
                    <option value="">Select</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="5th Year">5th Year</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Course *</label>
                  <input value={course} onChange={e => setCourse(e.target.value)} placeholder="e.g. B.Tech" style={inputStyle} required />
                </div>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>Specialisation</label>
                <input value={specialisation} onChange={e => setSpecialisation(e.target.value)} placeholder="e.g. Computer Science" style={inputStyle} />
              </div>
            </>
          )}

          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Email *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={inputStyle} required />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={labelStyle}>Password *</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" style={inputStyle} required minLength={6} />
          </div>

          <button type="submit" disabled={loading} style={{
            width:"100%", padding:"14px 0", background:loading ? TD : `linear-gradient(135deg, ${T}, ${TL})`,
            color:BG, fontWeight:900, fontSize:15, border:"none", borderRadius:10,
            cursor:loading ? "wait" : "pointer", fontFamily:FONT, letterSpacing:0.5,
            boxShadow:`0 4px 20px ${T}40`, transition:"all 0.2s",
          }}>
            {loading ? "Please wait..." : mode === "signup" ? "Create Account" : "Log In"}
          </button>
        </form>

        <div style={{ textAlign:"center", marginTop:18, fontSize:13, color:TM }}>
          {mode === "signup" ? (
            <>Already have an account? <span onClick={() => setMode("login")} style={{ color:T, cursor:"pointer", fontWeight:700 }}>Log in</span></>
          ) : (
            <>Don't have an account? <span onClick={() => setMode("signup")} style={{ color:T, cursor:"pointer", fontWeight:700 }}>Sign up</span></>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ZoneRushApp() {
  const [dbReady, setDbReady] = useState(false);
  const [authUser, setAuthUser] = useState(null);

  // Don't load stale demo data from localStorage — always start from defaults
  // Real data will be loaded from DB when authenticated
  const [sharedUser, _setSharedUser] = useState({ ...USER });
  const setSharedUser = (updater) => {
    _setSharedUser(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try { localStorage.setItem("zr_user", JSON.stringify(next)); } catch {}
      // Sync to Supabase if authenticated
      if (authUser) {
        supabase.from("profiles").update({
          display_name: next.name,
          level: next.level, xp: next.xp, xp_next: next.xpNext,
          ae: next.ae, shards: next.shards,
          streak: next.streak, shields: next.shields,
          combat_rank: next.combatRank, influence_rank: next.influenceRank,
        }).eq("id", authUser.id).then(() => {});
      }
      return next;
    });
  };
  const [sharedMissions,   setSharedMissions]   = useState(MISSIONS);
  const [sharedEvents,     setSharedEvents]     = useState(LIVE_EVENTS);
  const [sharedShopItems,  setSharedShopItems]  = useState(
    INIT_SHOP_ITEMS.map(it => ({
      ...it, price:it.priceAE, rarity:it.rarity,
      icon:(SHOP_ITEMS.find(s => s.id===it.id)||{}).icon||"🎁",
      owned: it.priceAE === 0, featured:["lpc_long","lpc_leather","lpc_plate"].includes(it.id),
    }))
  );
  const [sharedStyleEvent, setSharedStyleEvent] = useState({
    ...STYLE_EVENT_LIVE,
    gallery:[],
  });
  const [sharedStyleSubs,  setSharedStyleSubs]  = useState(STYLE_SUBMISSIONS_INIT);
  const [sharedProofs,     setSharedProofs]     = useState(PROOF_SUBMISSIONS);
  const [playerNotifs,     setPlayerNotifs]     = useState([]);
  const [completedMissions, _setCompletedMissions] = useState(() => {
    try { const s = localStorage.getItem("zr_completedMissions"); return s ? new Set(JSON.parse(s)) : new Set(); }
    catch { return new Set(); }
  });
  const setCompletedMissions = (updater) => {
    _setCompletedMissions(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try { localStorage.setItem("zr_completedMissions", JSON.stringify([...next])); } catch {}
      return next;
    });
  };
  const [joinedEvents, setJoinedEvents] = useState(new Set());
  const [marketplaceListings, setMarketplaceListings] = useState([]);
  const [listedItems, setListedItems] = useState(new Set());
  const [listingPrices, setListingPrices] = useState({});

  // ── Fetch data from Supabase on mount ──
  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null);
    });

    // Fetch public data (no auth required)
    const fetchPublicData = async () => {
      try {
        // Fetch quest definitions from DB
        const { data: dbQuests } = await supabase.from("quest_definitions").select("*").eq("is_active", true).order("sort_order");
        if (dbQuests?.length) {
          setSharedMissions(dbQuests.map(q => ({
            id: q.id, title: q.title, description: q.description, cat: q.category,
            icon: q.icon, type: q.tracking_type,
            reward: `${q.aether_reward} AE`, xp: `${q.xp_reward} XP`,
            aether_reward: q.aether_reward, xp_reward: q.xp_reward, shard_reward: q.shard_reward,
            progress: 0, goal: q.target_value,
            tier: q.tier, requires_clan: q.requires_clan,
            color: q.tier === "daily" ? T : q.tier === "weekly" ? TB : TL,
            timer: q.tier === "daily" ? "23h" : q.tier === "weekly" ? "This week" : "This month",
            week: q.tier === "weekly", month: q.tier === "monthly", _disabled: false,
          })));
        }

        // Fetch shop items
        const { data: dbShop } = await supabase.from("shop_items").select("*").order("created_at");
        if (dbShop?.length) {
          setSharedShopItems(dbShop.map(it => ({
            id: it.id, name: it.name, cat: it.category, price: it.price_ae, priceAE: it.price_ae,
            rarity: it.rarity, icon: it.icon, type: it.item_type, stock: it.stock,
            sold: it.sold, active: it.active, soulBound: it.soul_bound,
            owned: false, featured: it.featured,
          })));
        }

        // Fetch events
        const { data: dbEvents } = await supabase.from("events").select("*").eq("status", "active");
        if (dbEvents?.length) {
          setSharedEvents(dbEvents.map(e => ({
            id: e.id, title: e.title, type: e.type, status: e.status,
            desc: e.description, endDate: e.end_date ? new Date(e.end_date).toLocaleDateString("en-GB", { month:"short", day:"numeric" }) : "",
            reward: e.reward, participants: 0, maxParticipants: e.max_participants,
            eligibility: e.eligibility, color: e.color,
          })));
          // Fetch participant counts
          for (const e of dbEvents) {
            supabase.from("event_participants").select("id", { count: "exact", head: true }).eq("event_id", e.id)
              .then(({ count }) => {
                if (count !== null) setSharedEvents(es => es.map(ev => ev.id === e.id ? { ...ev, participants: count } : ev));
              });
          }
        }

        // Fetch zones (used by clan screens and map)
        const { data: dbZones } = await supabase.from("zones").select("*, owner_clan:clans!zones_owner_clan_id_fkey(name, tag, color)");
        if (dbZones?.length) {
          window.__zr_zones = dbZones;
        }

        // Fetch clans (used by leaderboard and clan join)
        const { data: dbClans } = await supabase.from("clans").select("*").order("rank");
        if (dbClans?.length) {
          window.__zr_clans = dbClans;
        }

        // Fetch style events
        const { data: dbStyleEvents } = await supabase.from("style_events").select("*").order("created_at", { ascending: false }).limit(1);
        if (dbStyleEvents?.length) {
          const se = dbStyleEvents[0];
          // Fetch submissions for this style event
          const { data: dbStyleSubs } = await supabase.from("style_submissions").select("*").eq("style_event_id", se.id);
          if (dbStyleSubs?.length) {
            setSharedStyleSubs(dbStyleSubs.map(s => ({
              id: s.id, userId: s.user_id, userName: "Player", title: s.title,
              votes: s.votes, status: s.status, submittedAt: new Date(s.submitted_at).toLocaleDateString("en-GB", { month:"short", day:"numeric" }),
              flagged: s.flagged,
            })));
          }
          setSharedStyleEvent(prev => ({
            ...prev,
            phase: se.phase, weekId: se.week_id, theme: se.theme,
            submissionEnds: se.submission_ends ? new Date(se.submission_ends).toLocaleDateString("en-GB", { month:"short", day:"numeric" }) : prev.submissionEnds,
            votingEnds: se.voting_ends ? new Date(se.voting_ends).toLocaleDateString("en-GB", { month:"short", day:"numeric" }) : prev.votingEnds,
          }));
        }

        // Fetch game config
        const { data: dbConfig } = await supabase.from("game_config").select("*");
        if (dbConfig?.length) {
          window.__zr_config = {};
          dbConfig.forEach(c => { window.__zr_config[c.key] = c.value; });
        }

        setDbReady(true);
      } catch (err) {
        console.warn("Supabase fetch failed, using mock data:", err);
        setDbReady(true);
      }
    };

    fetchPublicData();

    return () => subscription.unsubscribe();
  }, []);

  // ── Fetch user-specific data when authenticated ──
  useEffect(() => {
    if (!authUser) return;
    const fetchUserData = async () => {
      // Fetch profile
      const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", authUser.id).single();
      if (profile) {
        // ── Streak logic: check if streak should reset ──
        const lastActive = profile.updated_at ? new Date(profile.updated_at) : null;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lastDay = lastActive ? new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate()) : null;
        const daysSinceActive = lastDay ? Math.floor((today - lastDay) / 86400000) : 999;
        
        let currentStreak = profile.streak || 0;
        if (daysSinceActive > 1) {
          // Missed a day — reset streak
          currentStreak = 0;
          await supabase.from("profiles").update({ streak: 0, updated_at: new Date().toISOString() }).eq("user_id", authUser.id);
        } else if (daysSinceActive === 1) {
          // Consecutive day — increment streak
          currentStreak = (profile.streak || 0) + 1;
          await supabase.from("profiles").update({ streak: currentStreak, updated_at: new Date().toISOString() }).eq("user_id", authUser.id);
        }
        // daysSinceActive === 0 means same day, keep streak as is but update timestamp
        if (daysSinceActive === 0) {
          await supabase.from("profiles").update({ updated_at: new Date().toISOString() }).eq("user_id", authUser.id);
        }

        _setSharedUser({
          name: profile.display_name || authUser.email,
          level: profile.level, xp: profile.xp, xpNext: profile.xp_next,
          ae: profile.ae, shards: profile.shards,
          streak: currentStreak, shields: profile.shields,
          combatRank: profile.combat_rank, influenceRank: profile.influence_rank,
          clan: null, // Will be populated from clan_members
        });
      }

      // Fetch user's clan membership
      const { data: membership } = await supabase.from("clan_members").select("*, clan:clans(*)").eq("user_id", authUser.id).maybeSingle();
      if (membership?.clan) {
        const c = membership.clan;
        const { count: memberCount } = await supabase.from("clan_members").select("id", { count: "exact", head: true }).eq("clan_id", c.id);
        const clanZones = (window.__zr_zones || []).filter(z => z.captured_by === c.id);
        _setSharedUser(u => ({
          ...u,
          clan: {
            id: c.id, name: c.name, tag: c.tag, motto: c.motto, color: c.color,
            founded: new Date(c.founded_at).toLocaleDateString("en-GB", { month:"short", year:"numeric" }),
            memberRole: membership.role.charAt(0).toUpperCase() + membership.role.slice(1),
            treasury: c.treasury, weeklyXP: c.weekly_xp,
            rank: c.rank, cpr: Number(c.cpr), zonesHeld: clanZones.length,
            totalMembers: memberCount || 1, maxMembers: c.max_members,
          }
        }));
        // Also update profiles table
        await supabase.from("profiles").update({ clan_id: c.id }).eq("user_id", authUser.id);
      }

      // Fetch quest progress from quest_progress table
      const { data: questProgress } = await supabase.from("quest_progress").select("*").eq("user_id", authUser.id);
      if (questProgress?.length) {
        const completedIds = new Set(questProgress.filter(qp => qp.status === "completed" || qp.status === "claimed").map(qp => qp.quest_definition_id));
        _setCompletedMissions(completedIds);
        // Update mission progress values
        setSharedMissions(ms => ms.map(m => {
          const qp = questProgress.find(q => q.quest_definition_id === m.id);
          return qp ? { ...m, progress: qp.current_value, _progressId: qp.id } : m;
        }));
      }

      // Fetch user inventory
      const { data: inventory } = await supabase.from("user_inventory").select("item_id").eq("user_id", authUser.id);
      if (inventory?.length) {
        const ownedIds = new Set(inventory.map(i => i.item_id));
        setSharedShopItems(items => items.map(it => ({ ...it, owned: ownedIds.has(it.id) })));
      }

      // Fetch user's event participations
      const { data: participations } = await supabase.from("event_participants").select("event_id").eq("user_id", authUser.id);
      if (participations?.length) {
        setJoinedEvents(new Set(participations.map(p => p.event_id)));
      }

      // Fetch marketplace listings (items listed for sale by all users)
      const { data: listings } = await supabase.from("user_inventory").select("*, item:shop_items(*), seller:profiles!user_inventory_user_id_fkey(display_name, id)").eq("listed_for_sale", true);
      if (listings?.length) {
        const mapped = listings.filter(l => l.item && l.user_id !== authUser.id).map(l => ({
          ...l.item, id: l.item.id, name: l.item.name, cat: l.item.category,
          price: l.sale_price_ae, rarity: l.item.rarity, icon: l.item.icon,
          seller: l.seller?.display_name || "Player", _isMarketListing: true,
          _inventoryId: l.id, _sellerId: l.user_id,
        }));
        setMarketplaceListings(mapped);
      }
      // Track user's own listed items
      const { data: myListings } = await supabase.from("user_inventory").select("item_id, sale_price_ae").eq("user_id", authUser.id).eq("listed_for_sale", true);
      if (myListings?.length) {
        setListedItems(new Set(myListings.map(l => l.item_id)));
        const prices = {};
        myListings.forEach(l => { prices[l.item_id] = l.sale_price_ae; });
        setListingPrices(prices);
      }

      // Fetch notifications
      const { data: notifs } = await supabase.from("notifications").select("*").eq("user_id", authUser.id).eq("read", false).order("created_at", { ascending: false });
      if (notifs?.length) {
        setPlayerNotifs(notifs.map(n => ({ id: n.id, type: n.type, msg: `${n.title}: ${n.body}` })));
      }
    };
    fetchUserData();
  }, [authUser]);

  const appCtx = {
    authUser, dbReady,
    sharedUser, setSharedUser,
    sharedMissions, setSharedMissions,
    sharedEvents, setSharedEvents,
    sharedShopItems, setSharedShopItems,
    sharedStyleEvent, setSharedStyleEvent,
    sharedStyleSubs, setSharedStyleSubs,
    sharedProofs, setSharedProofs,
    playerNotifs, setPlayerNotifs,
    completedMissions, joinedEvents,
    marketplaceListings, listedItems, listingPrices,

    listItemForSale: async (itemId, price) => {
      setListedItems(s => new Set([...s, itemId]));
      setListingPrices(p => ({ ...p, [itemId]: price }));
      const item = sharedShopItems.find(i => i.id === itemId);
      if (item) {
        setMarketplaceListings(ls => [...ls, {
          ...item, price, seller: sharedUser.name, _isMarketListing: true,
          _inventoryId: "inv_" + itemId, _sellerId: authUser?.id,
        }]);
      }
      if (authUser) {
        await supabase.from("user_inventory").update({ listed_for_sale: true, sale_price_ae: price }).eq("user_id", authUser.id).eq("item_id", itemId);
      }
    },
    unlistItem: async (itemId) => {
      setListedItems(s => { const n = new Set(s); n.delete(itemId); return n; });
      setListingPrices(p => { const n = { ...p }; delete n[itemId]; return n; });
      setMarketplaceListings(ls => ls.filter(l => !(l.id === itemId && l._sellerId === authUser?.id)));
      if (authUser) {
        await supabase.from("user_inventory").update({ listed_for_sale: false, sale_price_ae: null }).eq("user_id", authUser.id).eq("item_id", itemId);
      }
    },
    buyMarketplaceListing: async (inventoryId, itemId, price, sellerId) => {
      setMarketplaceListings(ls => ls.filter(l => l._inventoryId !== inventoryId));
      setSharedUser(u => ({ ...u, ae: Math.max(0, u.ae - price) }));
      if (authUser) {
        await supabase.from("user_inventory").insert({ user_id: authUser.id, item_id: itemId });
        if (sellerId) {
          await supabase.from("user_inventory").update({ listed_for_sale: false, sale_price_ae: null }).eq("user_id", sellerId).eq("item_id", itemId);
          const sellerCredit = Math.floor(price * 0.95);
          const { data: sp } = await supabase.from("profiles").select("ae").eq("id", sellerId).single();
          if (sp) await supabase.from("profiles").update({ ae: sp.ae + sellerCredit }).eq("id", sellerId);
        }
      }
    },

    // ── User mutations ──
    completeMission: (id, ae, xp) => {
      setCompletedMissions(s => new Set([...s, id]));
      setSharedUser(u => {
        let newXp = u.xp + xp;
        let newLevel = u.level;
        let newXpNext = u.xpNext;
        while (newXp >= newXpNext) {
          newXp -= newXpNext;
          newLevel += 1;
          newXpNext = Math.floor(newXpNext * 1.25);
        }
        return { ...u, ae: u.ae + ae, xp: newXp, level: newLevel, xpNext: newXpNext };
      });
      // Write to quest_progress table
      if (authUser) {
        const mission = sharedMissions.find(m => m.id === id);
        const targetVal = mission?.goal || 1;
        supabase.from("quest_progress").upsert({
          user_id: authUser.id, quest_definition_id: id,
          current_value: targetVal, target_value: targetVal,
          status: "completed", completed_at: new Date().toISOString(),
          period_start: new Date().toISOString(),
        }, { onConflict: "user_id,quest_definition_id", ignoreDuplicates: false }).then(() => {});
      }
    },
    purchaseItem: (id, price) => {
      setSharedUser(u => ({ ...u, ae: Math.max(0, u.ae - price) }));
      setSharedShopItems(is => is.map(i => i.id === id ? { ...i, sold:(i.sold||0)+1, owned: true } : i));
      // Write to Supabase
      if (authUser) {
        supabase.from("user_inventory").insert({ user_id: authUser.id, item_id: id }).then(() => {});
        supabase.from("shop_items").update({ sold: undefined }).eq("id", id).then(() => {
          // Increment sold via raw increment isn't available, so we fetch+update
          supabase.from("shop_items").select("sold").eq("id", id).single().then(({ data }) => {
            if (data) supabase.from("shop_items").update({ sold: data.sold + 1 }).eq("id", id).then(() => {});
          });
        });
      }
    },
    joinEvent: (id) => {
      setJoinedEvents(s => new Set([...s, id]));
      setSharedEvents(es => es.map(e => e.id === id ? { ...e, participants:(e.participants||0)+1 } : e));
      if (authUser) {
        supabase.from("event_participants").insert({ event_id: id, user_id: authUser.id }).then(() => {});
      }
    },
    joinClan: async (name, tag, color) => {
      // Find clan in database
      const dbClans = window.__zr_clans || [];
      const dbClan = dbClans.find(c => c.name === name);
      if (authUser && dbClan) {
        await supabase.from("clan_members").insert({ clan_id: dbClan.id, user_id: authUser.id, role: "member" });
        await supabase.from("profiles").update({ clan_id: dbClan.id }).eq("user_id", authUser.id);
        const { count } = await supabase.from("clan_members").select("id", { count: "exact", head: true }).eq("clan_id", dbClan.id);
        const clanZones = (window.__zr_zones || []).filter(z => z.captured_by === dbClan.id);
        setSharedUser(u => ({
          ...u,
          clan: {
            id: dbClan.id, name: dbClan.name, tag: dbClan.tag, motto: dbClan.motto, color: dbClan.color || color,
            founded: new Date(dbClan.founded_at).toLocaleDateString("en-GB", { month:"short", year:"numeric" }),
            memberRole: "Member", treasury: dbClan.treasury, weeklyXP: dbClan.weekly_xp,
            rank: dbClan.rank, cpr: Number(dbClan.cpr), zonesHeld: clanZones.length,
            totalMembers: count || 1, maxMembers: dbClan.max_members,
          }
        }));
      } else {
        // Fallback: mock join
        const existingClan = ENEMY_CLANS.find(c => c.name === name);
        const suggestedClan = SUGGESTED_CLANS.find(c => c.name === name);
        const memberCount = suggestedClan?.members || 8;
        setSharedUser(u => ({
          ...u,
          clan: { id:tag.toLowerCase(), name, tag, motto:"New member!", color, founded:"Mar 2026", memberRole:"Member", treasury:existingClan ? 8000 : 0, weeklyXP:existingClan ? 6000 : 0, rank:existingClan?.rank || 99, cpr:existingClan?.cpr || 0, zonesHeld:existingClan?.zones || 0, totalMembers:memberCount + 1, maxMembers:20 }
        }));
      }
    },
    leaveClan: async () => {
      if (authUser && sharedUser.clan?.id) {
        await supabase.from("clan_members").delete().eq("user_id", authUser.id).eq("clan_id", sharedUser.clan.id);
      }
      setSharedUser(u => ({ ...u, clan: null }));
      showToast("👋 You left the clan.", "info");
    },
    donateToClan: async (amount) => {
      const amt = Math.min(amount, sharedUser.ae);
      if (amt <= 0) return;
      setSharedUser(u => ({
        ...u,
        ae: u.ae - amt,
        clan: u.clan ? { ...u.clan, treasury: (u.clan.treasury || 0) + amt } : u.clan,
      }));
      showToast(`◎ Donated ${amt} AE to clan treasury!`, "success");
      if (authUser && sharedUser.clan?.id) {
        await supabase.from("clans").update({ treasury: (sharedUser.clan.treasury || 0) + amt }).eq("id", sharedUser.clan.id);
        await supabase.from("treasury_log").insert({
          clan_id: sharedUser.clan.id, type: "income", description: `Donation from ${sharedUser.name}`, amount: amt, created_by: authUser.id,
        });
      }
    },
    startZoneCapture: () => {
      showToast("📡 GPS lock acquired — capture sequence starting...", "info");
      // Simulate GPS lock + 3-minute countdown (compressed to 8 seconds for demo)
      setTimeout(() => {
        const success = Math.random() > 0.15; // 85% success rate
        if (success) {
          setSharedUser(u => {
            let newXp = u.xp + 100, newLevel = u.level, newXpNext = u.xpNext;
            while (newXp >= newXpNext) { newXp -= newXpNext; newLevel++; newXpNext = Math.floor(newXpNext * 1.25); }
            return { ...u, ae: u.ae + 50, xp: newXp, level: newLevel, xpNext: newXpNext };
          });
          showToast("📍 Zone captured! +50 AE +100 XP", "success");
        } else {
          showToast("⚠ Capture contested! Enemy reinforcements arrived — try again later.", "error");
        }
      }, 8000);
    },
    captureZone: () => {
      setSharedUser(u => {
        let newXp = u.xp + 100, newLevel = u.level, newXpNext = u.xpNext;
        while (newXp >= newXpNext) { newXp -= newXpNext; newLevel++; newXpNext = Math.floor(newXpNext * 1.25); }
        return { ...u, ae: u.ae + 50, xp: newXp, level: newLevel, xpNext: newXpNext };
      });
      showToast("📍 Zone captured! +50 AE +100 XP", "success");
    },
    defendZone: () => {
      showToast("🛡️ GPS lock verifying defense position...", "info");
      setTimeout(() => {
        setSharedUser(u => {
          let newXp = u.xp + 120, newLevel = u.level, newXpNext = u.xpNext;
          while (newXp >= newXpNext) { newXp -= newXpNext; newLevel++; newXpNext = Math.floor(newXpNext * 1.25); }
          return { ...u, ae: u.ae + 80, xp: newXp, level: newLevel, xpNext: newXpNext };
        });
        showToast("🛡️ Zone defended successfully! +80 AE +120 XP", "success");
      }, 4000);
    },

    // ── Admin mutations ──
    approveStyleSub: (id) => {
      setSharedStyleSubs(ss => ss.map(s => s.id === id ? { ...s, status:"approved", flagged:false } : s));
      setSharedStyleEvent(ev => {
        const sub = STYLE_SUBMISSIONS_INIT.find(s => s.id === id);
        if (!sub) return ev;
        if (ev.gallery.some(g => g.id === id)) return ev;
        return { ...ev, gallery: [...ev.gallery, { id, userName:sub.userName, title:sub.title, votes:sub.votes, isMine:false }] };
      });
    },
    rejectStyleSub: (id, reason) => {
      setSharedStyleSubs(ss => ss.map(s => s.id === id ? { ...s, status:"rejected", rejectReason:reason } : s));
      setSharedStyleEvent(ev => ({ ...ev, gallery: ev.gallery.filter(g => g.id !== id) }));
    },
    approveProof: (id) => {
      setSharedProofs(ps => ps.map(p => p.id===id ? { ...p, status:"approved" } : p));
      const proof = sharedProofs.find(p => p.id===id);
      if (proof) {
        setPlayerNotifs(ns => [...ns, { id:Date.now(), type:"reward", msg:`✓ "${proof.missionTitle}" approved! +${proof.reward} AE +${proof.xp} XP credited.` }]);
        setSharedUser(u => {
          let newXp = u.xp + proof.xp, newLevel = u.level, newXpNext = u.xpNext;
          while (newXp >= newXpNext) { newXp -= newXpNext; newLevel++; newXpNext = Math.floor(newXpNext * 1.25); }
          return { ...u, ae: u.ae + proof.reward, xp: newXp, level: newLevel, xpNext: newXpNext };
        });
        setCompletedMissions(s => new Set([...s, proof.missionId]));
        // Write to Supabase
        if (authUser) {
          supabase.from("proof_submissions").update({ status: "approved", reviewed_by: authUser.id, reviewed_at: new Date().toISOString() }).eq("id", id).then(() => {});
        }
      }
    },
    rejectProof: (id, reason) => {
      setSharedProofs(ps => ps.map(p => p.id===id ? { ...p, status:"rejected", rejectReason:reason } : p));
      const proof = sharedProofs.find(p => p.id===id);
      if (proof) setPlayerNotifs(ns => [...ns, { id:Date.now(), type:"rejected", msg:`⚠ "${proof.missionTitle}" rejected. Reason: ${reason || "See guidelines."}` }]);
      if (authUser) {
        supabase.from("proof_submissions").update({ status: "rejected", reject_reason: reason, reviewed_by: authUser.id, reviewed_at: new Date().toISOString() }).eq("id", id).then(() => {});
      }
    },
    setStylePhase: (phase) => {
      setSharedStyleEvent(ev => ({ ...ev, phase }));
      if (authUser) {
        supabase.from("style_events").update({ phase }).order("created_at", { ascending: false }).limit(1).then(() => {});
      }
    },
    toggleShopItem: (id) => {
      setSharedShopItems(is => is.map(i => i.id===id ? { ...i, active:!i.active } : i));
      if (authUser) {
        const item = sharedShopItems.find(i => i.id === id);
        if (item) supabase.from("shop_items").update({ active: !item.active }).eq("id", id).then(() => {});
      }
    },
    addShopItem: (item) => {
      setSharedShopItems(is => [...is, item]);
      if (authUser) {
        supabase.from("shop_items").insert({
          name: item.name, category: item.cat, price_ae: item.priceAE || item.price, rarity: item.rarity || "common",
          item_type: item.type || "general", icon: item.icon || "🎁", stock: item.stock, active: true,
          soul_bound: item.soulBound || false, featured: item.featured || false,
        }).then(() => {});
      }
    },
    toggleMission: (id) => setSharedMissions(ms => ms.map(m => m.id===id ? { ...m, _disabled:!m._disabled } : m)),
    addEvent: (ev) => {
      setSharedEvents(es => [...es, ev]);
      if (authUser) {
        supabase.from("events").insert({
          title: ev.title, type: ev.type || "territory", status: "active",
          description: ev.desc, reward: ev.reward, max_participants: ev.maxParticipants,
          eligibility: ev.eligibility, color: ev.color,
        }).then(() => {});
      }
    },
    endEvent: (id) => {
      setSharedEvents(es => es.filter(e => e.id!==id));
      if (authUser) {
        supabase.from("events").update({ status: "ended" }).eq("id", id).then(() => {});
      }
    },
    publishWinnerToShop: (sub) => {
      const newItem = { id:"c"+Date.now(), name:sub.title, cat:"cosmetic", price:200, priceAE:200, rarity:"epic", icon:"👗", owned:false, featured:true, type:"general", stock:null, sold:0, active:true, soulBound:false, designer:sub.userName, isWinner:true };
      setSharedShopItems(is => [...is, newItem]);
      setPlayerNotifs(ns => [...ns, { id:Date.now(), type:"shop", msg:`🏆 Style Event winner "${sub.title}" by ${sub.userName} is now in the Market!` }]);
      if (authUser) {
        supabase.from("shop_items").insert({
          name: sub.title, category: "cosmetic", price_ae: 200, rarity: "epic", icon: "👗",
          active: true, featured: true, community_designed: true, designer_name: sub.userName,
        }).then(() => {});
      }
    },
    submitProof: (proof) => {
      setSharedProofs(ps => [...ps, proof]);
      showToast(`📋 New proof queued for admin review`, "info");
      if (authUser) {
        supabase.from("proof_submissions").insert({
          user_id: authUser.id, mission_id: proof.missionId, note: proof.note, image_url: proof.imgUrl,
        }).then(() => {});
      }
    },
    warnPlayer: (name) => { showToast(`⚠ Warning issued to ${name}`, "warning"); },
    banPlayer: (name) => { showToast(`🚫 ${name} has been banned`, "error"); },
    createClan: async (name, tag, motto) => {
      if (authUser) {
        const { data: newClan, error } = await supabase.from("clans").insert({
          name, tag, motto: motto || "New clan!", color: TL, treasury: 0,
        }).select().single();
        if (newClan) {
          await supabase.from("clan_members").insert({ clan_id: newClan.id, user_id: authUser.id, role: "leader" });
          await supabase.from("profiles").update({ clan_id: newClan.id, ae: sharedUser.ae - 500 }).eq("user_id", authUser.id);
          setSharedUser(u => ({
            ...u, ae: u.ae - 500,
            clan: { id: newClan.id, name, tag, motto: motto || "New clan!", color: TL, founded: "Mar 2026", memberRole: "Leader", treasury: 0, weeklyXP: 0, rank: 99, cpr: 0, zonesHeld: 0, totalMembers: 1, maxMembers: 20 }
          }));
        } else {
          showToast(`❌ Clan creation failed: ${error?.message || "Unknown error"}`, "error");
        }
      } else {
        setSharedUser(u => ({
          ...u, ae: u.ae - 500,
          clan: { id:tag.toLowerCase(), name, tag, motto: motto || "New clan!", color:TL, founded:"Mar 2026", memberRole:"Leader", treasury:0, weeklyXP:0, rank:99, cpr:0, zonesHeld:0, totalMembers:1, maxMembers:20 }
        }));
      }
    },
    discoverClue: () => {
      setSharedUser(u => {
        let newXp = u.xp + 80, newLevel = u.level, newXpNext = u.xpNext;
        while (newXp >= newXpNext) { newXp -= newXpNext; newLevel++; newXpNext = Math.floor(newXpNext * 1.25); }
        return { ...u, ae: u.ae + 150, xp: newXp, level: newLevel, xpNext: newXpNext };
      });
      if (authUser) {
        supabase.from("story_progress").upsert({
          user_id: authUser.id, chapter: 1, clues_found: (sharedUser.storyClues || 0) + 1,
        }, { onConflict: "user_id,chapter" }).then(() => {});
      }
    },
  };

  if (!authUser) {
    return (
      <>
        <ToastContainer />
        <AuthScreen onAuth={(user) => setAuthUser(user)} />
      </>
    );
  }

  return (
    <AppContext.Provider value={appCtx}>
      <ToastContainer />
      <HomeScreen />
    </AppContext.Provider>
  );
}
