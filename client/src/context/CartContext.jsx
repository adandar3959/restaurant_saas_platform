import { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';

const CartContext = createContext(null);

function getStorageKey(restaurantId) {
  return `rms_cart_${restaurantId}`;
}

function loadCart(restaurantId) {
  try {
    const raw = localStorage.getItem(getStorageKey(restaurantId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(restaurantId, items) {
  try {
    localStorage.setItem(getStorageKey(restaurantId), JSON.stringify(items));
  } catch { /* ignore */ }
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return { ...state, items: action.payload };

    case 'ADD': {
      const existing = state.items.find(i => i._id === action.payload._id);
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i._id === action.payload._id
              ? { ...i, qty: i.qty + (action.qty || 1) }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.payload, qty: action.qty || 1 }] };
    }

    case 'REMOVE':
      return { ...state, items: state.items.filter(i => i._id !== action.id) };

    case 'UPDATE_QTY':
      return {
        ...state,
        items: state.items
          .map(i => i._id === action.id ? { ...i, qty: action.qty } : i)
          .filter(i => i.qty > 0),
      };

    case 'CLEAR':
      return { ...state, items: [] };

    default:
      return state;
  }
}

export function CartProvider({ restaurantId, children }) {
  const location = useLocation();

  // Dynamic state to hold resolved ID for slug-based URLs
  const [slugId, setSlugId] = useState(() => {
    const match = window.location.pathname.match(/\/r\/([^/]+)/);
    return match ? sessionStorage.getItem(`slug_id_${match[1]}`) : null;
  });

  // Fetch or retrieve resolved slug ID on navigation changes
  useEffect(() => {
    const match = location.pathname.match(/\/r\/([^/]+)/);
    if (!match) {
      setSlugId(null);
      return;
    }
    const slug = match[1];
    const cached = sessionStorage.getItem(`slug_id_${slug}`);
    if (cached) {
      setSlugId(cached);
    } else {
      fetch(`http://localhost:5000/api/v1/tenants/slug/${slug}`)
        .then(res => res.json())
        .then(data => {
          const tenantId = data.data?._id || data._id;
          if (tenantId) {
            sessionStorage.setItem(`slug_id_${slug}`, tenantId);
            setSlugId(tenantId);
          }
        })
        .catch(err => console.error('Failed to resolve slug in CartProvider', err));
    }
  }, [location.pathname]);

  // Synchronous auto-detection during initial render to prevent race conditions
  const initialRestaurantId = restaurantId || (() => {
    const match = window.location.pathname.match(/\/menu\/([^/]+)/);
    if (match) return match[1];

    const searchParams = new URLSearchParams(window.location.search);
    const queryRid = searchParams.get('restaurant_id');
    if (queryRid) return queryRid;

    const slugMatch = window.location.pathname.match(/\/r\/([^/]+)/);
    if (slugMatch) {
      return sessionStorage.getItem(`slug_id_${slugMatch[1]}`);
    }
    return null;
  })();

  const [state, dispatch] = useReducer(cartReducer, {
    items: initialRestaurantId ? loadCart(initialRestaurantId) : []
  });
  const [loadedId, setLoadedId] = useState(initialRestaurantId);

  // Auto-detect restaurantId from URL on route changes
  const effectiveRestaurantId = restaurantId || (() => {
    const match = location.pathname.match(/\/menu\/([^/]+)/);
    if (match) return match[1];

    // Check for query parameter (e.g. on order-success page)
    const searchParams = new URLSearchParams(location.search);
    const queryRid = searchParams.get('restaurant_id');
    if (queryRid) return queryRid;

    return slugId;
  })();

  // Load from localStorage on mount / restaurantId change (only if not already loaded)
  useEffect(() => {
    if (!effectiveRestaurantId || loadedId === effectiveRestaurantId) return;
    const saved = loadCart(effectiveRestaurantId);
    dispatch({ type: 'INIT', payload: saved });
    setLoadedId(effectiveRestaurantId);
  }, [effectiveRestaurantId, loadedId]);

  // Persist to localStorage whenever items change, but only AFTER initial load
  useEffect(() => {
    if (!effectiveRestaurantId || loadedId !== effectiveRestaurantId) return;
    saveCart(effectiveRestaurantId, state.items);
  }, [state.items, effectiveRestaurantId, loadedId]);

  const addItem = useCallback((item, qty = 1) => {
    dispatch({ type: 'ADD', payload: item, qty });
  }, []);

  const removeItem = useCallback((id) => {
    dispatch({ type: 'REMOVE', id });
  }, []);

  const updateQty = useCallback((id, qty) => {
    dispatch({ type: 'UPDATE_QTY', id, qty });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const totalItems = state.items.reduce((s, i) => s + i.qty, 0);
  const totalPrice = state.items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{
      items: state.items,
      totalItems,
      totalPrice,
      addItem,
      removeItem,
      updateQty,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
