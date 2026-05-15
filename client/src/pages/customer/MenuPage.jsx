import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { customerApi } from '../../api/customer.api';
import { CartProvider, useCart } from '../../context/CartContext';
import '../../styles/customer.css';

// ── helpers ──────────────────────────────────────────────────────
const getId = (v) => (v && typeof v === 'object' ? String(v._id ?? v) : String(v ?? ''));

const FOOD_EMOJI = {
  burger:'🍔',pizza:'🍕',pasta:'🍝',chicken:'🍗',rice:'🍚',sandwich:'🥪',
  dessert:'🍰',cake:'🎂',coffee:'☕',drink:'🥤',wrap:'🌯',steak:'🥩',
  wings:'🍗',curry:'🍛',biryani:'🍛',salad:'🥗',soup:'🍜',fish:'🐟',
  sushi:'🍱',taco:'🌮',starter:'🥗',appetizer:'🥗',bakery:'🥐',
  bread:'🍞',breakfast:'🍳',noodle:'🍜',
};
function getEmoji(name = '') {
  const n = name.toLowerCase();
  for (const [k, v] of Object.entries(FOOD_EMOJI)) if (n.includes(k)) return v;
  return '🍽️';
}

const SCRIPT_WORDS = ['Culinary','Freshness','Artisan','Symphony','Heritage','Savor','Delight','Fusion','Crafted','Baked'];
const TILE_BG = [
  'linear-gradient(135deg,#2d6a4f,#1b4332)',
  'linear-gradient(135deg,#40916c,#2d6a4f)',
  'linear-gradient(135deg,#52b788,#40916c)',
  'linear-gradient(135deg,#1b4332,#081c15)',
  'linear-gradient(135deg,#74c69d,#52b788)',
];

