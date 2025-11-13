import { CalendarIcon } from "lucide-react";
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { VerificationFormValues } from "../../utils";

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

const personalInfoSecondRow = [
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
    type: "date",
  },
];

const addressFields = [
  {
    id: "city",
    label: "City",
    placeholder: "Enter City",
    required: true,
  },
  {
    id: "state",
    label: "State",
    placeholder: "Select State",
    required: true,
  },
  {
    id: "zipCode",
    label: "Zip Code",
    placeholder: "Enter Zip Code",
    required: true,
  },
];

const screeningIncludes = [
  "Credit Check",
  "National Criminal History Search",
  "Evictions and Property Damage Check",
];

interface CurrentAddressSectionProps {
  form: UseFormReturn<VerificationFormValues>;
}

const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
];

export const CurrentAddressSection = ({ form }: CurrentAddressSectionProps): JSX.Element => {
  return (
    <div className="flex flex-col items-center justify-center gap-8 p-6 self-stretch w-full rounded-2xl overflow-hidden border border-solid border-[#cfd4dc]">
      <div className="flex flex-col items-start gap-8 p-6 self-stretch w-full bg-neutral-50 rounded-xl">
        <div className="flex flex-col items-start gap-5 self-stretch w-full">
          <h2 className="self-stretch [font-family:'Poppins',Helvetica] font-medium text-gray-3800 text-xl tracking-[-0.40px] leading-[normal]">
            Personal Information
          </h2>

          <div className="flex flex-wrap md:flex-nowrap items-start gap-5 self-stretch w-full">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem className="flex flex-col items-start gap-1.5 flex-1 min-w-[230px]">
                  <FormLabel className="inline-flex items-center gap-1.5">
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                      First Name
                    </span>
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter First Name"
                      className="h-12 px-3 py-2 bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs font-text-label-medium-regular text-[#667085]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem className="flex flex-col items-start gap-1.5 flex-1 min-w-[230px]">
                  <FormLabel className="inline-flex items-center gap-1.5">
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                      Last Name
                    </span>
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Last Name"
                      className="h-12 px-3 py-2 bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs font-text-label-medium-regular text-[#667085]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-wrap md:flex-nowrap items-start gap-5 self-stretch w-full">
            <FormField
              control={form.control}
              name="ssn"
              render={({ field }) => (
                <FormItem className="flex flex-col items-start gap-1.5 flex-1 min-w-[230px]">
                  <FormLabel className="inline-flex items-center gap-1.5">
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                      Social Security No
                    </span>
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter SSN"
                      maxLength={9}
                      className="h-12 px-3 py-2 bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs font-text-label-medium-regular text-[#667085]"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dob"
              render={({ field }) => (
                <FormItem className="flex flex-col items-start gap-1.5 flex-1 min-w-[230px]">
                  <FormLabel className="inline-flex items-center gap-1.5">
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                      Date of Birth
                    </span>
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative w-full">
                      <Input
                        type="date"
                        placeholder="dd/mm/yyyy"
                        className="h-12 px-3 py-2 bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs font-text-label-medium-regular text-[#667085]"
                        {...field}
                      />
                      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#667085] pointer-events-none" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start gap-8 p-6 self-stretch w-full bg-neutral-50 rounded-xl">
        <div className="flex flex-col items-start gap-5 self-stretch w-full">
          <h2 className="self-stretch [font-family:'Poppins',Helvetica] font-medium text-gray-3800 text-xl tracking-[0] leading-[normal]">
            Current Address
          </h2>

          <div className="flex flex-col items-start gap-5 self-stretch w-full">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="flex flex-col items-start gap-1.5 self-stretch w-full">
                  <FormLabel className="inline-flex items-center gap-1.5">
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                      Street Address
                    </span>
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Street Address"
                      className="h-12 px-3 py-2 bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs font-text-label-medium-regular text-[#667085]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-wrap md:flex-nowrap items-start gap-5 self-stretch w-full">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-start gap-1.5 flex-1 min-w-[230px]">
                    <FormLabel className="inline-flex items-center gap-1.5">
                      <span className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                        City
                      </span>
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter City"
                        className="h-12 px-3 py-2 bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs font-text-label-medium-regular text-[#667085]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-start gap-1.5 flex-1 min-w-[230px]">
                    <FormLabel className="inline-flex items-center gap-1.5">
                      <span className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                        State
                      </span>
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 px-3 py-2 bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs font-text-label-medium-regular text-[#667085]">
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {US_STATES.map((state) => (
                          <SelectItem key={state.value} value={state.value}>
                            {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="zip"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-start gap-1.5 flex-1 min-w-[230px]">
                    <FormLabel className="inline-flex items-center gap-1.5">
                      <span className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                        Zip Code
                      </span>
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter Zip Code"
                        maxLength={10}
                        className="h-12 px-3 py-2 bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs font-text-label-medium-regular text-[#667085]"
                        {...field}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^\d-]/g, '');
                          if (value.length > 5 && !value.includes('-')) {
                            value = value.substring(0, 5) + '-' + value.substring(5, 9);
                          }
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2">
          <p className="tracking-[0] leading-5 [font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-sm">
            This screening includes:
          </p>
          <ul className="flex flex-col items-start gap-1 list-none">
            {screeningIncludes.map((item, index) => (
              <li
                key={index}
                className="[font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-sm tracking-[0] leading-5"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
