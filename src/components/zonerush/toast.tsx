// @ts-nocheck
import { useState, useEffect } from "react";
import type { Toast, ToastHandler } from "./types";
import { FONT } from "./constants";

let _toastId = 0;
const _toastListeners: ToastHandler[] = [];

export function showToast(msg: string, type="success", duration=3000) {
  const t: Toast = { id:++_toastId, msg, type, duration };
  _toastListeners.forEach((fn: any) => fn(t));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const handler = (t: Toast) => {
      setToasts((ts: any) => [...ts, t]);
      setTimeout(() => setToasts((ts: any) => ts.filter((x: any) => x.id !== t.id)), t.duration);
    };
    _toastListeners.push(handler);
    return () => { const i = _toastListeners.indexOf(handler); if (i>=0) _toastListeners.splice(i,1); };
  }, []);
  if (!toasts.length) return null;
  return (
    <div style={{ position:"fixed", top:16, left:"50%", transform:"translateX(-50%)", zIndex:9999, display:"flex", flexDirection:"column", gap:8, maxWidth:380, width:"100%", padding:"0 16px", pointerEvents:"none" }}>
      {toasts.map((t: any) => (
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
