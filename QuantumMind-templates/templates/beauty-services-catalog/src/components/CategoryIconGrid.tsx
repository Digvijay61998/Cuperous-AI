import React from 'react';
import { Category } from '../types';

interface CategoryIconGridProps {
  categories: Category[];
  selectedId?: string;
  maxVisible?: number;
  onSelect?: (categoryId: string) => void;
  ariaLabel?: string;
}

const CategoryIconGrid: React.FC<CategoryIconGridProps> = ({
  categories,
  selectedId,
  maxVisible = 6,
  onSelect,
  ariaLabel = 'Service categories',
}) => {
  const visible = categories.slice(0, maxVisible);

  return (
    <div className="category-grid" role="group" aria-label={ariaLabel}>
      {visible.map((cat) => {
        const isSelected = cat.id === selectedId;
        return (
          <button
            key={cat.id}
            className={`category-grid__item ${isSelected ? 'category-grid__item--selected' : ''}`}
            onClick={() => onSelect?.(cat.id)}
            aria-pressed={isSelected}
            type="button"
          >
            <span
              className="category-grid__icon"
              style={{ backgroundColor: cat.color || 'var(--qt-primary)' }}
            >
              {cat.icon}
            </span>
            <span className="category-grid__label">{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryIconGrid;
