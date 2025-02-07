import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApplicationItemHeaderStyles, ApplicationItemLabelStyles, ApplicationItemSubHeaderStyles } from '@/constants/styles';
import { useApplicationStore } from '@/stores/application-store';

export const PersonalInfo: React.FC = () => {
  const { personalInfo, setPersonalInfo, errors } = useApplicationStore();
  const error = errors.basicInfo.personalInfo;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalInfo({
      ...personalInfo,
      [name]: value
    });
  };

  return (
    <div className="space-y-4">
      <h2 className={ApplicationItemSubHeaderStyles}>
        Full Name
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className={ApplicationItemLabelStyles}>First Name</Label>
          <Input
            id="firstName"
            name="firstName"
            value={personalInfo.firstName}
            onChange={handleInputChange}
            className={error?.firstName ? "border-red-500" : ""}
          />
          {error?.firstName && <p className="mt-1 text-red-500 text-sm">{error.firstName}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className={ApplicationItemLabelStyles}>Last Name</Label>
          <Input
            id="lastName"
            name="lastName"
            value={personalInfo.lastName}
            onChange={handleInputChange}
            className={error?.lastName ? "border-red-500" : ""}
          />
          {error?.lastName && <p className="mt-1 text-red-500 text-sm">{error.lastName}</p>}
        </div>
      </div>
    </div>
  );
};
