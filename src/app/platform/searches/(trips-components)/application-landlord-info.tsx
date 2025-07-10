import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApplicationItemLabelStyles, ApplicationItemSubHeaderStyles } from '@/constants/styles';
import { useApplicationStore } from '@/stores/application-store';

export const LandlordInfo: React.FC = () => {
  const { landlordInfo, setLandlordInfo, errors } = useApplicationStore();
  const error = errors.landlordInfo;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLandlordInfo({
      ...landlordInfo,
      [name]: value
    });
  };

  return (
    <div className="mt-8">
      <h3 className={ApplicationItemSubHeaderStyles}>Current Landlord Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <Label className={ApplicationItemLabelStyles}>First Name</Label>
          <Input
            name="landlordFirstName"
            value={landlordInfo.landlordFirstName}
            onChange={handleInputChange}
            placeholder="Landlord's First Name"
            className={error?.landlordFirstName ? "border-red-500" : ""}
          />
          {error?.landlordFirstName && <p className="mt-1 text-red-500 text-sm">{error.landlordFirstName}</p>}
        </div>
        <div>
          <Label className={ApplicationItemLabelStyles}>Last Name</Label>
          <Input
            name="landlordLastName"
            value={landlordInfo.landlordLastName}
            onChange={handleInputChange}
            placeholder="Landlord's Last Name"
            className={error?.landlordLastName ? "border-red-500" : ""}
          />
          {error?.landlordLastName && <p className="mt-1 text-red-500 text-sm">{error.landlordLastName}</p>}
        </div>
        <div>
          <Label className={ApplicationItemLabelStyles}>Email</Label>
          <Input
            name="landlordEmail"
            value={landlordInfo.landlordEmail}
            onChange={handleInputChange}
            placeholder="Landlord's Email"
            className={error?.landlordEmail ? "border-red-500" : ""}
          />
          {error?.landlordEmail && <p className="mt-1 text-red-500 text-sm">{error.landlordEmail}</p>}
        </div>
        <div>
          <Label className={ApplicationItemLabelStyles}>Phone Number</Label>
          <Input
            name="landlordPhoneNumber"
            value={landlordInfo.landlordPhoneNumber}
            onChange={handleInputChange}
            placeholder="Landlord's Phone Number"
            className={error?.landlordPhoneNumber ? "border-red-500" : ""}
          />
          {error?.landlordPhoneNumber && <p className="mt-1 text-red-500 text-sm">{error.landlordPhoneNumber}</p>}
        </div>
      </div>
    </div>
  );
};