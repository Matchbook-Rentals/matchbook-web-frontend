import { XIcon } from "lucide-react";
import React from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";

interface BrandDialogProps {
  titleComponent?: React.ReactNode;
  contentComponent: React.ReactNode;
  footerComponent?: React.ReactNode;
}

export const BrandDialog: React.FC<BrandDialogProps> = ({
  titleComponent,
  contentComponent,
  footerComponent,
}) => {
  // Data for the stepper
  const steps = [
    { status: "active" },
    { status: "inactive" },
    { status: "inactive" },
  ];

  return (
    <Card className="flex flex-col items-center gap-6 p-6 bg-white w-full max-w-[821px] mx-auto">
      {titleComponent && (
        <div className="flex items-center justify-between relative self-stretch w-full">
          <XIcon className="w-6 h-6 text-gray-500" />
          {titleComponent}
          <div className="w-6 h-6" /> {/* Empty div for spacing */}
        </div>
      )}

      <div className="flex w-full items-center justify-center">
        <div className="flex w-[368px] items-center justify-center">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              {/* Step circle */}
              <div className="inline-flex items-start relative">
                <div
                  className={`relative w-6 h-6 rounded-full overflow-hidden ${
                    step.status === "active"
                      ? "bg-[#f9f5ff] shadow-[0px_0px_0px_4px_#3c87873d]"
                      : "bg-gray-50"
                  }`}
                >
                  <div
                    className={`h-6 rounded-xl border-[1.5px] border-solid ${
                      step.status === "active"
                        ? "bg-[#3c8787]"
                        : "border-[#eaecf0]"
                    }`}
                  >
                    <div
                      className={`relative w-2 h-2 top-2 left-2 rounded ${
                        step.status === "active" ? "bg-white" : "bg-[#d0d5dd]"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Connector line (except after the last step) */}
              {index < steps.length - 1 && (
                <div className="relative w-20 h-0.5 bg-[#0b6969]" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <CardContent className="flex flex-col items-end gap-6 relative self-stretch w-full p-0">
        {contentComponent}
        {footerComponent}
      </CardContent>
    </Card>
  );
};

// Example usage with the original content
export const ExampleUsage = () => {
  return (
    <BrandDialog
      titleComponent={
        <h2 className="font-medium font-['Poppins',Helvetica] text-gray-neutral900 text-xl text-center">
          Select Location
        </h2>
      }
      contentComponent={
        <div className="flex flex-col items-start gap-4 relative self-stretch w-full">
          <div className="flex items-center gap-4 relative self-stretch w-full">
            <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
              <Input placeholder="Choose Location" className="h-12 w-full" />
            </div>
          </div>
        </div>
      }
      footerComponent={
        <Button className="bg-[#0b6969] hover:bg-[#095757] text-white w-[165px]">
          Next
        </Button>
      }
    />
  );
};