import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const CheckIn = (): JSX.Element => {
  // Form fields data
  const formFields = [
    {
      label: "Property access",
      required: true,
      placeholder: "How renters gain entry into the property?",
    },
    {
      label: "Parking",
      required: true,
      placeholder: "Where do renters park?",
    },
    {
      label: "Wifi",
      required: true,
      placeholder: "If Wifi is provided how do renters get access?",
    },
    {
      label: "Other notes",
      required: true,
      placeholder: "What other items should renters know?",
    },
  ];

  return (
    <div className="flex flex-col items-start gap-6">
      {/* Page title */}
      <div className="flex items-end gap-6 w-full">
        <div className="flex flex-col items-start gap-2 flex-1">
          <h1 className="text-2xl font-medium text-[#020202] [font-family:'Poppins',Helvetica]">
            Check-in Instructions
          </h1>
          <p className="text-sm font-normal text-[#5d606d] [font-family:'Poppins',Helvetica]">
            Renters will see these the day before move-in
          </p>
        </div>
      </div>

      {/* Form section */}
      <div className="flex flex-col items-start gap-[18px] w-full">
        <Card className="w-full bg-white">
          <CardContent className="flex flex-col items-start gap-8 p-6">
            <div className="flex flex-col items-start gap-5 w-full">
              <h2 className="text-xl font-medium text-gray-800 [font-family:'Poppins',Helvetica]">
                What should renters know at move-in
              </h2>

              {formFields.map((field, index) => (
                <div
                  key={`form-field-${index}`}
                  className="flex flex-col items-start gap-1.5 w-full"
                >
                  <div className="inline-flex items-center gap-1.5">
                    <label className="font-medium text-[#344054] text-sm [font-family:'Poppins',Helvetica]">
                      {field.label}
                    </label>
                    {field.required && (
                      <img
                        className="w-[5.2px] h-1.5"
                        alt="Required"
                        src="/star-6.svg"
                      />
                    )}
                  </div>
                  <Input
                    className="h-12 bg-sidebar"
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>
          </CardContent>
          <div className="flex justify-center pb-6">
            <Button className="bg-[#1e7566] hover:bg-[#166355] text-white">
              Save
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};