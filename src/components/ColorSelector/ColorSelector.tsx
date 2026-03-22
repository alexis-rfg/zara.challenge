import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColorOption } from '@/types/product.types';
import './ColorSelector.scss';

/**
 * Props for the ColorSelector component.
 */
export type ColorSelectorProps = {
  /** Array of available color options */
  colors: ColorOption[];
  /** Index of the currently selected color, or null if none selected */
  selectedIndex: number | null;
  /** Callback fired when a color is selected */
  onSelect: (index: number) => void;
};

/**
 * Color selector component with visual swatches and hover preview.
 * Displays color options as clickable swatches with the selected/hovered color name below.
 *
 * @param props - Component props
 * @returns A color selection interface with swatches and name display
 *
 * @example
 * ```tsx
 * <ColorSelector
 *   colors={product.colorOptions}
 *   selectedIndex={selectedColorIndex}
 *   onSelect={setSelectedColorIndex}
 * />
 * ```
 */
export const ColorSelector = ({ colors, selectedIndex, onSelect }: ColorSelectorProps) => {
  const { t } = useTranslation();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const displayName =
    hoveredIndex !== null
      ? (colors[hoveredIndex]?.name ?? '')
      : selectedIndex !== null
        ? (colors[selectedIndex]?.name ?? '')
        : '';

  return (
    <div className="color-selector">
      <p className="color-selector__label">{t('colorSelector.label')}</p>
      <div
        className="color-selector__options"
        role="radiogroup"
        aria-label={t('colorSelector.ariaLabel')}
      >
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
