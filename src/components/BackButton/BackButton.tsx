import { useNavigate } from 'react-router-dom';
import './BackButton.scss';

/**
 * Fixed back button component that navigates to the home page.
 * Positioned at the top-left of the page, below the navbar.
 *
 * @returns A button with chevron icon and "back" text that navigates to home
 *
 * @example
 * ```tsx
 * <BackButton />
 * ```
 */
export const BackButton = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <button className="back-button" onClick={handleBack} aria-label="Go back to home">
      <img src="/icons/chevron-left.png" alt="" className="back-button__icon" />
      <span className="back-button__text">back</span>
    </button>
  );
};
