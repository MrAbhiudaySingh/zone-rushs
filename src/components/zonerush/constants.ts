// @ts-nocheck
// ═══════════════════════════════════════════════════════════════════════════════
// ZONERUSH — Shared Constants, Tokens & Default Data
// ═══════════════════════════════════════════════════════════════════════════════

import type { ZRMission, ZREvent, ZRShopItem, ZRProof, ZRStyleSub, ZRStyleEvent, ZRNotif, ZRTreasuryEntry, Mood } from "./types";

// ─── ASSET PATHS ───────────────────────────────────────────────────────────────
// (Kept as an empty record so existing `import { IMG }` statements still resolve.
// Story card uses a CSS gradient — no external art required.)
export const IMG: Record<string, string> = {};

// ─── DESIGN TOKENS ─────────────────────────────────────────────────────────────
export const BG   = "#0D1117";
export const S1   = "#161B22";
export const S2   = "#1C2330";
export const BR   = "#2A3441";
export const T    = "#00C9B1";
export const TL   = "#00E8CC";
export const TG   = "#06FF94";
export const TA   = "#FF6B35";
export const TY   = "#FFD166";
export const TR   = "#FF4757";
export const TB   = "#00B4FF";
export const TX   = "#F0F6FC";
export const TM   = "#8B9AB0";
export const TD   = "#3D4F63";
export const FONT  = "'Nunito',system-ui,sans-serif";
export const MONO  = "'Nunito','Nunito',monospace";

export const RARITY_COLOR: Record<string, string> = { common:"#8B9AB0", uncommon:TG, rare:TB, epic:TA, legendary:TY };

// ─── DEFAULT DATA ──────────────────────────────────────────────────────────────
export const USER: any = {
  name:"Player", level:1,
  xp:0, xpNext:100,
  ae:0, shards:0,
  streak:0, shields:0,
  combatRank:"Unranked", influenceRank:"Unranked",
  clan:null,
};

