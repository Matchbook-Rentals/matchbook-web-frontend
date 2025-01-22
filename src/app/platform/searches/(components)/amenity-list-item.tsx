import React from 'react';
import { Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AmenityListItemProps {
  icon?: React.ComponentType<{ className?: string }>;
  label?: string;
  iconClassNames?: string;
  labelClassNames?: string;
  className?: string;
}

const AmenityListItem: React.FC<AmenityListItemProps> = ({
  icon: Icon = Home,
  label = 'Amenity',
  iconClassNames,
  labelClassNames,
  className
}) => {
  return (
    <div className={cn("flex items-center gap-4 py-2", className)}>
      {Icon && <Icon className={cn("h-[64px] w-[64px]", iconClassNames)} />}
      <span className={cn("text-[16px] md:text-[20px]", labelClassNames)}>{label}</span>
    </div>
  );
};

export default AmenityListItem;
