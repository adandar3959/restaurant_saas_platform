import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { customerApi } from '../../api/customer.api';
import { CartProvider, useCart } from '../../context/CartContext';
import CartSidebar from './components/CartSidebar';
import '../../styles/customer.css';

// ── helpers ──────────────────────────────────────────────────────
const getId = (v) => (v && typeof v === 'object' ? String(v._id ?? v) : String(v ?? ''));

const FOOD_EMOJI = {
  burger: '🍔', pizza: '🍕', pasta: '🍝', chicken: '🍗', rice: '🍚', sandwich: '🥪',
  dessert: '🍰', cake: '🎂', coffee: '☕', drink: '🥤', wrap: '🌯', steak: '🥩',
  wings: '🍗', curry: '🍛', biryani: '🍛', salad: '🥗', soup: '🍜', fish: '🐟',
  sushi: '🍱', taco: '🌮', starter: '🥗', appetizer: '🥗', bakery: '🥐',
  bread: '🍞', breakfast: '🍳', noodle: '🍜',
};
function getEmoji(name = '') {
  const n = name.toLowerCase();
  for (const [k, v] of Object.entries(FOOD_EMOJI)) if (n.includes(k)) return v;
  return '🍽️';
}

const SCRIPT_WORDS = ['Culinary', 'Freshness', 'Artisan', 'Symphony', 'Heritage', 'Savor', 'Delight', 'Fusion', 'Crafted', 'Baked'];