// Campus-realistic seed missions used as fallback when the DB has no rows.
// `tier` matches the QuestScreen tabs. `verification` maps to the proof flow.
// Production missions live in the `missions` table in Supabase; these are the
// authored defaults for a fresh deployment on Woxsen University Kamkole campus.
export const MISSIONS: any[] = [
  // ─── DAILY (refresh midnight) ───────────────────────────────────────────────
  { id:"d1", title:"Library check-in",       desc:"Check in at any academic-block zone before 6 PM",      tier:"daily", category:"academic", verification:"gps",      reward_ae:50,  reward_xp:30,  done:false, progress:0, total:1 },
  { id:"d2", title:"Morning steps",          desc:"Hit 3,000 steps before noon",                          tier:"daily", category:"wellness", verification:"steps",    reward_ae:60,  reward_xp:40,  done:false, progress:0, total:3000, unit:"steps" },
  { id:"d3", title:"Quiet study session",    desc:"Spend 30 continuous minutes inside a Library zone",    tier:"daily", category:"academic", verification:"gps_dwell",reward_ae:80,  reward_xp:50,  done:false, progress:0, total:30, unit:"min" },
  { id:"d4", title:"Cafeteria social",       desc:"Capture a Social-zone (canteen, courtyard) once",      tier:"daily", category:"social",   verification:"gps",      reward_ae:40,  reward_xp:25,  done:false, progress:0, total:1 },
  { id:"d5", title:"Hydration check",        desc:"Log 8 glasses of water before midnight",                tier:"daily", category:"wellness", verification:"counter",  reward_ae:30,  reward_xp:20,  done:false, progress:0, total:8 },
  { id:"d6", title:"Daily wellbeing check-in",desc:"Tap your mood when the daily prompt appears",          tier:"daily", category:"wellness", verification:"auto",     reward_ae:25,  reward_xp:15,  done:false, progress:0, total:1 },

  // ─── WEEKLY (refresh Monday 00:00, +300 AE all-complete bonus) ─────────────
  { id:"w1", title:"Three zones, three days", desc:"Capture three different zones across at least three different days this week", tier:"weekly", category:"explore",  verification:"gps_streak", reward_ae:300, reward_xp:200, done:false, progress:0, total:3 },
  { id:"w2", title:"Squad up",                desc:"Complete one mission with at least 2 clan members joined",                       tier:"weekly", category:"social",   verification:"co_op",      reward_ae:250, reward_xp:180, done:false, progress:0, total:1 },
  { id:"w3", title:"Wellness week",           desc:"Three voluntary mood check-ins",                                                  tier:"weekly", category:"wellness", verification:"auto",       reward_ae:200, reward_xp:150, done:false, progress:0, total:3 },
  { id:"w4", title:"Recreation ranger",       desc:"Capture two Recreation zones (sports ground, lawn, garden)",                     tier:"weekly", category:"explore",  verification:"gps",        reward_ae:280, reward_xp:200, done:false, progress:0, total:2 },
  { id:"w5", title:"Library scholar",         desc:"Accumulate 2 hours total inside Library zones",                                   tier:"weekly", category:"academic", verification:"gps_dwell",  reward_ae:350, reward_xp:240, done:false, progress:0, total:120, unit:"min" },
  { id:"w6", title:"Campus event attendance", desc:"Attend any in-person campus event (admin-verified photo)",                       tier:"weekly", category:"social",   verification:"photo",      reward_ae:400, reward_xp:280, done:false, progress:0, total:1 },

  // ─── MONTHLY (refresh 1st of month, +3,550 AE all-complete bonus) ──────────
  { id:"m1", title:"Capture the campus",   desc:"Capture every zone TYPE at least once (academic, social, recreation, residential, landmark, arena)", tier:"monthly", category:"explore",   verification:"gps_unique_types", reward_ae:800,   reward_xp:500,  reward_shards:1, done:false, progress:0, total:6 },
  { id:"m2", title:"Marathon",             desc:"Walk 100,000 cumulative steps this month",                                                              tier:"monthly", category:"wellness",  verification:"steps",            reward_ae:600,   reward_xp:400,                  done:false, progress:0, total:100000, unit:"steps" },
  { id:"m3", title:"Story chapter solver", desc:"Discover all clues in the active Story chapter and submit a final theory",                              tier:"monthly", category:"story",     verification:"story",            reward_ae:1000,  reward_xp:700,  reward_shards:1, done:false, progress:0, total:1 },
  { id:"m4", title:"Clan champion",        desc:"Donate 1,000 AE to your clan treasury",                                                                  tier:"monthly", category:"social",    verification:"counter",          reward_ae:500,   reward_xp:300,                  done:false, progress:0, total:1000, unit:"AE" },
  { id:"m5", title:"Style designer",       desc:"Submit one entry to a Style Event",                                                                      tier:"monthly", category:"creative",  verification:"submit",           reward_ae:400,   reward_xp:250,                  done:false, progress:0, total:1 },
  { id:"m6", title:"Help a fresher",       desc:"Help a first-year peer with a campus task (admin-verified)",                                             tier:"monthly", category:"community", verification:"photo",            reward_ae:250,   reward_xp:200,                  done:false, progress:0, total:1 },
];

export const MONTHLY_MISSIONS: any[] = [];

