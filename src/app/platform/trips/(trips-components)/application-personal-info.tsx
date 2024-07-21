
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PersonalInfoProps {
  personalInfo: {
    firstName: string;
    lastName: string;
  };
  setPersonalInfo: React.Dispatch<React.SetStateAction<{
    firstName: string;
    lastName: string;
  }>>;
}

export const PersonalInfo: React.FC<PersonalInfoProps> = ({ personalInfo, setPersonalInfo }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalInfo(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="firstName">First Name</Label>
        <Input
          id="firstName"
          name="firstName"
          value={personalInfo.firstName}
          onChange={handleInputChange}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lastName">Last Name</Label>
        <Input
          id="lastName"
          name="lastName"
          value={personalInfo.lastName}
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
};
