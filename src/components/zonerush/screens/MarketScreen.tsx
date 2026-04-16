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
import type { MarketScreenProps } from "../types";

export function MarketScreen({ user }: MarketScreenProps) {
  const ctx = useContext(AppContext);
  const [mTab, setMTab] = useState("shop");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const allShopItems = ctx?.sharedShopItems || SHOP_ITEMS;
  const activeShop = allShopItems.filter((i: any) => i.active !== false);
  const [owned, setOwned] = useState(new Set(
    activeShop.filter((i: any) => i.owned).map((i: any) => i.id).concat(COMMUNITY_ITEMS.filter((i: any) => i.owned).map((i: any) => i.id))
  ));
  const [cart, setCart] = useState<any>(null);
  const [sellModal, setSellModal] = useState<any>(null);
  const [sellPrice, setSellPrice] = useState("");
  const marketplaceListings = ctx?.marketplaceListings || [];

  const shopItems = activeShop.filter((i: any) => !i.designer && !i._isMarketListing && (i.rarity === "common" || i.rarity === "uncommon") && (!search || i.name.toLowerCase().includes(search.toLowerCase())) && (catFilter === "all" || i.cat === catFilter || (catFilter === "armor" && (i.cat === "armor" || i.cat === "arms")) || (catFilter === "clothing" && (i.cat === "clothing" || i.cat === "armor")) ));
  const community = [
    ...COMMUNITY_ITEMS,
    ...allShopItems.filter((i: any) => i.designer && i.active !== false),
    ...marketplaceListings.filter((l: any) => l.seller !== (ctx?.sharedUser?.name || ""))
  ].filter((i: any) => !search || i.name.toLowerCase().includes(search.toLowerCase()));
  const inventory = [...activeShop.filter((i: any) => owned.has(i.id)), ...COMMUNITY_ITEMS.filter((i: any) => owned.has(i.id))];

  const buy = (item) => {
    const price = item.price || item.priceAE || 0;
    if (price > (ctx?.sharedUser?.ae || user.ae)) {
      showToast(`⚠ Not enough AE to buy ${item.name}`, "error");
      setCart(null);
      return;
    }
    // If it's a marketplace listing, handle differently
    if (item._isMarketListing && ctx?.buyMarketplaceListing) {
      ctx.buyMarketplaceListing(item._inventoryId, item.id, price, item._sellerId);
      setOwned(o => new Set([...o, item.id]));
      setCart(null);
      showToast(`🛍️ Purchased ${item.name} from ${item.seller} for ◎${price} AE!`, "success");
      return;
    }
    if (ctx?.purchaseItem) ctx.purchaseItem(item.id, price);
    setOwned(o => new Set([...o, item.id]));
    setCart(null);
    showToast(`🛍️ Purchased ${item.name} for ◎${price} AE!`, "success");
  };

  const handleListForSale = (item) => {
    const price = parseInt(sellPrice);
    if (!price || price <= 0) {
      showToast("⚠ Enter a valid price", "error");
      return;
    }
    if (ctx?.listItemForSale) ctx.listItemForSale(item.id, price);
    setSellModal(null);
    setSellPrice("");
    showToast(`🏷️ ${item.name} listed for ◎${price} AE on the marketplace!`, "success");
  };

  const handleUnlist = (item) => {
    if (ctx?.unlistItem) ctx.unlistItem(item.id);
    showToast(`✓ ${item.name} removed from marketplace`, "info");
  };

  return (
    <div style={{ position:"relative", zIndex:1, height:"100dvh", overflowY:"auto", paddingBottom:90 }}>
      {/* Header with gradient */}
      <div style={{ padding:"20px 16px 0", marginBottom:12 }}>
        <div style={{ fontSize:26, fontWeight:900, color:TX, letterSpacing:"-0.5px", marginBottom:2 }}>Market</div>
        <div style={{ fontSize:13, color:TM, marginBottom:12 }}>
          Balance: <span style={{ color:TA, fontWeight:700 }}>◎ {(ctx?.sharedUser?.ae || user.ae).toLocaleString()} AE</span>
          <span style={{ color:TD }}> · {user.shards} shards</span>
        </div>
        <TabBar
          tabs={[["shop","Shop"], ["community","Community", marketplaceListings.length], ["inventory","Inventory", inventory.length]]}
          active={mTab}
          onSelect={setMTab}
          style={{ marginBottom:12 }}
        />
        {/* Search */}
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:"rgba(255,255,255,0.04)", border:`1px solid ${BR}`, borderRadius:14 }}>
          <span style={{ color:TM, fontSize:14 }}>🔍</span>
          <input style={{ flex:1, background:"none", border:"none", color:TX, fontSize:13, fontFamily:FONT }} placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch("")} style={{ background:"none", border:"none", color:TM, cursor:"pointer", padding:0 }}>✕</button>}
        </div>
      </div>

      <div style={{ padding:"0 16px" }}>
        {mTab === "shop" && (
          <>
            {/* Category filter chips */}
            <div style={{ display:"flex", gap:6, overflowX:"auto", marginBottom:12, paddingBottom:4 }}>
              {[["all","All"],["clothing","Clothing"],["armor","Armor"],["arms","Arms"],["weapon","Weapons"],["shield","Shields"],["footwear","Footwear"],["consumable","Items"]].map((k: any, l: any) => (
                <button key={k} onClick={() => setCatFilter(k)} style={{
                  padding:"6px 14px", borderRadius:99, fontSize:11, fontWeight:700, fontFamily:FONT, whiteSpace:"nowrap",
                  background: catFilter===k ? T : "rgba(255,255,255,0.06)", border: catFilter===k ? `1px solid ${T}` : `1px solid ${BR}`,
                  color: catFilter===k ? "#000" : TM,
                }}>{l}</button>
              ))}
            </div>
            {shopItems.filter(i=>i.featured).length > 0 && (
              <>
                <div style={{ fontSize:14, fontWeight:700, color:TX, marginBottom:10 }}>⭐ Featured</div>
                <div style={{ display:"flex", gap:8, overflowX:"auto", marginBottom:16 }}>
                  {shopItems.filter(i=>i.featured).map((item: any) => (
                    <ShopItemCard key={item.id} item={item} owned={owned.has(item.id)} onBuy={() => setCart(item)} featured />
                  ))}
                </div>
              </>
            )}
            <div style={{ fontSize:14, fontWeight:700, color:TX, marginBottom:10 }}>All Items</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {shopItems.filter(i=>!i.featured).map((item: any) => (
                <ShopItemCard key={item.id} item={item} owned={owned.has(item.id)} onBuy={() => setCart(item)} />
              ))}
            </div>
          </>
        )}

        {mTab === "community" && (
          <>
            <div style={{ padding:"12px 14px", background:`${TL}08`, border:`1px solid ${TL}25`, borderRadius:12, fontSize:12, color:TM, marginBottom:12, lineHeight:1.6 }}>
              👗 Community designs + player marketplace. Designers earn 10% of Style Challenge sales. Players set their own prices on resales.
            </div>
            {/* List your own design CTA */}
            <button onClick={() => {
              if (ctx?.sharedStyleEvent?.phase === "submission" || ctx?.sharedStyleEvent?.phase === "voting") {
                showToast("👗 Head to the Style Event (Quests → Events) to submit your design!", "info");
              } else {
                showToast("👗 Style Event submissions are currently closed. Check back next week!", "info");
              }
            }} style={{
              width:"100%", padding:"14px", marginBottom:12, borderRadius:14,
              background:`linear-gradient(135deg, ${TL}15, ${T}08)`,
              border:`1.5px dashed ${TL}50`, color:TL, fontSize:13, fontWeight:700,
              display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontFamily:FONT,
            }}>
              <span style={{ fontSize:18 }}>✨</span> Submit Your Own Design
            </button>

            {/* Player marketplace listings */}
            {marketplaceListings.filter((l: any) => l.seller !== (ctx?.sharedUser?.name || "")).length > 0 && (
              <>
                <div style={{ fontSize:14, fontWeight:700, color:TA, marginBottom:10, display:"flex", alignItems:"center", gap:6 }}>
                  <span>🏷️</span> Player Marketplace
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                  {marketplaceListings.filter((l: any) => l.seller !== (ctx?.sharedUser?.name || "")).map((item: any) => (
                    <MarketplaceListingCard key={item._inventoryId || item.id} item={item} onBuy={() => setCart(item)} />
                  ))}
                </div>
              </>
            )}

            {/* Community designs */}
            <div style={{ fontSize:14, fontWeight:700, color:TX, marginBottom:10 }}>👗 Style Challenge Winners</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[...COMMUNITY_ITEMS, ...allShopItems.filter((i: any) => i.designer && i.active !== false)].filter((i: any) => !search || i.name.toLowerCase().includes(search.toLowerCase())).map((item: any) => (
                <CommunityItemCard key={item.id} item={item} owned={owned.has(item.id)} onBuy={() => setCart({ ...item, price: item.price || item.priceAE || 200 })} />
              ))}
            </div>
            {[...COMMUNITY_ITEMS, ...allShopItems.filter((i: any) => i.designer && i.active !== false)].length === 0 && marketplaceListings.length === 0 && (
              <div style={{ padding:"60px 20px", textAlign:"center", color:TM }}>
                <div style={{ fontSize:40, marginBottom:12 }}>👗</div>
                <div style={{ fontSize:15, fontWeight:700, color:TX, marginBottom:6 }}>No community designs yet</div>
                <div style={{ fontSize:12 }}>First Style Event winner coming soon</div>
              </div>
            )}
          </>
        )}

        {mTab === "inventory" && (
          inventory.length === 0 ? (
            <div style={{ padding:"60px 20px", textAlign:"center", color:TM }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🎒</div>
              <div style={{ fontSize:15, fontWeight:700, color:TX, marginBottom:6 }}>Nothing owned yet</div>
              <div style={{ fontSize:12 }}>Purchase items from the Shop</div>
            </div>
          ) : (
            <>
              <div style={{ padding:"10px 14px", background:`${TA}08`, border:`1px solid ${TA}25`, borderRadius:12, fontSize:12, color:TM, marginBottom:12, lineHeight:1.6 }}>
                🏷️ Sell items you own on the marketplace! Set your own price and other players can buy them.
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {inventory.map((item: any) => {
                  const isListed = ctx?.listedItems?.has(item.id);
                  const listingPrice = ctx?.listingPrices?.[item.id];
                  return (
                    <div key={item.id} style={{
                      background:S1, border:`1px solid ${isListed ? `${TA}50` : RARITY_COLOR[item.rarity]+"30"}`, borderRadius:16, overflow:"hidden",
                    }}>
                      <div style={{ height:3, background: isListed ? TA : RARITY_COLOR[item.rarity] }} />
                      <div style={{ padding:"14px 12px 12px", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                        <div style={{ fontSize:32 }}>{item.icon}</div>
                        <div style={{ fontSize:12, fontWeight:700, color:TX, textAlign:"center", lineHeight:1.3 }}>{item.name}</div>
                        <div style={{ fontSize:10, color:RARITY_COLOR[item.rarity], fontWeight:700 }}>{item.rarity} · {item.cat}</div>
                        <div style={{ padding:"5px 12px", background:`${TG}15`, border:`1px solid ${TG}40`, borderRadius:99, fontSize:11, fontWeight:700, color:TG }}>✓ Owned</div>
                        {isListed ? (
                          <div style={{ display:"flex", flexDirection:"column", gap:4, width:"100%" }}>
                            <div style={{ fontSize:11, fontWeight:700, color:TA, textAlign:"center" }}>🏷️ Listed: ◎{listingPrice} AE</div>
                            <button onClick={() => handleUnlist(item)} style={{ padding:"6px 12px", background:`${TR}10`, border:`1px solid ${TR}30`, borderRadius:99, color:TR, fontSize:11, fontWeight:700, fontFamily:FONT }}>Remove Listing</button>
                          </div>
                        ) : (
                          <button onClick={() => { setSellModal(item); setSellPrice(""); }} style={{ padding:"7px 14px", background:`${TA}15`, border:`1px solid ${TA}40`, borderRadius:99, color:TA, fontSize:11, fontWeight:700, fontFamily:FONT, display:"flex", alignItems:"center", gap:4 }}>
                            🏷️ Sell
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )
        )}
      </div>

      {/* Purchase modal */}
      {cart && (() => {
        const cartPrice = cart.price || cart.priceAE || 0;
        const currentAE = ctx?.sharedUser?.ae ?? user.ae;
        return (
        <div onClick={() => setCart(null)} style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(13,17,23,0.9)", backdropFilter:"blur(16px)", display:"flex", alignItems:"flex-end", justifyContent:"center", padding:"0 0 16px" }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:400, background:S2, border:`1px solid ${BR}`, borderRadius:"24px 24px 20px 20px", padding:"28px 24px 20px", display:"flex", flexDirection:"column", alignItems:"center" }}>
            <div style={{ fontSize:52, marginBottom:8 }}>{cart.icon || "🎁"}</div>
            <div style={{ fontSize:20, fontWeight:800, color:TX, marginBottom:4 }}>{cart.name}</div>
            <div style={{ fontSize:11, fontWeight:700, color:RARITY_COLOR[cart.rarity] || TM, marginBottom:8 }}>{(cart.rarity||"common").toUpperCase()}</div>
            {cart.designer && <div style={{ fontSize:11, color:TL, marginBottom:4 }}>by {cart.designer}</div>}
            {cart.seller && <div style={{ fontSize:11, color:TA, marginBottom:4 }}>Sold by {cart.seller}</div>}
            <div style={{ fontSize:28, fontWeight:900, color:TA, margin:"4px 0 8px", fontFamily:MONO }}>◎ {cartPrice}</div>
            <div style={{ fontSize:12, color:TM, marginBottom:24 }}>Balance after: ◎ {Math.max(0, currentAE - cartPrice).toLocaleString()} AE</div>
            {currentAE >= cartPrice ? (
              <button onClick={() => buy(cart)} style={{ width:"100%", padding:"15px", borderRadius:16, border:"none", background:`linear-gradient(135deg, ${T}, ${TG})`, color:"#0D1117", fontSize:15, fontWeight:800, fontFamily:FONT, marginBottom:10, boxShadow:`0 8px 24px ${T}50` }}>
                Confirm Purchase
              </button>
            ) : (
              <div style={{ fontSize:13, color:TR, fontWeight:700, textAlign:"center", marginBottom:10 }}>
                Not enough AE (need {cartPrice - currentAE} more)
              </div>
            )}
            <button onClick={() => setCart(null)} style={{ width:"100%", padding:"13px", borderRadius:14, background:"none", border:`1px solid ${BR}`, color:TM, fontSize:13, fontFamily:FONT }}>Cancel</button>
          </div>
        </div>
        );
      })()}

      {/* Sell modal */}
      {sellModal && (
        <div onClick={() => setSellModal(null)} style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(13,17,23,0.9)", backdropFilter:"blur(16px)", display:"flex", alignItems:"flex-end", justifyContent:"center", padding:"0 0 16px" }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:400, background:S2, border:`1px solid ${BR}`, borderRadius:"24px 24px 20px 20px", padding:"28px 24px 20px", display:"flex", flexDirection:"column", alignItems:"center" }}>
            <div style={{ fontSize:52, marginBottom:8 }}>{sellModal.icon || "🎁"}</div>
            <div style={{ fontSize:20, fontWeight:800, color:TX, marginBottom:4 }}>{sellModal.name}</div>
            <div style={{ fontSize:11, fontWeight:700, color:RARITY_COLOR[sellModal.rarity] || TM, marginBottom:16 }}>{(sellModal.rarity||"common").toUpperCase()}</div>
            <div style={{ fontSize:14, fontWeight:700, color:TX, marginBottom:12 }}>Set Your Price</div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, width:"100%" }}>
              <span style={{ fontSize:18, color:TA }}>◎</span>
              <input type="number" value={sellPrice} onChange={e => setSellPrice(e.target.value)} placeholder="e.g. 300" style={{ flex:1, background:"rgba(255,255,255,0.06)", border:`1px solid ${BR}`, borderRadius:12, padding:"12px 14px", color:TX, fontSize:16, fontWeight:700, fontFamily:FONT }} autoFocus />
              <span style={{ fontSize:14, color:TM, fontWeight:700 }}>AE</span>
            </div>
            <div style={{ fontSize:11, color:TM, marginBottom:20, textAlign:"center", lineHeight:1.5 }}>
              Your item will appear in the Community marketplace.<br/>
              A 5% marketplace fee applies on sale.
            </div>
            <button onClick={() => handleListForSale(sellModal)} disabled={!sellPrice || parseInt(sellPrice) <= 0} style={{ width:"100%", padding:"15px", borderRadius:16, border:"none", background: sellPrice && parseInt(sellPrice) > 0 ? `linear-gradient(135deg, ${TA}, #FF9F1C)` : "rgba(255,255,255,0.05)", color: sellPrice && parseInt(sellPrice) > 0 ? "#0D1117" : TM, fontSize:15, fontWeight:800, fontFamily:FONT, marginBottom:10, boxShadow: sellPrice && parseInt(sellPrice) > 0 ? `0 8px 24px ${TA}50` : "none" }}>
              🏷️ List for Sale
            </button>
            <button onClick={() => setSellModal(null)} style={{ width:"100%", padding:"13px", borderRadius:14, background:"none", border:`1px solid ${BR}`, color:TM, fontSize:13, fontFamily:FONT }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ height:20 }} />
    </div>
  );
}

// Marketplace listing card for community tab
function MarketplaceListingCard({ item, onBuy }: any) {
  const rc = RARITY_COLOR[item.rarity] || TM;
  return (
    <div style={{ background:S1, border:`1px solid ${TA}30`, borderRadius:16, overflow:"hidden" }}>
      <div style={{ height:3, background:TA }} />
      <div style={{ padding:"14px 12px 12px", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
        <div style={{ fontSize:32 }}>{item.icon}</div>
        <div style={{ fontSize:12, fontWeight:700, color:TX, textAlign:"center", lineHeight:1.3 }}>{item.name}</div>
        <div style={{ fontSize:10, color:rc, fontWeight:700 }}>{item.rarity} · {item.cat}</div>
        <div style={{ fontSize:10, color:TA }}>Sold by {item.seller}</div>
        <button onClick={onBuy} style={{ padding:"7px 16px", background:`${TA}15`, border:`1px solid ${TA}40`, borderRadius:99, color:TA, fontSize:12, fontWeight:700, fontFamily:FONT }}>◎ {item.price}</button>
      </div>
    </div>
  );
}

function SpritePreview({ src, size=48 }: any) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!src || !canvasRef.current) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, size, size);
      // LPC spritesheets: 64x64 per frame, row 2 = facing down (south), first column
      ctx.drawImage(img, 0, 128, 64, 64, 0, 0, size, size);
    };
    img.onerror = () => {};
    img.src = src;
  }, [src, size]);
  if (!src) return null;
  return <canvas ref={canvasRef} width={size} height={size} style={{ imageRendering:"pixelated", width:size, height:size }} />;
}

function ShopItemCard({ item, owned, onBuy, featured, forceOwned }: any) {
  const isOwned = owned || forceOwned;
  const rc = RARITY_COLOR[item.rarity];
  const RARITY_LABEL = { common:"Common", uncommon:"Uncommon", rare:"Rare", epic:"Epic", legendary:"Legendary" };
  const CAT_ICONS = { clothing:"👕", armor:"🛡️", footwear:"👢", headgear:"⛑️", weapon:"⚔️", consumable:"🧪" };
  const spriteImg = SPRITE_IMG[item.id];
  return (
    <div style={{
      background:S1, border:`1px solid ${rc}30`, borderRadius:16, overflow:"hidden",
      ...(featured ? { flex:"0 0 140px", minWidth:140 } : {}),
    }}>
      <div style={{ height:3, background:rc }} />
      <div style={{ padding:"14px 12px 12px", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
        <div style={{ width:56, height:56, background:`${rc}10`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
          {spriteImg ? (
            <SpritePreview src={spriteImg} size={56} />
          ) : (
            <span style={{ fontSize:28 }}>{item.icon || ITEM_ICONS[item.cat] || "📦"}</span>
          )}
        </div>
        <div style={{ fontSize:12, fontWeight:700, color:TX, textAlign:"center", lineHeight:1.3 }}>{item.name}</div>
        <div style={{ fontSize:10, color:rc, fontWeight:700 }}>{RARITY_LABEL[item.rarity]} · {CAT_ICONS[item.cat] || ""} {item.cat}</div>
        {item.weaponType && <div style={{ fontSize:9, color:TM }}>Type: {item.weaponType}</div>}
        {isOwned ? (
          <div style={{ padding:"5px 12px", background:`${TG}15`, border:`1px solid ${TG}40`, borderRadius:99, fontSize:11, fontWeight:700, color:TG }}>✓ Owned</div>
        ) : (
          <button onClick={onBuy} style={{ padding:"7px 16px", background:`${rc}15`, border:`1px solid ${rc}40`, borderRadius:99, color:rc, fontSize:12, fontWeight:700, fontFamily:FONT }}>◎ {item.price || item.priceAE}</button>
        )}
      </div>
    </div>
  );
}

function CommunityItemCard({ item, owned, onBuy }: any) {
  return (
    <div style={{ background:S1, border:`1px solid ${TL}30`, borderRadius:16, overflow:"hidden" }}>
      <div style={{ height:3, background:TL }} />
      <div style={{ padding:"14px 12px 12px", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
        <div style={{ fontSize:32 }}>{item.icon}</div>
        <div style={{ fontSize:12, fontWeight:700, color:TX, textAlign:"center" }}>{item.name}</div>
        <div style={{ fontSize:10, color:TL }}>by {item.designer}</div>
        <div style={{ fontSize:10, color:TM }}>⭐ {item.votes} · Week #{item.weekId}</div>
        {owned ? (
          <div style={{ padding:"5px 12px", background:`${TG}15`, border:`1px solid ${TG}40`, borderRadius:99, fontSize:11, fontWeight:700, color:TG }}>✓ Owned</div>
        ) : (
          <button onClick={onBuy} style={{ padding:"7px 16px", background:`${TL}15`, border:`1px solid ${TL}40`, borderRadius:99, color:TL, fontSize:12, fontWeight:700, fontFamily:FONT }}>◎ {item.price}</button>
        )}
      </div>
    </div>
  );
}
