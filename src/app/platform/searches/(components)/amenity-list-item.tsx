import React from 'react';
import { Home } from 'lucide-react';

interface AmenityListItemProps {
  icon?: React.ComponentType<{ className?: string }>;
  label?: string;
}

const AmenityListItem: React.FC<AmenityListItemProps> = ({
  icon: Icon = Home,
  label = 'Amenity'
}) => {
  return (
    <div className=" flex items-center gap-4 py-2">
      {Icon && <Icon className="h-[64px] w-[64px] " />}
      <span className="text-[16px] md:text-[20px]">{label}</span>
    </div>
  );
};

export default AmenityListItem;
