import React from 'react';
import { Category } from '../types';

interface CategoryRowProps {
  categories: Category[];
  activeId: string;
  onSelect: (categoryId: string) => void;
}

const CategoryRow: React.FC<CategoryRowProps> = ({ categories, activeId, onSelect }) => {
  return (
    <div className="category-row" role="tablist" aria-label="Product categories">
      {categories.map((cat) => {
        const isActive = cat.id === activeId;
        return (
          <button
            key={cat.id}
            className={`category-row__item${isActive ? ' category-row__item--active' : ''}`}
            onClick={() => onSelect(cat.id)}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={cat.name}
          >
            <div className="category-row__icon">
              {cat.icon ? (
                <img src={cat.icon} alt="" className="category-row__icon-img" />
              ) : (
                <span className="category-row__icon-fallback" aria-hidden="true">
                  {cat.name.charAt(0)}
                </span>
              )}
            </div>
            <span className="category-row__label">{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryRow;