// Sample live events for the Events tab. Real events are inserted by admins.
export const LIVE_EVENTS: any[] = [
  { id:"e1", title:"Tech Fest 2026 — Opening Ceremony", desc:"QR-redeemable rewards at the main stage",   reward_ae:500,  reward_xp:300,  date_start:"2026-05-15T18:00:00Z", date_end:"2026-05-15T22:00:00Z", participants:0, max_participants:500, location:"Main Auditorium", qr_enabled:true,  category:"festival" },
  { id:"e2", title:"Inter-house Sports Day",            desc:"Scan QRs at each track event you attend",   reward_ae:300,  reward_xp:250,  date_start:"2026-05-20T08:00:00Z", date_end:"2026-05-20T17:00:00Z", participants:0, max_participants:0,   location:"Sports Complex", qr_enabled:true,  category:"sports" },
  { id:"e3", title:"Aarambh — Cultural Night",          desc:"Experience the show; grab a unique avatar item from the QR booth", reward_ae:400, reward_xp:280, date_start:"2026-05-25T19:00:00Z", date_end:"2026-05-25T23:00:00Z", participants:0, max_participants:1000, location:"Open-air Theatre", qr_enabled:true, category:"cultural" },
  { id:"e4", title:"Community Service Drive",           desc:"Volunteer for the campus tree-planting drive", reward_ae:600, reward_xp:400, date_start:"2026-06-05T07:00:00Z", date_end:"2026-06-05T11:00:00Z", participants:0, max_participants:50,  location:"Eco-Garden Zone", qr_enabled:true, category:"community" },
];

// ─── SPRITE PATHS ───────────────────────────────────────────────────────────
// Most existing entries point to the original /public/sprites/ icons.
// Items added in v5 point to /public/sprites/items/ where the LPC sprite kit
// (CC-BY-SA 3.0 / GPL 3.0 — Liberated Pixel Cup) icons were curated.
export const SPRITE_IMG: Record<string,string> = {
  // ── Original (v0–v3) ──
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

  // ── v5: 39 new LPC icons curated from
  //         github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator
  //       Cropped to 64×64 PNG and stored locally under /public/sprites/items/.
  helm_sugarloaf:   "/sprites/items/helm_sugarloaf.png",
  helm_armet:       "/sprites/items/helm_armet.png",
  helm_great:       "/sprites/items/helm_great.png",
  helm_barbuta:     "/sprites/items/helm_barbuta.png",
  helm_close:       "/sprites/items/helm_close.png",
  hat_top:          "/sprites/items/hat_top.png",
  hat_bowler:       "/sprites/items/hat_bowler.png",
  hat_crown:        "/sprites/items/hat_crown.png",
  hat_tiara:        "/sprites/items/hat_tiara.png",
  hat_wizard:       "/sprites/items/hat_wizard.png",
  hat_celestial:    "/sprites/items/hat_celestial.png",
  hat_pirate:       "/sprites/items/hat_pirate.png",
  hat_tricorne:     "/sprites/items/hat_tricorne.png",
  hat_santa:        "/sprites/items/hat_santa.png",
  hat_elf:          "/sprites/items/hat_elf.png",
  torso_chainmail:  "/sprites/items/torso_chainmail.png",
  torso_robe:       "/sprites/items/torso_robe.png",
  torso_robe_white: "/sprites/items/torso_robe_white.png",
  torso_robe_dark:  "/sprites/items/torso_robe_dark.png",
  torso_tunic:      "/sprites/items/torso_tunic.png",
  cape_teal:        "/sprites/items/cape_teal.png",
  cape_navy:        "/sprites/items/cape_navy.png",
  cape_rose:        "/sprites/items/cape_rose.png",
  cape_white:       "/sprites/items/cape_white.png",
  weap_longsword:   "/sprites/items/weap_longsword.png",
  weap_dagger:      "/sprites/items/weap_dagger.png",
  weap_scimitar:    "/sprites/items/weap_scimitar.png",
  weap_rapier:      "/sprites/items/weap_rapier.png",
  weap_mace:        "/sprites/items/weap_mace.png",
  weap_waraxe:      "/sprites/items/weap_waraxe.png",
  weap_halberd:     "/sprites/items/weap_halberd.png",
  weap_spear:       "/sprites/items/weap_spear.png",
  weap_trident:     "/sprites/items/weap_trident.png",
  weap_scythe:      "/sprites/items/weap_scythe.png",
  shield_round:     "/sprites/items/shield_round.png",
  shield_kite:      "/sprites/items/shield_kite.png",
  shield_kite_red:  "/sprites/items/shield_kite_red.png",
  shield_spartan:   "/sprites/items/shield_spartan.png",
  shield_crusader:  "/sprites/items/shield_crusader.png",
};

