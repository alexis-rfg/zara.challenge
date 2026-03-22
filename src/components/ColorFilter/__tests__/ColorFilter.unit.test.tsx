import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorFilter } from '../ColorFilter';
import type { FilterColor } from '@/types/hooks.types';
import colorOptionsFixtures from '@/test/fixtures/colorOptions.json';

const mockColors: FilterColor[] = [
  {
    name: colorOptionsFixtures.titaniumBlack.name,
    hexCode: colorOptionsFixtures.titaniumBlack.hexCode,
  },
  {
    name: colorOptionsFixtures.titaniumWhite.name,
    hexCode: colorOptionsFixtures.titaniumWhite.hexCode,
  },
  { name: colorOptionsFixtures.blue.name, hexCode: colorOptionsFixtures.blue.hexCode },
];

const baseProps = {
  resultCount: 10,
  loading: false,
  isOpen: false,
  isFilterLoading: false,
  availableColors: mockColors,
  selectedColor: null,
  activeCount: 0,
  onOpen: vi.fn(),
  onClose: vi.fn(),
  onSelect: vi.fn(),
  onClear: vi.fn(),
};

describe('ColorFilter — closed (default) state', () => {
  it('shows result count', () => {
    render(<ColorFilter {...baseProps} resultCount={8} />);
    expect(screen.getByText('8 RESULTS')).toBeInTheDocument();
  });

  it('uses singular RESULT for count of 1', () => {
    render(<ColorFilter {...baseProps} resultCount={1} />);
    expect(screen.getByText('1 RESULT')).toBeInTheDocument();
  });

  it('shows FILTRAR button when no active filters', () => {
    render(<ColorFilter {...baseProps} />);
    expect(screen.getByRole('button', { name: /open color filter/i })).toHaveTextContent('FILTER');
  });

  it('shows FILTRAR (N) when a filter is active', () => {
    render(<ColorFilter {...baseProps} activeCount={1} />);
    expect(screen.getByRole('button', { name: /1 filter applied/i })).toHaveTextContent(
      'FILTER (1)',
    );
  });

  it('shows clear button only when filters are active', () => {
    const { rerender } = render(<ColorFilter {...baseProps} activeCount={0} />);
    expect(screen.queryByRole('button', { name: /clear all filters/i })).not.toBeInTheDocument();

    rerender(<ColorFilter {...baseProps} activeCount={1} />);
    expect(screen.getByRole('button', { name: /clear all filters/i })).toBeInTheDocument();
  });

  it('calls onOpen when FILTRAR is clicked', async () => {
    const onOpen = vi.fn();
    const user = userEvent.setup();
    render(<ColorFilter {...baseProps} onOpen={onOpen} />);

    await user.click(screen.getByRole('button', { name: /open color filter/i }));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('calls onClear when clear button is clicked', async () => {
    const onClear = vi.fn();
    const user = userEvent.setup();
    render(<ColorFilter {...baseProps} activeCount={1} onClear={onClear} />);

    await user.click(screen.getByRole('button', { name: /clear all filters/i }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('shows Searching... while loading', () => {
    render(<ColorFilter {...baseProps} loading={true} />);
    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('has aria-live status for result count', () => {
    render(<ColorFilter {...baseProps} />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });
});

describe('ColorFilter — open state', () => {
  it('shows color swatches when open', () => {
    render(<ColorFilter {...baseProps} isOpen={true} />);
    const radioGroup = screen.getByRole('radiogroup', { name: /filter by color/i });
    expect(radioGroup).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(mockColors.length);
  });

  it('shows CERRAR button when open', () => {
    render(<ColorFilter {...baseProps} isOpen={true} />);
    expect(screen.getByRole('button', { name: /close filter/i })).toHaveTextContent('CLOSE');
  });

  it('calls onClose when CERRAR is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ColorFilter {...baseProps} isOpen={true} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: /close filter/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSelect with hex code when a swatch is clicked', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<ColorFilter {...baseProps} isOpen={true} onSelect={onSelect} />);

    await user.click(screen.getByRole('radio', { name: colorOptionsFixtures.titaniumBlack.name }));

    expect(onSelect).toHaveBeenCalledWith(colorOptionsFixtures.titaniumBlack.hexCode);
  });

  it('marks the selected swatch as aria-checked', () => {
    render(
      <ColorFilter
        {...baseProps}
        isOpen={true}
        selectedColor={colorOptionsFixtures.titaniumBlack.hexCode}
      />,
    );
    expect(
      screen.getByRole('radio', { name: colorOptionsFixtures.titaniumBlack.name }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByRole('radio', { name: colorOptionsFixtures.titaniumWhite.name }),
    ).toHaveAttribute('aria-checked', 'false');
  });

  it('shows loading indicator while filter data loads', () => {
    render(
      <ColorFilter {...baseProps} isOpen={true} isFilterLoading={true} availableColors={[]} />,
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows an empty-state message when no colors are available', () => {
    render(<ColorFilter {...baseProps} isOpen={true} availableColors={[]} />);
    expect(screen.getByText('No colors available')).toBeInTheDocument();
  });
});
