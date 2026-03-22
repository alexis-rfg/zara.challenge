import { useTranslation } from 'react-i18next';
import type { StorageSelectorProps } from '@/types/components.types';
import './StorageSelector.scss';

/**
 * Storage capacity selector component with adjacent button layout.
 * Displays storage options as buttons that share borders for a seamless appearance.
 *
 * @param props - Component props.
 * @returns Storage selection interface.
 */
export const StorageSelector = ({ options, selectedIndex, onSelect }: StorageSelectorProps) => {
  const { t } = useTranslation();

  /**
   * Returns the CSS class for a storage option based on selection state.
   *
   * @param index - Storage option index.
   * @returns Button class name with selected modifier when active.
   */
  const getOptionClassName = (index: number): string => {
    return `storage-selector__option${selectedIndex === index ? ' storage-selector__option--selected' : ''}`;
  };

  return (
    <div className="storage-selector">
      <p className="storage-selector__label">{t('storageSelector.label')}</p>
      <div
        className="storage-selector__options"
        role="radiogroup"
        aria-label={t('storageSelector.ariaLabel')}
      >
        {options.map((option, index) => (
          <button
            key={option.capacity}
            type="button"
            role="radio"
            aria-checked={selectedIndex === index}
            className={getOptionClassName(index)}
            onClick={() => onSelect(index)}
          >
            {option.capacity}
          </button>
        ))}
      </div>
    </div>
  );
};
