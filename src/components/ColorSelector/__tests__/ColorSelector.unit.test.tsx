import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorSelector } from '../ColorSelector';
import colorOptionsFixtures from '@/test/fixtures/colorOptions.json';

const mockColors = [
  colorOptionsFixtures.titaniumViolet,
  colorOptionsFixtures.titaniumBlack,
  colorOptionsFixtures.titaniumWhite,
];

describe('ColorSelector', () => {
  it('renders all color options as radio buttons', () => {
    render(<ColorSelector colors={mockColors} selectedIndex={null} onSelect={vi.fn()} />);
    expect(screen.getAllByRole('radio')).toHaveLength(mockColors.length);
  });

  it('renders with accessible radiogroup label', () => {
    render(<ColorSelector colors={mockColors} selectedIndex={null} onSelect={vi.fn()} />);
    expect(screen.getByRole('radiogroup', { name: /select color/i })).toBeInTheDocument();
  });

  it('marks selected color as aria-checked', () => {
    render(<ColorSelector colors={mockColors} selectedIndex={1} onSelect={vi.fn()} />);
    expect(
      screen.getByRole('radio', { name: colorOptionsFixtures.titaniumBlack.name }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByRole('radio', { name: colorOptionsFixtures.titaniumViolet.name }),
    ).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onSelect with correct index when a color is clicked', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<ColorSelector colors={mockColors} selectedIndex={null} onSelect={onSelect} />);

    await user.click(screen.getByRole('radio', { name: colorOptionsFixtures.titaniumBlack.name }));

    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('shows selected color name below swatches', () => {
    render(<ColorSelector colors={mockColors} selectedIndex={0} onSelect={vi.fn()} />);
    expect(screen.getByText(colorOptionsFixtures.titaniumViolet.name)).toBeInTheDocument();
  });

  it('shows hovered color name when hovering a swatch', async () => {
    const user = userEvent.setup();
    render(<ColorSelector colors={mockColors} selectedIndex={null} onSelect={vi.fn()} />);

    await user.hover(screen.getByRole('radio', { name: colorOptionsFixtures.titaniumWhite.name }));

    expect(screen.getByText(colorOptionsFixtures.titaniumWhite.name)).toBeInTheDocument();
  });

  it('reverts to selected color name when hover ends', async () => {
    const user = userEvent.setup();
    render(<ColorSelector colors={mockColors} selectedIndex={0} onSelect={vi.fn()} />);

    await user.hover(screen.getByRole('radio', { name: colorOptionsFixtures.titaniumBlack.name }));
    expect(screen.getByText(colorOptionsFixtures.titaniumBlack.name)).toBeInTheDocument();

    await user.unhover(
      screen.getByRole('radio', { name: colorOptionsFixtures.titaniumBlack.name }),
    );
    expect(screen.getByText(colorOptionsFixtures.titaniumViolet.name)).toBeInTheDocument();
  });

  it('shows empty name when nothing is selected or hovered', () => {
    render(<ColorSelector colors={mockColors} selectedIndex={null} onSelect={vi.fn()} />);
    const nameEl = document.querySelector('.color-selector__name');
    expect(nameEl?.textContent).toBe('');
  });

  it('applies the correct background color to each swatch', () => {
    render(<ColorSelector colors={mockColors} selectedIndex={null} onSelect={vi.fn()} />);
    const swatches = document.querySelectorAll('.color-selector__swatch');
    expect(swatches[0]).toHaveStyle({
      backgroundColor: colorOptionsFixtures.titaniumViolet.hexCode,
    });
    expect(swatches[1]).toHaveStyle({
      backgroundColor: colorOptionsFixtures.titaniumBlack.hexCode,
    });
  });

  it('applies selected class to the chosen color button', () => {
    render(<ColorSelector colors={mockColors} selectedIndex={2} onSelect={vi.fn()} />);
    const whiteBtn = screen.getByRole('radio', { name: colorOptionsFixtures.titaniumWhite.name });
    expect(whiteBtn).toHaveClass('color-selector__option--selected');
  });

  it('has aria-live on the color name display', () => {
    render(<ColorSelector colors={mockColors} selectedIndex={null} onSelect={vi.fn()} />);
    const liveRegion = document.querySelector('.color-selector__name');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });
});
