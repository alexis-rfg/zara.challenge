import type { StorageOption } from '@/types/product.types';
import './StorageSelector.scss';

type StorageSelectorProps = {
  options: StorageOption[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
};

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
