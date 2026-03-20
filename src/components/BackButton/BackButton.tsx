import { useNavigate } from 'react-router-dom';
import './BackButton.scss';

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
