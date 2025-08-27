import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApplicationItemLabelStyles, ApplicationItemSubHeaderStyles, ApplicationItemInputStyles } from '@/constants/styles';
import { useApplicationStore } from '@/stores/application-store';
import { BrandCheckbox } from "@/app/brandCheckbox";
import { format } from 'date-fns';
import { CalendarIcon } from "@radix-ui/react-icons";

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

  const formFields = [
    { label: "First Name", placeholder: "Enter First Name" },
    { label: "Last Name", placeholder: "Enter Last Name" },
    { label: "Middle Name", placeholder: "Enter Middle Name" },
    { label: "Email", placeholder: "Enter Email" },
    { label: "Date of Birth", placeholder: "Select Date of Birth" },
  ];

  return (
    <>
      <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
          <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
              <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                  {formFields[0].label}
                </Label>
                <span className="text-red-500 ml-1">*</span>
              </div>
              <Input
                name="firstName"
                value={personalInfo.firstName}
                onChange={handleInputChange}
                className="flex h-12 items-center gap-2 px-3 py-2 relative self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs"
                placeholder={formFields[0].placeholder}
              />
              {error?.firstName && <p className="mt-1 text-red-500 text-sm">{error.firstName}</p>}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
          <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
            <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
              <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                {formFields[1].label}
              </Label>
              <span className="text-red-500 ml-1">*</span>
            </div>
            <Input
              name="lastName"
              value={personalInfo.lastName}
              onChange={handleInputChange}
              className="flex h-12 items-center gap-2 px-3 py-2 relative self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs"
              placeholder={formFields[1].placeholder}
            />
            {error?.lastName && <p className="mt-1 text-red-500 text-sm">{error.lastName}</p>}
          </div>
        </div>
      </div>

      <div className="flex-[0_0_auto] flex items-center gap-5 relative self-stretch w-full">
        <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
          <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
              <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                  {formFields[2].label}
                </Label>
              </div>
              <Input
                name="middleName"
                value={personalInfo.middleName || ''}
                onChange={handleInputChange}
                disabled={personalInfo.noMiddleName}
                className="flex h-12 items-center gap-2 px-3 py-2 relative self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs"
                placeholder={formFields[2].placeholder}
              />
              {error?.middleName && <p className="mt-1 text-red-500 text-sm">{error.middleName}</p>}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 pt-[22px] pb-0 px-0 relative flex-1 grow">
          <BrandCheckbox
            name="noMiddleName"
            checked={personalInfo.noMiddleName}
            onChange={(e) => handleCheckboxChange(e.target.checked)}
            label="No Middle Name"
          />
        </div>
      </div>

      <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
          <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
              <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                  {formFields[3].label}
                </Label>
                <span className="text-red-500 ml-1">*</span>
              </div>
              <Input
                name="email"
                type="email"
                value={personalInfo.email || ''}
                onChange={handleInputChange}
                className="flex h-12 items-center gap-2 px-3 py-2 relative self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs"
                placeholder={formFields[3].placeholder}
              />
              {error?.email && <p className="mt-1 text-red-500 text-sm">{error.email}</p>}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
          <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
            <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
              <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                  {formFields[4].label}
                </Label>
              </div>
              <span className="text-red-500 ml-1">*</span>
            </div>
            <div className="relative self-stretch w-full h-12 flex items-center bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs px-3 py-2">
              <Input
                name="dateOfBirth"
                type="date"
                value={personalInfo.dateOfBirth ? 
                  (typeof personalInfo.dateOfBirth === 'string' ? 
                    personalInfo.dateOfBirth.split('T')[0] : 
                    format(personalInfo.dateOfBirth, 'yyyy-MM-dd')) 
                  : ''}
                onChange={handleInputChange}
                className="flex-1 border-0 bg-transparent p-0 h-auto font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#667085] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]"
                placeholder={formFields[4].placeholder}
              />
              <CalendarIcon className="w-5 h-5 text-[#667085]" />
            </div>
            {error?.dateOfBirth && <p className="mt-1 text-red-500 text-sm">{error.dateOfBirth}</p>}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
          <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
              <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                  Social Security Number
                </Label>
                <span className="text-red-500 ml-1">*</span>
              </div>
              <Input
                name="ssn"
                value={personalInfo.ssn || ''}
                onChange={handleSSNChange}
                maxLength={11}
                className="flex h-12 items-center gap-2 px-3 py-2 relative self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs"
                placeholder="XXX-XX-XXXX"
              />
              {error?.ssn && <p className="mt-1 text-red-500 text-sm">{error.ssn}</p>}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
          {/* Empty div to maintain 2-column layout */}
        </div>
      </div>
    </>
  );
};
