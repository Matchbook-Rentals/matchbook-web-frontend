import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectValue, SelectTrigger, SelectLabel, SelectItem, SelectGroup, SelectContent } from "@/components/ui/select";

interface BedTypeSelectProps {
  bedroomIndex: number; // Prop to indicate the bedroom number
  selectedBedType: string;
  setSelectedBedType: (value: string) => void;
}

const BedTypeSelect: React.FC<BedTypeSelectProps> = ({ bedroomIndex, selectedBedType, setSelectedBedType }) => {
  const bedroomId = `bedroom-${bedroomIndex}`; // Dynamic ID based on bedroom index

  const handleChange = (value: string) => {
    setSelectedBedType(value);
  };

  return (
    <div className="flex items-center gap-4 mb-3">
      <Label htmlFor={bedroomId}>Bedroom {bedroomIndex}</Label> {/* Dynamically label based on bedroom index */}
      <Select value={selectedBedType} onValueChange={handleChange}>
        <SelectTrigger className="w-[180px]" id={bedroomId}>
          <SelectValue placeholder="Select bed size" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Bed Sizes</SelectLabel>
            <SelectItem className='cursor-pointer' value="twin">Twin</SelectItem>
            <SelectItem className='cursor-pointer' value="twinxl">Twin XL</SelectItem>
            <SelectItem className='cursor-pointer' value="full">Full</SelectItem>
            <SelectItem className='cursor-pointer' value="queen">Queen</SelectItem>
            <SelectItem className='cursor-pointer' value="king">King</SelectItem>
            <SelectItem className='cursor-pointer' value="caking">California King</SelectItem>
            <SelectItem className='cursor-pointer' value="none">No Bed</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

export default BedTypeSelect;
