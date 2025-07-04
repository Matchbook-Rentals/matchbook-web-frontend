import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const US_STATES = [
  { name: "Alabama", code: "AL" },
  { name: "Alaska", code: "AK" },
  { name: "Arizona", code: "AZ" },
  { name: "Arkansas", code: "AR" },
  { name: "California", code: "CA" },
  { name: "Colorado", code: "CO" },
  { name: "Connecticut", code: "CT" },
  { name: "Delaware", code: "DE" },
  { name: "Florida", code: "FL" },
  { name: "Georgia", code: "GA" },
  { name: "Hawaii", code: "HI" },
  { name: "Idaho", code: "ID" },
  { name: "Illinois", code: "IL" },
  { name: "Indiana", code: "IN" },
  { name: "Iowa", code: "IA" },
  { name: "Kansas", code: "KS" },
  { name: "Kentucky", code: "KY" },
  { name: "Louisiana", code: "LA" },
  { name: "Maine", code: "ME" },
  { name: "Maryland", code: "MD" },
  { name: "Massachusetts", code: "MA" },
  { name: "Michigan", code: "MI" },
  { name: "Minnesota", code: "MN" },
  { name: "Mississippi", code: "MS" },
  { name: "Missouri", code: "MO" },
  { name: "Montana", code: "MT" },
  { name: "Nebraska", code: "NE" },
  { name: "Nevada", code: "NV" },
  { name: "New Hampshire", code: "NH" },
  { name: "New Jersey", code: "NJ" },
  { name: "New Mexico", code: "NM" },
  { name: "New York", code: "NY" },
  { name: "North Carolina", code: "NC" },
  { name: "North Dakota", code: "ND" },
  { name: "Ohio", code: "OH" },
  { name: "Oklahoma", code: "OK" },
  { name: "Oregon", code: "OR" },
  { name: "Pennsylvania", code: "PA" },
  { name: "Rhode Island", code: "RI" },
  { name: "South Carolina", code: "SC" },
  { name: "South Dakota", code: "SD" },
  { name: "Tennessee", code: "TN" },
  { name: "Texas", code: "TX" },
  { name: "Utah", code: "UT" },
  { name: "Vermont", code: "VT" },
  { name: "Virginia", code: "VA" },
  { name: "Washington", code: "WA" },
  { name: "West Virginia", code: "WV" },
  { name: "Wisconsin", code: "WI" },
  { name: "Wyoming", code: "WY" }
];

interface AddressConfirmationFormProps {
  initialAddress?: {
    street: string;
    street2: string;
    city: string;
    state: string;
    zip: string;
  };
  onAddressChange?: (address: {
    street: string;
    apt: string;
    city: string;
    state: string;
    zip: string;
  }) => void;
  onUpdatePin?: () => void;
  addressEdited?: boolean;
  inputStyles?: string;
  labelStyles?: string;
}

