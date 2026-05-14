import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

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
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Load from localStorage on mount / restaurantId change
  useEffect(() => {
    if (!restaurantId) return;
    const saved = loadCart(restaurantId);
    dispatch({ type: 'INIT', payload: saved });
  }, [restaurantId]);

  // Persist to localStorage whenever items change
  useEffect(() => {
    if (!restaurantId) return;
    saveCart(restaurantId, state.items);
  }, [state.items, restaurantId]);

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