export const ITEM_ICONS: Record<string,string> = { clothing:"👕", armor:"🛡️", arms:"🧤", footwear:"👢", headgear:"⛑️", weapon:"⚔️", shield:"🛡️", consumable:"🧪" };

export const SHOP_ITEMS: any[] = [
  // ── Tier 1: starter items (60–450 AE) ──
  { id:"lpc_gloves",       name:"Leather Gloves",        cat:"arms",     price:120,  rarity:"common",   img:null, icon:"🧤", owned:false, featured:false, avatarSlot:"arms", avatarOptionId:"gloves" },
  { id:"lpc_armplate",     name:"Plate Gauntlets",       cat:"arms",     price:350,  rarity:"uncommon", img:null, icon:"🛡", owned:false, featured:false, avatarSlot:"arms", avatarOptionId:"plate" },
  { id:"lpc_chainmail",    name:"Chainmail Shirt",       cat:"clothing", price:220,  rarity:"uncommon", img:null, icon:"⛓️", owned:false, featured:true,  avatarSlot:"torso", avatarOptionId:"chainmail" },
  { id:"lpc_jacket",       name:"Collared Jacket",       cat:"clothing", price:180,  rarity:"uncommon", img:null, icon:"🎩", owned:false, featured:false, avatarSlot:"torso", avatarOptionId:"jacket" },
  { id:"lpc_leggings",     name:"Reinforced Leggings",   cat:"clothing", price:150,  rarity:"common",   img:null, icon:"🩱", owned:false, featured:false, avatarSlot:"legs", avatarOptionId:"leggings" },
  { id:"lpc_shorts",       name:"Campus Shorts",         cat:"clothing", price:80,   rarity:"common",   img:null, icon:"🩳", owned:false, featured:false, avatarSlot:"legs", avatarOptionId:"shorts" },
  { id:"lpc_armleg",       name:"Armored Leggings",      cat:"armor",    price:300,  rarity:"uncommon", img:null, icon:"🛡", owned:false, featured:false, avatarSlot:"legs", avatarOptionId:"armour" },
  { id:"lpc_sandals",      name:"Campus Sandals",        cat:"footwear", price:60,   rarity:"common",   img:null, icon:"🩴", owned:false, featured:false, avatarSlot:"feet", avatarOptionId:"sandals" },
  { id:"lpc_dagger",       name:"Iron Dagger",           cat:"weapon",   price:150,  rarity:"common",   img:null, icon:"🗡️", owned:false, featured:false, weaponType:"sword" },
  { id:"lpc_longsw",       name:"Longsword",             cat:"weapon",   price:350,  rarity:"uncommon", img:null, icon:"⚔️", owned:false, featured:true,  weaponType:"sword" },
  { id:"lpc_mace",         name:"War Mace",              cat:"weapon",   price:280,  rarity:"uncommon", img:null, icon:"🪓", owned:false, featured:false, weaponType:"blunt" },
  { id:"lpc_halberd",      name:"Halberd",               cat:"weapon",   price:450,  rarity:"rare",     img:null, icon:"⚔️", owned:false, featured:false, weaponType:"polearm" },
  { id:"lpc_spear",        name:"Battle Spear",          cat:"weapon",   price:280,  rarity:"uncommon", img:null, icon:"🏹", owned:false, featured:false, weaponType:"polearm" },
  { id:"lpc_bow",          name:"Hunter's Bow",          cat:"weapon",   price:320,  rarity:"uncommon", img:null, icon:"🏹", owned:false, featured:false, weaponType:"ranged" },
  { id:"lpc_staff",        name:"Arcane Staff",          cat:"weapon",   price:400,  rarity:"rare",     img:null, icon:"🪄", owned:false, featured:false, weaponType:"magic" },
  { id:"lpc_shield_round", name:"Round Shield",          cat:"shield",   price:250,  rarity:"uncommon", img:null, icon:"🛡", owned:false, featured:false, avatarSlot:"shield", avatarOptionId:"round" },

  // ── Consumables ──
  { id:"lpc_xpboost",      name:"XP Boost Potion",       cat:"consumable",price:150, rarity:"uncommon", img:null, icon:"🧪", owned:false, featured:false },
  { id:"lpc_shield_item",  name:"Zone Shield (1h)",      cat:"consumable",price:250, rarity:"rare",     img:null, icon:"🔰", owned:false, featured:false },
  { id:"streak_shield",    name:"Streak Shield",         cat:"consumable",price:300, rarity:"rare",     img:null, icon:"🛡️", owned:false, featured:true },

  // ── v5: Tier 1.5 — LPC headgear (250–600 AE) ──
  { id:"helm_close",       name:"Close Helm",            cat:"head",     price:280,  rarity:"common",   img:"/sprites/items/helm_close.png",       icon:"⛑️", owned:false, featured:false, avatarSlot:"head" },
  { id:"helm_barbuta",     name:"Barbuta Helm",          cat:"head",     price:320,  rarity:"uncommon", img:"/sprites/items/helm_barbuta.png",     icon:"⛑️", owned:false, featured:false, avatarSlot:"head" },
  { id:"helm_sugarloaf",   name:"Sugarloaf Helm",        cat:"head",     price:380,  rarity:"uncommon", img:"/sprites/items/helm_sugarloaf.png",   icon:"⛑️", owned:false, featured:false, avatarSlot:"head" },
  { id:"helm_great",       name:"Great Helm",            cat:"head",     price:480,  rarity:"rare",     img:"/sprites/items/helm_great.png",       icon:"⛑️", owned:false, featured:true,  avatarSlot:"head" },
  { id:"helm_armet",       name:"Armet Helm",            cat:"head",     price:560,  rarity:"rare",     img:"/sprites/items/helm_armet.png",       icon:"⛑️", owned:false, featured:false, avatarSlot:"head" },

  // ── Tier 2 cosmetics (2,000–5,000 AE per doc) ──
  { id:"hat_top",          name:"Top Hat",               cat:"cosmetic", price:2000, rarity:"epic",     img:"/sprites/items/hat_top.png",          icon:"🎩", owned:false, featured:true,  avatarSlot:"head" },
  { id:"hat_bowler",       name:"Bowler Hat",            cat:"cosmetic", price:2200, rarity:"epic",     img:"/sprites/items/hat_bowler.png",       icon:"🎩", owned:false, featured:false, avatarSlot:"head" },
  { id:"hat_wizard",       name:"Wizard's Hat",          cat:"cosmetic", price:2500, rarity:"epic",     img:"/sprites/items/hat_wizard.png",       icon:"🧙", owned:false, featured:false, avatarSlot:"head" },
  { id:"hat_pirate",       name:"Pirate Bicorne",        cat:"cosmetic", price:2800, rarity:"epic",     img:"/sprites/items/hat_pirate.png",       icon:"🏴‍☠️", owned:false, featured:false, avatarSlot:"head" },
  { id:"cape_teal",        name:"Teal Cape",             cat:"cosmetic", price:1800, rarity:"epic",     img:"/sprites/items/cape_teal.png",        icon:"🦸", owned:false, featured:false, avatarSlot:"cape" },
  { id:"cape_navy",        name:"Navy Cape",             cat:"cosmetic", price:1800, rarity:"epic",     img:"/sprites/items/cape_navy.png",        icon:"🦸", owned:false, featured:false, avatarSlot:"cape" },
  { id:"cape_rose",        name:"Rose Cape",             cat:"cosmetic", price:1800, rarity:"epic",     img:"/sprites/items/cape_rose.png",        icon:"🦸", owned:false, featured:false, avatarSlot:"cape" },
  { id:"weap_scimitar",    name:"Curved Scimitar",       cat:"weapon",   price:2200, rarity:"epic",     img:"/sprites/items/weap_scimitar.png",    icon:"⚔️", owned:false, featured:false, weaponType:"sword" },
  { id:"weap_rapier",      name:"Slim Rapier",           cat:"weapon",   price:2400, rarity:"epic",     img:"/sprites/items/weap_rapier.png",      icon:"⚔️", owned:false, featured:false, weaponType:"sword" },
  { id:"weap_waraxe",      name:"War Axe",               cat:"weapon",   price:3200, rarity:"epic",     img:"/sprites/items/weap_waraxe.png",      icon:"🪓", owned:false, featured:false, weaponType:"blunt" },
  { id:"weap_trident",     name:"Trident",               cat:"weapon",   price:3500, rarity:"epic",     img:"/sprites/items/weap_trident.png",     icon:"🔱", owned:false, featured:false, weaponType:"polearm" },
  { id:"shield_kite",      name:"Kite Shield",           cat:"shield",   price:2000, rarity:"epic",     img:"/sprites/items/shield_kite.png",      icon:"🛡️", owned:false, featured:false, avatarSlot:"shield" },
  { id:"shield_kite_red",  name:"Crimson Kite Shield",   cat:"shield",   price:2400, rarity:"epic",     img:"/sprites/items/shield_kite_red.png",  icon:"🛡️", owned:false, featured:false, avatarSlot:"shield" },
  { id:"shield_spartan",   name:"Spartan Shield",        cat:"shield",   price:3200, rarity:"epic",     img:"/sprites/items/shield_spartan.png",   icon:"🛡️", owned:false, featured:false, avatarSlot:"shield" },
  { id:"torso_chainmail2", name:"Heavy Chainmail",       cat:"clothing", price:2400, rarity:"epic",     img:"/sprites/items/torso_chainmail.png",  icon:"⛓️", owned:false, featured:false, avatarSlot:"torso" },
  { id:"torso_robe",       name:"Cleric's Robe",         cat:"clothing", price:1900, rarity:"epic",     img:"/sprites/items/torso_robe.png",       icon:"🥋", owned:false, featured:false, avatarSlot:"torso" },
  { id:"torso_robe_white", name:"Pilgrim's Robe",        cat:"clothing", price:1900, rarity:"epic",     img:"/sprites/items/torso_robe_white.png", icon:"🥋", owned:false, featured:false, avatarSlot:"torso" },
  { id:"torso_robe_dark",  name:"Acolyte's Robe",        cat:"clothing", price:2100, rarity:"epic",     img:"/sprites/items/torso_robe_dark.png",  icon:"🥋", owned:false, featured:false, avatarSlot:"torso" },
  { id:"torso_tunic",      name:"Linen Tunic",           cat:"clothing", price:1500, rarity:"epic",     img:"/sprites/items/torso_tunic.png",      icon:"👔", owned:false, featured:false, avatarSlot:"torso" },

  // ── Tier 3 prestige (6,000+ AE) ──
  { id:"hat_crown",        name:"Royal Crown",           cat:"cosmetic", price:8000, rarity:"legendary",img:"/sprites/items/hat_crown.png",        icon:"👑", owned:false, featured:true,  avatarSlot:"head" },
  { id:"hat_tiara",        name:"Diamond Tiara",         cat:"cosmetic", price:9000, rarity:"legendary",img:"/sprites/items/hat_tiara.png",        icon:"👑", owned:false, featured:false, avatarSlot:"head" },
  { id:"weap_longsword2",  name:"Heroic Longsword",      cat:"weapon",   price:6500, rarity:"legendary",img:"/sprites/items/weap_longsword.png",   icon:"⚔️", owned:false, featured:false, weaponType:"sword" },
  { id:"weap_halberd2",    name:"Champion's Halberd",    cat:"weapon",   price:7200, rarity:"legendary",img:"/sprites/items/weap_halberd.png",     icon:"⚔️", owned:false, featured:false, weaponType:"polearm" },
  { id:"shield_crusader",  name:"Crusader Shield",       cat:"shield",   price:6500, rarity:"legendary",img:"/sprites/items/shield_crusader.png",  icon:"🛡️", owned:false, featured:false, avatarSlot:"shield" },

  // Original cape/crown/banner (kept for back-compat) — emoji icons
  { id:"cape_legend",      name:"Cape of the Legend",    cat:"clothing", price:2200, rarity:"epic",     img:"/sprites/items/cape_white.png",       icon:"🦸", owned:false, featured:false, avatarSlot:"cape" },
  { id:"crown_silver",     name:"Silver Crown",          cat:"cosmetic", price:3500, rarity:"epic",     img:"/sprites/items/hat_tiara.png",        icon:"👑", owned:false, featured:false, avatarSlot:"head" },
  { id:"banner_dawn",      name:"Banner of Dawn",        cat:"cosmetic", price:8000, rarity:"legendary",img:"/sprites/items/cape_rose.png",        icon:"🏴", owned:false, featured:true,  avatarSlot:"cape" },
];

