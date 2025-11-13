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
    title: "CREDIT REPORT AND BACKGROUND CHECK AUTHORIZATION DISCLOSURE",
    content: `Authorization to Obtain Reports.

By completing the Credit Report Authorization Form and Background Check Authorization Form, you authorize Matchbook LLC and its designated agencies to obtain consumer reports and background checks ("Reports") about you in compliance with the Fair Credit Reporting Act.

Lawful Purpose.

Any and all information obtained under the Credit Report Authorization Form and Background Check Authorization Form is collected for the valid purpose of evaluating your qualifications to rent a property listed on the Matchbook LLC platform and for any other lawful purpose covered under the Fair Credit Reporting Act. The results of your Credit Report and Background Check may impact whether you are matched with a host.

Confidentiality.

Matchbook LLC agrees to handle your information with care and in accordance with applicable privacy laws. Your reports will not be sold or disclosed to any third party except as explicitly stated in this consent or as required by law. Matchbook LLC may share a general summary of your credit standing (e.g., "Excellent (800–850)," "Good (670–739)," "Fair (580–669)," or ("Poor (300–579)") with hosts to assist in evaluating your application. Your full report will not be shared with hosts, property owners, or managers.

Authorization to Obtain Reports.

By completing the Credit Report Authorization Form and Background Check Authorization Form, you authorize Matchbook LLC and its designated agencies to obtain consumer reports and background checks ("Reports") about you in compliance with the Fair Credit Reporting Act.

Lawful Purpose.

Any and all information obtained under the Credit Report Authorization Form and Background Check Authorization Form is collected for the valid purpose of evaluating your qualifications to rent a property listed on the Matchbook LLC platform and for any other lawful purpose covered under the Fair Credit Reporting Act. The results of your Credit Report and Background Check may impact whether you are matched with a host.

Confidentiality.

Matchbook LLC agrees to handle your information with care and in accordance with applicable privacy laws. Your reports will not be sold or disclosed to any third party except as explicitly stated in this consent or as required by law. Matchbook LLC may share a general summary of your credit standing (e.g., "Excellent (800–850)," "Good (670–739)," "Fair (580–669)," or ("Poor (300–579)") with hosts to assist in evaluating your application. Your full report will not be shared with hosts, property owners, or managers.`,
  },
  {
    title: "Credit Authorization",
    content: `I hereby authorize Matchbook LLC and its designated agents and representatives, including third-party screening providers to obtain a consumer credit report ("Report") from a consumer credit reporting agency (such as ISoftPull).  I authorize all corporations, former employees, credit agency, educational institution, government agency (local, state, or federal), or other related entity, and their agents and representatives, to release any and all information they may have about me.

I understand that my personal information such as my date of birth and social security number will be used for the purpose of obtaining this Report. I understand that the Report may include, but is not limited to, information related to the following from any credit reporting agency or other financial or public sources:

Credit history;

I hereby authorize Matchbook LLC and its designated agents and representatives, including third-party screening providers to obtain a consumer credit report ("Report") from a consumer credit reporting agency (such as ISoftPull).  I authorize all corporations, former employees, credit agency, educational institution, government agency (local, state, or federal), or other related entity, and their agents and representatives, to release any and all information they may have about me.

I understand that my personal information such as my date of birth and social security number will be used for the purpose of obtaining this Report. I understand that the Report may include, but is not limited to, information related to the following from any credit reporting agency or other financial or public sources:

Credit history;`,
  },
  {
    title: "Placeholder",
    content: `This is placeholder content for the third legal disclosure section.

The actual legal content is waiting at the lawyers office and will be provided once reviewed and approved by legal counsel.

This section will contain important information regarding tenant rights, data privacy, and other legally required disclosures in accordance with federal and state regulations.

Please note that this is temporary content used only for testing the scroll behavior and layout of the disclosure sections.

This is placeholder content for the third legal disclosure section.

The actual legal content is waiting at the lawyers office and will be provided once reviewed and approved by legal counsel.

This section will contain important information regarding tenant rights, data privacy, and other legally required disclosures in accordance with federal and state regulations.

Please note that this is temporary content used only for testing the scroll behavior and layout of the disclosure sections.`,
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
    <div className="flex flex-col w-full items-start justify-center gap-4 p-4">
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
          <CardContent className="flex flex-col items-center justify-center gap-8 p-6">
            {disclosureSections.map((section, index) => (
              <Card
                key={index}
                className="w-full rounded-xl border border-solid border-[#e6e6e6]"
              >
                <CardContent className="flex flex-col items-start gap-2 px-3 py-4">
                  <h2 className="font-m3-title-medium font-[number:var(--m3-title-medium-font-weight)] text-[#373940] text-[length:var(--m3-title-medium-font-size)] tracking-[var(--m3-title-medium-letter-spacing)] leading-[var(--m3-title-medium-line-height)] [font-style:var(--m3-title-medium-font-style)]">
                    {section.title}
                  </h2>

                  <ScrollArea className="w-full h-[373px]">
                    <div className="[font-family:'Poppins',Helvetica] font-normal text-[#373940] text-sm tracking-[0] leading-[normal] whitespace-pre-line pr-4">
                      {section.content}
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
                            <>
                              <span className="font-semibold text-[#373940]">
                                By checking this box, I confirm that I have been
                                provided with my{" "}
                              </span>
                              <a
                                href="#"
                                className="font-semibold text-[#2644ac] underline"
                              >
                                Summary of Rights
                              </a>
                              <span className="font-semibold text-[#373940]">
                                {" "}
                                under the FCRA.{" "}
                              </span>
                              <span className="text-[#373940]">
                                CREDIT REPORT AND BACKGROUND CHECK AUTHORIZATION DISCLOSURE
                              </span>
                            </>
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
                            <>
                              <span className="font-semibold text-[#373940]">
                                By checking this box, I authorize Matchbook LLC to obtain my{" "}
                              </span>
                              <span className="text-[#373940]">
                                credit report for rental evaluation purposes.
                              </span>
                            </>
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
                            <>
                              <span className="font-semibold text-[#373940]">
                                By checking this box, I authorize Matchbook LLC to conduct a{" "}
                              </span>
                              <span className="text-[#373940]">
                                background check and eviction history search.
                              </span>
                            </>
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="w-full flex justify-between items-center">
              <BrandButton
                type="button"
                variant="outline"
                size="lg"
                onClick={onBack}
              >
                Back
              </BrandButton>

              <BrandButton
                type="button"
                size="lg"
                onClick={onSubmit}
              >
                Complete Verification
              </BrandButton>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
