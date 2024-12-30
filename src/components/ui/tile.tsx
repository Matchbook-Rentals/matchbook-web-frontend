import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface TileProps {
  label: string;
  icon: React.ReactNode;
  className?: string;
  labelClassNames?: string;
  onClick?: () => void;
}

export default function Tile({ label, icon, className, labelClassNames, onClick }: TileProps) {
  return (
    <Card
      className={`w-[155px] h-[175px] text-charcoal flex flex-col items-center justify-between py-2 border-[2px] border-[#E3E3E3] rounded-[15px] ${className || ''}`}
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center space-y-1 justify-between h-full w-full p-0 ">
        {icon}
        <div className={`text-center pb-2 w-[98%] ${labelClassNames || ''}`}>
          {label}
        </div>
      </CardContent>
    </Card>
  );
}
