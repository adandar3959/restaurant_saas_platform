import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { customerApi } from '../../api/customer.api';
import { CartProvider, useCart } from '../../context/CartContext';
import CategoryTabs   from './components/CategoryTabs';
import MenuItemCard   from './components/MenuItemCard';
import DealsSection   from './components/DealsSection';
import '../../styles/customer.css';

// ─── Toast ───────────────────────────────────────────────────
function Toast({ message, show }) {
  return (
    <div className={`c-toast${show ? ' show' : ''}`}>
      🛒 {message} added to cart!
    </div>
  );
}

// ─── Top Bar ─────────────────────────────────────────────────
function TopBar({ restaurant, tableNo, onCartClick }) {
  const { totalItems, totalPrice } = useCart();
  const name = restaurant?.restaurantName || restaurant?.name || 'Restaurant';
  const initial = name.charAt(0).toUpperCase();

  return (
    <header className="c-topbar">
      <div className="c-topbar-brand">
        <div className="c-topbar-logo">{initial}</div>
        <div>
          <div className="c-topbar-name">{name}</div>
          {tableNo && (
            <div className="c-topbar-table">📍 Table {tableNo}</div>
          )}
        </div>
      </div>

      {totalItems > 0 && (
        <button className="c-cart-btn" onClick={onCartClick}>
          🛒 Cart · Rs {totalPrice.toLocaleString()}
          <span className="c-cart-badge">{totalItems}</span>
        </button>
      )}
    </header>
  );
}

// ─── Hero Banner ─────────────────────────────────────────────
function HeroBanner({ restaurant }) {
  const name = restaurant?.restaurantName || restaurant?.name || 'Our Menu';
  const desc = restaurant?.description || 'Fresh, delicious food made just for you.';

  return (
    <div className="c-hero">
      <div className="c-hero-label">🔥 Live Menu</div>
      <h1 className="c-hero-title">{name}</h1>
      <p className="c-hero-sub">{desc}</p>
      <div className="c-hero-meta">
        <span className="c-hero-pill">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
          </svg>
          20–35 min
        </span>
        <span className="c-hero-pill">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          4.8 rating
        </span>
      </div>
    </div>
  );
}

