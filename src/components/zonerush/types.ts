import type { User } from "@supabase/supabase-js";
import type { Dispatch, SetStateAction, CSSProperties, ReactNode } from "react";

// ─── Data Models ─────────────────────────────────────────────────────────────

export interface ZRClan {
  id: string;
  name: string;
  tag: string;
  motto?: string;
  color: string;
  founded: string;
  memberRole: string;
  treasury: number;
  weeklyXP: number;
  rank: number;
  cpr: number;
  zonesHeld: number;
  totalMembers: number;
  maxMembers: number;
}

export interface ZRUser {
  name: string;
  level: number;
  xp: number;
  xpNext: number;
  ae: number;
  shards: number;
  streak: number;
  shields: number;
  combatRank: string;
  influenceRank: string;
  clan: ZRClan | null;
  storyClues?: number;
  [key: string]: unknown; // allow extra fields
}

export interface ZRMission {
  id: string;
  title: string;
  description?: string | null;
  cat: string;
  icon?: string | null;
  type: string;
  reward: string;
  xp: string;
  aether_reward: number;
  xp_reward: number;
  shard_reward: number;
  progress: number;
  goal: number;
  tier: string;
  requires_clan: boolean;
  color: string;
  timer: string;
  week?: boolean;
  month?: boolean;
  _disabled?: boolean;
  _progressId?: string;
  [key: string]: unknown;
}

export interface ZRShopItem {
  id: string;
  name: string;
  cat: string;
  price: number;
  priceAE?: number;
  rarity: string;
  img?: string | null;
  icon: string;
  owned: boolean;
  featured: boolean;
  type?: string;
  stock?: number | null;
  sold?: number;
  active?: boolean;
  soulBound?: boolean;
  avatarSlot?: string;
  avatarOptionId?: string;
  weaponType?: string;
  designer?: string;
  isWinner?: boolean;
  _isMarketListing?: boolean;
  _inventoryId?: string;
  _sellerId?: string;
  seller?: string;
  [key: string]: unknown;
}

export interface ZREvent {
  id: string | number;
  title: string;
  type?: string;
  status?: string;
  desc?: string;
  endDate?: string;
  eligibility?: string;
  participants?: number;
  maxParticipants?: number | null;
  reward?: string;
  color?: string;
  [key: string]: unknown;
}

export interface ZRStyleEvent {
  phase: string;
  weekId: number;
  theme: string;
  submissionEnds: string;
  votingEnds: string;
  gallery: ZRGalleryItem[];
  [key: string]: unknown;
}

export interface ZRGalleryItem {
  id: string;
  userName: string;
  title: string;
  votes: number;
  isMine?: boolean;
  [key: string]: unknown;
}

export interface ZRStyleSub {
  id: string;
  userId: string;
  userName: string;
  title: string;
  votes: number;
  status: string;
  submittedAt: string;
  flagged?: boolean;
  rejectReason?: string;
  [key: string]: unknown;
}

export interface ZRProof {
  id: string;
  userId: string;
  userName: string;
  missionId: string;
  missionTitle: string;
  cat: string;
  note?: string;
  imgUrl?: string;
  status: string;
  reward?: number;
  xp?: number;
  rejectReason?: string;
  [key: string]: unknown;
}

export interface ZRNotif {
  id: string | number;
  type: string;
  msg: string;
}

export interface ZRZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  tier: number;
  zone_type: string;
  owner_clan_id: string | null;
  owner_clan?: { name: string; tag: string; color: string } | null;
  control_strength: number;
  development_level: number;
  aether_rate_per_hour: number;
  contest_status: string;
  last_capture_at: string | null;
  [key: string]: unknown;
}

export interface ZRTreasuryEntry {
  amount: number;
  [key: string]: unknown;
}

// ─── Toast ───────────────────────────────────────────────────────────────────

export interface Toast {
  id: number;
  msg: string;
  type: string;
  duration: number;
}

export type ToastHandler = (t: Toast) => void;

// ─── Mood ────────────────────────────────────────────────────────────────────

export interface Mood {
  s: number;
  e: string;
  l: string;
  c: string;
}

// ─── AppContext ──────────────────────────────────────────────────────────────

export interface AppContextType {
  authUser: User | null;
  dbReady: boolean;
  sharedUser: ZRUser;
  setSharedUser: Dispatch<SetStateAction<ZRUser>> | ((updater: ZRUser | ((prev: ZRUser) => ZRUser)) => void);
  sharedMissions: ZRMission[];
  setSharedMissions: Dispatch<SetStateAction<ZRMission[]>>;
  sharedEvents: ZREvent[];
  setSharedEvents: Dispatch<SetStateAction<ZREvent[]>>;
  sharedShopItems: ZRShopItem[];
  setSharedShopItems: Dispatch<SetStateAction<ZRShopItem[]>>;
  sharedStyleEvent: ZRStyleEvent;
  setSharedStyleEvent: Dispatch<SetStateAction<ZRStyleEvent>>;
  sharedStyleSubs: ZRStyleSub[];
  setSharedStyleSubs: Dispatch<SetStateAction<ZRStyleSub[]>>;
  sharedProofs: ZRProof[];
  setSharedProofs: Dispatch<SetStateAction<ZRProof[]>>;
  playerNotifs: ZRNotif[];
  setPlayerNotifs: Dispatch<SetStateAction<ZRNotif[]>>;
  completedMissions: Set<string>;
  joinedEvents: Set<string | number>;
  marketplaceListings: ZRShopItem[];
  listedItems: Set<string>;
  listingPrices: Record<string, number>;

