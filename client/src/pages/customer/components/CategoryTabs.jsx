export default function CategoryTabs({ categories, activeId, onChange }) {
  return (
    <div className="c-cat-bar">
      <div className="c-cat-inner">
        <button
          className={`c-cat-tab${activeId === 'all' ? ' active' : ''}`}
          onClick={() => onChange('all')}
        >
          🍽️ All
        </button>
        {categories.map(cat => (
          <button
            key={cat._id}
            className={`c-cat-tab${activeId === cat._id ? ' active' : ''}`}
            onClick={() => onChange(cat._id)}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
