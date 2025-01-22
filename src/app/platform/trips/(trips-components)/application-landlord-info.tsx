import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LandlordInfo {
  landlordFirstName: string;
  landlordLastName: string;
  landlordEmail: string;
  landlordPhoneNumber: string;
}

interface LandlordInfoProps {
  landlordInfo: LandlordInfo;
  setLandlordInfo: React.Dispatch<React.SetStateAction<LandlordInfo>>;
  isRenter?: boolean;
}

export const LandlordInfo: React.FC<LandlordInfoProps> = ({ landlordInfo, setLandlordInfo, isRenter = true }) => {
  if (!isRenter) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLandlordInfo(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  return (
    <div>
      <h3 className="text-[24px]  mb-2 mt-6">Property Manager Information</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="font-normal text-[20px]" htmlFor="landlordFirstName">First Name</Label>
          <Input
            id="landlordFirstName"
            name="landlordFirstName"
            value={landlordInfo.landlordFirstName}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <Label className="font-normal text-[20px]" htmlFor="landlordLastName">Last Name</Label>
          <Input
            id="landlordLastName"
            name="landlordLastName"
            value={landlordInfo.landlordLastName}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <Label className="font-normal text-[20px]" htmlFor="landlordEmail">Email Address</Label>
          <Input
            id="landlordEmail"
            name="landlordEmail"
            value={landlordInfo.landlordEmail}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <Label className="font-normal text-[20px]" htmlFor="landlordPhoneNumber">Phone Number</Label>
          <Input
            id="landlordPhoneNumber"
            name="landlordPhoneNumber"
            value={landlordInfo.landlordPhoneNumber}
            onChange={handleInputChange}
          />
        </div>
      </div>
    </div>
  );
}