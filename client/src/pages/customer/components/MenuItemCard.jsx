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
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();

  const handleAdd = () => {
    addItem(item, qty);
    onAdded && onAdded(item.name);
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
          <div className="c-modal-price">Rs {item.price?.toLocaleString()}</div>

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
          <button className="c-add-to-cart-btn" onClick={handleAdd}>
            <span>🛒</span>
            Add {qty} to Cart — Rs {(item.price * qty).toLocaleString()}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MenuItemCard({ item, onAdded }) {
  const [showModal, setShowModal] = useState(false);
  const { addItem, items } = useCart();
  const inCart = items.find(i => i._id === item._id);

  const handleQuickAdd = useCallback((e) => {
    e.stopPropagation();
    addItem(item, 1);
    onAdded && onAdded(item.name);
  }, [item, addItem, onAdded]);

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
            <span className="c-item-price">Rs {item.price?.toLocaleString()}</span>
            {isAvailable && (
              <button
                className="c-item-add-btn"
                onClick={handleQuickAdd}
                title="Quick add"
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
