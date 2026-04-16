// @ts-nocheck
import { useState, useEffect, useContext, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ZRNotif } from "./types";
import { AppContext } from "./AppContext";
import { showToast, ToastContainer } from "./toast";
import {
  USER, MISSIONS, LIVE_EVENTS, SHOP_ITEMS, INIT_SHOP_ITEMS,
  PROOF_SUBMISSIONS, COMMUNITY_ITEMS, STYLE_SUBMISSIONS_INIT,
  STYLE_EVENT_LIVE, CL_USER, ENEMY_CLANS, SUGGESTED_CLANS,
  T, TL, TG, TA, TY, TR, TB, TX, TM,
} from "./constants";
import { AuthScreen } from "./screens/AuthScreen";
import { HomeScreen } from "./screens/HomeScreen";

// ═══════════════════════════════════════════════════════════════════════════════
// ZONERUSH APP — Root shell with context provider
// ═══════════════════════════════════════════════════════════════════════════════

export default function ZoneRushApp() {
  const [dbReady, setDbReady] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);

  // Don't load stale demo data from localStorage — always start from defaults
  // Real data will be loaded from DB when authenticated
  const [sharedUser, _setSharedUser] = useState<any>({ ...USER });
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
  const [sharedMissions,   setSharedMissions]   = useState<any[]>(MISSIONS);
  const [sharedEvents,     setSharedEvents]     = useState<any[]>(LIVE_EVENTS);
  const [sharedShopItems,  setSharedShopItems]  = useState<any[]>(
    INIT_SHOP_ITEMS.map((it: any) => ({
      ...it, price:it.priceAE, rarity:it.rarity,
      icon:(SHOP_ITEMS.find((s: any) => s.id===it.id)||{}).icon||"🎁",
      owned: it.priceAE === 0, featured:["lpc_long","lpc_leather","lpc_plate"].includes(it.id),
    }))
  );
  const [sharedStyleEvent, setSharedStyleEvent] = useState<any>({
    ...STYLE_EVENT_LIVE,
    gallery:[],
  });
  const [sharedStyleSubs,  setSharedStyleSubs]  = useState<any[]>(STYLE_SUBMISSIONS_INIT);
  const [sharedProofs,     setSharedProofs]     = useState<any[]>(PROOF_SUBMISSIONS);
  const [playerNotifs,     setPlayerNotifs]     = useState<ZRNotif[]>([]);
  const [completedMissions, _setCompletedMissions] = useState<Set<string>>(() => {
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
  const [joinedEvents, setJoinedEvents] = useState<Set<string | number>>(new Set());
  const [marketplaceListings, setMarketplaceListings] = useState<any[]>([]);
  const [listedItems, setListedItems] = useState<Set<string>>(new Set());
  const [listingPrices, setListingPrices] = useState<Record<string, number>>({});

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
          setSharedMissions(dbQuests.map((q: any) => ({
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
          setSharedShopItems(dbShop.map((it: any) => ({
            id: it.id, name: it.name, cat: it.category, price: it.price_ae, priceAE: it.price_ae,
            rarity: it.rarity, icon: it.icon, type: it.item_type, stock: it.stock,
            sold: it.sold, active: it.active, soulBound: it.soul_bound,
            owned: false, featured: it.featured,
          })));
        }

        // Fetch events
        const { data: dbEvents } = await supabase.from("events").select("*").eq("status", "active");
        if (dbEvents?.length) {
          setSharedEvents(dbEvents.map((e: any) => ({
            id: e.id, title: e.title, type: e.type, status: e.status,
            desc: e.description, endDate: e.end_date ? new Date(e.end_date).toLocaleDateString("en-GB", { month:"short", day:"numeric" }) : "",
            reward: e.reward, participants: 0, maxParticipants: e.max_participants,
            eligibility: e.eligibility, color: e.color,
          })));
          // Fetch participant counts
          for (const e of dbEvents) {
            supabase.from("event_participants").select("id", { count: "exact", head: true }).eq("event_id", e.id)
              .then(({ count }) => {
                if (count !== null) setSharedEvents((es: any) => es.map((ev: any) => ev.id === e.id ? { ...ev, participants: count } : ev));
              });
          }
        }

        // Fetch zones (used by clan screens and map)
        const { data: dbZones } = await supabase.from("zones").select("*, owner_clan:clans!zones_owner_clan_id_fkey(name, tag, color)");
        if (dbZones?.length) {
          (window as any).__zr_zones = dbZones;
        }

        // Fetch clans (used by leaderboard and clan join)
        const { data: dbClans } = await supabase.from("clans").select("*").order("rank");
        if (dbClans?.length) {
          (window as any).__zr_clans = dbClans;
        }

        // Fetch style events
        const { data: dbStyleEvents } = await supabase.from("style_events").select("*").order("created_at", { ascending: false }).limit(1);
        if (dbStyleEvents?.length) {
          const se = dbStyleEvents[0];
          const { data: dbStyleSubs } = await supabase.from("style_submissions").select("*").eq("style_event_id", se.id);
          if (dbStyleSubs?.length) {
            setSharedStyleSubs(dbStyleSubs.map((s: any) => ({
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
          (window as any).__zr_config = {};
          dbConfig.forEach((c: any) => { (window as any).__zr_config[c.key] = c.value; });
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
      // Fetch profile — create one if it doesn't exist yet
      let { data: profile } = await supabase.from("profiles").select("*").eq("user_id", authUser.id).single();
      if (!profile) {
        const { data: newProfile } = await supabase.from("profiles").upsert({
          user_id: authUser.id,
          display_name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "Player",
          roll_number: authUser.user_metadata?.roll_number || null,
          year: authUser.user_metadata?.year || null,
          course: authUser.user_metadata?.course || null,
          specialisation: authUser.user_metadata?.specialisation || null,
          xp_next: 100,
        }, { onConflict: "user_id" }).select("*").single();
        profile = newProfile;
      }
      if (profile) {
        const lastActive = profile.updated_at ? new Date(profile.updated_at) : null;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lastDay = lastActive ? new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate()) : null;
        const daysSinceActive = lastDay ? Math.floor((today - lastDay) / 86400000) : 999;
        
        let currentStreak = profile.streak || 0;
        if (daysSinceActive > 1) {
          currentStreak = 0;
          await supabase.from("profiles").update({ streak: 0, updated_at: new Date().toISOString() }).eq("user_id", authUser.id);
        } else if (daysSinceActive === 1) {
          currentStreak = (profile.streak || 0) + 1;
          await supabase.from("profiles").update({ streak: currentStreak, updated_at: new Date().toISOString() }).eq("user_id", authUser.id);
        }
        if (daysSinceActive === 0) {
          await supabase.from("profiles").update({ updated_at: new Date().toISOString() }).eq("user_id", authUser.id);
        }

        _setSharedUser({
          name: profile.display_name || authUser.email,
          level: profile.level, xp: profile.xp, xpNext: profile.xp_next,
          ae: profile.ae, shards: profile.shards,
          streak: currentStreak, shields: profile.shields,
          combatRank: profile.combat_rank, influenceRank: profile.influence_rank,
          clan: null,
        });
      }

      // Fetch user's clan membership
      const { data: membership } = await supabase.from("clan_members").select("*, clan:clans(*)").eq("user_id", authUser.id).maybeSingle();
      if (membership?.clan) {
        const c = membership.clan;
        const { count: memberCount } = await supabase.from("clan_members").select("id", { count: "exact", head: true }).eq("clan_id", c.id);
        const clanZones = ((window as any).__zr_zones || []).filter((z: any) => z.captured_by === c.id);
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
        await supabase.from("profiles").update({ clan_id: c.id }).eq("user_id", authUser.id);
      }

      // Fetch quest progress
      const { data: questProgress } = await supabase.from("quest_progress").select("*").eq("user_id", authUser.id);
      if (questProgress?.length) {
        const completedIds = new Set(questProgress.filter((qp: any) => qp.status === "completed" || qp.status === "claimed").map((qp: any) => qp.quest_definition_id));
        _setCompletedMissions(completedIds);
        setSharedMissions((ms: any) => ms.map((m: any) => {
          const qp = questProgress.find((q: any) => q.quest_definition_id === m.id);
          return qp ? { ...m, progress: qp.current_value, _progressId: qp.id } : m;
        }));
      }

      // Fetch user inventory
      const { data: inventory } = await supabase.from("user_inventory").select("item_id").eq("user_id", authUser.id);
      if (inventory?.length) {
        const ownedIds = new Set(inventory.map((i: any) => i.item_id));
        setSharedShopItems(items => items.map((it: any) => ({ ...it, owned: ownedIds.has(it.id) })));
      }

      // Fetch user's event participations
      const { data: participations } = await supabase.from("event_participants").select("event_id").eq("user_id", authUser.id);
      if (participations?.length) {
        setJoinedEvents(new Set(participations.map((p: any) => p.event_id)));
      }

      // Fetch marketplace listings
      const { data: listings } = await supabase.from("user_inventory").select("*, item:shop_items(*), seller:profiles!user_inventory_user_id_fkey(display_name, id)").eq("listed_for_sale", true);
      if (listings?.length) {
        const mapped = listings.filter((l: any) => l.item && l.user_id !== authUser.id).map((l: any) => ({
          ...l.item, id: l.item.id, name: l.item.name, cat: l.item.category,
          price: l.sale_price_ae, rarity: l.item.rarity, icon: l.item.icon,
          seller: l.seller?.display_name || "Player", _isMarketListing: true,
          _inventoryId: l.id, _sellerId: l.user_id,
        }));
        setMarketplaceListings(mapped);
      }
      const { data: myListings } = await supabase.from("user_inventory").select("item_id, sale_price_ae").eq("user_id", authUser.id).eq("listed_for_sale", true);
      if (myListings?.length) {
        setListedItems(new Set(myListings.map((l: any) => l.item_id)));
        const prices = {};
        myListings.forEach((l: any) => { prices[l.item_id] = l.sale_price_ae; });
        setListingPrices(prices);
      }

      // Fetch notifications
      const { data: notifs } = await supabase.from("notifications").select("*").eq("user_id", authUser.id).eq("read", false).order("created_at", { ascending: false });
      if (notifs?.length) {
        setPlayerNotifs(notifs.map((n: any) => ({ id: n.id, type: n.type, msg: `${n.title}: ${n.body}` })));
      }
    };
    fetchUserData();
  }, [authUser]);

  const appCtx: any = {
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
      setListedItems((s: any) => new Set([...s, itemId]));
      setListingPrices((p: any) => ({ ...p, [itemId]: price }));
      const item = sharedShopItems.find((i: any) => i.id === itemId);
      if (item) {
        setMarketplaceListings((ls: any) => [...ls, {
          ...item, price, seller: sharedUser.name, _isMarketListing: true,
          _inventoryId: "inv_" + itemId, _sellerId: authUser?.id,
        }]);
      }
      if (authUser) {
        await supabase.from("user_inventory").update({ listed_for_sale: true, sale_price_ae: price }).eq("user_id", authUser.id).eq("item_id", itemId);
      }
    },
    unlistItem: async (itemId) => {
      setListedItems((s: any) => { const n = new Set(s); n.delete(itemId); return n; });
      setListingPrices((p: any) => { const n = { ...p }; delete n[itemId]; return n; });
      setMarketplaceListings((ls: any) => ls.filter((l: any) => !(l.id === itemId && l._sellerId === authUser?.id)));
      if (authUser) {
        await supabase.from("user_inventory").update({ listed_for_sale: false, sale_price_ae: null }).eq("user_id", authUser.id).eq("item_id", itemId);
      }
    },
    buyMarketplaceListing: async (inventoryId, itemId, price, sellerId) => {
      setMarketplaceListings((ls: any) => ls.filter((l: any) => l._inventoryId !== inventoryId));
      setSharedUser((u: any) => ({ ...u, ae: Math.max(0, u.ae - price) }));
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
      setCompletedMissions((s: any) => new Set([...s, id]));
      setSharedUser((u: any) => {
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
      if (authUser) {
        const mission = sharedMissions.find((m: any) => m.id === id);
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
      setSharedUser((u: any) => ({ ...u, ae: Math.max(0, u.ae - price) }));
      setSharedShopItems((is: any) => is.map((i: any) => i.id === id ? { ...i, sold:(i.sold||0)+1, owned: true } : i));
      if (authUser) {
        supabase.from("user_inventory").insert({ user_id: authUser.id, item_id: id }).then(() => {});
        supabase.from("shop_items").update({ sold: undefined }).eq("id", id).then(() => {
          supabase.from("shop_items").select("sold").eq("id", id).single().then(({ data }: any) => {
            if (data) supabase.from("shop_items").update({ sold: data.sold + 1 }).eq("id", id).then(() => {});
          });
        });
      }
    },
    joinEvent: (id) => {
      setJoinedEvents((s: any) => new Set([...s, id]));
      setSharedEvents((es: any) => es.map((e: any) => e.id === id ? { ...e, participants:(e.participants||0)+1 } : e));
      if (authUser) {
        supabase.from("event_participants").insert({ event_id: id, user_id: authUser.id }).then(() => {});
      }
    },
    joinClan: async (name, tag, color) => {
      const dbClans = (window as any).__zr_clans || [];
      const dbClan = dbClans.find((c: any) => c.name === name);
      if (authUser && dbClan) {
        await supabase.from("clan_members").insert({ clan_id: dbClan.id, user_id: authUser.id, role: "member" });
        await supabase.from("profiles").update({ clan_id: dbClan.id }).eq("user_id", authUser.id);
        const { count } = await supabase.from("clan_members").select("id", { count: "exact", head: true }).eq("clan_id", dbClan.id);
        const clanZones = ((window as any).__zr_zones || []).filter((z: any) => z.captured_by === dbClan.id);
        setSharedUser((u: any) => ({
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
        const existingClan = ENEMY_CLANS.find((c: any) => c.name === name);
        const suggestedClan = SUGGESTED_CLANS.find((c: any) => c.name === name);
        const memberCount = suggestedClan?.members || 8;
        setSharedUser((u: any) => ({
          ...u,
          clan: { id:tag.toLowerCase(), name, tag, motto:"New member!", color, founded:"Mar 2026", memberRole:"Member", treasury:existingClan ? 8000 : 0, weeklyXP:existingClan ? 6000 : 0, rank:existingClan?.rank || 99, cpr:existingClan?.cpr || 0, zonesHeld:existingClan?.zones || 0, totalMembers:memberCount + 1, maxMembers:20 }
        }));
      }
    },
    leaveClan: async () => {
      if (authUser && sharedUser.clan?.id) {
        await supabase.from("clan_members").delete().eq("user_id", authUser.id).eq("clan_id", sharedUser.clan.id);
      }
      setSharedUser((u: any) => ({ ...u, clan: null }));
      showToast("👋 You left the clan.", "info");
    },
    donateToClan: async (amount) => {
      const amt = Math.min(amount, sharedUser.ae);
      if (amt <= 0) return;
      setSharedUser((u: any) => ({
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
      setTimeout(() => {
        const success = Math.random() > 0.15;
        if (success) {
          setSharedUser((u: any) => {
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
      setSharedUser((u: any) => {
        let newXp = u.xp + 100, newLevel = u.level, newXpNext = u.xpNext;
        while (newXp >= newXpNext) { newXp -= newXpNext; newLevel++; newXpNext = Math.floor(newXpNext * 1.25); }
        return { ...u, ae: u.ae + 50, xp: newXp, level: newLevel, xpNext: newXpNext };
      });
      showToast("📍 Zone captured! +50 AE +100 XP", "success");
    },
    defendZone: () => {
      showToast("🛡️ GPS lock verifying defense position...", "info");
      setTimeout(() => {
        setSharedUser((u: any) => {
          let newXp = u.xp + 120, newLevel = u.level, newXpNext = u.xpNext;
          while (newXp >= newXpNext) { newXp -= newXpNext; newLevel++; newXpNext = Math.floor(newXpNext * 1.25); }
          return { ...u, ae: u.ae + 80, xp: newXp, level: newLevel, xpNext: newXpNext };
        });
        showToast("🛡️ Zone defended successfully! +80 AE +120 XP", "success");
      }, 4000);
    },

    // ── Admin mutations ──
    approveStyleSub: (id) => {
      setSharedStyleSubs((ss: any) => ss.map((s: any) => s.id === id ? { ...s, status:"approved", flagged:false } : s));
      setSharedStyleEvent((ev: any) => {
        const sub = STYLE_SUBMISSIONS_INIT.find((s: any) => s.id === id);
        if (!sub) return ev;
        if (ev.gallery.some((g: any) => g.id === id)) return ev;
        return { ...ev, gallery: [...ev.gallery, { id, userName:sub.userName, title:sub.title, votes:sub.votes, isMine:false }] };
      });
    },
    rejectStyleSub: (id, reason) => {
      setSharedStyleSubs((ss: any) => ss.map((s: any) => s.id === id ? { ...s, status:"rejected", rejectReason:reason } : s));
      setSharedStyleEvent((ev: any) => ({ ...ev, gallery: ev.gallery.filter((g: any) => g.id !== id) }));
    },
    approveProof: (id) => {
      setSharedProofs((ps: any) => ps.map((p: any) => p.id===id ? { ...p, status:"approved" } : p));
      const proof = sharedProofs.find((p: any) => p.id===id);
      if (proof) {
        setPlayerNotifs((ns: any) => [...ns, { id:Date.now(), type:"reward", msg:`✓ "${proof.missionTitle}" approved! +${proof.reward} AE +${proof.xp} XP credited.` }]);
        setSharedUser((u: any) => {
          let newXp = u.xp + proof.xp, newLevel = u.level, newXpNext = u.xpNext;
          while (newXp >= newXpNext) { newXp -= newXpNext; newLevel++; newXpNext = Math.floor(newXpNext * 1.25); }
          return { ...u, ae: u.ae + proof.reward, xp: newXp, level: newLevel, xpNext: newXpNext };
        });
        setCompletedMissions((s: any) => new Set([...s, proof.missionId]));
        if (authUser) {
          supabase.from("proof_submissions").update({ status: "approved", reviewed_by: authUser.id, reviewed_at: new Date().toISOString() }).eq("id", id).then(() => {});
        }
      }
    },
    rejectProof: (id, reason) => {
      setSharedProofs((ps: any) => ps.map((p: any) => p.id===id ? { ...p, status:"rejected", rejectReason:reason } : p));
      const proof = sharedProofs.find((p: any) => p.id===id);
      if (proof) setPlayerNotifs((ns: any) => [...ns, { id:Date.now(), type:"rejected", msg:`⚠ "${proof.missionTitle}" rejected. Reason: ${reason || "See guidelines."}` }]);
      if (authUser) {
        supabase.from("proof_submissions").update({ status: "rejected", reject_reason: reason, reviewed_by: authUser.id, reviewed_at: new Date().toISOString() }).eq("id", id).then(() => {});
      }
    },
    setStylePhase: (phase) => {
      setSharedStyleEvent((ev: any) => ({ ...ev, phase }));
      if (authUser) {
        supabase.from("style_events").update({ phase }).order("created_at", { ascending: false }).limit(1).then(() => {});
      }
    },
    toggleShopItem: (id) => {
      setSharedShopItems((is: any) => is.map((i: any) => i.id===id ? { ...i, active:!i.active } : i));
      if (authUser) {
        const item = sharedShopItems.find((i: any) => i.id === id);
        if (item) supabase.from("shop_items").update({ active: !item.active }).eq("id", id).then(() => {});
      }
    },
    addShopItem: (item) => {
      setSharedShopItems((is: any) => [...is, item]);
      if (authUser) {
        supabase.from("shop_items").insert({
          name: item.name, category: item.cat, price_ae: item.priceAE || item.price, rarity: item.rarity || "common",
          item_type: item.type || "general", icon: item.icon || "🎁", stock: item.stock, active: true,
          soul_bound: item.soulBound || false, featured: item.featured || false,
        }).then(() => {});
      }
    },
    toggleMission: (id) => setSharedMissions((ms: any) => ms.map((m: any) => m.id===id ? { ...m, _disabled:!m._disabled } : m)),
    addEvent: (ev) => {
      setSharedEvents((es: any) => [...es, ev]);
      if (authUser) {
        supabase.from("events").insert({
          title: ev.title, type: ev.type || "territory", status: "active",
          description: ev.desc, reward: ev.reward, max_participants: ev.maxParticipants,
          eligibility: ev.eligibility, color: ev.color,
        }).then(() => {});
      }
    },
    endEvent: (id) => {
      setSharedEvents((es: any) => es.filter((e: any) => e.id!==id));
      if (authUser) {
        supabase.from("events").update({ status: "ended" }).eq("id", id).then(() => {});
      }
    },
    publishWinnerToShop: (sub) => {
      const newItem = { id:"c"+Date.now(), name:sub.title, cat:"cosmetic", price:200, priceAE:200, rarity:"epic", icon:"👗", owned:false, featured:true, type:"general", stock:null, sold:0, active:true, soulBound:false, designer:sub.userName, isWinner:true };
      setSharedShopItems((is: any) => [...is, newItem]);
      setPlayerNotifs((ns: any) => [...ns, { id:Date.now(), type:"shop", msg:`🏆 Style Event winner "${sub.title}" by ${sub.userName} is now in the Market!` }]);
      if (authUser) {
        supabase.from("shop_items").insert({
          name: sub.title, category: "cosmetic", price_ae: 200, rarity: "epic", icon: "👗",
          active: true, featured: true, community_designed: true, designer_name: sub.userName,
        }).then(() => {});
      }
    },
    submitProof: (proof) => {
      setSharedProofs((ps: any) => [...ps, proof]);
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
          setSharedUser((u: any) => ({
            ...u, ae: u.ae - 500,
            clan: { id: newClan.id, name, tag, motto: motto || "New clan!", color: TL, founded: "Mar 2026", memberRole: "Leader", treasury: 0, weeklyXP: 0, rank: 99, cpr: 0, zonesHeld: 0, totalMembers: 1, maxMembers: 20 }
          }));
        } else {
          showToast(`❌ Clan creation failed: ${error?.message || "Unknown error"}`, "error");
        }
      } else {
        setSharedUser((u: any) => ({
          ...u, ae: u.ae - 500,
          clan: { id:tag.toLowerCase(), name, tag, motto: motto || "New clan!", color:TL, founded:"Mar 2026", memberRole:"Leader", treasury:0, weeklyXP:0, rank:99, cpr:0, zonesHeld:0, totalMembers:1, maxMembers:20 }
        }));
      }
    },
    discoverClue: () => {
      setSharedUser((u: any) => {
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
