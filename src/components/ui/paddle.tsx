import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from "@/lib/utils";

interface PaddleProps {
  label: string;
  icon: React.ReactNode;
  className?: string;
  labelClassNames?: string;
  iconClassNames?: string;
  onClick?: () => void;
}

const Paddle: React.FC<PaddleProps> = ({ label, icon, className, labelClassNames, iconClassNames, onClick }) => {
  return (
    <Card
      className={cn(
        "w-[155px] h-[175px] text-charcoal flex flex-col bg-background items-center justify-between py-2 border-[1px] border-[#E3E3E3] rounded-[30px]",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center h-full w-full px-0 pt-12">
        <div className={cn("flex-1 flex h-1/2 items-end", iconClassNames)}>{icon}</div>
        <div className={cn(
          "text-center w-[80%] h-1/2 pt-4 leading-none flex-1 flex justify-center items-start",
          labelClassNames
        )}>
          {label}
        </div>
      </CardContent>
    </Card>
  );
};

export default Paddle;
