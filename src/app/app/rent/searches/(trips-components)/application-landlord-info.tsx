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
    <div className="space-y-5">
      {/* Row 1: First Name + Last Name */}
      <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
          <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
            <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
              First Name
            </Label>
          </div>
          <Input
            name="landlordFirstName"
            value={landlordInfo.landlordFirstName}
            onChange={handleInputChange}
            placeholder="Landlord's First Name"
            className={`flex h-12 items-center gap-2 px-3 py-2 relative self-stretch w-full bg-white rounded-lg border border-solid shadow-shadows-shadow-xs font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#667085] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)] ${error?.landlordFirstName ? "border-red-500" : "border-[#d0d5dd]"}`}
          />
          {error?.landlordFirstName && <p className="mt-1 text-red-500 text-sm">{error.landlordFirstName}</p>}
        </div>

        <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
          <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
            <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
              Last Name
            </Label>
          </div>
          <Input
            name="landlordLastName"
            value={landlordInfo.landlordLastName}
            onChange={handleInputChange}
            placeholder="Landlord's Last Name"
            className={`flex h-12 items-center gap-2 px-3 py-2 relative self-stretch w-full bg-white rounded-lg border border-solid shadow-shadows-shadow-xs font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#667085] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)] ${error?.landlordLastName ? "border-red-500" : "border-[#d0d5dd]"}`}
          />
          {error?.landlordLastName && <p className="mt-1 text-red-500 text-sm">{error.landlordLastName}</p>}
        </div>
      </div>

      {/* Row 2: Email + Phone Number */}
      <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
          <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
            <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
              Email
            </Label>
          </div>
          <Input
            name="landlordEmail"
            value={landlordInfo.landlordEmail}
            onChange={handleInputChange}
            placeholder="Landlord's Email"
            className={`flex h-12 items-center gap-2 px-3 py-2 relative self-stretch w-full bg-white rounded-lg border border-solid shadow-shadows-shadow-xs font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#667085] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)] ${error?.landlordEmail ? "border-red-500" : "border-[#d0d5dd]"}`}
          />
          {error?.landlordEmail && <p className="mt-1 text-red-500 text-sm">{error.landlordEmail}</p>}
        </div>

        <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
          <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
            <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
              Phone Number
            </Label>
          </div>
          <Input
            name="landlordPhoneNumber"
            value={landlordInfo.landlordPhoneNumber}
            onChange={handleInputChange}
            placeholder="Landlord's Phone Number"
            className={`flex h-12 items-center gap-2 px-3 py-2 relative self-stretch w-full bg-white rounded-lg border border-solid shadow-shadows-shadow-xs font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#667085] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)] ${error?.landlordPhoneNumber ? "border-red-500" : "border-[#d0d5dd]"}`}
          />
          {error?.landlordPhoneNumber && <p className="mt-1 text-red-500 text-sm">{error.landlordPhoneNumber}</p>}
        </div>
      </div>
    </div>
  );
};
