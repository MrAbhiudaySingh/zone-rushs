// @ts-nocheck
// ═══════════════════════════════════════════════════════════════════════════════
// ZONERUSH — Shared Constants, Tokens & Default Data
// ═══════════════════════════════════════════════════════════════════════════════

import type { ZRMission, ZREvent, ZRShopItem, ZRProof, ZRStyleSub, ZRStyleEvent, ZRNotif, ZRTreasuryEntry, Mood } from "./types";

// ─── ASSET PATHS ───────────────────────────────────────────────────────────────
export const IMG: Record<string, string> = {
  storyArt:   "/assets/story_chapter1.png",
  denNeon:    "/assets/den_neon.png",
  denRooftop: "/assets/den_rooftop.png",
};

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
  xp:0, xpNext:1000,
  ae:0, shards:0,
  streak:0, shields:0,
  combatRank:"Unranked", influenceRank:"Unranked",
  clan:null,
};

export const MISSIONS: ZRMission[] = [];
export const MONTHLY_MISSIONS: ZRMission[] = [];
export const LIVE_EVENTS: ZREvent[] = [];

export const SPRITE_IMG: Record<string,string> = {
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

export const ITEM_ICONS: Record<string,string> = { clothing:"👕", armor:"🛡️", arms:"🧤", footwear:"👢", headgear:"⛑️", weapon:"⚔️", shield:"🛡️", consumable:"🧪" };

export const SHOP_ITEMS: any[] = [
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
  { id:"lpc_xpboost",      name:"XP Boost Potion",       cat:"consumable",price:150, rarity:"uncommon", img:null, icon:"🧪", owned:false, featured:false },
  { id:"lpc_shield_item",  name:"Zone Shield (1h)",      cat:"consumable",price:250, rarity:"rare",     img:null, icon:"🔰", owned:false, featured:false },
];

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

export const GAME_RULES: any = { ZONE_ATTACK_COOLDOWN_HOURS:24, WAR_DECLARE_COST_AE:200, ZONE_GEO_RADIUS_METRES:100 };
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
