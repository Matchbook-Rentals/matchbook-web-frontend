"use client"

import { HomeIcon } from "lucide-react";
import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { BrandCheckbox } from "@/app/brandCheckbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrandButton } from "@/components/ui/brandButton";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

const disclosureSections = [
  {
    title: "Background Check Authorization",
    htmlPath: "/legal/rental-background-report-authorization-and-disclosure-form.html",
  },
  {
    title: "Credit Check Authorization",
    htmlPath: "/legal/RENTER CREDIT CHECK AUTHORIZATION FORM 10-09-25 Final.html",
  },
];

interface AuthorizationDisclosureScreenProps {
  form: UseFormReturn<any>;
  onBack: () => void;
  onSubmit: () => void;
}

export const AuthorizationDisclosureScreen = ({
  form,
  onBack,
  onSubmit
}: AuthorizationDisclosureScreenProps): JSX.Element => {
  return (
    <div className="flex flex-col w-full items-start justify-center gap-4 p-2 md:p-4 pb-24">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className="flex items-center">
              <HomeIcon className="w-6 h-6" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <span className="font-text-md-regular font-[number:var(--text-md-regular-font-weight)] text-gray-500 text-[length:var(--text-md-regular-font-size)] tracking-[var(--text-md-regular-letter-spacing)] leading-[var(--text-md-regular-line-height)] [font-style:var(--text-md-regular-font-style)]">
              /
            </span>
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-gray-900 text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]">
              MatchBook Renter Verification
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col items-start justify-center gap-6 w-full">
        <div className="flex flex-col w-full items-start gap-1">
          <h1 className="font-text-heading-medium-medium font-[number:var(--text-heading-medium-medium-font-weight)] text-[#373940] text-[length:var(--text-heading-medium-medium-font-size)] tracking-[var(--text-heading-medium-medium-letter-spacing)] leading-[var(--text-heading-medium-medium-line-height)] [font-style:var(--text-heading-medium-medium-font-style)]">
            Complete MatchBook Renter Verification
          </h1>

          <p className="[font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-sm tracking-[-0.28px] leading-[normal]">
            This screening includes a credit range, background check, and
            eviction history.
          </p>
        </div>

        <Card className="w-full rounded-2xl border border-solid border-[#cfd4dc]">
          <CardContent className="flex flex-col items-center justify-center gap-8 p-3 md:p-6">
            {disclosureSections.map((section, index) => (
              <Card
                key={index}
                className="w-full rounded-xl border border-solid border-[#e6e6e6]"
              >
                <CardContent className="flex flex-col items-start gap-2 px-3 py-4">
                  <h2 className="font-m3-title-medium font-[number:var(--m3-title-medium-font-weight)] text-[#373940] text-[length:var(--m3-title-medium-font-size)] tracking-[var(--m3-title-medium-letter-spacing)] leading-[var(--m3-title-medium-line-height)] [font-style:var(--m3-title-medium-font-style)] font-bold">
                    {section.title}
                  </h2>

                  <ScrollArea className="w-full h-[373px]">
                    <div className="w-full pr-4">
                      <iframe
                        src={section.htmlPath}
                        className="w-full h-[350px] border-0"
                        title={section.title}
                        sandbox="allow-same-origin"
                      />
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ))}

            <Card className="w-full rounded-xl border border-solid border-[#e6e6e6]">
              <CardContent className="flex flex-col items-start gap-2 px-3 py-4">
                <FormField
                  control={form.control}
                  name="fcraRightsAcknowledgment"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <BrandCheckbox
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          name="fcraRightsAcknowledgment"
                          label={
                            <span className="font-semibold text-[#373940]">
                              By checking this box, I confirm that I have read and understood the Background Check Authorization and Credit Check Authorization disclosures above.
                            </span>
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="creditAuthorizationAcknowledgment"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <BrandCheckbox
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          name="creditAuthorizationAcknowledgment"
                          label={
                            <span className="font-semibold text-[#373940]">
                              By checking this box, I authorize Matchbook LLC to obtain my credit report for rental evaluation purposes.
                            </span>
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="backgroundCheckAuthorization"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <BrandCheckbox
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          name="backgroundCheckAuthorization"
                          label={
                            <span className="font-semibold text-[#373940]">
                              By checking this box, I authorize Matchbook LLC to conduct a background check and eviction history search.
                            </span>
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