// ─── EVENT-ONLY ITEMS ─────────────────────────────────────────────────────────
// These cosmetics are NOT purchasable in the Shop. They can ONLY be obtained
// by scanning event QR codes. Admins choose them when generating QR rewards.
export const EVENT_ITEMS: any[] = [
  { id:"hat_celestial",  name:"Celestial Hood (Event)",  cat:"cosmetic", rarity:"epic",      img:"/sprites/items/hat_celestial.png", icon:"🌙", avatarSlot:"head", eventOnly:true },
  { id:"hat_tricorne",   name:"Tricorne Hat (Event)",    cat:"cosmetic", rarity:"epic",      img:"/sprites/items/hat_tricorne.png",  icon:"🎩", avatarSlot:"head", eventOnly:true },
  { id:"hat_santa",      name:"Festive Cap (Event)",    cat:"cosmetic", rarity:"epic",      img:"/sprites/items/hat_santa.png",     icon:"🎅", avatarSlot:"head", eventOnly:true },
  { id:"hat_elf",        name:"Elf Hat (Event)",         cat:"cosmetic", rarity:"epic",      img:"/sprites/items/hat_elf.png",       icon:"🧝", avatarSlot:"head", eventOnly:true },
  { id:"cape_white",     name:"Founder's Cape (Event)",  cat:"cosmetic", rarity:"legendary", img:"/sprites/items/cape_white.png",    icon:"🦸", avatarSlot:"cape", eventOnly:true },
  { id:"weap_scythe",    name:"Reaper's Scythe (Event)", cat:"weapon",   rarity:"legendary", img:"/sprites/items/weap_scythe.png",   icon:"🪦", weaponType:"polearm", eventOnly:true },
];

