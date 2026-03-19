import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    resultCount: 0,
    loading: false,
  };

  it('renders search input with placeholder', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search by name or brand...');
    expect(input).toBeInTheDocument();
  });

  it('displays the current search value', () => {
    render(<SearchBar {...defaultProps} value="iPhone" />);

    const input = screen.getByDisplayValue('iPhone');
    expect(input).toBeInTheDocument();
  });

  it('calls onChange when user types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<SearchBar {...defaultProps} onChange={onChange} />);

    const input = screen.getByPlaceholderText('Search by name or brand...');
    await user.type(input, 'Samsung');

    expect(onChange).toHaveBeenCalledTimes(7); // One call per character
    // Controlled input: onChange fires with e.target.value per keystroke
    expect(onChange).toHaveBeenNthCalledWith(1, 'S');
    expect(onChange).toHaveBeenLastCalledWith('g');
  });

  it('displays result count with singular form', () => {
    render(<SearchBar {...defaultProps} resultCount={1} />);

    expect(screen.getByText('1 result')).toBeInTheDocument();
  });

  it('displays result count with plural form', () => {
    render(<SearchBar {...defaultProps} resultCount={5} />);

    expect(screen.getByText('5 results')).toBeInTheDocument();
  });

  it('displays search term in result count when searching', () => {
    render(<SearchBar {...defaultProps} value="iPhone" resultCount={3} />);

    expect(screen.getByText(/3 results for "iPhone"/)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<SearchBar {...defaultProps} loading={true} />);

    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByLabelText('Search products');
    expect(input).toBeInTheDocument();

    const resultsRegion = screen.getByRole('status');
    expect(resultsRegion).toHaveAttribute('aria-live', 'polite');
    expect(resultsRegion).toHaveAttribute('aria-atomic', 'true');
  });

  it('search icon is hidden from screen readers', () => {
    const { container } = render(<SearchBar {...defaultProps} />);

    const icon = container.querySelector('svg');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('clears input when value prop changes to empty string', () => {
    const { rerender } = render(<SearchBar {...defaultProps} value="test" />);

    expect(screen.getByDisplayValue('test')).toBeInTheDocument();

    rerender(<SearchBar {...defaultProps} value="" />);

    expect(screen.queryByDisplayValue('test')).not.toBeInTheDocument();
  });
});
