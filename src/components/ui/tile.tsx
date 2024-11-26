import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface TileProps {
  label: string;
  icon: React.ReactNode;
}

export default function Tile({ label, icon }: TileProps) {
  return (
    <Card className="w-[170px] h-[197px] text-charcoal  flex flex-col items-center justify-between py-2 border-2 border-charcoalBrand rounded-[30px]">
      <CardContent className="flex flex-col items-center space-y-1 justify-between h-full w-full p-0 ">
        <div className=" pt-4 ">
          {icon}
        </div>
        <div className="text-center text-[20px] pb-2 w-[98%] ">
          {label}
        </div>
      </CardContent>
    </Card>
  );
}
