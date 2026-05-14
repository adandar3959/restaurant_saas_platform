import { useCart } from '../../../context/CartContext';

/**
 * Horizontal-scroll deal cards strip shown above the main menu.
 * Each deal card shows: name, included items, original price (crossed),
 * deal price, discount badge, and an "Add Deal" button.
 */
export default function DealsSection({ deals, onAdded }) {
  const { addItem } = useCart();

  const handleAddDeal = (deal) => {
    // Add the deal as a single cart item (priced at dealPrice)
    addItem({
      _id:         deal._id,
      name:        deal.name,
      price:       deal.dealPrice,
      description: deal.description || deal.items?.map(i => `${i.quantity}× ${i.name}`).join(', '),
      isDeal:      true,
    }, 1);
    onAdded && onAdded(deal.name);
  };

  return (
    <div style={{ padding: '4px 0 0' }}>
      <div className="c-section-label">🔥 Deals &amp; Combos</div>
      <div style={{
        overflowX: 'auto',
        scrollbarWidth: 'none',
        display: 'flex',
        gap: 12,
        padding: '4px 16px 20px',
      }}>
        {deals.map(deal => {
          const hasSaving = deal.originalPrice && deal.originalPrice > deal.dealPrice;
          const pct = hasSaving
            ? Math.round(((deal.originalPrice - deal.dealPrice) / deal.originalPrice) * 100)
            : deal.discountPct || 0;

          return (
            <div key={deal._id} style={{
              flexShrink: 0,
              width: 220,
              background: '#fff',
              border: '1.5px solid #F97316',
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(249,115,22,0.12)',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* Top banner */}
              <div style={{
                background: 'linear-gradient(135deg, #F97316, #FBBF24)',
                padding: '14px 14px 10px',
                position: 'relative',
              }}>
                {pct > 0 && (
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    background: '#fff', color: '#EA580C',
                    borderRadius: 9999, padding: '2px 8px',
                    fontSize: 11, fontWeight: 900,
                  }}>
                    {pct}% OFF
                  </div>
                )}
                {deal.tag && (
                  <div style={{
                    display: 'inline-block',
                    background: 'rgba(255,255,255,0.25)',
                    borderRadius: 9999, padding: '2px 10px',
                    fontSize: 11, fontWeight: 700, color: '#fff',
                    marginBottom: 6,
                  }}>
                    {deal.tag}
                  </div>
                )}
                <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
                  {deal.name}
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Included items */}
                {deal.items?.length > 0 && (
                  <div style={{ fontSize: 12, color: '#78716C', fontWeight: 600, lineHeight: 1.5 }}>
                    {deal.items.map((item, i) => (
                      <span key={i}>
                        {item.quantity > 1 && <strong style={{ color: '#F97316' }}>{item.quantity}× </strong>}
                        {item.name}
                        {i < deal.items.length - 1 ? ' + ' : ''}
                      </span>
                    ))}
                  </div>
                )}

                {/* Price row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: '#EA580C' }}>
                    Rs {deal.dealPrice?.toLocaleString()}
                  </span>
                  {hasSaving && (
                    <span style={{ fontSize: 13, color: '#A8A29E', textDecoration: 'line-through', fontWeight: 600 }}>
                      Rs {deal.originalPrice?.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Add button */}
                <button
                  onClick={() => handleAddDeal(deal)}
                  style={{
                    width: '100%', padding: '9px 0',
                    background: 'linear-gradient(135deg, #F97316, #FBBF24)',
                    color: '#fff', border: 'none', borderRadius: 9999,
                    fontSize: 13, fontWeight: 800, cursor: 'pointer',
                    fontFamily: 'Nunito, sans-serif',
                    boxShadow: '0 2px 10px rgba(249,115,22,0.3)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => e.target.style.transform = 'translateY(-1px)'}
                  onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
                >
                  🛒 Add Deal
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