// ─── Menu Content (inner — needs CartProvider to be above) ────
function MenuContent({ restaurantId, tableNo }) {
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '' });
  const toastTimer = useRef(null);

  // Fetch data
  useEffect(() => {
    if (!restaurantId) return;
    setLoading(true);
    setError(null);

    Promise.all([
      customerApi.getCategories(restaurantId),
      customerApi.getMenuItems(restaurantId, { limit: 200 }),
      customerApi.getDeals(restaurantId),
    ])
      .then(([catRes, itemRes, dealRes]) => {
        setCategories(catRes.data?.data || catRes.data || []);
        const raw = itemRes.data?.data || itemRes.data || [];
        setItems(Array.isArray(raw) ? raw : (raw.items || []));
        const rawDeals = dealRes.data?.data || dealRes.data || [];
        setDeals(Array.isArray(rawDeals) ? rawDeals.filter(d => d.isAvailable !== false) : []);
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Could not load menu. Please try again.');
      })
      .finally(() => setLoading(false));

    // Also try to fetch restaurant info (may fail gracefully)
    customerApi.getRestaurant(restaurantId)
      .then(res => setRestaurant(res.data?.data || res.data))
      .catch(() => {});
  }, [restaurantId]);

  const showToast = useCallback((name) => {
    clearTimeout(toastTimer.current);
    setToast({ show: true, message: name });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2200);
  }, []);

  // Filter items
  const filteredItems = items.filter(item => {
    const matchCat = activeCategory === 'all' || item.categoryId === activeCategory || item.category === activeCategory;
    const matchSearch = !search || item.name?.toLowerCase().includes(search.toLowerCase()) || item.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Group by category for display
  const categoriesToShow = activeCategory === 'all'
    ? categories
    : categories.filter(c => c._id === activeCategory);

  const getItemsByCategory = (catId) =>
    filteredItems.filter(i => i.categoryId === catId || i.category === catId);

  const uncategorized = filteredItems.filter(
    i => !i.categoryId && !i.category
  );

  const { totalItems: cartCount } = useCart();

  return (
    <div className="customer-root">
      <TopBar
        restaurant={restaurant}
        tableNo={tableNo}
        onCartClick={() => navigate(`/menu/${restaurantId}/cart${tableNo ? `?table=${tableNo}` : ''}`)}
      />

      {!loading && !error && <HeroBanner restaurant={restaurant} />}

      {!loading && !error && (
        <CategoryTabs
          categories={categories}
          activeId={activeCategory}
          onChange={setActiveCategory}
        />
      )}

      {/* Search */}
      {!loading && !error && (
        <div className="c-search-wrap">
          <div className="c-search-box">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="c-search-input"
              placeholder="Search dishes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Deals Section */}
      {!loading && !error && deals.length > 0 && !search && (
        <DealsSection deals={deals} onAdded={showToast} />
      )}


      {/* Loading */}
      {loading && (
        <div className="c-spinner-wrap">
          <div className="c-spinner" />
          Loading menu...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="c-empty">
          <div className="c-empty-icon">😕</div>
          <strong>Oops!</strong>
          <p>{error}</p>
        </div>
      )}

      {/* Items */}
      {!loading && !error && (
        <div className="c-page-padding-bottom">
          {/* Search results — flat */}
          {search ? (
            <>
              <div className="c-section-label">
                Results for "{search}"
              </div>
              {filteredItems.length === 0 ? (
                <div className="c-empty">
                  <div className="c-empty-icon">🔍</div>
                  <p>No dishes found</p>
                </div>
              ) : (
                <div className="c-items-grid">
                  {filteredItems.map((item, i) => (
                    <div key={item._id} style={{ animationDelay: `${i * 40}ms` }}>
                      <MenuItemCard item={item} onAdded={showToast} />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Grouped by category */
            <>
              {categoriesToShow.map(cat => {
                const catItems = getItemsByCategory(cat._id);
                if (catItems.length === 0) return null;
                return (
                  <div key={cat._id}>
                    <div className="c-section-label">{cat.name}</div>
                    <div className="c-items-grid">
                      {catItems.map((item, i) => (
                        <div key={item._id} style={{ animationDelay: `${i * 40}ms` }}>
                          <MenuItemCard item={item} onAdded={showToast} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Items with no category */}
              {uncategorized.length > 0 && activeCategory === 'all' && (
                <>
                  <div className="c-section-label">More Items</div>
                  <div className="c-items-grid">
                    {uncategorized.map((item, i) => (
                      <div key={item._id} style={{ animationDelay: `${i * 40}ms` }}>
                        <MenuItemCard item={item} onAdded={showToast} />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* All filtered items empty */}
              {filteredItems.length === 0 && (
                <div className="c-empty">
                  <div className="c-empty-icon">🍽️</div>
                  <p>No items in this category yet.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <Toast show={toast.show} message={toast.message} />
    </div>
  );
}

// ─── Menu Page (wraps CartProvider) ──────────────────────────
export default function MenuPage() {
  const { restaurantId } = useParams();
  const [searchParams] = useSearchParams();
  const tableNo = searchParams.get('table');

  if (!restaurantId) {
    return (
      <div className="customer-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 48 }}>🍽️</div>
        <p style={{ color: 'var(--c-text-muted)', fontFamily: 'Nunito, sans-serif' }}>Invalid menu link.</p>
      </div>
    );
  }

  return (
    <CartProvider restaurantId={restaurantId}>
      <MenuContent restaurantId={restaurantId} tableNo={tableNo} />
    </CartProvider>
  );
}