// ─── ITEM CATALOG ─────────────────────────────────────────────────────────────
// Master list (shop + event items) — used by the admin QR generator's reward
// dropdown so admins can pick any item as a QR reward, including event-only
// cosmetics that aren't available in the shop.
export const ITEM_CATALOG: any[] = [...SHOP_ITEMS, ...EVENT_ITEMS];

export const INIT_SHOP_ITEMS: any[] = SHOP_ITEMS.map((item: any) => ({
  ...item,
  priceAE: item.price,
  type: item.rarity === "legendary" ? "limited" : "general",
  stock: item.rarity === "legendary" ? 5 : item.rarity === "epic" ? 15 : null,
  sold: Math.floor(Math.random() * 20),
  active: true,
  soulBound: item.cat === "consumable",
}));

export const PROOF_SUBMISSIONS: ZRProof[] = [];
export const COMMUNITY_ITEMS: ZRShopItem[] = [];

export const STORY: any = { ch:0, title:"Coming Soon", sub:"Story quests are not yet available.", clues:0, total:0 };
export const WEEKLY: any = { done:0, total:0, days:0 };

export const STYLE_SUBMISSIONS_INIT: ZRStyleSub[] = [];

export const STYLE_EVENT_LIVE: any = {
  phase:"submission", weekId:1,
  theme:"No active style event.",
  submissionEnds:"TBD", votingEnds:"TBD",
  gallery:[],
};

