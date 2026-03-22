import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColorSelectorProps } from '@/types/components.types';
import './ColorSelector.scss';

/**
 * Color selector component with visual swatches and hover preview.
 *
 * @param props - Component props.
 * @returns Color selection interface with swatches and name display.
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

  /**
   * Returns the CSS class for a swatch button based on selection state.
   *
   * @param index - Color option index.
   * @returns Button class name with selected modifier when active.
   */
  const getOptionClassName = (index: number): string => {
    return `color-selector__option${selectedIndex === index ? ' color-selector__option--selected' : ''}`;
  };

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
            className={getOptionClassName(index)}
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
