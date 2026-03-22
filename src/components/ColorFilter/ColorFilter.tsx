import { useTranslation } from 'react-i18next';
import type { ColorFilterProps } from '@/types/components.types';
import './ColorFilter.scss';

/**
 * Mobile-only color filter bar displayed below the search input.
 *
 * @param props - Component props.
 * @returns Mobile filter bar JSX.
 */
export const ColorFilter = ({
  resultCount,
  loading,
  isOpen,
  isFilterLoading,
  availableColors,
  selectedColor,
  activeCount,
  onOpen,
  onClose,
  onSelect,
  onClear,
}: ColorFilterProps) => {
  const { t } = useTranslation();

  /**
   * Returns the CSS class for a swatch button based on selection state.
   *
   * @param hexCode - Swatch hex code.
   * @returns BEM class name with selected modifier when active.
   */
  const getSwatchClassName = (hexCode: string): string => {
    return `color-filter__swatch${selectedColor === hexCode ? ' color-filter__swatch--selected' : ''}`;
  };

  const loadingLabel = t('colorFilter.loading');
  const countLabel = loading
    ? t('colorFilter.searching')
    : t('colorFilter.result', { count: resultCount });
  const filterActionLabel =
    activeCount > 0
      ? t('colorFilter.filterBtnActive', { count: activeCount })
      : t('colorFilter.filterBtn');
  const filterActionAriaLabel =
    activeCount > 0
      ? t('colorFilter.filterAppliedAriaLabel', { count: activeCount })
      : t('colorFilter.filterOpenAriaLabel');

  const clearButton =
    activeCount > 0 ? (
      <button
        type="button"
        className="color-filter__clear"
        onClick={onClear}
        aria-label={t('colorFilter.clearAriaLabel')}
      >
        ×
      </button>
    ) : null;

  const swatchesContent = isFilterLoading ? (
    <span className="color-filter__loading">{loadingLabel}</span>
  ) : availableColors.length > 0 ? (
    availableColors.map((color) => (
      <button
        key={color.hexCode}
        type="button"
        role="radio"
        aria-checked={selectedColor === color.hexCode}
        aria-label={color.name}
        className={getSwatchClassName(color.hexCode)}
        onClick={() => onSelect(color.hexCode)}
      >
        <span className="color-filter__swatch-inner" style={{ backgroundColor: color.hexCode }} />
      </button>
    ))
  ) : (
    <span className="color-filter__loading">{t('colorFilter.empty')}</span>
  );

  if (isOpen) {
    return (
      <div className="color-filter" aria-label={t('colorFilter.ariaLabel')}>
        <div
          className="color-filter__swatches"
          role="radiogroup"
          aria-label={t('colorFilter.swatchesAriaLabel')}
        >
          {swatchesContent}
        </div>

        <button
          type="button"
          className="color-filter__action"
          onClick={onClose}
          aria-label={t('colorFilter.closeAriaLabel')}
        >
          {t('colorFilter.closeBtn')}
        </button>
      </div>
    );
  }

  return (
    <div className="color-filter" aria-label={t('colorFilter.ariaLabel')}>
      <span className="color-filter__count" role="status" aria-live="polite" aria-atomic="true">
        {countLabel}
      </span>

      <div className="color-filter__actions">
        <button
          type="button"
          className="color-filter__action"
          onClick={onOpen}
          aria-label={filterActionAriaLabel}
        >
          {filterActionLabel}
        </button>
        {clearButton}
      </div>
    </div>
  );
};
