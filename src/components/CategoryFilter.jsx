import React from 'react';
import { 
  Sparkles, 
  Waves, 
  TreePine, 
  Sun, 
  Building2, 
  Mountain, 
  Trees, 
  Building,
  SlidersHorizontal
} from 'lucide-react';
import { CATEGORIES } from '../data/mockData';

const ICON_MAP = {
  Sparkles,
  Waves,
  TreePine,
  Sun,
  Building2,
  Mountain,
  Trees,
  Building
};

export default function CategoryFilter({ selectedCategory, setSelectedCategory }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      padding: '1.25rem 0',
      borderBottom: '1px solid var(--border-color)',
      marginBottom: '1rem'
    }}>
      {/* SCROLLABLE CATEGORIES */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
        overflowX: 'auto',
        scrollBehavior: 'smooth',
        paddingBottom: '0.25rem',
        width: '100%'
      }}>
        {CATEGORIES.map((cat) => {
          const IconComponent = ICON_MAP[cat.icon] || Sparkles;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.4rem',
                paddingBottom: '0.5rem',
                borderBottom: isSelected ? '2px solid var(--dark)' : '2px solid transparent',
                color: isSelected ? 'var(--dark)' : 'var(--dark-gray)',
                fontWeight: isSelected ? 700 : 500,
                fontSize: '0.82rem',
                whiteSpace: 'nowrap',
                transition: 'var(--transition-fast)',
                opacity: isSelected ? 1 : 0.75
              }}
            >
              <IconComponent size={22} color={isSelected ? 'var(--dark)' : 'var(--dark-gray)'} />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* FILTERS BUTTON */}
      <button style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.65rem 1rem',
        fontSize: '0.85rem',
        fontWeight: 600,
        backgroundColor: 'white',
        boxShadow: 'var(--shadow-sm)',
        whiteSpace: 'nowrap'
      }}>
        <SlidersHorizontal size={16} />
        <span>Filtros</span>
      </button>
    </div>
  );
}
