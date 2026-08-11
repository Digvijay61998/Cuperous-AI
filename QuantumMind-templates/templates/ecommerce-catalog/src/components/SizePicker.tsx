import React from 'react';

interface SizePickerProps {
  sizes: string[];
  selectedSize: string;
  onSelect: (size: string) => void;
}

const SizePicker: React.FC<SizePickerProps> = ({ sizes, selectedSize, onSelect }) => {
  return (
    <div className="size-picker" role="radiogroup" aria-label="Select size">
      {sizes.map((size) => {
        const isActive = size === selectedSize;
        return (
          <button
            key={size}
            className={`size-picker__pill${isActive ? ' size-picker__pill--active' : ''}`}
            onClick={() => onSelect(size)}
            type="button"
            role="radio"
            aria-checked={isActive}
          >
            {size}
          </button>
        );
      })}
    </div>
  );
};

export default SizePicker;
