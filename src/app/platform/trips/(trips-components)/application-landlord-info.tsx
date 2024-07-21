import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LandlordInfo {
  firstName: string;
  lastName: string;
  emailAddress: string;
  phoneNumber: string;
}

interface LandlordInfoProps {
  landlordInfo: LandlordInfo;
  setLandlordInfo: React.Dispatch<React.SetStateAction<LandlordInfo>>;
  isRenter?: boolean;
}

export const LandlordInfo: React.FC<LandlordInfoProps> = ({ landlordInfo, setLandlordInfo, isRenter=true }) => {
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
      <h3 className="text-lg font-semibold mb-2">Landlord/Property Manager Contact Information</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="landlordFirstName">First Name</Label>
          <Input
            id="landlordFirstName"
            name="firstName"
            value={landlordInfo.firstName}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="landlordLastName">Last Name</Label>
          <Input
            id="landlordLastName"
            name="lastName"
            value={landlordInfo.lastName}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="landlordEmailAddress">Email Address</Label>
          <Input
            id="landlordEmailAddress"
            name="emailAddress"
            value={landlordInfo.emailAddress}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="landlordPhoneNumber">Phone Number</Label>
          <Input
            id="landlordPhoneNumber"
            name="phoneNumber"
            value={landlordInfo.phoneNumber}
            onChange={handleInputChange}
          />
        </div>
      </div>
    </div>
  );
}
