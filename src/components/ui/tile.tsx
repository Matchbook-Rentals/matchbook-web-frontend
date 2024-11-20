import React from 'react';
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card';

interface TileProps {
  label: string;
  icon: React.ReactNode;
}

export default function Tile({ label, icon }: TileProps) {
  return (
    <Card className="w-36 h-32 border-2 border-black flex flex-col items-center justify-between px-2">
      <div />
      <div className="flex-shrink-0 self-center">{icon}</div>
      <div className="w-36 text-center">{label}</div>
    </Card>
  );
};
