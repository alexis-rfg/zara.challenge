import { useTranslation } from 'react-i18next';
import type { FilterColor } from '@/hooks/useColorFilter';
import './ColorFilter.scss';

export type ColorFilterProps = {
  /** Number of products currently displayed (after filtering). */
  resultCount: number;
  /** Whether the product list is loading. */
  loading: boolean;
  /** Whether the swatch panel is open. */
  isOpen: boolean;
  /** Whether color data is being fetched (first open only). */
  isFilterLoading: boolean;
  /** Unique colors extracted from the catalog. */
  availableColors: FilterColor[];
  /** Currently selected color hex code, or `null`. */
  selectedColor: string | null;
  /** Number of active filters (0 or 1). */
  activeCount: number;
  /** Open the swatch panel. */
  onOpen: () => void;
  /** Close the swatch panel without changing the selection. */
  onClose: () => void;
  /** Select a color by hex code (closes the panel automatically). */
  onSelect: (hexCode: string) => void;
  /** Clear the active color filter. */
  onClear: () => void;
};

/**
 * Mobile-only color filter bar displayed below the search input.
 *
 * ### Three visual states
 * | State | Left side | Right side |
 * |-------|-----------|------------|
 * | **Default** | `N RESULTS` | `FILTRAR` |
 * | **Open** | color swatches | `CERRAR` |
 * | **Applied** | `N RESULTS` | `FILTRAR (N) ×` |
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

  // ─── Open state: swatches + CERRAR ──────────────────────────────────────────
  if (isOpen) {
    return (
      <div className="color-filter" aria-label={t('colorFilter.ariaLabel')}>
        <div
          className="color-filter__swatches"
          role="radiogroup"
          aria-label={t('colorFilter.swatchesAriaLabel')}
        >
          {isFilterLoading ? (
            <span className="color-filter__loading">{t('colorFilter.loading')}</span>
          ) : (
            availableColors.map((color) => (
              <button
                key={color.hexCode}
                type="button"
                role="radio"
                aria-checked={selectedColor === color.hexCode}
                aria-label={color.name}
                className={`color-filter__swatch${selectedColor === color.hexCode ? ' color-filter__swatch--selected' : ''}`}
                onClick={() => onSelect(color.hexCode)}
              >
                <span
                  className="color-filter__swatch-inner"
                  style={{ backgroundColor: color.hexCode }}
                />
              </button>
            ))
          )}
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

  // ─── Default / Applied state: results count + FILTRAR ───────────────────────
  return (
    <div className="color-filter" aria-label={t('colorFilter.ariaLabel')}>
      <span className="color-filter__count" role="status" aria-live="polite" aria-atomic="true">
        {loading && t('colorFilter.searching')}
        {!loading && t('colorFilter.result', { count: resultCount })}
      </span>

      <div className="color-filter__actions">
        <button
          type="button"
          className="color-filter__action"
          onClick={onOpen}
          aria-label={
            activeCount > 0
              ? t('colorFilter.filterAppliedAriaLabel', { count: activeCount })
              : t('colorFilter.filterOpenAriaLabel')
          }
        >
          {activeCount > 0
            ? t('colorFilter.filterBtnActive', { count: activeCount })
            : t('colorFilter.filterBtn')}
        </button>

        {activeCount > 0 && (
          <button
            type="button"
            className="color-filter__clear"
            onClick={onClear}
            aria-label={t('colorFilter.clearAriaLabel')}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};
