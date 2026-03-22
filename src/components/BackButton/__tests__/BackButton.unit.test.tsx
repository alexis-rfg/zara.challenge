import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BackButton } from '../BackButton';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('BackButton', () => {
  it('renders a button with back label', () => {
    render(<BackButton />);
    expect(screen.getByRole('button', { name: /go back to home/i })).toBeInTheDocument();
  });

  it('shows back text', () => {
    render(<BackButton />);
    expect(screen.getByText('back')).toBeInTheDocument();
  });

  it('navigates to home when clicked', async () => {
    const user = userEvent.setup();
    render(<BackButton />);

    await user.click(screen.getByRole('button', { name: /go back to home/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('renders the chevron icon with empty alt text for a11y', () => {
    render(<BackButton />);
    // alt="" makes the img a presentation element (hidden from a11y tree)
    const icon = document.querySelector('.back-button__icon');
    expect(icon).toHaveAttribute('alt', '');
  });
});
