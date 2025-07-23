import { CalendarIcon } from "lucide-react";
import React from "react";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export const VerificationFormSection = (): JSX.Element => {
  // Form field data for mapping
  const personalInfoFields = [
    {
      id: "firstName",
      label: "First Name",
      placeholder: "Enter First Name",
      required: true,
    },
    {
      id: "lastName",
      label: "Last Name",
      placeholder: "Enter Last Name",
      required: true,
    },
  ];

  const personalInfoFields2 = [
    {
      id: "ssn",
      label: "Social Security No",
      placeholder: "Enter SSN",
      required: true,
    },
    {
      id: "dob",
      label: "Date of Birth",
      placeholder: "dd/mm/yyyy",
      required: true,
      isDate: true,
    },
  ];

  const addressFields = [
    {
      id: "city",
      label: "City",
      placeholder: "Enter City",
      required: true,
      width: "1/3",
    },
    {
      id: "state",
      label: "State",
      placeholder: "Select State",
      required: true,
      width: "1/3",
    },
    {
      id: "zipCode",
      label: "Zip Code",
      placeholder: "Enter Zip Code",
      required: true,
      width: "1/3",
    },
  ];

  const screeningItems = [
    "Credit Check",
    "National Criminal History Search",
    "Evictions and Property Damage Check",
  ];

  return (
    <div className="flex flex-col gap-8 p-6 w-full rounded-2xl border border-solid border-[#cfd4dc]">
      <Card className="border-0 shadow-none">
        <CardContent className="p-6 bg-background rounded-xl">
          <div className="flex flex-col gap-5 w-full">
            <h2 className="font-medium text-gray-3800 text-xl tracking-[-0.40px] font-['Poppins',Helvetica]">
              Personal Information
            </h2>

            <div className="flex flex-col gap-5 w-full">
              {/* First row of personal info fields */}
              <div className="flex flex-wrap gap-5 w-full">
                {personalInfoFields.map((field) => (
                  <div key={field.id} className="flex flex-col gap-1.5 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Label
                        htmlFor={field.id}
                        className="font-medium text-[#344054] text-sm font-['Poppins',Helvetica]"
                      >
                        {field.label}
                      </Label>
                      {field.required && (
                        <img
                          className="w-[5.2px] h-1.5"
                          alt="Required"
                          src="/star-6.svg"
                        />
                      )}
                    </div>
                    <Input
                      id={field.id}
                      placeholder={field.placeholder}
                      className="h-12 px-3 py-2 bg-white rounded-lg border border-[#d0d5dd] shadow-shadows-shadow-xs text-[#667085] font-text-label-medium-regular"
                    />
                  </div>
                ))}
              </div>

              {/* Second row of personal info fields */}
              <div className="flex flex-wrap gap-5 w-full">
                {personalInfoFields2.map((field) => (
                  <div key={field.id} className="flex flex-col gap-1.5 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Label
                        htmlFor={field.id}
                        className="font-medium text-[#344054] text-sm font-['Poppins',Helvetica]"
                      >
                        {field.label}
                      </Label>
                      {field.required && (
                        <img
                          className="w-[5.2px] h-1.5"
                          alt="Required"
                          src="/star-6.svg"
                        />
                      )}
                    </div>
                    {field.isDate ? (
                      <div className="relative">
                        <Input
                          id={field.id}
                          placeholder={field.placeholder}
                          className="h-12 px-3 py-2 bg-white rounded-lg border border-[#d0d5dd] shadow-shadows-shadow-xs text-[#667085] font-text-label-medium-regular pr-10"
                        />
                        <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                      </div>
                    ) : (
                      <Input
                        id={field.id}
                        placeholder={field.placeholder}
                        className="h-12 px-3 py-2 bg-white rounded-lg border border-[#d0d5dd] shadow-shadows-shadow-xs text-[#667085] font-text-label-medium-regular"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-none">
        <CardContent className="p-6 bg-background rounded-xl">
          <div className="flex flex-col gap-5 w-full">
            <h2 className="font-medium text-gray-3800 text-xl font-['Poppins',Helvetica]">
              Current Address
            </h2>

            <div className="flex flex-col gap-5 w-full">
              {/* Street Address field */}
              <div className="flex flex-col gap-1.5 w-full">
                <div className="flex items-center gap-1.5">
                  <Label
                    htmlFor="streetAddress"
                    className="font-medium text-[#344054] text-sm font-['Poppins',Helvetica]"
                  >
                    Street Address
                  </Label>
                  <img
                    className="w-[5.2px] h-1.5"
                    alt="Required"
                    src="/star-6.svg"
                  />
                </div>
                <Input
                  id="streetAddress"
                  placeholder="Enter Street Address"
                  className="h-12 px-3 py-2 bg-white rounded-lg border border-[#d0d5dd] shadow-shadows-shadow-xs text-[#667085] font-text-label-medium-regular"
                />
              </div>

              {/* City, State, Zip row */}
              <div className="flex flex-wrap gap-5 w-full">
                {addressFields.map((field) => (
                  <div key={field.id} className="flex flex-col gap-1.5 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Label
                        htmlFor={field.id}
                        className="font-medium text-[#344054] text-sm font-['Poppins',Helvetica]"
                      >
                        {field.label}
                      </Label>
                      {field.required && (
                        <img
                          className="w-[5.2px] h-1.5"
                          alt="Required"
                          src="/star-6.svg"
                        />
                      )}
                    </div>
                    <Input
                      id={field.id}
                      placeholder={field.placeholder}
                      className="h-12 px-3 py-2 bg-white rounded-lg border border-[#d0d5dd] shadow-shadows-shadow-xs text-[#667085] font-text-label-medium-regular"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Screening information */}
          <div className="flex flex-col mt-8 gap-2">
            <p className="tracking-[0] leading-5 text-[#5d606d] text-sm font-['Poppins',Helvetica]">
              This screening includes:
            </p>
            <ul className="flex flex-col gap-1">
              {screeningItems.map((item, index) => (
                <li
                  key={index}
                  className="text-[#5d606d] text-sm tracking-[0] leading-5 font-['Poppins',Helvetica]"
                >
                  • {item}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
