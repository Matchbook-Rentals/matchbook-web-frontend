import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface PaddleProps {
  label: string;
  icon: React.ReactNode;
  className?: string;
  labelClassNames?: string;
  onClick?: () => void;
}

const Paddle: React.FC<PaddleProps> = ({ label, icon, className, labelClassNames, onClick }) => {
  return (
    <Card
      className={`w-[155px] h-[175px] text-charcoal flex flex-col items-center justify-between py-2 border-[2px] border-[#E3E3E3] rounded-[30px] ${className || ''}`}
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center space-y-1 justify-start h-full w-full pb-5  ">
        {icon}
        <div className={`text-center w-full ${labelClassNames || ''}`}>
          {label}
        </div>
      </CardContent>
    </Card>
  );
};

export default Paddle;