export const CL_USER: any = {
  name:"Player", level:1, ae:0, shards:0,
  clan:null,
};

export const MEMBERS: any[] = [];

export const GAME_RULES: any = {
  // Combat / capture
  ZONE_ATTACK_COOLDOWN_HOURS: 24,
  ZONE_RECAPTURE_COOLDOWN_MINS: 30,        // doc: 30-min cooldown after ownership change
  ZONE_GEO_RADIUS_METRES: 100,
  ZONE_CAPTURE_SECS_STANDARD: 3 * 60,      // doc: 3-min countdown for standard zones
  ZONE_CAPTURE_SECS_LANDMARK: 5 * 60,      // doc: 5-min countdown for premium/landmark zones
  // Clan
  WAR_DECLARE_COST_AE: 200,
  CLAN_CREATE_COST_AE: 500,
  CLAN_REINFORCE_COST_AE: 200,
  CLAN_UPGRADE_ZONE_COST_AE: 800,
  CLAN_BROADCAST_COST_AE: 100,
  CLAN_CREATE_MIN_LEVEL: 3,
  CLAN_MAX_MEMBERS: 20,
  // Capture rewards
  CAPTURE_AE_UNCLAIMED: 50,
  CAPTURE_AE_CONTESTED: 150,
  HOLD_24H_AE_BONUS: 200,
  CLUSTER_CONTROL_AE_BONUS: 500,
  // Marketplace / style
  MARKETPLACE_FEE_PCT: 5,
  STYLE_DESIGNER_ROYALTY_PCT: 10,
  STYLE_EVENT_PUBLISH_CAP: 50,
  // Misc
  DEV_LEVEL_MULTIPLIER_PCT: 15,
  CONTROL_STRENGTH_DECAY_PER_HOUR: 2,
};
const _now = Date.now();
export const _hAgo = (h: number) => new Date(_now - h * 3600000).toISOString();

