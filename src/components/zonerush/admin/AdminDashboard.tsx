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
import type { AdminSectionTitleProps, KpiCardProps, StatusPillProps, StrengthBarProps, AdminTableProps, MiniLineChartProps, DualLineChartProps, DonutChartProps, PlayerModalProps } from "../types";


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
const AA: Record<string, any> = {
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
function AdminSectionTitle({ title, sub }: AdminSectionTitleProps) {
  return (
    <div style={AA.sectionTitle}>
      <div style={AA.sectionTitleTxt}>{title}</div>
      <div style={AA.sectionSub}>{sub}</div>
    </div>
  );
}
// Alias for backward compat
const SectionTitle = AdminSectionTitle;

function KpiCard({ label, val, delta, color }: KpiCardProps) {
  return (
    <div style={AA.kpiCard}>
      <div style={{ ...AA.kpiVal, color }}>{val}</div>
      <div style={AA.kpiLabel}>{label}</div>
      <div style={{ ...AA.kpiDelta, color: delta.includes("⚠") ? C.red : C.dim }}>{delta}</div>
    </div>
  );
}

function StatusPill({ status }: StatusPillProps) {
  const map: Record<string, string> = { active:C.teal, flagged:C.red, warned:C.amber, inactive:C.dim, pending:C.amber, reviewing:C.amber, resolved:C.teal };
  return <span style={{ ...AA.statusPillEl, color:map[status]||C.dim, borderColor:(map[status]||C.dim)+"44" }}>{status}</span>;
}

function StrengthBar({ val }: StrengthBarProps) {
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

function AdminTable({ cols, rows }: AdminTableProps) {
  return (
    <div style={AA.tableWrap}>
      <table style={AA.table}>
        <thead>
          <tr>
            {cols.map((c: any) => <th key={c} style={AA.th}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any, i: number) => (
            <tr key={i} style={AA.tr}>
              {row.map((cell: any, j: number) => <td key={j} style={AA.td}>{cell}</td>)}
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
function MiniLineChart({ data, color, min, max, label }: MiniLineChartProps) {
  const h = 80, w = 400, pad = 10;
  const lo = min ?? Math.min(...data), hi = max ?? Math.max(...data);
  const pts = data.map((v: any, i: number) => {
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

function DualLineChart({ data1, data2, color1, color2 }: DualLineChartProps) {
  const h = 80, w = 400, pad = 10;
  const allVals = [...data1, ...data2];
  const lo = Math.min(...allVals), hi = Math.max(...allVals);
  const pts = (data) => data.map((v: any, i: number) => {
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

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function DonutChart({ segments }: DonutChartProps) {
  const total = segments.reduce((s: any, seg: number) => s + seg.val, 0);
  let acc = -90;
  const r = 60, cx = 90, cy = 90;
  const slices = segments.map((seg: any) => {
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
        {slices.map((sl: any, i: number) => <path key={i} d={sl.d} fill={sl.color} opacity={0.85} />)}
        <circle cx={cx} cy={cy} r={38} fill="#0A0F1C" />
        <text x={cx} y={cy-5} textAnchor="middle" fill={ADM_TX} fontSize={11} fontWeight={800}>{total}%</text>
        <text x={cx} y={cy+12} textAnchor="middle" fill={C.dim} fontSize={9}>total</text>
      </svg>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {segments.map((s: any) => (
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

function BarChart({ data }: any) {
  const max = Math.max(...data.map((d: any) => d.val));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:8 }}>
      {data.map((d: any) => (
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
// Dev fallback credentials — only used if user_roles check fails or for quick testing
const DEV_CREDS = [
  { user:"admin@campus.ac.uk",      pass:"CE_ADMIN_2026",  role:"admin"      },
  { user:"research@campus.ac.uk",   pass:"CE_RESEARCH",    role:"researcher" },
  { user:"mod@campus.ac.uk",        pass:"CE_MOD_2026",    role:"moderator"  },
];

export function AdminRoot({ onExitAdmin }: any) {
  const [authed, setAuthed]   = useState(false);
  const [role,   setRole]     = useState(null);
  const handleLogout = async () => { await supabase.auth.signOut(); setAuthed(false); setRole(null); if (onExitAdmin) onExitAdmin(); };
  return authed
    ? <AdminDashboard role={role} onLogout={handleLogout} />
    : <AdminLogin onAuth={(r) => { setRole(r); setAuthed(true); }} onCancel={onExitAdmin} />;
}

function AdminLogin({ onAuth, onCancel }: any) {
  const [email, setEmail]   = useState("");
  const [pass,  setPass]    = useState("");
  const [err,   setErr]     = useState("");
  const [shake, setShake]   = useState(false);
  const [blink, setBlink]   = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setBlink(b => !b), 530);
    return () => clearInterval(t);
  }, []);

  const attempt = async () => {
    if (loading) return;
    setLoading(true);
    setErr("");
    try {
      // Try real Supabase Auth first
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (!error && data.user) {
        const userId = data.user.id;
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
        const userRole = roles?.[0]?.role;
        if (userRole && ["admin", "moderator", "researcher"].includes(userRole)) {
          onAuth(userRole);
          return;
        }
        await supabase.auth.signOut();
      }
      // Fallback to dev credentials
      const devMatch = DEV_CREDS.find((c: any) => c.user === email && c.pass === pass);
      if (devMatch) {
        onAuth(devMatch.role);
        return;
      }
      throw new Error("ACCESS DENIED — invalid credentials");
    } catch (e: any) {
      setErr(e.message || "Authentication failed");
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
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

function AdminDashboard({ role, onLogout }: any) {
  const [section, setSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const visibleSections = SECTIONS.filter((s: any) => s.roles.includes(role));
  const current = visibleSections.find((s: any) => s.id === section) || visibleSections[0];

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
            {visibleSections.map((s: any) => (
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
  const [activeCount, setActiveCount] = useState(0);
  useEffect(() => { const t = setInterval(() => setPulse((p: any) => !p), 1200); return () => clearInterval(t); }, []);
  useEffect(() => {
    (async () => {
      const { count } = await supabase.from("profiles").select("*", { count:"exact", head:true });
      setActiveCount(count || 0);
    })();
  }, []);
  return (
    <div style={AA.liveBadge}>
      <div style={{ ...AA.liveDot, opacity: pulse ? 1 : 0.3 }} />
      <span>LIVE — {activeCount} registered</span>
    </div>
  );
}

// ─── OVERVIEW SECTION ──────────────────────────────────────────────────────────
function OverviewSection() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [profilesRes, zonesRes, questProgRes, moodRes, clansRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("zones").select("id, contest_status, owner_clan_id"),
        supabase.from("quest_progress").select("id, status, created_at"),
        supabase.from("mood_entries").select("id, mood_score, crisis_flag"),
        supabase.from("clans").select("id"),
      ]);

      const profiles = profilesRes.data || [];
      const zones = zonesRes.data || [];
      const quests = questProgRes.data || [];
      const moods = moodRes.data || [];

      const totalAE = profiles.reduce((s: number, p: any) => s + (p.aether || 0), 0);
      const today = new Date().toISOString().slice(0, 10);
      const missionsToday = quests.filter((q: any) => q.created_at?.startsWith(today)).length;
      const crisisCount = moods.filter((m: any) => m.crisis_flag).length;
      const activeZones = zones.filter((z: any) => z.owner_clan_id).length;
      const contested = zones.filter((z: any) => z.contest_status !== "peaceful").length;

      setStats({
        users: profiles.length,
        zones: `${activeZones}/${zones.length}`,
        contested,
        totalAE,
        missionsToday,
        crisisCount,
        clans: (clansRes.data || []).length,
      });
      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={{ color:C.dim, fontFamily:ADM_MONO, padding:20 }}>Loading overview...</div>;

  return (
    <div style={AA.secWrap}>
      <SectionTitle title="Platform Overview" sub="Real-time snapshot from database" />
      <div style={AA.kpiGrid}>
        {[
          { label:"Registered Users", val:stats.users.toLocaleString(), delta:`${stats.clans} clans`, color:C.teal },
          { label:"Zones Active", val:stats.zones, delta:`${stats.contested} contested`, color:C.red },
          { label:"AE in Circulation", val:stats.totalAE.toLocaleString(), delta:"Total across all players", color:C.amber },
          { label:"Missions Today", val:String(stats.missionsToday), delta:"Quest progress entries", color:C.teal },
          { label:"Crisis Flags", val:String(stats.crisisCount), delta:stats.crisisCount > 0 ? "⚠ Review now" : "All clear", color:stats.crisisCount > 0 ? C.red : C.teal },
        ].map((k: any) => <KpiCard key={k.label} {...k} />)}
      </div>
      <div style={AA.chartsRow}>
        <div style={{ ...AA.chartCard, flex:1 }}>
          <div style={AA.chartTitle}>Recent Activity Feed</div>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}

function ActivityFeed() {
  const [events, setEvents] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(10);
      if (data) {
        setEvents(data.map((n: any) => ({
          t: new Date(n.created_at).toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" }),
          txt: n.message,
          c: n.type === "crisis" ? C.red : n.type === "warning" ? C.amber : C.teal,
          flag: n.type === "crisis",
        })));
      }
    })();
  }, []);
  if (events.length === 0) return <div style={{ color:C.dim, fontFamily:ADM_MONO, padding:12, fontSize:11 }}>No recent activity yet.</div>;
  return (
    <div style={AA.feedList}>
      {events.map((e: any, i: number) => (
        <div key={i} style={{ ...AA.feedRow, ...(e.flag ? AA.feedRowAlert : {}) }}>
          <span style={AA.feedTime}>{e.t}</span>
          <div style={{ ...AA.feedDot, background:e.c }} />
          <span style={{ ...AA.feedTxt, ...(e.flag ? { color:C.red, fontWeight:700 } : {}) }}>{e.txt}</span>
          {e.flag && <span style={AA.feedFlagPill}>REVIEW</span>}
        </div>
      ))}
    </div>
  );
}

// ─── PLAYERS SECTION ───────────────────────────────────────────────────────────
function PlayersSection() {
  const ctx = useContext(AppContext);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const [confirmBan, setConfirmBan] = useState<any>(null);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (!error && data) {
      setPlayers(data.map((p: any) => ({
        id: p.user_id,
        name: p.display_name,
        level: p.level,
        xp: p.xp,
        ae: p.aether,
        streak: p.streak,
        shards: p.shards,
        shields: p.shields,
        combatRank: p.combat_rank,
        influenceRank: p.influence_rank,
        status: "active",
        flag: false,
        email: "—",
        joinDate: new Date(p.created_at).toLocaleDateString("en-GB"),
        clan: null,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  const filtered = players.filter((p: any) => {
    const q = search.toLowerCase();
    const matchQ = !q || p.name.toLowerCase().includes(q) || String(p.id).includes(q);
    const matchF = filter === "all" || (filter === "flagged" && p.flag) || (filter === "inactive" && p.status === "inactive");
    return matchQ && matchF;
  });

  const banPlayer = (id) => { setPlayers((ps: any) => ps.map((p: any) => p.id === id ? { ...p, status:"banned", flag:false } : p)); setConfirmBan(null); setSelected(null); };
  const warnPlayer = (id) => { setPlayers((ps: any) => ps.map((p: any) => p.id === id ? { ...p, status:"warned" } : p)); setSelected(null); };
  const unflagPlayer = (id) => { setPlayers((ps: any) => ps.map((p: any) => p.id === id ? { ...p, flag:false, status:"active" } : p)); };

  return (
    <div style={AA.secWrap}>
      <SectionTitle title="Player Management" sub={`${players.length} registered · ${players.filter(p=>p.flag).length} flagged`} />
      {loading ? <div style={{ color:C.dim, fontFamily:ADM_MONO, padding:20 }}>Loading players...</div> : <>
      <div style={AA.toolBar}>
        <input style={AA.searchInput} placeholder="Search name or ID..." value={search} onChange={e=>setSearch(e.target.value)} />
        <div style={AA.filterRow}>
          {["all","flagged","inactive"].map((f: any) => (
            <button key={f} style={{ ...AA.filterBtn, ...(filter===f?AA.filterBtnOn:{}) }} onClick={() => setFilter(f)}>{f.toUpperCase()}</button>
          ))}
        </div>
        <button style={AA.exportBtn}>↓ Export CSV</button>
      </div>
      <Table cols={["ID","Name","Level","XP","AE","Streak","Status","Actions"]} rows={filtered.map((p: any) => [
        <span style={AA.monoSm}>{String(p.id).slice(0,8)}</span>,
        <span style={AA.playerName}>{p.name}</span>,
        <span style={{ ...AA.mono, color:C.teal }}>Lv {p.level}</span>,
        <span style={AA.mono}>{p.xp.toLocaleString()}</span>,
        <span style={{ ...AA.mono, color:C.amber }}>{p.ae.toLocaleString()}</span>,
        <span style={AA.mono}>{p.streak}d</span>,
        <StatusPill status={p.status} />,
        <div style={AA.actionBtns}>
          <button style={AA.tinyBtn} onClick={()=>setSelected(p)}>View</button>
          {p.flag && <button style={{ ...AA.tinyBtn, ...AA.tinyBtnAmber }} onClick={()=>warnPlayer(p.id)}>Warn</button>}
          {p.flag && <button style={{ ...AA.tinyBtn, ...AA.tinyBtnRed }} onClick={()=>setConfirmBan(p)}>Ban</button>}
        </div>,
      ])} />
      </>}
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

function PlayerModal({ player, onClose, onWarn, onBan }: PlayerModalProps) {
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
          {[["Level",`Lv ${player.level}`],["XP",player.xp.toLocaleString()],["AE Balance",player.ae.toLocaleString()],["Streak",`${player.streak} days`],["Clan",player.clan||"None"],["Status",player.status]].map((k: any, v: any) => (
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
function WellbeingSection() {
  const [moods, setMoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("mood_entries").select("*").order("created_at", { ascending: false });
      setMoods(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={{ color:C.dim, fontFamily:ADM_MONO, padding:20 }}>Loading wellbeing data...</div>;

  const crisisEntries = moods.filter((m: any) => m.crisis_flag);
  const resolve = (id: string) => setResolvedIds(prev => new Set([...prev, id]));

  const dist = [5,4,3,2,1].map(score => {
    const count = moods.filter((m: any) => m.mood_score === score).length;
    return { label: ["","Bad (1)","Low (2)","Okay (3)","Good (4)","Great (5)"][score], count, pct: moods.length > 0 ? Math.round((count / moods.length) * 100) : 0, color: ["","#E74C3C","#E67E22","#F5A623","#27AE60","#00D4A8"][score] };
  });

  return (
    <div style={AA.secWrap}>
      <SectionTitle title="Wellbeing Dashboard" sub="All data anonymised — no user identification without outreach consent" />
      {crisisEntries.length > 0 ? (
        <div style={AA.crisisBox}>
          <div style={AA.crisisHdr}><span style={AA.crisisTitle}>⚠ CRISIS FLAGS — Immediate Review Required</span><span style={AA.crisisCount}>{crisisEntries.filter(f => !resolvedIds.has(f.id)).length} unresolved</span></div>
          {crisisEntries.map((f: any) => {
            const isResolved = resolvedIds.has(f.id);
            return (
              <div key={f.id} style={{ ...AA.crisisRow, ...(isResolved ? AA.crisisRowResolved : {}) }}>
                <div style={AA.crisisLeft}>
                  <div style={{ ...AA.crisisAnon, ...(isResolved ? { color:C.dim } : {}) }}>Entry #{f.anon_user_hash?.slice(0,6) || "?"}</div>
                  {f.free_text ? <div style={AA.crisisText}>"{f.free_text}"</div> : <div style={{ ...AA.crisisText, fontStyle:"italic", color:C.dim }}>🔒 No free text shared</div>}
                  <div style={AA.crisisMeta}>Mood: {f.mood_score}/5 · {new Date(f.created_at).toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" })} · {f.outreach_requested ? "🙋 Outreach requested" : "No outreach opt-in"}</div>
                </div>
                <div style={AA.crisisActions}>
                  {!isResolved && f.outreach_requested && <button style={AA.crisisContactBtn}>Contact Student Support</button>}
                  {!isResolved && <button style={AA.crisisResolveBtn} onClick={() => resolve(f.id)}>Mark Resolved</button>}
                  {isResolved && <span style={AA.resolvedBadge}>✓ Resolved</span>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ ...AA.chartCard, marginBottom:12, borderColor:"rgba(0,212,168,0.3)" }}><div style={{ color:C.teal, fontSize:12, fontFamily:ADM_MONO }}>✓ No crisis flags — all clear</div></div>
      )}
      <div style={AA.chartsRow}>
        <div style={{ ...AA.chartCard, flex:1 }}>
          <div style={AA.chartTitle}>Mood Distribution ({moods.length} check-ins)</div>
          {moods.length === 0 ? <div style={{ color:C.dim, fontFamily:ADM_MONO, fontSize:11 }}>No mood entries yet.</div> :
          <div style={AA.moodBars}>{dist.map((m: any) => (<div key={m.label} style={AA.moodBar}><div style={AA.moodBarLbl}>{m.label}</div><div style={AA.moodBarTrack}><div style={{ ...AA.moodBarFill, width:`${m.pct}%`, background:m.color }} /></div><div style={{ ...AA.mono, fontSize:11, color:m.color, width:40 }}>{m.count}</div></div>))}</div>}
        </div>
      </div>
      <div style={AA.privacyBox}><div style={AA.privacyTitle}>🔒 Privacy Architecture Active</div><div style={AA.privacyBody}>All mood entries stored with anonymised hash only. Free text encrypted at rest (AES-256).</div></div>
    </div>
  );
}

// ─── ZONES SECTION ─────────────────────────────────────────────────────────────
const ADMIN_GAME_RULES: Record<string, number> = { ZONE_ATTACK_COOLDOWN_HOURS:24, ZONE_CAPTURE_MINS_STANDARD:3, ZONE_CAPTURE_MINS_LANDMARK:5, CLAN_CREATE_MIN_LEVEL:5, CLAN_MAX_MEMBERS:20, CLAN_CREATE_COST_AE:500, WAR_DECLARE_COST_AE:200, COMBAT_OPPONENT_COOLDOWN_HOURS:4, COMBAT_MAX_INCOMING:3, COMBAT_LEVEL_RANGE:5 };

function ZonesSection() {
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("zones").select("*, owner_clan:clans(name, tag, color)");
      if (!error && data) {
        setZones(data.map((z: any) => ({
          id: z.id,
          name: z.name,
          type: z.zone_type,
          owner: z.owner_clan?.name || null,
          ownerTag: z.owner_clan?.tag || null,
          strength: z.control_strength,
          income: z.aether_rate_per_hour,
          tier: z.tier,
          contested: z.contest_status !== "peaceful",
          lastCapture: z.last_capture_at ? new Date(z.last_capture_at).toLocaleDateString("en-GB") : "Never",
          lastAttackedAt: z.last_capture_at,
          developmentLevel: z.development_level,
        })));
      }
      setLoading(false);
    })();
  }, []);

  const contested = zones.filter(z => z.contested);
  const unclaimed = zones.filter(z => !z.owner);

  return (
    <div style={AA.secWrap}>
      <SectionTitle title="Zone Control" sub={`${contested.length} contested · ${unclaimed.length} unclaimed`} />
      {loading ? <div style={{ color:C.dim, fontFamily:ADM_MONO, padding:20 }}>Loading zones...</div> : <>
      <Table cols={["ID","Zone","Type","Owner","Strength","Income/hr","Tier","Status","Actions"]} rows={zones.map((z: any) => [
        <span style={AA.monoSm}>{String(z.id).slice(0,8)}</span>,
        <span style={AA.playerName}>{z.name}</span>,
        <span style={{ color:C.dim, textTransform:"capitalize" }}>{z.type}</span>,
        <span style={{ color:z.owner?"#A78BFA":C.dim }}>{z.owner ? `${z.owner} [${z.ownerTag}]` : "Unclaimed"}</span>,
        <StrengthBar val={z.strength} />,
        <span style={{ ...AA.mono, color:C.amber }}>+{z.income}</span>,
        <span style={AA.mono}>T{z.tier}</span>,
        <span style={{ color:z.contested?C.red:C.teal, fontSize:11, fontWeight:700 }}>{z.contested?"CONTESTED":"Peaceful"}</span>,
        <div style={AA.actionBtns}><button style={AA.tinyBtn} onClick={()=>setSel(z)}>Manage</button></div>,
      ])} />
      </>}
      {sel && (
        <div style={AA.modalOverlay} onClick={()=>setSel(null)}>
          <div style={AA.modal} onClick={e=>e.stopPropagation()}>
            <div style={AA.modalHdr}><div><div style={AA.modalTitle}>{sel.name}</div><div style={AA.modalSub}>Tier {sel.tier} · {sel.type}</div></div><button style={AA.modalClose} onClick={()=>setSel(null)}>✕</button></div>
            <div style={AA.modalGrid}>
              {[["Owner",sel.owner||"Unclaimed"],["Strength",`${sel.strength}%`],["Income",`${sel.income} AE/hr`],["Development",`Lv ${sel.developmentLevel}`]].map(([label,val]: any) => (
                <div key={label} style={AA.modalStat}><div style={AA.modalStatLbl}>{label}</div><div style={AA.modalStatVal}>{val}</div></div>
              ))}
            </div>
            <div style={AA.modalActions}>
              <button style={AA.modalBtn}>🔄 Force Unclaim</button>
              <button style={AA.modalBtn}>⬆ Upgrade Tier</button>
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
      ].map((k: any) => <KpiCard key={k.label} {...k} />)}</div>
      <div style={AA.chartsRow}>
        <div style={{ ...AA.chartCard, flex:2 }}><div style={AA.chartTitle}>AE Supply vs Sinks — 14 Days</div><DualLineChart data1={[2100,2180,2200,2240,2280,2300,2330,2350,2370,2390,2400,2410,2415,2418]} data2={[1600,1680,1720,1780,1820,1850,1870,1900,1920,1940,1960,1970,1980,1890]} color1={C.amber} color2={C.teal} /></div>
        <div style={{ ...AA.chartCard, flex:1 }}><div style={AA.chartTitle}>AE Source Breakdown</div><DonutChart segments={[{ label:"Daily missions",val:44,color:C.teal },{ label:"Zone income",val:22,color:C.amber },{ label:"Weekly missions",val:18,color:"#A78BFA" },{ label:"Combat wins",val:10,color:C.red },{ label:"Story rewards",val:6,color:"#4DA6FF" }]} /></div>
      </div>
      <div style={AA.chartCard}><div style={AA.chartTitle}>Admin Economy Controls</div><div style={AA.ecoControls}>
        {[{ label:"Daily mission AE multiplier",val:"1.0×" },{ label:"Shop price floor",val:"100 AE" },{ label:"Marketplace fee",val:"5%" },{ label:"Max player AE balance",val:"50,000 AE" }].map((c: any) => (
          <div key={c.label} style={AA.ecoControlRow}><span style={AA.ecoControlLabel}>{c.label}</span><div style={AA.ecoControlRight}><span style={{ ...AA.mono, color:C.amber }}>{c.val}</span><button style={AA.tinyBtn}>Edit</button></div></div>
        ))}
      </div></div>
    </div>
  );
}

// ─── SHOP SECTION ──────────────────────────────────────────────────────────────
const RARITY_COL: Record<string, string> = { common:C.dim, uncommon:"#27AE60", rare:"#4DA6FF", epic:"#A78BFA", legendary:"#F5A623" };
const BLANK_ITEM = { name:"", cat:"headwear", priceAE:"", rarity:"common", type:"general", stock:"", soulBound:false };
const CATS = ["headwear","eyewear","outerwear","equipment","furniture","clan","consumable","cosmetic"];
const RARITIES = ["common","uncommon","rare","epic","legendary"];

function ShopSection() {
  const ctx = useContext(AppContext);
  const items = ctx?.sharedShopItems || INIT_SHOP_ITEMS;
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(BLANK_ITEM);
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? items : items.filter((i: any) => i.type === filter || (filter==="active" && i.active) || (filter==="inactive" && !i.active));

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
        <div style={AA.filterRow}>{[["all","All"],["general","General"],["limited","Limited"],["active","Active"],["inactive","Inactive"]].map((f: any, l: any) => (<button key={f} style={{ ...AA.filterBtn, ...(filter===f?AA.filterBtnOn:{}) }} onClick={() => setFilter(f)}>{l}</button>))}</div>
        <button style={{ ...AA.exportBtn, marginLeft:"auto" }} onClick={() => setShowAdd(true)}>+ Add Item</button>
      </div>
      <Table cols={["Name","Cat","Price","Rarity","Type","Stock","Sold","Status","Actions"]} rows={filtered.map((item: any) => { const stockOut = item.type==="limited" && item.stock !== null && item.sold >= item.stock; return [
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
                <div style={{ ...AA.fieldWrap, flex:1 }}><label style={AA.fieldLabel}>CATEGORY</label><select style={{ ...AA.fieldInput, color:ADM_TX }} value={form.cat} onChange={e => setForm(f=>({...f, cat:e.target.value}))}>{CATS.map((c: any) => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}</select></div>
                <div style={{ ...AA.fieldWrap, flex:1 }}><label style={AA.fieldLabel}>RARITY</label><select style={{ ...AA.fieldInput, color:ADM_TX }} value={form.rarity} onChange={e => setForm(f=>({...f, rarity:e.target.value}))}>{RARITIES.map((r: any) => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}</select></div>
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
function MissionsSection() {
  const ctx = useContext(AppContext);
  const [mTab, setMTab] = useState("templates");
  const [questDefs, setQuestDefs] = useState<any[]>([]);
  const [proofs, setProofs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewProof, setViewProof] = useState<any>(null);
  const [rejectNote, setRejectNote] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [defsRes, proofsRes] = await Promise.all([
      supabase.from("quest_definitions").select("*").order("sort_order"),
      supabase.from("proof_submissions").select("*, quest_progress:quest_progress(*, quest_definition:quest_definitions(*))"),
    ]);
    if (defsRes.data) setQuestDefs(defsRes.data);
    if (proofsRes.data) {
      // Fetch display names for submitters
      const userIds = [...new Set(proofsRes.data.map((p: any) => p.user_id))];
      const { data: profiles } = userIds.length > 0
        ? await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds)
        : { data: [] };
      const nameMap: Record<string, string> = {};
      (profiles || []).forEach((p: any) => { nameMap[p.user_id] = p.display_name; });

      setProofs(proofsRes.data.map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        userName: nameMap[p.user_id] || "Unknown",
        missionTitle: p.quest_progress?.quest_definition?.title || "Unknown Mission",
        cat: p.quest_progress?.quest_definition?.category || "",
        status: p.status,
        reward: p.quest_progress?.quest_definition?.aether_reward || 0,
        xp: p.quest_progress?.quest_definition?.xp_reward || 0,
        proofUrl: p.proof_url,
        progressId: p.quest_progress_id,
        submittedAt: new Date(p.quest_progress?.created_at || Date.now()).toLocaleDateString("en-GB"),
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const pending = proofs.filter((p: any) => p.status === "pending");
  const resolved = proofs.filter((p: any) => p.status === "approved" || p.status === "rejected");

  const toggleQuest = async (id: string, currentActive: boolean) => {
    const { error } = await supabase.from("quest_definitions").update({ is_active: !currentActive }).eq("id", id);
    if (!error) {
      setQuestDefs(ds => ds.map(d => d.id === id ? { ...d, is_active: !currentActive } : d));
      showToast(`Mission ${!currentActive ? "enabled" : "disabled"}`, "success");
    } else {
      showToast("Failed to update mission", "error");
    }
  };

  const approve = async (proof: any) => {
    const { error } = await supabase.from("proof_submissions").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", proof.id);
    if (!error && proof.reward > 0 || proof.xp > 0) {
      // Update user profile with rewards
      const { data: profile } = await supabase.from("profiles").select("aether, xp").eq("user_id", proof.userId).maybeSingle();
      if (profile) {
        await supabase.from("profiles").update({
          aether: profile.aether + (proof.reward || 0),
          xp: profile.xp + (proof.xp || 0),
        }).eq("user_id", proof.userId);
      }
    }
    if (!error) {
      setProofs(ps => ps.map(p => p.id === proof.id ? { ...p, status: "approved" } : p));
      showToast(`✓ Proof approved — ${proof.reward} AE + ${proof.xp} XP released`, "success");
    }
    setViewProof(null);
  };

  const reject = async (id: string, reason: string) => {
    await supabase.from("proof_submissions").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", id);
    setProofs(ps => ps.map(p => p.id === id ? { ...p, status: "rejected" } : p));
    showToast("Proof rejected", "warning");
    setViewProof(null);
    setRejectNote("");
  };

  return (
    <div style={AA.secWrap}>
      <SectionTitle title="Missions" sub="Mission templates · proof image review · reward release" />
      {loading ? <div style={{ color:C.dim, fontFamily:ADM_MONO, padding:20 }}>Loading...</div> : <>
      <div style={AA.innerTabBar}>
        <button style={{ ...AA.innerTab, ...(mTab==="templates"?AA.innerTabOn:{}) }} onClick={() => setMTab("templates")}>📋 Templates ({questDefs.length})</button>
        <button style={{ ...AA.innerTab, ...(mTab==="proof"?AA.innerTabOn:{}) }} onClick={() => setMTab("proof")}>📷 Proof Review{pending.length > 0 && <span style={AA.innerTabBadge}>{pending.length}</span>}</button>
      </div>
      {mTab === "templates" && <>
        <div style={AA.toolBar}><span style={{ color:C.dim, fontSize:12 }}>{questDefs.filter(m=>m.is_active).length} active · changes reflect instantly</span></div>
        <Table cols={["Title","Category","Tier","AE","XP","Shards","Tracking","Status","Actions"]} rows={questDefs.map((m: any) => [
          <span style={AA.playerName}>{m.icon} {m.title}</span>,
          <span style={{ color:C.dim }}>{m.category}</span>,
          <span style={{ color:C.teal, fontSize:11 }}>{m.tier}</span>,
          <span style={{ ...AA.mono, color:C.amber }}>{m.aether_reward}</span>,
          <span style={AA.mono}>{m.xp_reward}</span>,
          <span style={AA.mono}>{m.shard_reward}</span>,
          <span style={{ color:C.dim, textTransform:"capitalize", fontSize:11 }}>{m.tracking_type}</span>,
          <span style={{ color:m.is_active?C.teal:C.dim, fontSize:11, fontWeight:700 }}>{m.is_active?"ACTIVE":"OFF"}</span>,
          <div style={AA.actionBtns}><button style={{ ...AA.tinyBtn, ...(m.is_active?AA.tinyBtnRed:AA.tinyBtnGreen) }} onClick={() => toggleQuest(m.id, m.is_active)}>{m.is_active?"Disable":"Enable"}</button></div>,
        ])} />
      </>}
      {mTab === "proof" && <>
        {pending.length > 0 && <><div style={AA.proofQueueLabel}>⏳ Awaiting Review — {pending.length}</div>{pending.map((s: any) => <ProofCard key={s.id} sub={s} onView={() => { setViewProof(s); setRejectNote(""); }} />)}</>}
        {resolved.length > 0 && <><div style={{ ...AA.proofQueueLabel, color:C.dim, marginTop:16 }}>✓ Resolved — {resolved.length}</div>{resolved.map((s: any) => <ProofCard key={s.id} sub={s} resolved />)}</>}
        {pending.length === 0 && resolved.length === 0 && <div style={{ color:C.dim, fontFamily:ADM_MONO, padding:20 }}>No proof submissions yet.</div>}
      </>}
      </>}
      {viewProof && (
        <div style={AA.modalOverlay} onClick={() => setViewProof(null)}>
          <div style={{ ...AA.modal, maxWidth:560 }} onClick={e => e.stopPropagation()}>
            <div style={AA.modalHdr}><div><div style={AA.modalTitle}>{viewProof.missionTitle}</div><div style={AA.modalSub}>{viewProof.userName} · {viewProof.submittedAt}</div></div><button style={AA.modalClose} onClick={() => setViewProof(null)}>✕</button></div>
            <div style={AA.proofImgWrap}>{viewProof.proofUrl ? <img src={viewProof.proofUrl} alt="Proof" style={{ width:"100%", maxHeight:300, objectFit:"contain" }} /> : <div style={AA.proofImgPlaceholder}>📷</div>}</div>
            <div style={AA.proofRewardRow}><div style={AA.proofRewardChip}><span style={{ color:C.amber }}>◎</span> {viewProof.reward} AE</div><div style={AA.proofRewardChip}><span style={{ color:C.teal }}>⚡</span> {viewProof.xp} XP</div></div>
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:16 }}>
              <button style={{ ...AA.modalBtn, background:"rgba(0,212,168,0.08)", borderColor:"rgba(0,212,168,0.4)", color:C.teal, fontWeight:700 }} onClick={() => approve(viewProof)}>✓ Approve — release rewards</button>
              <input style={AA.fieldInput} placeholder="Rejection reason (required)" value={rejectNote} onChange={e => setRejectNote(e.target.value)} />
              <button style={{ ...AA.modalBtn, ...AA.modalBtnRed, opacity: rejectNote.trim() ? 1 : 0.4 }} disabled={!rejectNote.trim()} onClick={() => reject(viewProof.id, rejectNote)}>✕ Reject submission</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProofCard({ sub, resolved, onView }: any) {
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
function EventsSection() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title:"", desc:"" });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("events").select("*").order("created_at", { ascending: false });
    if (!error && data) setEvents(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const active = events.filter(e => e.status === "active");
  const upcoming = events.filter(e => e.status === "upcoming");
  const ended = events.filter(e => e.status === "ended");

  const endEventNow = async (id: string) => {
    const { error } = await supabase.from("events").update({ status: "ended" }).eq("id", id);
    if (!error) {
      setEvents(evs => evs.map(e => e.id === id ? { ...e, status: "ended" } : e));
      showToast("Event ended", "success");
    }
  };

  const createEvent = async () => {
    if (!form.title.trim()) return;
    const { data, error } = await supabase.from("events").insert({ title: form.title, description: form.desc, status: "active" }).select().maybeSingle();
    if (!error && data) {
      setEvents(evs => [data, ...evs]);
      showToast("Event created!", "success");
    }
    setForm({ title:"", desc:"" });
    setShowCreate(false);
  };

  const statusColor = { active: C.teal, upcoming: C.amber, ended: C.dim, scheduled: C.amber };

  return (
    <div style={AA.secWrap}>
      <SectionTitle title="Events" sub="Create and manage timed campus-wide events" />
      {loading ? <div style={{ color:C.dim, fontFamily:ADM_MONO, padding:20 }}>Loading events...</div> : <>
      <div style={AA.toolBar}>
        <div style={{ ...AA.kpiGrid, gridTemplateColumns:"repeat(3,1fr)", width:"100%" }}>
          {[{ label:"Active now",val:active.length,color:C.teal },{ label:"Upcoming",val:upcoming.length,color:C.amber },{ label:"Ended",val:ended.length,color:C.dim }].map((k: any) => (<div key={k.label} style={AA.kpiCard}><div style={{ ...AA.kpiVal, color:k.color }}>{k.val}</div><div style={AA.kpiLabel}>{k.label}</div></div>))}
        </div>
        <button style={{ ...AA.exportBtn, whiteSpace:"nowrap", alignSelf:"flex-start" }} onClick={() => setShowCreate(true)}>+ Create Event</button>
      </div>
      <Table cols={["Title","Description","Status","Reward AE","Created","Actions"]} rows={events.map((ev: any) => [
        <span style={AA.playerName}>{ev.title}</span>,
        <span style={{ color:C.dim, fontSize:11 }}>{ev.description || "—"}</span>,
        <span style={{ color:statusColor[ev.status]||C.dim, fontSize:11, fontWeight:700, textTransform:"uppercase" }}>{ev.status}</span>,
        <span style={{ ...AA.mono, color:C.amber }}>{ev.reward_ae} AE</span>,
        <span style={AA.monoSm}>{new Date(ev.created_at).toLocaleDateString("en-GB")}</span>,
        <div style={AA.actionBtns}>
          {ev.status === "active" && <button style={{ ...AA.tinyBtn, ...AA.tinyBtnRed }} onClick={() => endEventNow(ev.id)}>End Now</button>}
        </div>,
      ])} />
      </>}
      {showCreate && (
        <div style={AA.modalOverlay} onClick={() => setShowCreate(false)}>
          <div style={{ ...AA.modal, maxWidth:580 }} onClick={e => e.stopPropagation()}>
            <div style={AA.modalHdr}><div style={AA.modalTitle}>⚡ Create Event</div><button style={AA.modalClose} onClick={() => setShowCreate(false)}>✕</button></div>
            <div style={{ display:"flex", flexDirection:"column", gap:14, marginTop:12 }}>
              <div style={AA.fieldWrap}><label style={AA.fieldLabel}>TITLE</label><input style={AA.fieldInput} placeholder="e.g. Freshers Capture Blitz" value={form.title} onChange={e => setForm(f=>({...f, title:e.target.value}))} /></div>
              <div style={AA.fieldWrap}><label style={AA.fieldLabel}>DESCRIPTION</label><textarea style={{ ...AA.fieldInput, resize:"none", height:70 }} value={form.desc} onChange={e => setForm(f=>({...f, desc:e.target.value}))} /></div>
              <div style={{ display:"flex", gap:10 }}>
                <button style={{ ...AA.exportBtn, flex:1 }} onClick={() => setShowCreate(false)}>Cancel</button>
                <button style={{ ...AA.exportBtn, flex:2, background:`linear-gradient(135deg, ${C.teal}, #0088BB)`, color:"#050810", fontWeight:700, border:"none" }} onClick={createEvent}>⚡ Create Event</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── STYLE EVENT SECTION ───────────────────────────────────────────────────────
const STYLE_WEEKS: any[] = [
  { id:12, status:"voting", theme:"Design a look for someone who just captured the library at midnight.", startDate:"Feb 17", voteEnd:"Feb 24", submissions:23, votes:184 },
  { id:11, status:"closed", theme:"What does the campus ghost wear?", startDate:"Feb 10", voteEnd:"Feb 17", submissions:31, votes:287, winner:"Priya M." },
];

function StyleEventSection() {
  const ctx = useContext(AppContext);
  const [seTab, setSeTab] = useState("current");
  const [viewSub, setViewSub] = useState<any>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [confirmPublish, setConfirmPublish] = useState<boolean>(false);

  const subs = ctx?.sharedStyleSubs || STYLE_SUBMISSIONS_INIT;
  const pending = subs.filter((s: any) => s.status === "pending" || s.status === "flagged");
  const approved = subs.filter((s: any) => s.status === "approved");
  const rejected = subs.filter((s: any) => s.status === "rejected");

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
            {[{ id:"submission",label:"✏️ Submissions",color:C.amber },{ id:"voting",label:"🗳️ Voting",color:C.teal },{ id:"closed",label:"✓ Closed",color:C.dim }].map((p: any) => (
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
        {pending.length > 0 && <><div style={AA.proofQueueLabel}>⏳ Awaiting Review — {pending.length}</div>{pending.map((s: any) => <StyleSubCard key={s.id} sub={s} onView={() => { setViewSub(s); setRejectNote(""); }} />)}</>}
        {approved.length > 0 && <><div style={{ ...AA.proofQueueLabel, color:C.teal, marginTop:12 }}>✓ Approved ({approved.length})</div>{approved.map((s: any) => <StyleSubCard key={s.id} sub={s} resolved />)}</>}
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

function StyleSubCard({ sub, resolved, onView }: { sub: any; resolved?: boolean; onView?: () => void }) {
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
      <div style={{ ...AA.kpiGrid, gridTemplateColumns:"repeat(4,1fr)", marginBottom:16 }}>{[{ label:"Fights Today",val:"47",delta:"+8 vs avg",color:C.red },{ label:"Zone Raids",val:"12",delta:"4 zones changed",color:C.amber },{ label:"Clan Wars",val:"2",delta:"1 ongoing",color:C.red },{ label:"Items Dropped",val:"6",delta:"3 rare",color:"#A78BFA" }].map((k: any) => <KpiCard key={k.label} {...k} />)}</div>
      <Table cols={["ID","Challenger","Defender","Mode","Winner","Wager","Time"]} rows={COMBAT_LOG.map((c: any) => [<span style={AA.monoSm}>#{c.id}</span>,<span style={AA.playerName}>{c.challenger}</span>,<span style={AA.playerName}>{c.defender}</span>,<span style={{ color:C.teal, fontSize:11, textTransform:"uppercase" }}>{c.mode.replace("_"," ")}</span>,<span style={{ color:C.amber, fontWeight:700 }}>{c.winner}</span>,<span style={AA.mono}>{c.wager>0?`${c.wager} AE`:"—"}</span>,<span style={AA.monoSm}>{c.time}</span>])} />
    </div>
  );
}

// ─── CLANS SECTION ─────────────────────────────────────────────────────────────
function ClansSection() {
  const [clans, setClans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("clans").select("*").order("cpr_score", { ascending: false });
      if (!error && data) setClans(data);
      setLoading(false);
    })();
  }, []);

  return (
    <div style={AA.secWrap}>
      <SectionTitle title="Clan Management" sub={`${clans.length} active clans`} />
      {loading ? <div style={{ color:C.dim, fontFamily:ADM_MONO, padding:20 }}>Loading clans...</div> :
      <Table cols={["Tag","Name","Members","Zones","CPR","Treasury","Actions"]} rows={clans.map((c: any) => [
        <span style={{ ...AA.mono, color:"#A78BFA" }}>[{c.tag}]</span>,
        <span style={AA.playerName}>{c.name}</span>,
        <span style={AA.mono}>{c.total_members}/{c.max_members}</span>,
        <span style={{ ...AA.mono, color:C.teal }}>{c.zones_held}</span>,
        <span style={{ ...AA.mono, color:C.amber }}>{c.cpr_score}</span>,
        <span style={{ ...AA.mono, color:C.amber }}>{c.aether_treasury.toLocaleString()} AE</span>,
        <div style={AA.actionBtns}><button style={AA.tinyBtn} onClick={() => showToast(`📊 ${c.name}: ${c.total_members} members, ${c.zones_held} zones`, "info")}>View</button></div>,
      ])} />}
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
    setChapters(chs => chs.map((ch: any) => ch.id === id ? { ...ch, status:"active" } : ch));
    showToast(`📖 Chapter ${id} unlocked! Players can now discover clues.`, "success");
  };

  return (
    <div style={AA.secWrap}>
      <SectionTitle title="Story Quest Manager" sub="The Campus Chronicle — Season 1" />
      <div style={AA.chartsRow}>
        <div style={{ ...AA.chartCard, flex:1 }}><div style={AA.chartTitle}>Chapter Progress</div>
          {chapters.map((ch: any) => (<div key={ch.id} style={AA.chapterRow}><div style={AA.chapterLeft}><span style={{ ...AA.mono, color:ch.status==="active"?C.teal:ch.status==="draft"?C.amber:C.dim }}>Ch{ch.id}</span><div><div style={AA.chapterTitle}>{ch.title}</div><div style={AA.chapterMeta}>{ch.status==="active"?`${ch.cluesSolved}/${ch.totalClues} clues · ${ch.players} players`:ch.status==="locked"?"Locked":"Draft"}</div></div></div>
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
    setReports(rs => rs.map((r: any) => r.id === reportId ? {
      ...r,
      status: "resolved",
      priorActions: [...r.priorActions, action],
    } : r));
    showToast(`${ACTION_LABELS[action]} applied to report #${reportId}`, action === "ban" ? "error" : "warning");
  };

  const resolveReport = (reportId) => {
    setReports(rs => rs.map((r: any) => r.id === reportId ? { ...r, status:"resolved" } : r));
    showToast(`✓ Report #${reportId} resolved — no action taken`, "success");
  };

  return (
    <div style={AA.secWrap}>
      <SectionTitle title="Moderation Queue" sub={`${reports.filter(r=>r.status!=="resolved").length} open · Warn → Timeout → Ban`} />
      <div style={AA.modLadder}>
        {[{ step:1, icon:"⚠️", label:"Warn", color:C.amber },{ step:2, icon:"⏱", label:"Timeout", color:C.red },{ step:3, icon:"🚫", label:"Ban", color:C.red }].map((s: any, i: number) => (
          <div key={s.step} style={AA.modLadderItem}><div style={{ ...AA.modLadderIcon, borderColor:s.color+"44", color:s.color }}>{s.icon}</div><div style={AA.modLadderLabel}>{s.label}</div>{i<2 && <div style={AA.modLadderArrow}>→</div>}</div>
        ))}
      </div>
      <Table cols={["#","Reporter","Reported","Reason","Severity","History","Status","Actions"]} rows={reports.map((r: any) => {
        const next = nextAction(r.priorActions);
        return [
          <span style={AA.monoSm}>R{r.id}</span>,<span style={AA.monoSm}>{r.reporter}</span>,<span style={AA.playerName}>{r.reported}</span>,<span style={{ color:C.dim, fontSize:11 }}>{r.reason}</span>,
          <span style={{ color:{high:C.red,medium:C.amber,low:C.teal}[r.severity], fontSize:10, fontWeight:700, textTransform:"uppercase" }}>{r.severity}</span>,
          <div style={{ display:"flex", gap:3 }}>{r.priorActions.length===0?<span style={{ color:C.dim, fontSize:10 }}>None</span>:r.priorActions.map((a: any, i: number) => <span key={i} style={{ fontSize:12 }}>{PRIOR_ICONS[a]}</span>)}</div>,
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
      ].map((k: any) => <KpiCard key={k.label} {...k} />)}</div>
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
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");

  const startEdit = (key, val) => { setEditKey(key); setEditVal(val); };
  const saveEdit = () => {
    if (!editKey) return;
    setGroups((gs: any) => gs.map((g: any) => ({
      ...g,
      settings: g.settings.map((s: any) => s.key === editKey ? { ...s, val: editVal } : s),
    })));
    showToast(`✓ ${editKey} updated to "${editVal}"`, "success");
    setEditKey(null);
    setEditVal("");
  };

  const toggleFlag = (key) => {
    setGroups((gs: any) => gs.map((g: any) => ({
      ...g,
      settings: g.settings.map((s: any) => s.key === key ? { ...s, val: s.val === "ON" ? "OFF" : "ON" } : s),
    })));
    const setting = groups.flatMap((g: any) => g.settings).find((s: any) => s.key === key);
    const newVal = setting?.val === "ON" ? "OFF" : "ON";
    showToast(`⚙️ ${key} set to ${newVal}`, newVal === "ON" ? "success" : "warning");
  };

  return (
    <div style={AA.secWrap}>
      <SectionTitle title="Platform Config" sub="Global settings — changes apply immediately" />
      {groups.map((group: any) => (
        <div key={group.group} style={{ ...AA.chartCard, marginBottom:12 }}>
          <div style={AA.chartTitle}>{group.group}</div>
          {group.settings.map((s: any) => (
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

