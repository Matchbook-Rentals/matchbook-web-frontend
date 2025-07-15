import React from 'react';

interface ListingCreationCardProps {
  name: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
}

export const ListingCreationCard: React.FC<ListingCreationCardProps> = ({
  name,
  icon,
  isSelected,
  onClick,
}) => {
  return (
    <div
      className={` w-[145px] xs:w-[155px] sm:w-[165px] md:w-[194px] h-[103px] p-0 rounded-lg cursor-pointer ${
        isSelected
          ? "border-2 border-solid border-[#333333]"
          : "border border-solid border-[#e6e6e6]"
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col  items-start gap-1.5 py-6 md:py-6 md:pl-6 pr-0 pl-4 pr-1 h-full">
        <div className="relative w-[30px] h-[30px] flex items-center justify-center overflow-hidden">
          {icon}
        </div>
        <div className="font-text-label-small-medium font-[number:var(--text-label-small-medium-font-weight)] text-[#484a54] text-[length:var(--text-label-small-medium-font-size)] tracking-[var(--text-label-small-medium-letter-spacing)] leading-[var(--text-label-small-medium-line-height)] [font-style:var(--text-label-small-medium-font-style)]">
          {name}
        </div>
      </div>
    </div>
  );
};

export default ListingCreationCard;
