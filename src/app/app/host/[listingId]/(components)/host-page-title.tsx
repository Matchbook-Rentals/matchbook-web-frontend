import React from "react";

interface HostPageTitleProps {
  title?: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
}

export const HostPageTitle = ({ title, subtitle, rightContent }: HostPageTitleProps): JSX.Element => {
  return (
    <header className="w-full  py-6">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-medium text-2xl text-black font-['Poppins',Helvetica] leading-[28.8px]">
            {title}
          </h1>
          <p className="font-normal text-base text-gray-500 font-['Poppins',Helvetica] leading-6">
            {subtitle}
          </p>
        </div>
        {rightContent && (
          <div className="flex items-end ">
            {rightContent}
          </div>
        )}
      </div>
    </header>
  );
};
