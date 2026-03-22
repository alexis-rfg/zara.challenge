import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StorageSelector } from '../StorageSelector';
import storageOptionsFixtures from '@/test/fixtures/storageOptions.json';

const mockOptions = [
  storageOptionsFixtures['128gb'],
  storageOptionsFixtures['256gb'],
  storageOptionsFixtures['512gb'],
];

describe('StorageSelector', () => {
  it('renders all storage options as radio buttons', () => {
    render(<StorageSelector options={mockOptions} selectedIndex={null} onSelect={vi.fn()} />);
    expect(screen.getAllByRole('radio')).toHaveLength(mockOptions.length);
  });

  it('renders the radiogroup with accessible label', () => {
    render(<StorageSelector options={mockOptions} selectedIndex={null} onSelect={vi.fn()} />);
    expect(
      screen.getByRole('radiogroup', { name: /select storage capacity/i }),
    ).toBeInTheDocument();
  });

  it('displays capacity text in each button', () => {
    render(<StorageSelector options={mockOptions} selectedIndex={null} onSelect={vi.fn()} />);
    mockOptions.forEach((opt) => {
      expect(screen.getByText(opt.capacity)).toBeInTheDocument();
    });
  });

  it('marks selected option as aria-checked', () => {
    render(<StorageSelector options={mockOptions} selectedIndex={1} onSelect={vi.fn()} />);
    const buttons = screen.getAllByRole('radio');
    expect(buttons[0]).toHaveAttribute('aria-checked', 'false');
    expect(buttons[1]).toHaveAttribute('aria-checked', 'true');
    expect(buttons[2]).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onSelect with correct index when option is clicked', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<StorageSelector options={mockOptions} selectedIndex={null} onSelect={onSelect} />);

    await user.click(screen.getByText(storageOptionsFixtures['512gb'].capacity));

    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it('applies selected class to the chosen option', () => {
    render(<StorageSelector options={mockOptions} selectedIndex={0} onSelect={vi.fn()} />);
    const buttons = screen.getAllByRole('radio');
    expect(buttons[0]).toHaveClass('storage-selector__option--selected');
    expect(buttons[1]).not.toHaveClass('storage-selector__option--selected');
  });

  it('no option is selected when selectedIndex is null', () => {
    render(<StorageSelector options={mockOptions} selectedIndex={null} onSelect={vi.fn()} />);
    screen.getAllByRole('radio').forEach((btn) => {
      expect(btn).toHaveAttribute('aria-checked', 'false');
    });
  });
});
