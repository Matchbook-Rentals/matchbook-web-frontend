
import React from 'react';
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card';

interface TileProps {
  label: string;
  icon: React.ReactNode;
}

export default function Tile({ label, icon }: TileProps) {
  return (
    // when I chagne this component to flex-col the icon gets too big. Why might that be?
    <Card className="w-36 h-32 flex flex-col justify-center pt-2 px-2">
      <CardContent className="flex flex-col items-center justify-between pb-2">
        <div className="w-16 h-16 flex items-center justify-center">
          {icon}
        </div>
        <div className=' w-36 text-center'> {label} </div>

      </CardContent>
    </Card>
  );
};
