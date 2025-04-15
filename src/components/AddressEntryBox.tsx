import React, { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

interface AddressEntryBoxProps {
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
}

export const AddressEntryBox = ({ initialAddress, onAddressChange }: AddressEntryBoxProps) => {
  const [form, setForm] = useState({
    street: "",
    apt: "",
    city: "",
    state: "",
    zip: "",
  });

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updatedForm = { ...form, [name]: value };
    setForm(updatedForm);
    if (onAddressChange) {
      onAddressChange(updatedForm);
    }
  };

  return (
    <div className="w-full max-w-[880px]">
      <div className="w-full">
        <h2 className="font-medium text-2xl text-[#3f3f3f] mb-6 font-['Poppins',Helvetica]">
          Please confirm the property address
        </h2>
        <Card className="w-full border-2 border-solid border-[#0000004c] rounded-[10px]">
          <CardContent className="p-5">
            {/* Street Address */}
            <div>
              <div className="py-2">
                <label className="font-light text-[15px] text-[#3f3f3f] font-['Poppins',Helvetica]" htmlFor="street">
                  Street Address
                </label>
                <input
                  id="street"
                  name="street"
                  type="text"
                  required
                  value={form.street}
                  onChange={handleChange}
                  className="font-medium text-lg text-[#3f3f3f] mt-1 font-['Poppins',Helvetica] w-full border-b border-[#00000033] focus:outline-none bg-transparent"
                  autoComplete="street-address"
                />
              </div>
              <Separator className="my-2" />
            </div>

            {/* Apt, Suite, Unit (optional) */}
            <div>
              <div className="py-2">
                <label className="font-light text-[15px] text-[#3f3f3f] font-['Poppins',Helvetica]" htmlFor="apt">
                  Apt, Suite, Unit (optional)
                </label>
                <input
                  id="apt"
                  name="apt"
                  type="text"
                  value={form.apt}
                  onChange={handleChange}
                  className="font-medium text-lg text-[#3f3f3f] mt-1 font-['Poppins',Helvetica] w-full border-b border-[#00000033] focus:outline-none bg-transparent"
                  autoComplete="address-line2"
                />
              </div>
              <Separator className="my-2" />
            </div>

            {/* City */}
            <div>
              <div className="py-2">
                <label className="font-light text-[15px] text-[#3f3f3f] font-['Poppins',Helvetica]" htmlFor="city">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  required
                  value={form.city}
                  onChange={handleChange}
                  className="font-medium text-lg text-[#3f3f3f] mt-1 font-['Poppins',Helvetica] w-full border-b border-[#00000033] focus:outline-none bg-transparent"
                  autoComplete="address-level2"
                />
              </div>
              <Separator className="my-2" />
            </div>

            {/* State */}
            <div>
              <div className="py-2">
                <label className="font-light text-[15px] text-[#3f3f3f] font-['Poppins',Helvetica]" htmlFor="state">
                  State
                </label>
                <select
                  id="state"
                  name="state"
                  required
                  value={form.state}
                  onChange={handleChange}
                  className="font-medium text-lg cursor-pointer text-[#3f3f3f] mt-1 font-['Poppins',Helvetica] w-full border-b border-[#00000033] focus:outline-none bg-transparent cursor-pointer"
                  autoComplete="address-level1"
                >
                  <option value="" disabled>Select a state</option>
                  {US_STATES.map((state) => (
                    <option key={state} value={state} className="cursor-pointer">{state}</option>
                  ))}
                </select>
              </div>
              <Separator className="my-2" />
            </div>

            {/* Zip */}
            <div>
              <div className="py-2">
                <label className="font-light text-[15px] text-[#3f3f3f] font-['Poppins',Helvetica]" htmlFor="zip">
                  Zip
                </label>
                <input
                  id="zip"
                  name="zip"
                  type="text"
                  required
                  value={form.zip}
                  onChange={handleChange}
                  className="font-medium text-lg text-[#3f3f3f] mt-1 font-['Poppins',Helvetica] w-full border-b border-[#00000033] focus:outline-none bg-transparent"
                  autoComplete="postal-code"
                  pattern="[0-9]{5}(-[0-9]{4})?"
                  maxLength={10}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
