import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Montserrat } from 'next/font/google';
import { cn } from "@/lib/utils";

const montserrat = Montserrat({ subsets: ["latin"] });

interface PaddleProps {
  Icon: LucideIcon;
  title: string;
  onClick?: () => void;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

const Paddle: React.FC<PaddleProps> = ({ Icon, title, onClick, className, iconClassName, textClassName }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center w-[250px] h-[385px] rounded-3xl border-[2px] border-black transition-all duration-200 p-4",
        onClick && "hover:shadow-lg hover:border-gray-300 cursor-pointer",
        className
      )}
    >
      <div className="flex-1 flex items-center justify-center">
        <Icon className={cn("w-16 h-16 text-charcoalBrand", iconClassName)} />
      </div>
      <span className={cn("text-subtext text-lg font-normal mt-2", montserrat.className, textClassName)}>{title}</span>
    </button>
  );
};

export default Paddle;
