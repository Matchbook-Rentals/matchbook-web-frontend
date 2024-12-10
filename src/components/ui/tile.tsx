import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface TileProps {
  label: string;
  icon: React.ReactNode;
  className?: string;
  labelClassNames?: string;
}

export default function Tile({ label, icon, className, labelClassNames}: TileProps) {
  return (
    <Card className={`w-[155px] h-[175px] text-charcoal flex flex-col items-center justify-between py-2 border-[2px] border-[#E3E3E3] rounded-[30px] ${className || ''}`}>
      <CardContent className="flex flex-col items-center space-y-1 justify-between h-full w-full p-0 ">
        {icon}
        <div className={`text-center text-[20px] pb-2 w-[98%] ${labelClassNames || ''}`}>
          {label}
        </div>
      </CardContent>
    </Card>
  );
}