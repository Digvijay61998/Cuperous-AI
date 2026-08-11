import React from 'react';
import { Category } from '../types';

interface CategoryBarProps {
  categories: Category[];
  activeId: string;
  onSelect: (id: string) => void;
}

const CategoryBar: React.FC<CategoryBarProps> = ({ categories, activeId, onSelect }) => {
  return (
    <div className="category-bar" role="group" aria-label="Menu categories">
      {categories.map((category) => {
        const isActive = category.id === activeId;
        return (
          <button
            key={category.id}
            className={`category-bar__pill${isActive ? ' category-bar__pill--active' : ''}`}
            onClick={() => onSelect(category.id)}
            aria-pressed={isActive}
            type="button"
          >
            {category.name}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryBar;
