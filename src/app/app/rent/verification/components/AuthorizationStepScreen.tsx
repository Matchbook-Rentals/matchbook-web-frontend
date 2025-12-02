"use client"

import React from "react";
import { UseFormReturn, FieldPath } from "react-hook-form";
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
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import type { VerificationFormValues } from "../utils";

interface AuthorizationStepScreenProps {
  form: UseFormReturn<VerificationFormValues>;
  title: string;
  checkboxName: FieldPath<VerificationFormValues>;
  checkboxLabel: string;
  checkboxId: string;
  children: React.ReactNode;
}

export const AuthorizationStepScreen = ({
  form,
  title,
  checkboxName,
  checkboxLabel,
  checkboxId,
  children,
}: AuthorizationStepScreenProps): JSX.Element => {
  return (
    <div className="flex flex-col w-full items-start justify-center gap-4 p-2 md:p-4 pb-24">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">
              <img src="/logo-small.svg" alt="Home" className="w-[18px] h-[18px] -translate-y-[1px]" />
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

      <div className="flex flex-col w-full items-start gap-1">
        <h1 className="font-text-heading-medium-medium text-[#373940] text-2xl md:text-4xl">
          {title}
        </h1>
        <p className="[font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-sm">
          Please review and authorize the disclosure below
        </p>
      </div>

      <div className="flex flex-col items-start justify-center gap-6 w-full">
        <Card className="w-full rounded-2xl shadow-none p-0 border border-solid border-[#e6e6e6]">
          <CardContent className="flex flex-col items-start gap-6 p-4 md:p-6">
            {children}

            <FormField
              control={form.control}
              name={checkboxName}
              render={({ field }) => (
                <FormItem id={checkboxId} className="w-full pt-4 border-t border-[#e6e6e6]">
                  <FormControl>
                    <BrandCheckbox
                      checked={field.value as boolean}
                      onChange={(e) => field.onChange(e.target.checked)}
                      name={checkboxName}
                      label={
                        <span className="font-semibold text-[#373940]">
                          {checkboxLabel}
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
      </div>
    </div>
  );
};
