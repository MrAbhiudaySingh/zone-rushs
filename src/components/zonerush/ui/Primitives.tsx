// @ts-nocheck
import { useEffect } from "react";
import type { ChipProps, CardProps, SectionHeaderProps, ProgressBarProps, TabBarProps } from "../types";
import { BG, S1, BR, T, TL, TG, TA, TY, TR, TB, TX, TM, TD, FONT } from "../constants";

// ─── GLOBAL STYLES ─────────────────────────────────────────────────────────────
export function GlobalStyles() {
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

      @keyframes fadeUp { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
      @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
      @keyframes slideInRight { from { opacity:0; transform:translateX(32px); } to { opacity:1; transform:translateX(0); } }
      @keyframes bounceIn { 0% { opacity:0; transform:scale(0.6); } 60% { opacity:1; transform:scale(1.08); } 80% { transform:scale(0.96); } 100% { transform:scale(1); } }
      @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.7; transform:scale(1.15); } }
      @keyframes shimmer { 0% { transform:translateX(-100%); } 100% { transform:translateX(250%); } }
      @keyframes float { 0%,100% { transform:translateY(0px); } 50% { transform:translateY(-8px); } }
      @keyframes spin { to { transform:rotate(360deg); } }
      @keyframes contestPulse { 0%,100% { border-color:rgba(255,71,87,0.4); box-shadow:0 0 0 0 rgba(255,71,87,0.2); } 50% { border-color:rgba(255,71,87,0.9); box-shadow:0 0 0 6px rgba(255,71,87,0); } }
      @keyframes tealGlow { 0%,100% { box-shadow:0 0 20px rgba(0,201,177,0.3), 0 4px 24px rgba(0,0,0,0.4); } 50% { box-shadow:0 0 40px rgba(0,201,177,0.6), 0 4px 32px rgba(0,0,0,0.4); } }
      @keyframes streakBurn { 0%,100% { filter:drop-shadow(0 0 4px rgba(255,107,53,0.5)); } 50% { filter:drop-shadow(0 0 12px rgba(255,200,0,0.9)); } }
      @keyframes xpFill { from { width:0%; } to { width:var(--xp-width); } }
      @keyframes cardEntry { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      @keyframes orbFloat { 0% { transform:translate(0,0) scale(1); } 33% { transform:translate(20px,-15px) scale(1.05); } 66% { transform:translate(-10px,10px) scale(0.97); } 100% { transform:translate(0,0) scale(1); } }
      @keyframes tabSlide { from { opacity:0; transform:translateX(12px); } to { opacity:1; transform:translateX(0); } }
      @keyframes rewardPop { 0% { transform:scale(0) rotate(-10deg); opacity:0; } 60% { transform:scale(1.2) rotate(4deg); opacity:1; } 100% { transform:scale(1) rotate(0deg); opacity:1; } }

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

// Pill chip
export function Chip({ color, bg, icon, label, onClick, style }: ChipProps) {
  return (
    <div onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:5,
      padding:"7px 14px", borderRadius:99,
      background: bg || `${color}22`, border:`1.5px solid ${color}50`,
      fontSize:13, fontWeight:800, color,
      boxShadow:`0 2px 12px ${color}25`,
      ...(onClick ? { cursor:"pointer" } : {}), ...style,
    }}>
      {icon && <span style={{ fontSize:14 }}>{icon}</span>}
      <span>{label}</span>
    </div>
  );
}

// Card
export function Card({ children, style, accent, gradient, onClick, className }: CardProps) {
  return (
    <div onClick={onClick} className={className} style={{
      background: gradient || S1, border:`1.5px solid ${BR}`, borderRadius:22,
      padding:16, position:"relative", overflow:"hidden",
      ...(onClick ? { cursor:"pointer" } : {}),
      ...(accent ? { borderTop:`3px solid ${accent}`, boxShadow:`0 4px 24px ${accent}18` } : {}),
      ...style,
    }}>
      {children}
    </div>
  );
}

// Section header
export function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
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

// Progress bar with shimmer
export function ProgressBar({ value, max, color, height=6 }: ProgressBarProps) {
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

// Tab bar
export function TabBar({ tabs, active, onSelect, style }: TabBarProps) {
  return (
    <div style={{
      display:"flex", gap:4,
      background:"rgba(255,255,255,0.04)", borderRadius:16, padding:4,
      border:`1.5px solid ${BR}`, ...style,
    }}>
      {tabs.map(([id, label, badge]: [string, string, number?]) => (
        <button key={id} onClick={() => onSelect(id)} style={{
          flex:1, padding:"9px 4px", borderRadius:12, border:"none",
          background: active===id ? `linear-gradient(135deg, ${T}CC, ${TL}AA)` : "none",
          color: active===id ? "#0D1117" : TM,
          fontSize:13, fontWeight: active===id ? 900 : 600,
          display:"flex", alignItems:"center", justifyContent:"center", gap:6,
          boxShadow: active===id ? `0 4px 16px ${T}40` : "none",
          transition:"all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
          transform: active===id ? "scale(1.02)" : "scale(1)",
        }}>
          {label}
          {(badge ?? 0) > 0 && (
            <span style={{ background:TR, color:"#fff", fontSize:9, fontWeight:900, borderRadius:99, minWidth:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 4px" }}>
              {badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
