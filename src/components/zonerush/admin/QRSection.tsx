// @ts-nocheck
// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN — QR CODE GENERATOR
// Lets admins generate QR codes for events that grant XP, AE, Shards, or
// avatar items (clothing, weapons, shields, helmets, capes — anything from
// ITEM_CATALOG, including event-only cosmetics).
//
// Each QR shows:
//   - Total scan attempts (success or failure)
//   - Total claims (successful redemptions)
//   - Success rate
//
// Each QR has Download PNG and Print buttons so admins can produce printable
// posters for events.
//
// Required npm: qrcode
//   npm install qrcode
//
// Required SQL: see migrations/v5_qr_admin.sql in the patch README.
// ═══════════════════════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "../toast";
import {
  ITEM_CATALOG, EVENT_ITEMS, SHOP_ITEMS,
  T, TG, TA, TY, TR,
} from "../constants";

// Local admin design tokens (mirrors the AA palette in AdminDashboard so this
// section sits visually inside the dashboard without exporting AA from there)
const C = { bg:"#060A10", s1:"#0A0F1C", s2:"#0F1828", br:"#14203A", tx:"#C8D8E8", dim:"#445566", teal:T, amber:TA, red:TR, green:TG };
const FONT = "'IBM Plex Sans',system-ui,sans-serif";
const MONO = "'IBM Plex Mono',monospace";

// ─── Helpers ────────────────────────────────────────────────────────────────
const REWARD_TYPES = [
  { id:"ae",          label:"💎 AE (Aether)",  numeric:true,  desc:"In-game currency reward" },
  { id:"xp",          label:"⚡ XP",            numeric:true,  desc:"Experience points reward" },
  { id:"shards",      label:"🔷 Shards",        numeric:true,  desc:"Rare prestige currency" },
  { id:"avatar_item", label:"👕 Avatar Item",   numeric:false, desc:"Clothing, weapon, helmet, etc." },
];

function genToken(eventTag: string, idx: number) {
  const slug = (eventTag || "evt").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "evt";
  const rand = Math.random().toString(36).slice(2, 8);
  return `zr-${slug}-${String(idx).padStart(3, "0")}-${rand}`;
}

