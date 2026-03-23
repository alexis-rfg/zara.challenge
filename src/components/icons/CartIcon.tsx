/**
 * Minimal cart icon used in the global navbar.
 *
 * @returns Cart SVG icon.
 */
export const CartIcon = () => (
  <svg
    className="navbar__cart-icon"
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M5.25 6V4.875C5.25 2.80493 6.92993 1.125 9 1.125C11.0701 1.125 12.75 2.80493 12.75 4.875V6"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.375 5.625H14.625L13.8 16.125H4.2L3.375 5.625Z"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
