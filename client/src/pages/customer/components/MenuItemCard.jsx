import { useState, useCallback } from 'react';
import { useCart } from '../../../context/CartContext';

const FOOD_EMOJI = {
  'burger': '🍔', 'pizza': '🍕', 'pasta': '🍝', 'salad': '🥗',
  'chicken': '🍗', 'fish': '🐟', 'sushi': '🍱', 'rice': '🍚',
  'soup': '🍜', 'sandwich': '🥪', 'dessert': '🍰', 'cake': '🎂',
  'ice cream': '🍦', 'coffee': '☕', 'drink': '🥤', 'juice': '🧃',
  'wrap': '🌯', 'taco': '🌮', 'steak': '🥩', 'wings': '🍗',
  'noodle': '🍜', 'curry': '🍛', 'biryani': '🍛', 'roll': '🌯',
};

function getEmoji(name = '') {
  const n = name.toLowerCase();
  for (const [k, v] of Object.entries(FOOD_EMOJI)) {
    if (n.includes(k)) return v;
  }
  return '🍽️';
}

function ItemDetailModal({ item, onClose, onAdded }) {
  const hasSizes  = item.sizes?.length > 0;
  const [qty, setQty]           = useState(1);
  const [selSize, setSelSize]   = useState(hasSizes ? item.sizes[0] : null);
  const { addItem } = useCart();

  const activePrice = hasSizes ? (selSize?.price ?? item.price) : item.price;

  const handleAdd = () => {
    const cartItem = hasSizes
      ? { ...item, _id: `${item._id}_${selSize.name}`, name: `${item.name} (${selSize.name})`, price: selSize.price }
      : item;
    addItem(cartItem, qty);
    onAdded && onAdded(hasSizes ? `${item.name} (${selSize.name})` : item.name);
    onClose();
  };

  return (
    <div className="c-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="c-modal-sheet">
        {/* Image */}
        <div className="c-modal-img" style={{ position: 'relative' }}>
          {item.imageUrl
            ? <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 72 }}>{getEmoji(item.name)}</span>
          }
          <button className="c-modal-close" onClick={onClose} style={{ position: 'absolute', top: 12, right: 12 }}>✕</button>
        </div>

        {/* Body */}
        <div className="c-modal-body">
          <div className="c-badges" style={{ marginBottom: 8 }}>
            {item.isVegetarian && <span className="c-badge c-badge-veg">🥬 Veg</span>}
            {item.isSpicy      && <span className="c-badge c-badge-spicy">🌶 Spicy</span>}
            {item.isPopular    && <span className="c-badge c-badge-pop">⭐ Popular</span>}
          </div>
          <h2 className="c-modal-title">{item.name}</h2>
          {item.description && <p className="c-modal-desc">{item.description}</p>}
          <div className="c-modal-price">Rs {activePrice?.toLocaleString()}</div>

          {/* Size selector */}
          {hasSizes && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-muted)', marginBottom: 10 }}>
                Choose Size
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {item.sizes.map(size => (
                  <button
                    key={size.name}
                    onClick={() => setSelSize(size)}
                    style={{
                      padding: '8px 16px',
                      border: `2px solid ${selSize?.name === size.name ? 'var(--c-primary)' : 'var(--c-border)'}`,
                      borderRadius: 'var(--c-radius-full)',
                      background: selSize?.name === size.name ? 'var(--c-primary-glow)' : 'var(--c-surface)',
                      color: selSize?.name === size.name ? 'var(--c-primary-dark)' : 'var(--c-text)',
                      fontWeight: 700, fontSize: 13, cursor: 'pointer',
                      fontFamily: 'Nunito, sans-serif',
                      transition: 'all 0.18s ease',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    }}
                  >
                    <span>{size.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: selSize?.name === size.name ? 'var(--c-primary-dark)' : 'var(--c-text-muted)' }}>
                      Rs {size.price?.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity control */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-muted)', marginBottom: 10 }}>
              Quantity
            </div>
            <div className="c-qty-control">
              <button className="c-qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}>−</button>
              <span className="c-qty-val">{qty}</span>
              <button className="c-qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="c-modal-footer">
          <button className="c-add-to-cart-btn" onClick={handleAdd} disabled={hasSizes && !selSize}>
            <span>🛒</span>
            Add {qty} to Cart — Rs {(activePrice * qty).toLocaleString()}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MenuItemCard({ item, onAdded }) {
  const [showModal, setShowModal] = useState(false);
  const { addItem, items } = useCart();
  const inCart  = items.find(i => i._id === item._id || i._id?.startsWith(item._id));
  const hasSizes = item.sizes?.length > 0;

  const handleQuickAdd = useCallback((e) => {
    e.stopPropagation();
    if (hasSizes) {
      // Has sizes → open modal so user can pick
      setShowModal(true);
      return;
    }
    addItem(item, 1);
    onAdded && onAdded(item.name);
  }, [item, addItem, onAdded, hasSizes]);

  const isAvailable = item.isAvailable !== false;

  return (
    <>
      <div className="c-item-card c-fade-up" onClick={() => isAvailable && setShowModal(true)}>
        {/* Image */}
        <div className="c-item-img-placeholder" style={{ position: 'relative' }}>
          {item.imageUrl
            ? <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
            : <span>{getEmoji(item.name)}</span>
          }
          {!isAvailable && <div className="c-unavailable">Unavailable</div>}
        </div>

        {/* Content */}
        <div className="c-item-body">
          <div className="c-badges">
            {item.isVegetarian && <span className="c-badge c-badge-veg">🥬 Veg</span>}
            {item.isSpicy      && <span className="c-badge c-badge-spicy">🌶</span>}
            {item.isPopular    && <span className="c-badge c-badge-pop">⭐</span>}
          </div>
          <div className="c-item-name">{item.name}</div>
          {item.description && <div className="c-item-desc">{item.description}</div>}
          <div className="c-item-footer">
            <span className="c-item-price">
              {hasSizes
                ? `Rs ${Math.min(...item.sizes.map(s => s.price)).toLocaleString()} – ${Math.max(...item.sizes.map(s => s.price)).toLocaleString()}`
                : `Rs ${item.price?.toLocaleString()}`
              }
            </span>
            {isAvailable && (
              <button
                className="c-item-add-btn"
                onClick={handleQuickAdd}
                title={hasSizes ? 'Choose size' : 'Quick add'}
                style={inCart ? { background: 'var(--c-primary-dark)' } : {}}
              >
                {inCart ? '✓' : '+'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <ItemDetailModal
          item={item}
          onClose={() => setShowModal(false)}
          onAdded={onAdded}
        />
      )}
    </>
  );
}