// ── Item Detail Modal ─────────────────────────────────────────────
function ItemModal({ item, onClose, onAdded }) {
  const hasSizes = item.sizes?.length > 0;
  const [qty, setQty] = useState(1);
  const [selSize, setSelSize] = useState(hasSizes ? item.sizes[0] : null);
  const { addItem } = useCart();
  const isDeal = item.dealPrice !== undefined;
  const price = hasSizes ? (selSize?.price ?? item.price) : (isDeal ? item.dealPrice : item.price);

  const handleAdd = () => {
    let ci;
    if (hasSizes) {
      ci = { ...item, _id: `${item._id}_${selSize.name}`, name: `${item.name} (${selSize.name})`, price: selSize.price };
    } else if (isDeal) {
      ci = { ...item, price: item.dealPrice };
    } else {
      ci = item;
    }
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
          {item.description ? <p className="mz-modal-desc">{item.description}</p> : (isDeal && item.items ? <p className="mz-modal-desc">{item.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</p> : null)}
          <div className="mz-modal-price">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Rs {price?.toLocaleString()}</span>
              {isDeal && item.originalPrice && item.originalPrice > item.dealPrice && (
                <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.6em' }}>
                  Rs {item.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>

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

// ── 3-Column Mosaic (pure mosaic, no overlay) ────────────────────
function CategorySlide({ cat, items }) {
  const word1 = SCRIPT_WORDS[(cat._id?.charCodeAt(0) ?? 0) % SCRIPT_WORDS.length];
  const word2 = SCRIPT_WORDS[(cat._id?.charCodeAt(1) ?? 3) % SCRIPT_WORDS.length];
  const imgs = items.filter(i => i.imageUrl).map(i => i.imageUrl);

  const imgTile = (idx, style = {}) => {
    const src = imgs[idx];
    return (
      <div style={{
        borderRadius: 10, overflow: 'hidden',
        background: src ? undefined : 'linear-gradient(135deg,#2d6a4f,#1b4332)',
        backgroundImage: src ? `url(${src})` : undefined,
        backgroundSize: 'cover', backgroundPosition: 'center',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        ...style,
      }}>
        {!src && <span style={{ fontSize: 28 }}>{getEmoji(cat.name)}</span>}
      </div>
    );
  };

  const scriptTile = (word, showArrow = false, style = {}) => (
    <div style={{
      borderRadius: 10, overflow: 'hidden',
      background: 'linear-gradient(135deg,#1b4332,#0a2118)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', ...style,
    }}>
      {showArrow && (
        <div style={{
          position: 'absolute', top: 8, left: 8,
          width: 24, height: 24, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, color: '#fff',
        }}>↗</div>
      )}
      <span style={{
        fontFamily: "'Dancing Script', cursive",
        fontSize: 16, color: 'rgba(255,255,255,0.75)', fontWeight: 600,
        textAlign: 'center', padding: '0 10px',
      }}>{word}</span>
    </div>
  );

  return (
    <div style={{
      height: '100%', background: '#8aaa78',
      display: 'grid',
      gridTemplateColumns: '1fr 1.15fr 1fr',
      gridTemplateRows: '1fr 1fr',
      gap: 5, padding: 8,
    }}>
      {scriptTile(word1, true, { gridColumn: 1, gridRow: 1 })}
      {imgTile(0, { gridColumn: 2, gridRow: '1 / 3' })}
      {imgTile(1, { gridColumn: 3, gridRow: 1 })}
      {imgTile(2, { gridColumn: 1, gridRow: 2 })}
      {scriptTile(word2, false, { gridColumn: 3, gridRow: 2 })}
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
            <div className="mz-item-info">
              <div className="mz-item-name">{item.name}</div>
              {item.description ? (
                 <div className="mz-item-desc">{item.description}</div>
              ) : item.dealPrice !== undefined && item.items ? (
                 <div className="mz-item-desc">{item.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</div>
              ) : null}
              <div className="mz-item-price">
                {item.dealPrice !== undefined ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Rs {item.dealPrice.toLocaleString()}</span>
                    {item.originalPrice && item.originalPrice > item.dealPrice && (
                      <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.85em' }}>
                        Rs {item.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                ) : item.sizes?.length > 0 ? (
                  `From Rs ${Math.min(...item.sizes.map(s => s.price)).toLocaleString()}`
                ) : (
                  `Rs ${item.price?.toLocaleString()}`
                )}
              </div>
            </div>
            {item.imageUrl && (
              <div className="mz-item-img" style={{ backgroundImage: `url(${item.imageUrl})` }} />
            )}
          </div>
        ))}
        {nextCat && (
          <button className="mz-up-next" onClick={onNextCat}>
            Up Next → {nextCat.name}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main menu content ────────────────────────────────────────────
function MenuContent({ restaurantId, tableNo }) {
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCatIdx, setActiveCatIdx] = useState(0);
  const [openCatIdx, setOpenCatIdx] = useState(null);
  const [selItem, setSelItem] = useState(null);
  const [toast, setToast] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { totalItems } = useCart();

  // Clone-based infinite carousel state
  const [displayIdx, setDisplayIdx] = useState(2); // 2..n+1 = real, 0..1=clones-left, n+2..n+3=clones-right
  const trackRef = useRef(null);
  const transitioning = useRef(false);

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
      const rawItems = iRes.data?.data?.items ?? iRes.data?.data ?? iRes.data?.items ?? iRes.data ?? [];
      let rawCats = cRes.data?.data ?? cRes.data ?? [];
      const rawDeals = dRes.data?.data ?? dRes.data ?? [];

      if (!Array.isArray(rawCats)) rawCats = [];
      const finalDeals = Array.isArray(rawDeals) ? rawDeals : [];

      if (finalDeals.length > 0) {
        rawCats = [
          { _id: 'mz-deals-pseudo', name: 'Deals & Combos', isDealCategory: true, image: 'https://images.unsplash.com/photo-1594212848116-b8dbbd5064e4?auto=format&fit=crop&w=800' },
          ...rawCats
        ];
      }

      setCategories(rawCats);
      setItems(Array.isArray(rawItems) ? rawItems : []);
      setDeals(finalDeals);
      if (r?.branding) applyTheme(r.branding);
    }).finally(() => setLoading(false));
  }, [restaurantId]);

  const applyTheme = (b) => {
    if (!b) return;
    const root = document.documentElement;
    if (b.primaryColor) root.style.setProperty('--mz-mid', b.primaryColor);
    if (b.secondaryColor) root.style.setProperty('--mz-cream', b.secondaryColor);
  };

  const n = categories.length;

  // ── Clone-based infinite carousel navigation ───────────────
  const advance = useCallback((dir) => {
    if (transitioning.current || n === 0) return;
    transitioning.current = true;
    if (trackRef.current) {
      trackRef.current.style.transition = 'transform 0.65s cubic-bezier(0.77,0,0.175,1)';
    }

    setDisplayIdx(prev => {
      const next = prev + dir;
      // Update real active index (real 0 is at displayIdx 2)
      setActiveCatIdx(((next - 2) % n + n) % n);
      setOpenCatIdx(null);
      return next;
    });

    setTimeout(() => {
      // After slide animation completes, snap to real position if at clone
      setDisplayIdx(prev => {
        if (prev <= 1) {
          // Animate to clone on left → snap to real equivalent
          if (trackRef.current) trackRef.current.style.transition = 'none';
          requestAnimationFrame(() => requestAnimationFrame(() => {
            if (trackRef.current) trackRef.current.style.transition = '';
            transitioning.current = false;
          }));
          return prev + n;
        }
        if (prev >= n + 2) {
          // Animate to clone on right → snap to real equivalent
          if (trackRef.current) trackRef.current.style.transition = 'none';
          requestAnimationFrame(() => requestAnimationFrame(() => {
            if (trackRef.current) trackRef.current.style.transition = '';
            transitioning.current = false;
          }));
          return prev - n;
        }
        transitioning.current = false;
        return prev;
      });
    }, 680);
  }, [n]);

  const goToCat = useCallback((realIdx) => {
    if (n === 0) return;
    if (trackRef.current) {
      trackRef.current.style.transition = 'transform 0.65s cubic-bezier(0.77,0,0.175,1)';
    }
    const wrapped = ((realIdx % n) + n) % n;
    setActiveCatIdx(wrapped);
    setOpenCatIdx(null);
    setDisplayIdx(wrapped + 2); // real 0 is at displayIdx 2
  }, [n]);

  const openCatItems = (idx) => {
    setOpenCatIdx(idx);
    setTimeout(() => {
      document.getElementById('mz-items-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
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

  const catItems = (cat) => {
    if (cat.isDealCategory) return deals;
    return items.filter(i => getId(i.categoryId) === cat._id);
  };

  const getCat = (i) => categories[((i % n) + n) % n];

  // Extended categories for clone-based infinite loop (2 clones on each side):
  const extendedCats = n > 0
    ? [getCat(n - 2), getCat(n - 1), ...categories, getCat(0), getCat(1)]
    : [];

  return (
    <div className="mz-root">
      {/* ── Fixed Top Nav (2-row mezami style) ─────────────── */}
      <nav className="mz-nav">
        {/* Row 1: Logo + Cart */}
        <div className="mz-nav-top">
          <div
            className="mz-nav-logo"
            onClick={() => { goToCat(0); }}
            style={{ cursor: 'pointer' }}
          >
            {restaurant?.restaurantName || 'Restaurant'}
            <span>Oriental Fusion</span>
          </div>
          <div
            className="mz-nav-cart"
            onClick={() => setIsCartOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            🛒 {totalItems > 0 ? `Cart (${totalItems})` : 'Cart'}
          </div>
        </div>
        {/* Row 2: Category links */}
        <div className="mz-nav-bottom">
          <button
            className="mz-nav-link"
            onClick={() => { goToCat(0); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >HOME</button>
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
      </nav>

      {/* ── Page ───────────────────────────────────────────── */}
      <div className="mz-page">

        {/* ── Carousel wrapper: clips sides but allows name to overflow bottom ── */}
        <div
          id="mz-carousel"
          style={{
            /* define slide dimensions for perfect math centering */
            '--slide-w': 'min(85vw, 592px)',
            '--slide-gap': '80px',
            /* clip-path clips left/right (side slides hidden) but allows vertical overflow */
            clipPath: 'inset(0 0 -9999px 0)',
            background: 'var(--mz-dark)',
            paddingTop: '24px',
            paddingBottom: '8px', /* Reduced padding */
          }}
        >
          <div
            ref={trackRef}
            style={{
              display: 'flex',
              gap: 'var(--slide-gap)',
              /* Start track exactly at center of viewport */
              marginLeft: '50%',
              /* Pull back by half a slide, and then shift left by displayIdx slides */
              transform: `translateX(calc( -1 * (var(--slide-w) / 2) - ${displayIdx} * (var(--slide-w) + var(--slide-gap)) ))`,
              willChange: 'transform',
            }}
          >
            {extendedCats.map((cat, extIdx) => {
              // Real index maps from extIdx (where extIdx 2 is real 0)
              const realIdx = ((extIdx - 2) % n + n) % n;
              const isActive = realIdx === activeCatIdx && extIdx === displayIdx;
              return (
                <div
                  key={`${extIdx}-${cat._id}`}
                  style={{
                    width: 'var(--slide-w)',
                    flexShrink: 0,
                    position: 'relative',
                    cursor: !isActive ? 'pointer' : 'default',
                  }}
                  onClick={() => !isActive && goToCat(realIdx)}
                >
                  {/* Mosaic box — fixed 592:331 aspect ratio */}
                  <div style={{
                    width: '100%',
                    aspectRatio: '592 / 331',
                    borderRadius: 14,
                    overflow: 'hidden',
                    opacity: isActive ? 1 : 0.55,
                    transition: 'opacity 0.4s ease',
                    boxShadow: isActive ? '0 8px 40px rgba(0,0,0,0.4)' : 'none',
                    position: 'relative',
                  }}>
                    <CategorySlide cat={cat} items={catItems(cat)} />
                    {/* Bottom gradient fade on active (so name blends out of box) */}
                    {isActive && (
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        height: '40%',
                        background: 'linear-gradient(to top, rgba(10,30,20,0.85) 0%, transparent 100%)',
                        borderRadius: '0 0 14px 14px',
                        pointerEvents: 'none',
                      }} />
                    )}
                  </div>

                  {/* Category name: straddles box bottom using negative margin */}
                  {isActive && (
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      zIndex: 10,
                      position: 'relative',
                      marginTop: '-2rem', /* pulls it up to straddle the bottom edge */
                    }}>
                      <h1 style={{
                        margin: 0, lineHeight: 1,
                        fontFamily: "'Raleway', sans-serif",
                        fontWeight: 900,
                        fontSize: 'clamp(24px, 4.5vw, 50px)',
                        color: '#fff',
                        letterSpacing: '0.06em',
                        textShadow: '0 2px 18px rgba(0,0,0,0.8)',
                        whiteSpace: 'nowrap',
                      }}>{cat.name.toUpperCase()}</h1>
                      <button
                        onClick={(e) => { e.stopPropagation(); goToCat(realIdx); openCatItems(realIdx); }}
                        style={{
                          padding: '7px 26px',
                          background: 'rgba(255,255,255,0.12)',
                          border: '1px solid rgba(255,255,255,0.35)',
                          borderRadius: 9999, color: '#fff',
                          fontFamily: "'Raleway', sans-serif",
                          fontSize: 10, fontWeight: 800, letterSpacing: '0.15em',
                          cursor: 'pointer', backdropFilter: 'blur(8px)',
                        }}
                      >VIEW MENU ↓</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Carousel footer: PREV · dots · NEXT ──────────── */}
        <div style={{
          height: 56, background: 'var(--mz-dark)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px',
          marginTop: 0, /* Removed extra margin */
        }}>
          <button className="mz-arrow-btn" onClick={() => advance(-1)}>PREV</button>
          <div className="mz-dots">
            {categories.map((_, i) => (
              <span key={i} className={`mz-dot ${i === activeCatIdx ? 'active' : ''}`} onClick={() => goToCat(i)} />
            ))}
          </div>
          <button className="mz-arrow-btn" onClick={() => advance(1)}>NEXT</button>
        </div>

        {/* ── Items panel ──────────────────────────────────── */}
        {openCatIdx !== null && categories[openCatIdx] && (
          <div id="mz-items-panel">
            <ItemsPanel
              cat={categories[openCatIdx]}
              items={catItems(categories[openCatIdx])}
              nextCat={categories[(openCatIdx + 1) % n]}
              onNextCat={() => {
                const nextIdx = (openCatIdx + 1) % n;
                goToCat(nextIdx);
                openCatItems(nextIdx);
              }}
              onItemSelect={setSelItem}
            />
          </div>
        )}

        {categories.length === 0 && (
          <div className="mz-loading" style={{ height: '80vh' }}>
            <span style={{ fontSize: 48 }}>🍽️</span>
            <span>No menu categories yet</span>
          </div>
        )}
      </div>

      {/* ── Item Detail Modal ────────────────────────────── */}
      {selItem && (
        <ItemModal
          item={selItem}
          onClose={() => setSelItem(null)}
          onAdded={handleAdded}
        />
      )}

      {/* ── Toast ────────────────────────────────────────── */}
      {toast && <div className="mz-toast">✓ {toast}</div>}

      {/* ── Cart Sidebar ───────────────────────────────────── */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        restaurantId={restaurantId}
        tableNo={tableNo}
      />
    </div>
  );
}

// ── Exported page (wraps CartProvider) ───────────────────────────
export default function MenuPage() {
  const { restaurantId } = useParams();
  const [searchParams] = useSearchParams();
  const tableNo = searchParams.get('table');
  return (
    <CartProvider restaurantId={restaurantId}>
      <MenuContent restaurantId={restaurantId} tableNo={tableNo} />
    </CartProvider>
  );
}