// ── Item Detail Modal ─────────────────────────────────────────────
function ItemModal({ item, onClose, onAdded }) {
  const hasSizes = item.sizes?.length > 0;
  const [qty, setQty]         = useState(1);
  const [selSize, setSelSize] = useState(hasSizes ? item.sizes[0] : null);
  const { addItem }           = useCart();
  const price = hasSizes ? (selSize?.price ?? item.price) : item.price;

  const handleAdd = () => {
    const ci = hasSizes
      ? { ...item, _id: `${item._id}_${selSize.name}`, name: `${item.name} (${selSize.name})`, price: selSize.price }
      : item;
    addItem(ci, qty);
    onAdded && onAdded(hasSizes ? `${item.name} (${selSize.name})` : item.name);
    onClose();
  };

  return (
    <div className="mz-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mz-modal-sheet">
        <div className="mz-modal-head">
          <span className="mz-modal-title">{item.name}</span>
          <button className="mz-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="mz-modal-body">
          {item.description && <p className="mz-modal-desc">{item.description}</p>}
          <div className="mz-modal-price">Rs {price?.toLocaleString()}</div>

          {hasSizes && (
            <div style={{ marginBottom: 20 }}>
              <div className="mz-modal-label">Choose Size</div>
              <div className="mz-size-pills">
                {item.sizes.map(s => (
                  <button
                    key={s.name}
                    className={`mz-size-pill ${selSize?.name === s.name ? 'active' : ''}`}
                    onClick={() => setSelSize(s)}
                  >
                    {s.name} · Rs {s.price?.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mz-modal-label">Quantity</div>
          <div className="mz-modal-qty">
            <button className="mz-qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
            <span className="mz-qty-val">{qty}</span>
            <button className="mz-qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
          </div>

          <button className="mz-modal-add-btn" onClick={handleAdd} disabled={hasSizes && !selSize}>
            Add {qty} to Cart — Rs {((price || 0) * qty).toLocaleString()}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mosaic Slide for one category ────────────────────────────────
function CategorySlide({ cat, items, catIdx, totalCats, activeCatIdx, onGoTo, onViewMenu }) {
  const isActive = catIdx === activeCatIdx;
  const word1 = SCRIPT_WORDS[catIdx % SCRIPT_WORDS.length];
  const word2 = SCRIPT_WORDS[(catIdx + 3) % SCRIPT_WORDS.length];
  const tiles  = items.slice(0, 5);

  const makeTile = (pos, gridCol, gridRow, scriptWord) => {
    if (scriptWord) {
      return (
        <div key={`s${pos}`} className="mz-tile mz-tile-script-bg" style={{ gridColumn: gridCol, gridRow }}>
          <span className="mz-script-text">{scriptWord}</span>
        </div>
      );
    }
    const item = tiles[pos];
    return (
      <div
        key={`t${pos}`}
        className="mz-tile"
        style={{
          gridColumn: gridCol, gridRow,
          background: item?.imageUrl ? `url(${item.imageUrl}) center/cover no-repeat` : TILE_BG[pos % TILE_BG.length],
        }}
      >
        {!item?.imageUrl && (
          <span className="mz-tile-emoji">{getEmoji(item?.name || cat.name)}</span>
        )}
      </div>
    );
  };

  return (
    <div className="mz-slide" id={`cat-${cat._id}`}>
      <div className="mz-mosaic">
        {makeTile(null, 1, '1/3', word1)}
        {makeTile(0,    2, 1,     null)}
        {makeTile(1,    3, '1/3', null)}
        {makeTile(2,    2, 2,     null)}
        {makeTile(3,    1, 3,     null)}
        {makeTile(null, 2, 3,     word2)}
        {makeTile(4,    3, 3,     null)}
      </div>

      {/* Overlay: category name + MENU button */}
      <div className="mz-slide-overlay">
        <h1 className="mz-slide-cat-name">{cat.name.toUpperCase()}</h1>
        <button className="mz-slide-menu-btn" onClick={onViewMenu}>MENU ↓</button>
      </div>

      {/* Bottom nav: PREV · dots · NEXT */}
      <div className="mz-slide-foot">
        {catIdx > 0
          ? <button className="mz-arrow-btn" onClick={() => onGoTo(catIdx - 1)}>PREV</button>
          : <span />
        }
        <div className="mz-dots">
          {Array.from({ length: totalCats }).map((_, i) => (
            <span key={i} className={`mz-dot ${i === activeCatIdx ? 'active' : ''}`} onClick={() => onGoTo(i)} />
          ))}
        </div>
        {catIdx < totalCats - 1
          ? <button className="mz-arrow-btn" onClick={() => onGoTo(catIdx + 1)}>NEXT</button>
          : <span />
        }
      </div>
    </div>
  );
}

// ── Items panel for one category ────────────────────────────────
function ItemsPanel({ cat, items, nextCat, onNextCat, onItemSelect }) {
  return (
    <div className="mz-items-panel">
      <div className="mz-items-inner">
        <h2 className="mz-items-cat-heading">{cat.name}</h2>
        {items.length === 0 && (
          <p style={{ textAlign: 'center', color: '#999', fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 18 }}>
            Coming soon…
          </p>
        )}
        {items.map(item => (
          <div
            key={item._id}
            className={`mz-item ${item.isAvailable === false ? 'mz-item-unavailable' : ''}`}
            onClick={() => item.isAvailable !== false && onItemSelect(item)}
            style={{ cursor: item.isAvailable !== false ? 'pointer' : 'default' }}
          >
            <div className="mz-item-left">
              <span className="mz-item-new">New</span>
              <h3 className="mz-item-name">{item.name}</h3>
              {item.description && <p className="mz-item-desc">{item.description}</p>}
              {item.sizes?.length > 0
                ? <div className="mz-item-price">Rs {Math.min(...item.sizes.map(s => s.price)).toLocaleString()} – {Math.max(...item.sizes.map(s => s.price)).toLocaleString()}</div>
                : <div className="mz-item-price">Rs {item.price?.toLocaleString()}</div>
              }
              {item.isAvailable === false && <span style={{ fontSize: 12, color: '#999', marginTop: 4, display: 'block' }}>Unavailable</span>}
            </div>
            {item.imageUrl
              ? <img src={item.imageUrl} alt={item.name} className="mz-item-img" />
              : <div className="mz-item-emoji-box"><span>{getEmoji(item.name)}</span></div>
            }
          </div>
        ))}
      </div>

      {nextCat && (
        <div className="mz-next-teaser" onClick={onNextCat}>
          Up Next
          <span className="mz-next-teaser-name">{nextCat.name}</span>
        </div>
      )}
    </div>
  );
}

// ── Main Menu Content ────────────────────────────────────────────
function MenuContent({ restaurantId, tableNo }) {
  const [restaurant,   setRestaurant]   = useState(null);
  const [categories,   setCategories]   = useState([]);
  const [items,        setItems]        = useState([]);
  const [deals,        setDeals]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeCatIdx, setActiveCatIdx] = useState(0);
  const [openCatIdx,   setOpenCatIdx]   = useState(null); // which category's items are showing
  const [selItem,      setSelItem]      = useState(null);
  const [toast,        setToast]        = useState('');
  const { items: cartItems, totalItems } = useCart();
  const sectionRefs = useRef([]);

  // ── fetch all data ──────────────────────────────────────────
  useEffect(() => {
    if (!restaurantId) return;
    setLoading(true);
    Promise.all([
      customerApi.getRestaurant(restaurantId).catch(() => ({ data: null })),
      customerApi.getCategories(restaurantId).catch(() => ({ data: { data: [] } })),
      customerApi.getMenuItems(restaurantId).catch(() => ({ data: { data: [] } })),
      customerApi.getDeals(restaurantId).catch(() => ({ data: { data: [] } })),
    ]).then(([rRes, cRes, iRes, dRes]) => {
      const r = rRes.data?.data || rRes.data;
      setRestaurant(r);
      setCategories(cRes.data?.data || []);
      setItems(iRes.data?.data || iRes.data?.items || []);
      setDeals(dRes.data?.data || []);
      if (r?.branding) applyTheme(r.branding);
    }).finally(() => setLoading(false));
  }, [restaurantId]);

  const applyTheme = (b) => {
    if (!b) return;
    const root = document.documentElement;
    if (b.primaryColor)   root.style.setProperty('--mz-mid',  b.primaryColor);
    if (b.secondaryColor) root.style.setProperty('--mz-cream', b.secondaryColor);
  };

  // ── navigate to category slide ──────────────────────────────
  const goToCat = useCallback((idx) => {
    if (idx < 0 || idx >= categories.length) return;
    setActiveCatIdx(idx);
    setOpenCatIdx(null);
    const el = document.getElementById(`cat-${categories[idx]._id}`);
    el?.scrollIntoView({ behavior: 'smooth' });
  }, [categories]);

  const openCatItems = (idx) => {
    setOpenCatIdx(idx);
    const el = document.getElementById(`items-${categories[idx]._id}`);
    setTimeout(() => el?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  const handleAdded = (name) => {
    setToast(`Added: ${name}`);
    setTimeout(() => setToast(''), 2000);
  };

  if (loading) {
    return (
      <div className="mz-loading">
        <span style={{ fontSize: 48 }}>🍽️</span>
        <span style={{ letterSpacing: '0.2em' }}>LOADING MENU…</span>
      </div>
    );
  }

  const catItems = (cat) => items.filter(i => getId(i.categoryId) === cat._id);

  return (
    <div className="mz-root">
      {/* ── Fixed Top Nav ─────────────────────────────────── */}
      <nav className="mz-nav">
        <div className="mz-nav-logo">
          {restaurant?.restaurantName || 'Restaurant'}
          {restaurant?.description && <span>{restaurant.description.slice(0, 30)}</span>}
        </div>
        <div className="mz-nav-links">
          <button className="mz-nav-link" onClick={() => { setOpenCatIdx(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            HOME
          </button>
          {categories.map((cat, idx) => (
            <button
              key={cat._id}
              className={`mz-nav-link ${activeCatIdx === idx ? 'active' : ''}`}
              onClick={() => goToCat(idx)}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <Link
          to={`/menu/${restaurantId}/cart${tableNo ? `?table=${tableNo}` : ''}`}
          className="mz-nav-cart"
        >
          🛒 {totalItems > 0 ? `Cart (${totalItems})` : 'Cart'}
        </Link>
      </nav>

      {/* ── Page ──────────────────────────────────────────── */}
      <div className="mz-page">

        {/* ── Deals strip (if any) ─────────────────────── */}
        {deals.length > 0 && (
          <div className="mz-deals-wrap">
            <div className="mz-deals-heading">🔥 DEALS & COMBOS</div>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '0 32px', paddingBottom: 8, scrollbarWidth: 'none' }}>
              {deals.filter(d => d.isAvailable).map(deal => (
                <div key={deal._id} style={{
                  minWidth: 220, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12, padding: '18px 20px', flexShrink: 0,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontFamily: 'Raleway,sans-serif', fontWeight: 800, fontSize: 14, color: '#fff' }}>{deal.name}</span>
                    {deal.originalPrice && deal.dealPrice && (
                      <span style={{ background: '#c9a84c', color: '#1b4332', fontFamily: 'Raleway,sans-serif', fontWeight: 800, fontSize: 10, padding: '2px 8px', borderRadius: 9999 }}>
                        {Math.round((1 - deal.dealPrice / deal.originalPrice) * 100)}% OFF
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 10, lineHeight: 1.4 }}>
                    {deal.items?.map(i => i.name).join(' + ')}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontFamily: 'Raleway,sans-serif', fontWeight: 800, fontSize: 16, color: '#95bf98' }}>Rs {deal.dealPrice?.toLocaleString()}</span>
                    {deal.originalPrice && <span style={{ fontFamily: 'Raleway,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.35)', textDecoration: 'line-through' }}>Rs {deal.originalPrice?.toLocaleString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Category Sections ─────────────────────────── */}
        {categories.map((cat, idx) => (
          <section key={cat._id} className="mz-cat-section" ref={el => sectionRefs.current[idx] = el}>
            {/* Full-screen mosaic slide */}
            <CategorySlide
              cat={cat}
              items={catItems(cat)}
              catIdx={idx}
              totalCats={categories.length}
              activeCatIdx={activeCatIdx}
              onGoTo={goToCat}
              onViewMenu={() => { setActiveCatIdx(idx); openCatItems(idx); }}
            />

            {/* Items panel — visible when this category is open */}
            {openCatIdx === idx && (
              <div id={`items-${cat._id}`}>
                <ItemsPanel
                  cat={cat}
                  items={catItems(cat)}
                  nextCat={categories[idx + 1] || null}
                  onNextCat={() => goToCat(idx + 1)}
                  onItemSelect={setSelItem}
                />
              </div>
            )}
          </section>
        ))}

        {/* Empty state */}
        {categories.length === 0 && (
          <div className="mz-loading" style={{ height: '80vh' }}>
            <span style={{ fontSize: 48 }}>🍽️</span>
            <span>No menu categories yet</span>
          </div>
        )}
      </div>

      {/* ── Item Detail Modal ──────────────────────────── */}
      {selItem && (
        <ItemModal
          item={selItem}
          onClose={() => setSelItem(null)}
          onAdded={handleAdded}
        />
      )}

      {/* ── Toast ─────────────────────────────────────── */}
      {toast && <div className="mz-toast">✓ {toast}</div>}
    </div>
  );
}

// ── Exported page (wraps CartProvider) ───────────────────────────
export default function MenuPage() {
  const { restaurantId }  = useParams();
  const [searchParams]    = useSearchParams();
  const tableNo           = searchParams.get('table');
  return (
    <CartProvider restaurantId={restaurantId}>
      <MenuContent restaurantId={restaurantId} tableNo={tableNo} />
    </CartProvider>
  );
}