// ─── MAIN SECTION ───────────────────────────────────────────────────────────
export function QRSection() {
  const [qrs, setQrs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [qrRes, evRes] = await Promise.all([
        // We join to the redemption count (live) and the scan-attempt count
        supabase.from("event_qr_codes")
          .select("id, event_id, token, reward_type, reward_value_int, reward_value_text, reward_label, valid_from, valid_until, max_redemptions, redeemed_count, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("events").select("id, title, qr_enabled, date_start, date_end").order("date_start", { ascending: true }),
      ]);
      setQrs(qrRes.data || []);
      setEvents(evRes.data || []);
    } catch (e: any) {
      showToast(`Failed to load: ${e.message}`, "error");
    }
    setLoading(false);
  };

  // Fetch scan-attempt counts for every QR (separate query to keep the join simple)
  const [attemptCounts, setAttemptCounts] = useState<Record<string, { total: number; success: number }>>({});
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (qrs.length === 0) return;
    (async () => {
      try {
        const { data } = await supabase
          .from("event_qr_scan_attempts")
          .select("qr_code_id, outcome");
        const map: Record<string, { total: number; success: number }> = {};
        (data || []).forEach((row: any) => {
          if (!row.qr_code_id) return;
          if (!map[row.qr_code_id]) map[row.qr_code_id] = { total: 0, success: 0 };
          map[row.qr_code_id].total += 1;
          if (row.outcome === "success") map[row.qr_code_id].success += 1;
        });
        setAttemptCounts(map);
      } catch {}
    })();
  }, [qrs.length]);

  return (
    <div style={{ background: C.s1, border:`1px solid ${C.br}`, borderRadius: 8, padding: 18 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: C.dim, fontWeight: 700, fontFamily: MONO, letterSpacing:"0.08em" }}>EVENT QR CODES</div>
          <div style={{ fontSize: 18, color: C.tx, fontWeight: 700, fontFamily: FONT, marginTop: 4 }}>QR Generator</div>
          <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>{qrs.length} QR codes · scans + claims tracked per code</div>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ padding:"10px 16px", borderRadius: 6, background:`linear-gradient(135deg, ${C.teal}, #0088BB)`, border:"none", color:"#050810", fontFamily: FONT, fontSize: 12, fontWeight: 700, cursor:"pointer" }}>+ Generate New QR</button>
      </div>

      {loading && <div style={{ textAlign:"center", padding:"40px 20px", color: C.dim, fontSize: 12 }}>Loading…</div>}

      {!loading && qrs.length === 0 && (
        <div style={{ textAlign:"center", padding:"50px 20px", color: C.dim, border:`1px dashed ${C.br}`, borderRadius: 6 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📱</div>
          <div style={{ fontSize: 14, color: C.tx, fontWeight: 700, marginBottom: 6 }}>No QR codes yet</div>
          <div style={{ fontSize: 12 }}>Generate a QR to give out event-specific rewards</div>
        </div>
      )}

      {!loading && qrs.length > 0 && (
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontFamily: FONT, fontSize: 12 }}>
            <thead>
              <tr style={{ background: C.s2 }}>
                {["Token", "Reward", "Event", "Claims", "Scans", "Success", "Created", "Actions"].map(h => (
                  <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize: 11, color: C.dim, fontWeight: 700, fontFamily: MONO, letterSpacing:"0.05em", borderBottom:`1px solid ${C.br}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {qrs.map((q: any) => {
                const ev = events.find((e: any) => e.id === q.event_id);
                const ac = attemptCounts[q.id] || { total: 0, success: 0 };
                // Total scans = unique attempts. We also include pure database
                // redeemed_count as the lower-bound for "successful claims".
                const claims = q.redeemed_count || 0;
                const scans = ac.total;
                const successRate = scans > 0 ? Math.round((ac.success / scans) * 100) : (claims > 0 ? 100 : 0);
                return (
                  <tr key={q.id} style={{ borderBottom:`1px solid ${C.br}` }}>
                    <td style={{ padding:"10px 12px", fontFamily: MONO, fontSize: 11, color: C.tx, maxWidth: 220, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{q.token}</td>
                    <td style={{ padding:"10px 12px", color: C.tx }}>{q.reward_label || rewardSummary(q)}</td>
                    <td style={{ padding:"10px 12px", color: C.dim, fontSize: 11 }}>{ev?.title || "—"}</td>
                    <td style={{ padding:"10px 12px", fontFamily: MONO, color: C.green, fontWeight: 700 }}>{claims}{q.max_redemptions ? `/${q.max_redemptions}` : ""}</td>
                    <td style={{ padding:"10px 12px", fontFamily: MONO, color: C.tx }}>{scans}</td>
                    <td style={{ padding:"10px 12px", fontFamily: MONO, color: successRate >= 80 ? C.green : successRate >= 50 ? C.amber : C.red }}>{scans > 0 ? `${successRate}%` : "—"}</td>
                    <td style={{ padding:"10px 12px", color: C.dim, fontSize: 11 }}>{q.created_at ? new Date(q.created_at).toLocaleDateString() : "—"}</td>
                    <td style={{ padding:"10px 12px" }}>
                      <button onClick={() => setViewing(q)} style={{ padding:"5px 10px", borderRadius: 4, background:`${C.teal}15`, border:`1px solid ${C.teal}40`, color: C.teal, fontFamily: FONT, fontSize: 11, fontWeight: 700, cursor:"pointer" }}>📥 View / Download</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <CreateQRModal events={events} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
      {viewing && <ViewQRModal qr={viewing} eventTitle={events.find((e: any) => e.id === viewing.event_id)?.title} onClose={() => setViewing(null)} />}
    </div>
  );
}

function rewardSummary(q: any) {
  if (q.reward_type === "ae")          return `+${(q.reward_value_int || 0).toLocaleString()} AE`;
  if (q.reward_type === "xp")          return `+${(q.reward_value_int || 0).toLocaleString()} XP`;
  if (q.reward_type === "shards")      return `+${(q.reward_value_int || 0).toLocaleString()} Shards`;
  if (q.reward_type === "avatar_item") return q.reward_value_text || "Avatar item";
  if (q.reward_type === "consumable")  return q.reward_value_text || "Consumable";
  return q.reward_type || "?";
}

// ─── CREATE MODAL ───────────────────────────────────────────────────────────
function CreateQRModal({ events, onClose, onCreated }: any) {
  const [eventId, setEventId] = useState<string>("");
  const [rewardType, setRewardType] = useState<string>("ae");
  const [rewardValueInt, setRewardValueInt] = useState<string>("100");
  const [rewardItemId, setRewardItemId] = useState<string>(EVENT_ITEMS[0]?.id || ITEM_CATALOG[0]?.id || "");
  const [rewardLabel, setRewardLabel] = useState<string>("");
  const [maxRedemptions, setMaxRedemptions] = useState<string>("");
  const [validUntil, setValidUntil] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Auto-generate the token when event changes
  useEffect(() => {
    if (!token) {
      const ev = events.find((e: any) => e.id === eventId);
      setToken(genToken(ev?.title || "", 1));
    }
  }, [eventId]);

  // Auto-fill reward label
  useEffect(() => {
    if (rewardType === "avatar_item") {
      const it = ITEM_CATALOG.find((i: any) => i.id === rewardItemId);
      if (it) setRewardLabel(it.name);
    } else {
      const meta = REWARD_TYPES.find(r => r.id === rewardType);
      if (meta) setRewardLabel(`${rewardValueInt || 0} ${meta.label.replace(/^[^ ]+ /, "")}`);
    }
  }, [rewardType, rewardItemId, rewardValueInt]);

  const handleCreate = async () => {
    if (!token.trim()) { showToast("⚠ Token is required", "error"); return; }
    if (!eventId) { showToast("⚠ Pick an event first", "error"); return; }
    const meta = REWARD_TYPES.find(r => r.id === rewardType);
    if (meta?.numeric && (!rewardValueInt || parseInt(rewardValueInt) <= 0)) {
      showToast("⚠ Reward amount must be positive", "error"); return;
    }
    if (!meta?.numeric && !rewardItemId) {
      showToast("⚠ Pick an item to award", "error"); return;
    }

    setSubmitting(true);
    try {
      const row: any = {
        event_id: eventId,
        token: token.trim(),
        reward_type: rewardType,
        reward_label: rewardLabel.trim() || rewardSummary({ reward_type: rewardType, reward_value_int: rewardValueInt, reward_value_text: rewardItemId }),
        max_redemptions: maxRedemptions ? parseInt(maxRedemptions) : null,
        valid_until: validUntil || null,
      };
      if (meta?.numeric) row.reward_value_int = parseInt(rewardValueInt);
      else row.reward_value_text = rewardItemId;

      const { error } = await supabase.from("event_qr_codes").insert(row);
      if (error) throw error;
      showToast(`✓ QR generated — token: ${token.slice(0, 30)}…`, "success");
      onCreated();
    } catch (e: any) {
      showToast(`❌ ${e.message || "Generation failed"}`, "error");
    }
    setSubmitting(false);
  };

  const meta = REWARD_TYPES.find(r => r.id === rewardType);

  return (
    <div onClick={onClose} style={{ position:"fixed", inset: 0, zIndex: 200, background:"rgba(6,10,16,0.85)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.s1, border:`1px solid ${C.br}`, borderRadius: 6, maxWidth: 560, width:"100%", maxHeight:"90vh", overflowY:"auto", fontFamily: FONT }}>
        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.br}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize: 14, color: C.tx, fontWeight: 700 }}>Generate New QR Code</div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 4, background:"rgba(255,255,255,0.05)", border:`1px solid ${C.br}`, color: C.tx, fontSize: 12, cursor:"pointer" }}>✕</button>
        </div>

        <div style={{ padding: 20, display:"flex", flexDirection:"column", gap: 14 }}>
          {/* Event */}
          <Field label="Event">
            <select value={eventId} onChange={e => setEventId(e.target.value)} style={fieldInputStyle}>
              <option value="">— Select an event —</option>
              {events.map((e: any) => <option key={e.id} value={e.id}>{e.title}{e.qr_enabled === false ? " (QR disabled)" : ""}</option>)}
            </select>
          </Field>

          {/* Reward type buttons */}
          <Field label="Reward Type">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 8 }}>
              {REWARD_TYPES.map(r => (
                <button key={r.id} onClick={() => setRewardType(r.id)} style={{
                  padding:"10px 12px", borderRadius: 4,
                  background: rewardType === r.id ? `${C.teal}20` : "rgba(255,255,255,0.03)",
                  border:`1px solid ${rewardType === r.id ? C.teal : C.br}`,
                  color: rewardType === r.id ? C.tx : C.dim,
                  fontFamily: FONT, fontSize: 12, fontWeight: 700, cursor:"pointer", textAlign:"left",
                }}>
                  <div>{r.label}</div>
                  <div style={{ fontSize: 10, color: C.dim, fontWeight: 400, marginTop: 2 }}>{r.desc}</div>
                </button>
              ))}
            </div>
          </Field>

          {/* Reward value */}
          {meta?.numeric ? (
            <Field label={`${meta.label.replace(/^[^ ]+ /, "")} Amount`}>
              <input type="number" min="1" value={rewardValueInt} onChange={e => setRewardValueInt(e.target.value)} placeholder="e.g. 100" style={fieldInputStyle} />
            </Field>
          ) : (
            <Field label="Choose Item">
              <select value={rewardItemId} onChange={e => setRewardItemId(e.target.value)} style={fieldInputStyle}>
                <optgroup label="Event-only cosmetics">
                  {EVENT_ITEMS.map((i: any) => <option key={i.id} value={i.id}>{i.name} — {i.rarity}</option>)}
                </optgroup>
                <optgroup label="Shop items (also available for purchase)">
                  {SHOP_ITEMS.filter((i: any) => i.cat !== "consumable").map((i: any) => <option key={i.id} value={i.id}>{i.name} — {i.rarity}</option>)}
                </optgroup>
                <optgroup label="Consumables">
                  {SHOP_ITEMS.filter((i: any) => i.cat === "consumable").map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </optgroup>
              </select>
              {(() => {
                const it = ITEM_CATALOG.find((i: any) => i.id === rewardItemId);
                if (!it) return null;
                return (
                  <div style={{ marginTop: 8, padding: 10, background: C.s2, border:`1px solid ${C.br}`, borderRadius: 4, display:"flex", alignItems:"center", gap: 10 }}>
                    {it.img ? (
                      <img src={it.img} alt={it.name} style={{ width: 48, height: 48, imageRendering:"pixelated", background:"rgba(255,255,255,0.04)", borderRadius: 4 }} />
                    ) : (
                      <div style={{ width: 48, height: 48, fontSize: 28, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.04)", borderRadius: 4 }}>{it.icon}</div>
                    )}
                    <div>
                      <div style={{ fontSize: 12, color: C.tx, fontWeight: 700 }}>{it.name}</div>
                      <div style={{ fontSize: 10, color: C.dim }}>{it.cat} · {it.rarity}{it.eventOnly ? " · event-only" : ""}</div>
                    </div>
                  </div>
                );
              })()}
            </Field>
          )}

          {/* Reward label */}
          <Field label="Display Label" hint="What players see when they redeem">
            <input value={rewardLabel} onChange={e => setRewardLabel(e.target.value)} maxLength={100} style={fieldInputStyle} />
          </Field>

          {/* Max redemptions / valid until */}
          <div style={{ display:"flex", gap: 12 }}>
            <Field label="Max Redemptions" hint="Blank = unlimited" style={{ flex: 1 }}>
              <input type="number" min="1" value={maxRedemptions} onChange={e => setMaxRedemptions(e.target.value)} placeholder="∞" style={fieldInputStyle} />
            </Field>
            <Field label="Valid Until" hint="Blank = no expiry" style={{ flex: 1 }}>
              <input type="datetime-local" value={validUntil} onChange={e => setValidUntil(e.target.value)} style={fieldInputStyle} />
            </Field>
          </div>

          {/* Token */}
          <Field label="QR Token" hint="Encoded in the QR. Auto-generated; edit if you want a custom one.">
            <div style={{ display:"flex", gap: 8 }}>
              <input value={token} onChange={e => setToken(e.target.value)} maxLength={120} style={{ ...fieldInputStyle, flex: 1, fontFamily: MONO }} />
              <button onClick={() => setToken(genToken(events.find((e: any) => e.id === eventId)?.title || "", Math.floor(Math.random() * 999) + 1))} style={{ padding:"0 14px", borderRadius: 4, background: C.s2, border:`1px solid ${C.br}`, color: C.tx, fontFamily: FONT, fontSize: 11, fontWeight: 700, cursor:"pointer" }}>🎲 Random</button>
            </div>
          </Field>

          {/* Actions */}
          <div style={{ display:"flex", gap: 10, marginTop: 6 }}>
            <button onClick={onClose} style={{ flex: 1, padding:"11px", borderRadius: 4, background:"rgba(255,255,255,0.04)", border:`1px solid ${C.br}`, color: C.tx, fontFamily: FONT, fontSize: 12, fontWeight: 700, cursor:"pointer" }}>Cancel</button>
            <button onClick={handleCreate} disabled={submitting} style={{ flex: 2, padding:"11px", borderRadius: 4, background: submitting ? C.dim : `linear-gradient(135deg, ${C.teal}, #0088BB)`, border:"none", color:"#050810", fontFamily: FONT, fontSize: 12, fontWeight: 700, cursor: submitting ? "wait" : "pointer" }}>{submitting ? "Generating…" : "✓ Generate QR"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const fieldInputStyle: any = { width:"100%", padding:"10px 12px", background: C.s2, border:`1px solid ${C.br}`, borderRadius: 4, color: C.tx, fontSize: 12, fontFamily: FONT, boxSizing:"border-box" };

function Field({ label, hint, children, style }: any) {
  return (
    <div style={style}>
      <div style={{ fontSize: 10, color: C.dim, fontWeight: 700, fontFamily: MONO, letterSpacing:"0.06em", marginBottom: 4 }}>{label.toUpperCase()}</div>
      {children}
      {hint && <div style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

// ─── VIEW / DOWNLOAD MODAL ──────────────────────────────────────────────────
function ViewQRModal({ qr, eventTitle, onClose }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const QRCode = (await import("qrcode")).default;
        if (cancelled || !canvasRef.current) return;
        await QRCode.toCanvas(canvasRef.current, qr.token, {
          width: 480,
          margin: 2,
          errorCorrectionLevel: "H",
          color: { dark: "#0D1117", light: "#FFFFFF" },
        });
      } catch (e: any) {
        if (!cancelled) setRenderError("QR library missing. Run: npm install qrcode");
      }
    })();
    return () => { cancelled = true; };
  }, [qr.token]);

  const downloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) { showToast("QR not ready", "error"); return; }
    canvas.toBlob((blob: any) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr-${qr.token}.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("📥 QR downloaded", "success");
    }, "image/png");
  };

  const printQR = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const w = window.open("", "_blank", "width=720,height=900");
    if (!w) { showToast("Popup blocked — allow popups to print", "error"); return; }
    const labelHtml = qr.reward_label || qr.token;
    const eventLine = eventTitle ? `<div style="font-size:14px;color:#666;margin-bottom:4px;">${escapeHtml(eventTitle)}</div>` : "";
    w.document.write(`
      <!doctype html><html><head><title>ZoneRush QR — ${escapeHtml(qr.token)}</title>
      <style>
        body{font-family:Arial,sans-serif;text-align:center;padding:40px 24px;}
        h1{font-size:22px;margin:0 0 8px;}
        img{display:block;margin:24px auto;width:480px;height:480px;image-rendering:pixelated;}
        .token{font-family:monospace;font-size:11px;color:#666;margin-top:8px;}
        .reward{font-size:18px;color:#0E7C66;font-weight:bold;margin:12px 0 4px;}
        @media print{button{display:none;}}
      </style></head><body>
      <h1>ZoneRush — Scan to Redeem</h1>
      ${eventLine}
      <div class="reward">${escapeHtml(labelHtml)}</div>
      <img src="${dataUrl}" alt="QR code" />
      <div class="token">${escapeHtml(qr.token)}</div>
      <p style="font-size:12px;color:#888;margin-top:24px;">Open ZoneRush → Quests → Events → Scan QR</p>
      <button onclick="window.print()" style="margin-top:18px;padding:10px 24px;font-size:14px;cursor:pointer;">Print this page</button>
      </body></html>
    `);
    w.document.close();
  };

  const claims = qr.redeemed_count || 0;
  const cap = qr.max_redemptions;

  return (
    <div onClick={onClose} style={{ position:"fixed", inset: 0, zIndex: 200, background:"rgba(6,10,16,0.85)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.s1, border:`1px solid ${C.br}`, borderRadius: 6, maxWidth: 560, width:"100%", maxHeight:"90vh", overflowY:"auto", fontFamily: FONT }}>
        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.br}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize: 14, color: C.tx, fontWeight: 700 }}>{qr.reward_label || rewardSummary(qr)}</div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{eventTitle || "—"}</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 4, background:"rgba(255,255,255,0.05)", border:`1px solid ${C.br}`, color: C.tx, fontSize: 12, cursor:"pointer" }}>✕</button>
        </div>

        <div style={{ padding: 24, display:"flex", flexDirection:"column", alignItems:"center", gap: 16 }}>
          {renderError ? (
            <div style={{ padding: 24, color: C.red, fontSize: 12, fontFamily: MONO, textAlign:"center" }}>{renderError}</div>
          ) : (
            <div style={{ padding: 14, background:"#FFFFFF", borderRadius: 6 }}>
              <canvas ref={canvasRef} style={{ display:"block", imageRendering:"pixelated" }} />
            </div>
          )}

          <div style={{ fontSize: 11, color: C.dim, fontFamily: MONO, textAlign:"center", wordBreak:"break-all", padding:"0 16px" }}>{qr.token}</div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap: 8, width:"100%" }}>
            <Stat label="Claims"  value={`${claims}${cap ? `/${cap}` : ""}`} color={C.green} />
            <Stat label="Limit"   value={cap ? `${cap}` : "∞"} color={C.tx} />
            <Stat label="Status"  value={qr.valid_until && new Date(qr.valid_until) < new Date() ? "Expired" : "Active"} color={qr.valid_until && new Date(qr.valid_until) < new Date() ? C.red : C.green} />
          </div>

          <div style={{ display:"flex", gap: 10, width:"100%" }}>
            <button onClick={downloadPNG} disabled={!!renderError} style={{ flex: 1, padding:"11px", borderRadius: 4, background: renderError ? C.dim : `linear-gradient(135deg, ${C.teal}, #0088BB)`, border:"none", color:"#050810", fontFamily: FONT, fontSize: 12, fontWeight: 700, cursor: renderError ? "not-allowed" : "pointer" }}>📥 Download PNG</button>
            <button onClick={printQR} disabled={!!renderError} style={{ flex: 1, padding:"11px", borderRadius: 4, background:"rgba(255,255,255,0.04)", border:`1px solid ${C.br}`, color: C.tx, fontFamily: FONT, fontSize: 12, fontWeight: 700, cursor: renderError ? "not-allowed" : "pointer" }}>🖨️ Print Page</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: any) {
  return (
    <div style={{ background: C.s2, border:`1px solid ${C.br}`, borderRadius: 4, padding: 10, textAlign:"center" }}>
      <div style={{ fontSize: 10, color: C.dim, fontWeight: 700, fontFamily: MONO, letterSpacing:"0.05em" }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 16, color, fontWeight: 700, fontFamily: MONO, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, (c: any) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
