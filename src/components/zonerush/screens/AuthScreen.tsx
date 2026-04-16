// @ts-nocheck
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "../toast";
import { BG, S1, S2, BR, T, TL, TG, TR, TX, TM, TD, FONT } from "../constants";
import type { AuthScreenProps } from "../types";

export function AuthScreen({ onAuth }: AuthScreenProps) {
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

  const handleSignup = async (e: any) => {
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

  const handleLogin = async (e: any) => {
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
          {["signup","login"].map((m: any) => (
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
