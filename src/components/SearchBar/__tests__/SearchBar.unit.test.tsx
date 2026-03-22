import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '../SearchBar';

describe('SearchBar', () => {
  const defaultProps = {
    onSearch: vi.fn(),
    committedSearch: '',
    resultCount: 0,
    loading: false,
  };

  it('renders search input with placeholder', () => {
    render(<SearchBar {...defaultProps} />);

    expect(screen.getByPlaceholderText('Search for a smartphone...')).toBeInTheDocument();
  });

  it('does not call onSearch while the user types', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(<SearchBar {...defaultProps} onSearch={onSearch} />);

    await user.type(screen.getByPlaceholderText('Search for a smartphone...'), 'Samsung');

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('calls onSearch with trimmed value when Enter is pressed', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(<SearchBar {...defaultProps} onSearch={onSearch} />);

    const input = screen.getByPlaceholderText('Search for a smartphone...');
    await user.type(input, 'Samsung');
    await user.keyboard('{Enter}');

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('Samsung');
  });

  it('trims whitespace before calling onSearch', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(<SearchBar {...defaultProps} onSearch={onSearch} />);

    const input = screen.getByPlaceholderText('Search for a smartphone...');
    await user.type(input, '  iPhone  ');
    await user.keyboard('{Enter}');

    expect(onSearch).toHaveBeenCalledWith('iPhone');
  });

  it('shows the clear button only when input has text', async () => {
    const user = userEvent.setup();

    render(<SearchBar {...defaultProps} />);

    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search for a smartphone...'), 'x');

    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('clears input and calls onSearch with empty string when clear button is clicked', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(<SearchBar {...defaultProps} onSearch={onSearch} />);

    const input = screen.getByPlaceholderText('Search for a smartphone...');
    await user.type(input, 'Apple');
    await user.click(screen.getByLabelText('Clear search'));

    expect(input).toHaveValue('');
    expect(onSearch).toHaveBeenCalledWith('');
  });

  it('displays result count with singular form', () => {
    render(<SearchBar {...defaultProps} resultCount={1} />);

    expect(screen.getByText('1 result')).toBeInTheDocument();
  });

  it('displays result count with plural form', () => {
    render(<SearchBar {...defaultProps} resultCount={5} />);

    expect(screen.getByText('5 results')).toBeInTheDocument();
  });

  it('shows committedSearch in result count label, not the current input', () => {
    render(<SearchBar {...defaultProps} committedSearch="iPhone" resultCount={3} />);

    expect(screen.getByText(/3 results for "iPhone"/)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<SearchBar {...defaultProps} loading={true} />);

    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<SearchBar {...defaultProps} />);

    expect(screen.getByLabelText('Search products')).toBeInTheDocument();

    const resultsRegion = screen.getByRole('status');
    expect(resultsRegion).toHaveAttribute('aria-live', 'polite');
    expect(resultsRegion).toHaveAttribute('aria-atomic', 'true');
  });

  it('renders as a form with role="search"', () => {
    render(<SearchBar {...defaultProps} />);

    expect(screen.getByRole('search')).toBeInTheDocument();
  });

  it('search icon is hidden from screen readers', () => {
    const { container } = render(<SearchBar {...defaultProps} />);

    const icon = container.querySelector('svg');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });
});
