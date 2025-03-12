import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApplicationItemLabelStyles, ApplicationItemSubHeaderStyles, ApplicationItemInputStyles } from '@/constants/styles';
import { useApplicationStore } from '@/stores/application-store';
import { Checkbox } from "@/components/ui/checkbox";
import { format } from 'date-fns';

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

  const handleCheckboxChange = (checked: boolean) => {
    setPersonalInfo({
      ...personalInfo,
      noMiddleName: checked,
      // Clear middleName if noMiddleName is checked
      ...(checked ? { middleName: '' } : {})
    });
  };

  // Format SSN as user types
  const handleSSNChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Remove all non-digits
    const digitsOnly = value.replace(/\D/g, '');
    
    // Format SSN
    let formattedValue = '';
    if (digitsOnly.length <= 3) {
      formattedValue = digitsOnly;
    } else if (digitsOnly.length <= 5) {
      formattedValue = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`;
    } else {
      formattedValue = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 5)}-${digitsOnly.slice(5, 9)}`;
    }

    setPersonalInfo({
      ...personalInfo,
      ssn: formattedValue
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className={ApplicationItemLabelStyles}>First Name</Label>
          <Input
            id="firstName"
            name="firstName"
            value={personalInfo.firstName}
            onChange={handleInputChange}
            placeholder="John"
            className={error?.firstName ? "border-red-500" : ApplicationItemInputStyles}
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
            placeholder="Doe"
            className={error?.lastName ? "border-red-500" : ApplicationItemInputStyles}
          />
          {error?.lastName && <p className="mt-1 text-red-500 text-sm">{error.lastName}</p>}
        </div>
      </div>
      
      {/* Middle Name Section */}
      <div className="space-y-2">
        <Label htmlFor="middleName" className={ApplicationItemLabelStyles}>Middle Name</Label>
        <div className="flex gap-4">
          <div className="w-1/2  flex ">
            <Input
              id="middleName"
              name="middleName"
              value={personalInfo.middleName || ''}
              onChange={handleInputChange}
              placeholder="Middle Name"
              disabled={personalInfo.noMiddleName}
              className={error?.middleName ? "border-red-500" : ApplicationItemInputStyles}
            />
            {error?.middleName && <p className="mt-1 text-red-500 text-sm">{error.middleName}</p>}
          </div>
          <div className="w-1/2 flex pt-1 items-start space-x-2">
            <Checkbox 
              id="noMiddleName" 
              checked={personalInfo.noMiddleName} 
              onCheckedChange={handleCheckboxChange}
            />
            <Label htmlFor="noMiddleName" className="text-md pt-1 font-normal">No Middle Name</Label>
          </div>
        </div>
        
      </div>
      
      {/* Date of Birth */}
      <div className="space-y-2">
        <Label htmlFor="dateOfBirth" className={ApplicationItemLabelStyles}>Date of Birth</Label>
        <Input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          value={personalInfo.dateOfBirth ? 
            (typeof personalInfo.dateOfBirth === 'string' ? 
              personalInfo.dateOfBirth.split('T')[0] : 
              format(personalInfo.dateOfBirth, 'yyyy-MM-dd')) 
            : ''}
          onChange={handleInputChange}
          className={error?.dateOfBirth ? "border-red-500" : ApplicationItemInputStyles}
        />
        {error?.dateOfBirth && <p className="mt-1 text-red-500 text-sm">{error.dateOfBirth}</p>}
      </div>
      
      {/* SSN - with security considerations */}
      <div className="space-y-2">
        <Label htmlFor="ssn" className={ApplicationItemLabelStyles}>
          Social Security Number <span className="text-sm font-normal text-gray-500">(Encrypted when stored)</span>
        </Label>
        <Input
          id="ssn"
          name="ssn"
          value={personalInfo.ssn || ''}
          onChange={handleSSNChange}
          placeholder="XXX-XX-XXXX"
          maxLength={11} // format XXX-XX-XXXX has 11 chars including hyphens
          className={error?.ssn ? "border-red-500" : ApplicationItemInputStyles}
        />
        {error?.ssn && <p className="mt-1 text-red-500 text-sm">{error.ssn}</p>}
        <p className="text-xs text-gray-500">
          Your SSN is securely encrypted and is only used for verification purposes.
        </p>
      </div>
    </div>
  );
};
