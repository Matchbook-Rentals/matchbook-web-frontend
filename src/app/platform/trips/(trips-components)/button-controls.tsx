
import React from 'react';

interface ButtonControlProps {
  Icon: React.ReactElement;
  handleClick: () => void;
  className?: string;
}

const ButtonControl: React.FC<ButtonControlProps> = ({
  Icon,
  handleClick,
  className = '',
}) => {
  return (
    <button
      onClick={handleClick}
      className={` ${className}`}
    >
      {Icon}
    </button>
  );
};

export default ButtonControl;