export function clanZoneOnCooldown(zone: any) {
  if (!zone.lastAttackedAt) return false;
  return (_now - new Date(zone.lastAttackedAt).getTime()) < GAME_RULES.ZONE_ATTACK_COOLDOWN_HOURS * 3600000;
}
export function clanCooldownRemaining(zone: any) {
  if (!zone.lastAttackedAt) return null;
  const rem = GAME_RULES.ZONE_ATTACK_COOLDOWN_HOURS * 3600000 - (_now - new Date(zone.lastAttackedAt).getTime());
  if (rem <= 0) return null;
  const h = Math.floor(rem / 3600000), m = Math.floor((rem % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export const ZONES: any[] = [];
export const ATTACKABLE_ZONES: any[] = [];
export const WAR_LOG: any[] = [];
export const ENEMY_CLANS: any[] = [];
export const TREASURY_LOG: ZRTreasuryEntry[] = [];
export const SUGGESTED_CLANS: any[] = [];

export const MOODS: Mood[] = [
  { s:5, e:"😄", l:"Great", c:TG },
  { s:4, e:"🙂", l:"Good",  c:"#34D399" },
  { s:3, e:"😐", l:"Okay",  c:TA },
  { s:2, e:"😔", l:"Low",   c:"#F97316" },
  { s:1, e:"😞", l:"Bad",   c:TR },
];

export const TABS = [
  { id:"market",   icon:"🛒", label:"Market" },
  { id:"missions", icon:"🎯", label:"Quests" },
  { id:"home",     icon:"⚡", label:"Home",  center:true },
  { id:"clan",     icon:"⚔️", label:"Clan" },
  { id:"profile",  icon:"👤", label:"Profile" },
];
