import React from "react";

interface CarouselButtonControlsProps {
  onBack: () => void;
  onNext: () => void;
  backLabel: string;
  nextLabel: string;
}

const CarouselButtonControls: React.FC<CarouselButtonControlsProps> = ({
  onBack,
  onNext,
  backLabel,
  nextLabel,
}) => {
  return (
    <div className="flex gap-2 justify-center mt-5 p-1">
      <button
        className="bg-primaryBrand px-5 py-2 text-2xl shadow-md shadow-slate-500 hover:shadow-none text-white rounded-lg"
        onClick={onBack}
      >
        {backLabel}
      </button>
      <button
        className="bg-primaryBrand px-5 py-2 text-2xl text-white rounded-lg shadow-sm hover:shadow-none shadow-black"
        onClick={onNext}
      >
        {nextLabel}
      </button>
    </div>
  );
};

export default CarouselButtonControls;
