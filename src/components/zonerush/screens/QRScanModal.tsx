// @ts-nocheck
// ═══════════════════════════════════════════════════════════════════════════════
// QR SCAN MODAL — for redeeming event-specific QR rewards
// Uses the `qr-scanner` npm package (lightweight wrapper around jsQR).
//
//   Install: npm install qr-scanner
//
// If camera access fails (no permission, no camera, library not loaded), users
// can paste the token text manually as a fallback. This matters at busy events
// where lighting or angle prevents a clean scan.
// ═══════════════════════════════════════════════════════════════════════════════
import { useEffect, useRef, useState, useContext } from "react";
import { AppContext } from "../AppContext";
import { showToast } from "../toast";
import { redeemEventQR } from "@/server/events";
import { BG, S1, S2, BR, T, TG, TA, TR, TX, TM, FONT, MONO, ITEM_CATALOG } from "../constants";

interface QRScanModalProps { event: any; onClose: () => void; }

export function QRScanModal({ event, onClose }: QRScanModalProps) {
  const ctx = useContext(AppContext);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<any>(null);
  const [mode, setMode] = useState<"scan"|"manual"|"reward"|"error">("scan");
  const [manualToken, setManualToken] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reward, setReward] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef<Set<string>>(new Set());

  // Lazy-load the qr-scanner library + start the camera
  useEffect(() => {
    if (mode !== "scan" || !videoRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const QrScanner = (await import("qr-scanner")).default;
        if (cancelled || !videoRef.current) return;
        const scanner = new QrScanner(
          videoRef.current,
          (result: any) => {
            const txt = (result?.data || "").trim();
            if (!txt || submittedRef.current.has(txt)) return;
            submittedRef.current.add(txt);
            handleSubmit(txt);
          },
          { highlightScanRegion: true, highlightCodeOutline: true, returnDetailedScanResult: true }
        );
        scannerRef.current = scanner;
        await scanner.start();
      } catch (err: any) {
        if (cancelled) return;
        console.error("QR scanner failed:", err);
        setErrorMsg("Camera unavailable. You can enter the token manually.");
        setMode("manual");
      }
    })();
    return () => {
      cancelled = true;
      try { scannerRef.current?.stop(); scannerRef.current?.destroy(); } catch {}
      scannerRef.current = null;
    };
  }, [mode]);

  const handleSubmit = async (token: string) => {
    if (submitting) return;
    if (!ctx?.authUser?.id) { showToast("⚠ Sign in required to redeem", "error"); return; }
    setSubmitting(true);
    try { scannerRef.current?.stop(); } catch {}
    try {
      const r: any = await redeemEventQR({ data: { token } });
      if (!r?.ok) {
        const codeMap: any = {
          unknown_token:    "This QR isn't recognised. Make sure you scanned the right code.",
          not_yet_active:   "This QR isn't active yet. Try again when the event opens.",
          expired:          "This QR has expired.",
          sold_out:         "All redemptions of this QR have been claimed.",
          already_redeemed: "You've already claimed this QR.",
          invalid_token:    "Token is invalid.",
        };
        setErrorMsg(codeMap[r?.error] || `Redemption failed: ${r?.error || "unknown"}`);
        setMode("error");
        submittedRef.current.delete(token); // allow retry of a different code
        setSubmitting(false);
        return;
      }
      setReward(r);
      setMode("reward");
      // Reflect the reward in shared user state so balances update without refresh.
      if (ctx?.setSharedUser) {
        ctx.setSharedUser((u: any) => {
          if (!u) return u;
          if (r.reward_type === "xp")     return { ...u, xp:     (u.xp     || 0) + (r.reward_value_int || 0) };
          if (r.reward_type === "ae")     return { ...u, ae:     (u.ae     || 0) + (r.reward_value_int || 0) };
          if (r.reward_type === "shards") return { ...u, shards: (u.shards || 0) + (r.reward_value_int || 0) };
          return u;
        });
      }
      // For item rewards, mark the item as owned so it shows up in the
      // Inventory tab AND in the Avatar Studio's owned-items list.
      if ((r.reward_type === "avatar_item" || r.reward_type === "consumable") && r.reward_value_text) {
        // Persist redemption locally so it survives reloads (DB user_inventory only
        // accepts uuid item_ids; event sprite items use string ids and are skipped server-side).
        try {
          const key = `zr_redeemed_${ctx.authUser.id}`;
          const raw = localStorage.getItem(key);
          const list: string[] = raw ? JSON.parse(raw) : [];
          if (!list.includes(r.reward_value_text)) {
            list.push(r.reward_value_text);
            localStorage.setItem(key, JSON.stringify(list));
          }
        } catch {}
      }
      if ((r.reward_type === "avatar_item" || r.reward_type === "consumable") && r.reward_value_text && ctx?.setSharedShopItems) {
        ctx.setSharedShopItems((items: any[]) => {
          const itemId = r.reward_value_text;
          const exists = items.some((i: any) => i.id === itemId);
          if (exists) {
            return items.map((i: any) => i.id === itemId ? { ...i, owned: true } : i);
          }
          // Item came from the event-only catalog (not yet in sharedShopItems) — append it
          // with its full catalog metadata (img/icon/rarity) so the inventory tile and
          // avatar studio see the proper sprite instead of a placeholder.
          const catalogEntry = ITEM_CATALOG.find((it: any) => it.id === itemId) || {};
          return [...items, {
            id: itemId,
            name: catalogEntry.name || r.reward_label || itemId,
            cat: catalogEntry.cat || "cosmetic",
            price: 0, priceAE: 0,
            rarity: catalogEntry.rarity || "rare",
            img: catalogEntry.img,
            icon: catalogEntry.icon || "🎁",
            avatarSlot: catalogEntry.avatarSlot,
            weaponType: catalogEntry.weaponType,
            owned: true,
            featured: false,
            type: "general",
            stock: null, sold: 0, active: true, soulBound: true,
            eventOnly: true,
          }];
        });
      }
      showToast(`🎁 Redeemed: ${r.reward_label || r.reward_type}`, "success");
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Network error. Try again in a moment.");
      setMode("error");
      submittedRef.current.delete(token);
    }
    setSubmitting(false);
  };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:400, background:"rgba(13,17,23,0.92)", backdropFilter:"blur(16px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:S1, border:`1px solid ${BR}`, borderRadius:20, maxWidth:420, width:"100%", overflow:"hidden", fontFamily:FONT }}>
        <div style={{ padding:"16px 18px", borderBottom:`1px solid ${BR}`, display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:11, color:T, fontWeight:900, letterSpacing:"0.6px", textTransform:"uppercase", marginBottom:2 }}>Event QR</div>
            <div style={{ fontSize:15, fontWeight:800, color:TX, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{event?.title || "Event"}</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ width:32, height:32, borderRadius:10, background:"rgba(255,255,255,0.06)", border:`1px solid ${BR}`, color:TX, fontSize:14, cursor:"pointer", fontFamily:FONT }}>✕</button>
        </div>

        {mode === "scan" && (
          <div style={{ padding:18 }}>
            <div style={{ position:"relative", aspectRatio:"1 / 1", background:"#000", borderRadius:14, overflow:"hidden", marginBottom:12 }}>
              <video ref={videoRef} style={{ width:"100%", height:"100%", objectFit:"cover" }} muted playsInline />
              <div style={{ position:"absolute", inset:"50% 14% auto 14%", height:"72%", marginTop:"-36%", border:`2px solid ${T}`, borderRadius:12, pointerEvents:"none", boxShadow:`0 0 0 9999px rgba(0,0,0,0.35)` }} />
              <div style={{ position:"absolute", left:0, right:0, bottom:10, textAlign:"center", color:"#fff", fontSize:12, textShadow:"0 1px 4px rgba(0,0,0,0.6)" }}>
                Hold the QR steady inside the frame
              </div>
            </div>
            <div style={{ fontSize:12, color:TM, lineHeight:1.5, marginBottom:12 }}>
              Point your camera at the event's QR code. Scanning starts automatically.
            </div>
            <button onClick={() => { try { scannerRef.current?.stop(); } catch {} setMode("manual"); }} style={{ width:"100%", padding:"11px", borderRadius:12, background:"rgba(255,255,255,0.04)", border:`1px solid ${BR}`, color:TX, fontSize:12, fontWeight:700, fontFamily:FONT, cursor:"pointer" }}>Or enter token manually</button>
          </div>
        )}

        {mode === "manual" && (
          <div style={{ padding:18 }}>
            <div style={{ fontSize:13, color:TX, fontWeight:700, marginBottom:8 }}>Enter event token</div>
            <div style={{ fontSize:12, color:TM, lineHeight:1.5, marginBottom:12 }}>The event organisers can read out a token if camera scanning isn't working for you.</div>
            <input value={manualToken} onChange={e => setManualToken(e.target.value)} placeholder="e.g. zr-techfest-stage-001" maxLength={200} autoFocus style={{ width:"100%", padding:"11px 14px", background:"rgba(255,255,255,0.04)", border:`1px solid ${BR}`, borderRadius:12, color:TX, fontSize:13, fontFamily:MONO, marginBottom:12, boxSizing:"border-box" }} />
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setMode("scan")} style={{ flex:1, padding:"11px", borderRadius:12, background:"rgba(255,255,255,0.04)", border:`1px solid ${BR}`, color:TX, fontSize:12, fontWeight:700, fontFamily:FONT, cursor:"pointer" }}>← Back to scan</button>
              <button onClick={() => manualToken.trim() && handleSubmit(manualToken.trim())} disabled={!manualToken.trim() || submitting} style={{ flex:2, padding:"11px", borderRadius:12, background: manualToken.trim() && !submitting ? `linear-gradient(135deg, ${T}, ${TG})` : "rgba(255,255,255,0.05)", border: manualToken.trim() && !submitting ? "none" : `1px solid ${BR}`, color: manualToken.trim() && !submitting ? "#0D1117" : TM, fontSize:13, fontWeight:800, fontFamily:FONT, cursor: manualToken.trim() && !submitting ? "pointer" : "not-allowed" }}>{submitting ? "Redeeming…" : "Redeem"}</button>
            </div>
          </div>
        )}

        {mode === "reward" && reward && (
          <div style={{ padding:24, textAlign:"center" }}>
            <div style={{ fontSize:54, marginBottom:10, animation:"fadeUp 0.4s" }}>🎁</div>
            <div style={{ fontSize:11, color:TG, fontWeight:900, letterSpacing:"1px", marginBottom:6, textTransform:"uppercase" }}>Reward Claimed</div>
            <div style={{ fontSize:20, fontWeight:900, color:TX, marginBottom:16, letterSpacing:"-0.3px" }}>{reward.reward_label || rewardSummary(reward)}</div>
            <div style={{ display:"inline-block", padding:"10px 18px", borderRadius:99, background:`${T}15`, border:`1px solid ${T}40`, color:T, fontSize:13, fontWeight:800, marginBottom:20, fontFamily:MONO }}>
              {rewardSummary(reward)}
            </div>
            <div style={{ fontSize:12, color:TM, lineHeight:1.5, marginBottom:20 }}>Look for more QR booths around the event venue.</div>
            <button onClick={onClose} style={{ width:"100%", padding:"12px", borderRadius:12, background:`linear-gradient(135deg, ${T}, ${TG})`, border:"none", color:"#0D1117", fontSize:13, fontWeight:900, fontFamily:FONT, cursor:"pointer" }}>Done</button>
          </div>
        )}

        {mode === "error" && (
          <div style={{ padding:22, textAlign:"center" }}>
            <div style={{ fontSize:46, marginBottom:10 }}>⚠️</div>
            <div style={{ fontSize:14, fontWeight:800, color:TX, marginBottom:8 }}>Couldn't redeem</div>
            <div style={{ fontSize:12, color:TM, lineHeight:1.55, marginBottom:18 }}>{errorMsg}</div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={onClose} style={{ flex:1, padding:"11px", borderRadius:12, background:"rgba(255,255,255,0.04)", border:`1px solid ${BR}`, color:TX, fontSize:12, fontWeight:700, fontFamily:FONT, cursor:"pointer" }}>Close</button>
              <button onClick={() => { setErrorMsg(null); setMode("scan"); }} style={{ flex:1, padding:"11px", borderRadius:12, background:T, border:"none", color:"#0D1117", fontSize:12, fontWeight:800, fontFamily:FONT, cursor:"pointer" }}>Try again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function rewardSummary(r: any) {
  if (r.reward_type === "xp")     return `+${(r.reward_value_int || 0).toLocaleString()} XP`;
  if (r.reward_type === "ae")     return `+${(r.reward_value_int || 0).toLocaleString()} AE`;
  if (r.reward_type === "shards") return `+${(r.reward_value_int || 0).toLocaleString()} Shards`;
  if (r.reward_type === "avatar_item") return `New cosmetic added to inventory`;
  if (r.reward_type === "consumable")  return `Item added to inventory`;
  return "Reward claimed";
}
