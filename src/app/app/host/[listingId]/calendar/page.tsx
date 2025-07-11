"use client";

import { CalendarIcon, XCircleIcon } from "lucide-react";
import React from "react";
import { BrandButton } from "@/components/ui/brandButton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HOST_PAGE_STYLE } from "@/constants/styles";
import { DesktopScheduleViewer } from "@/components/ui/custom-calendar/date-range-selector/desktop-schedule-viewer";

export const Body = (): JSX.Element => {
  return (
    <div className="flex flex-col w-full items-start">
      <section className="flex flex-col items-start gap-6 px-6 py-8 self-stretch w-full bg-[#f9f9f9]">
        <header className="flex items-end gap-6 self-stretch w-full">
          <div className="flex flex-col items-start gap-2 flex-1">
            <h1 className="self-stretch mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-[#020202] text-2xl tracking-[0] leading-[28.8px]">
              Calendar Management
            </h1>
            <p className="w-full font-['Poppins',Helvetica] font-normal text-greygrey-500 text-base tracking-[0] leading-6">
              Manage availability for sparkling New KING I Close to Necessities
            </p>
          </div>
        </header>

        <div className="flex flex-col items-start gap-[18px] self-stretch w-full">
          <div className="flex flex-col items-start gap-6 self-stretch w-full">
            <Card className="w-full shadow-[0px_0px_5px_#00000029] rounded-xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col items-end justify-center gap-6 w-full">
                  <div className="flex flex-col items-start gap-8 p-6 w-full bg-neutral-50 rounded-xl">
                    <div className="flex flex-col items-start gap-5 w-full">
                      <h2 className="self-stretch mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-gray-3800 text-xl tracking-[-0.40px] leading-[normal]">
                        Block Unavailable Dates
                      </h2>

                      <div className="flex items-start gap-5 w-full">
                        <div className="flex flex-col items-start gap-1.5 flex-1">
                          <div className="flex flex-col items-start gap-1.5 w-full">
                            <div className="inline-flex items-center gap-1.5">
                              <label className="inline-flex items-center gap-1.5">
                                <span className="w-fit mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                                  Start Date
                                </span>
                              </label>
                              <span className="text-red-500 w-[5.2px] h-1.5">
                                *
                              </span>
                            </div>
                            <div className="relative w-full">
                              <Input
                                className="h-12 w-full pr-10"
                                placeholder="dd/mm/yyyy"
                              />
                              <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-start gap-1.5 flex-1">
                          <div className="flex flex-col items-start gap-1.5 w-full">
                            <div className="inline-flex items-center gap-1.5">
                              <label className="inline-flex items-center gap-1.5">
                                <span className="w-fit mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                                  End Date
                                </span>
                              </label>
                              <span className="text-red-500 w-[5.2px] h-1.5">
                                *
                              </span>
                            </div>
                            <div className="relative w-full">
                              <Input
                                className="h-12 w-full pr-10"
                                placeholder="dd/mm/yyyy"
                              />
                              <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col h-[149px] items-start gap-1.5 w-full">
                        <div className="flex flex-col items-start gap-1.5 flex-1 w-full">
                          <div className="inline-flex items-center gap-1.5">
                            <label className="inline-flex items-center gap-1.5">
                              <span className="w-fit mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                                Reason
                              </span>
                            </label>
                          </div>
                          <Textarea
                            className="flex-1 w-full resize-none"
                            placeholder="e.g Personal use, maintenance, already booked elsewhere..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-3">
                    <BrandButton
                      variant="outline"
                      className="pl-3 pr-2 min-w-0"
                      rightIcon={<XCircleIcon className="w-5 h-5 ml-[2px] " />}
                    >
                      Clear
                    </BrandButton>

                    <BrandButton variant="default">
                      Add Unavailability
                    </BrandButton>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Calendar Schedule Viewer */}
        <div className=" pb-8 w-full">
          <DesktopScheduleViewer
            bookings={[]}
            unavailablePeriods={[]}
          />
        </div>
      </section>
    </div>
  );
};

export default function CalendarPage() {
  return (
    <div className={HOST_PAGE_STYLE}>
      <Body />
    </div>
  );
}