export const AddressConfirmationForm = ({ 
  initialAddress, 
  onAddressChange, 
  onUpdatePin,
  addressEdited = false,
  inputStyles,
  labelStyles
}: AddressConfirmationFormProps) => {
  const [form, setForm] = useState({
    street: "",
    apt: "",
    city: "",
    state: "",
    zip: "",
  });
  
  const [edited, setEdited] = useState(addressEdited);
  const [isStateAutofilled, setIsStateAutofilled] = useState(false);

  // Form field data for mapping
  const formFields = [
    {
      id: "street",
      name: "street",
      label: "Street Address",
      value: form.street,
      placeholder: "123 S Temple St",
      required: true,
      type: "text"
    },
    {
      id: "apt",
      name: "apt", 
      label: "Apt, Suite, Unit (optional)",
      value: form.apt,
      placeholder: "Apt 4B",
      required: false,
      type: "text"
    },
    {
      id: "city",
      name: "city",
      label: "City",
      value: form.city,
      placeholder: "Salt Lake City",
      required: true,
      type: "text"
    },
    {
      id: "state",
      name: "state",
      label: "State",
      value: form.state,
      placeholder: "Utah",
      required: true,
      type: "select"
    },
    {
      id: "zip",
      name: "zip",
      label: "Zip",
      value: form.zip,
      placeholder: "84101",
      required: true,
      type: "text",
      pattern: "[0-9]{5}(-[0-9]{4})?",
      maxLength: 10
    },
  ];

  useEffect(() => {
    if (initialAddress) {
      setForm({
        street: initialAddress.street || "",
        apt: initialAddress.street2 || "",
        city: initialAddress.city || "",
        state: initialAddress.state || "",
        zip: initialAddress.zip || "",
      });
    }
  }, [initialAddress]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // If it's the state field, normalize the input
    if (name === 'state') {
      processedValue = normalizeState(value);
    }
    
    const updatedForm = { ...form, [name]: processedValue };
    setForm(updatedForm);
    setEdited(true);
    if (onAddressChange) {
      onAddressChange(updatedForm);
    }
  };

  // Helper function to normalize state input to full name
  const normalizeState = (input: string): string => {
    // Check if it's a state code
    const stateByCode = US_STATES.find(s => s.code.toUpperCase() === input.toUpperCase());
    if (stateByCode) return stateByCode.name;
    
    // Check if it's already a full state name
    const stateByName = US_STATES.find(s => s.name.toLowerCase() === input.toLowerCase());
    if (stateByName) return stateByName.name;
    
    // Return as is if no match
    return input;
  };

  return (
    <div className="w-full">
      <Card className="border border-solid border-[#e6e6e6] p-6">
        <CardContent className="flex flex-col items-start gap-4 p-0">
          {formFields.map((field) => (
            <div
              key={field.id}
              className="flex flex-col items-start gap-1.5 w-full"
            >
              <Label
                htmlFor={field.id}
                className={labelStyles || "font-['Poppins'] font-medium text-sm text-[#344054]"}
              >
                {field.label}
              </Label>
              {field.type === "select" ? (
                <div className="relative w-full">
                  <Select value={field.value} onValueChange={(value) => {
                    const updatedForm = { ...form, state: value };
                    setForm(updatedForm);
                    setEdited(true);
                    setIsStateAutofilled(false); // Manual selection, not autofill
                    if (onAddressChange) {
                      onAddressChange(updatedForm);
                    }
                  }}>
                    <SelectTrigger className={cn(
                      "h-12 w-full", 
                      inputStyles,
                      isStateAutofilled && "bg-[#E8F0FE]", // Chrome's exact autofill background color
                      "data-[placeholder]:text-[#667085]" // Placeholder text color
                    )}>
                      <SelectValue placeholder="Select a state" className="text-[#667085]" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((state) => (
                        <SelectItem key={state.code} value={state.name}>{state.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Hidden input to capture autofill */}
                  <input
                    type="text"
                    name="state"
                    autoComplete="address-level1"
                    value=""
                    onChange={(e) => {
                      const value = normalizeState(e.target.value);
                      if (value && value !== form.state) {
                        const updatedForm = { ...form, state: value };
                        setForm(updatedForm);
                        setEdited(true);
                        setIsStateAutofilled(true); // Mark as autofilled
                        if (onAddressChange) {
                          onAddressChange(updatedForm);
                        }
                      }
                    }}
                    className="absolute inset-0 opacity-0 pointer-events-none -z-10"
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                </div>
              ) : (
                <Input
                  id={field.id}
                  name={field.name}
                  type={field.type}
                  value={field.value}
                  onChange={handleChange}
                  required={field.required}
                  pattern={field.pattern}
                  maxLength={field.maxLength}
                  placeholder={field.placeholder}
                  autoComplete={field.id === "street" ? "street-address" : 
                              field.id === "apt" ? "address-line2" :
                              field.id === "city" ? "address-level2" :
                              field.id === "zip" ? "postal-code" : undefined}
                  className={cn("h-12 w-full", inputStyles)}
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

    </div>
  );
};