  // Marketplace
  listItemForSale: (itemId: string, price: number) => Promise<void>;
  unlistItem: (itemId: string) => Promise<void>;
  buyMarketplaceListing: (inventoryId: string, itemId: string, price: number, sellerId?: string) => Promise<void>;

  // User mutations
  completeMission: (id: string, ae: number, xp: number) => void;
  purchaseItem: (id: string, price: number) => void;
  joinEvent: (id: string | number) => void;
  joinClan: (name: string, tag: string, color: string) => Promise<void>;
  leaveClan: () => Promise<void>;
  donateToClan: (amount: number) => Promise<void>;
  startZoneCapture: () => void;
  captureZone: () => void;
  defendZone: () => void;
  discoverClue: () => void;

  // Admin mutations
  approveStyleSub: (id: string) => void;
  rejectStyleSub: (id: string, reason?: string) => void;
  approveProof: (id: string) => void;
  rejectProof: (id: string, reason?: string) => void;
  setStylePhase: (phase: string) => void;
  toggleShopItem: (id: string) => void;
  addShopItem: (item: ZRShopItem) => void;
  toggleMission: (id: string) => void;
  addEvent: (ev: ZREvent) => void;
  endEvent: (id: string | number) => void;
  publishWinnerToShop: (sub: ZRStyleSub) => void;
  submitProof: (proof: ZRProof) => void;
  warnPlayer: (name: string) => void;
  banPlayer: (name: string) => void;
  createClan: (name: string, tag: string, motto?: string) => Promise<void>;
}

// ─── Component Props ────────────────────────────────────────────────────────

export interface WellbeingOverlayProps {
  onDone: (moodScore: number | null, freeText: string | null, outreachRequested: boolean, consentShare?: boolean) => void;
}

export interface ZoneAlertProps {
  onDismiss: () => void;
}

export interface HudHeaderProps {
  user: ZRUser;
  onAdminAccess?: () => void;
}

export interface XpTrackProps {
  user: ZRUser;
}

export interface StatStripProps {
  weekly?: unknown;
}

export interface ChipProps {
  color: string;
  bg?: string;
  icon?: string;
  label: string | number;
  onClick?: () => void;
  style?: CSSProperties;
}

export interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  accent?: string;
  gradient?: string;
  onClick?: () => void;
  className?: string;
}

export interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  height?: number;
}

export interface TabBarProps {
  tabs: [string, string, number?][];
  active: string;
  onSelect: (id: string) => void;
  style?: CSSProperties;
}

export interface MissionCardProps {
  m: ZRMission;
  idx?: number;
}

export interface StoryCardProps {
  story: { ch: number; title: string; sub: string; clues: number; total: number };
}

export interface StyleEventGalleryProps {
  event: ZRStyleEvent;
  onBack: () => void;
}

export interface QuestScreenProps {
  missions: ZRMission[];
  events: ZREvent[];
  styleEvent: ZRStyleEvent;
  onStyleEvent: () => void;
}

export interface MarketScreenProps {
  user: ZRUser;
}

export interface ClanScreenProps {
  userOverride?: ZRUser;
  onBack?: () => void;
}

export interface NoClanScreenProps {
  user: ZRUser;
  canCreate: boolean;
  onBack?: () => void;
}

export interface ClanHubProps {
  user: ZRUser;
  onBack?: () => void;
}

export interface WarTabProps {
  clan: ZRClan;
  isLeader: boolean;
  isOfficer: boolean;
}

export interface TreasuryTabProps {
  clan: ZRClan;
  isLeader: boolean;
}

export interface PlayerModalProps {
  player: { id: string | number; name: string; email?: string; joinDate?: string; [key: string]: unknown };
  onClose: () => void;
  onWarn: (id: string | number) => void;
  onBan: (id: string | number) => void;
}

export interface AuthScreenProps {
  onAuth: (user: User) => void;
}

export interface AdminSectionTitleProps {
  title: string;
  sub?: string;
}

export interface KpiCardProps {
  label: string;
  val: string;
  delta: string;
  color: string;
}

export interface StatusPillProps {
  status: string;
}

export interface StrengthBarProps {
  val: number;
}

export interface AdminTableProps {
  cols: string[];
  rows: ReactNode[][];
}

export interface MiniLineChartProps {
  data: number[];
  color: string;
  min?: number;
  max?: number;
  label?: string;
}

export interface DualLineChartProps {
  data1: number[];
  data2: number[];
  color1: string;
  color2: string;
}

export interface DonutChartProps {
  segments: { val: number; label: string; color: string }[];
}
