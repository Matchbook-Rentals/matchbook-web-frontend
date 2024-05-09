import React from 'react';
import { Label } from "@/components/ui/label";
import { SelectValue, SelectTrigger, SelectLabel, SelectItem, SelectGroup, SelectContent, Select } from "@/components/ui/select";

interface BedTypeSelectProps {
  bedroomIndex: number; // Prop to indicate the bedroom number
}

const BedTypeSelect: React.FC<BedTypeSelectProps> = ({ bedroomIndex }) => {
  const bedroomId = `bedroom-${bedroomIndex}`; // Dynamic ID based on bedroom index

  return (
    <div className="flex items-center gap-4">
      <Label htmlFor={bedroomId}>Bedroom {bedroomIndex}</Label> {/* Dynamically label based on bedroom index */}
      <Select>
        <SelectTrigger className="w-[180px]" id={bedroomId}>
          <SelectValue placeholder="Select bed size" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Bed Sizes</SelectLabel>
            <SelectItem value="twin">Twin</SelectItem>
            <SelectItem value="twinxl">Twin XL</SelectItem>
            <SelectItem value="full">Full</SelectItem>
            <SelectItem value="queen">Queen</SelectItem>
            <SelectItem value="king">King</SelectItem>
            <SelectItem value="caking">California King</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

export default BedTypeSelect;
