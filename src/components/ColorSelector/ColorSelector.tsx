import { useState } from 'react';
import type { ColorOption } from '@/types/product.types';
import './ColorSelector.scss';

type ColorSelectorProps = {
  colors: ColorOption[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
};

export const ColorSelector = ({ colors, selectedIndex, onSelect }: ColorSelectorProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const displayName =
    hoveredIndex !== null
      ? (colors[hoveredIndex]?.name ?? '')
      : selectedIndex !== null
        ? (colors[selectedIndex]?.name ?? '')
        : '';

  return (
    <div className="color-selector">
      <p className="color-selector__label">Color. Pick your favorite</p>
      <div className="color-selector__options" role="radiogroup" aria-label="Select color">
        {colors.map((color, index) => (
          <button
            key={color.name}
            type="button"
            role="radio"
            aria-checked={selectedIndex === index}
            aria-label={color.name}
            className={`color-selector__option${selectedIndex === index ? ' color-selector__option--selected' : ''}`}
            onClick={() => onSelect(index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <span className="color-selector__swatch" style={{ backgroundColor: color.hexCode }} />
          </button>
        ))}
        <span className="color-selector__name" aria-live="polite">
          {displayName}
        </span>
      </div>
    </div>
  );
};
