import type { StorageOption } from '@/types/product.types';
import './StorageSelector.scss';

/**
 * Props for the StorageSelector component.
 */
type StorageSelectorProps = {
  /** Array of available storage options with capacity and price */
  options: StorageOption[];
  /** Index of the currently selected storage option, or null if none selected */
  selectedIndex: number | null;
  /** Callback fired when a storage option is selected */
  onSelect: (index: number) => void;
};

/**
 * Storage capacity selector component with adjacent button layout.
 * Displays storage options as buttons that share borders for a seamless appearance.
 *
 * @param props - Component props
 * @returns A storage selection interface with capacity buttons
 *
 * @example
 * ```tsx
 * <StorageSelector
 *   options={product.storageOptions}
 *   selectedIndex={selectedStorageIndex}
 *   onSelect={setSelectedStorageIndex}
 * />
 * ```
 */
export const StorageSelector = ({ options, selectedIndex, onSelect }: StorageSelectorProps) => {
  return (
    <div className="storage-selector">
      <p className="storage-selector__label">Storage ¿How much space do you need?</p>
      <div
        className="storage-selector__options"
        role="radiogroup"
        aria-label="Select storage capacity"
      >
        {options.map((option, index) => (
          <button
            key={option.capacity}
            type="button"
            role="radio"
            aria-checked={selectedIndex === index}
            className={`storage-selector__option${selectedIndex === index ? ' storage-selector__option--selected' : ''}`}
            onClick={() => onSelect(index)}
          >
            {option.capacity}
          </button>
        ))}
      </div>
    </div>
  );
};
