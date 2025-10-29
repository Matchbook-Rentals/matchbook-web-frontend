"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPinIcon, CarIcon, WifiIcon, FileTextIcon, AlertCircleIcon, Copy, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface MoveInInstructionsDisplayProps {
  address: string;
  propertyAccess?: string | null;
  parkingInfo?: string | null;
  wifiInfo?: string | null;
  otherNotes?: string | null;
}

const hasInstructions = (props: MoveInInstructionsDisplayProps) => {
  return !!(
    props.propertyAccess ||
    props.parkingInfo ||
    props.wifiInfo ||
    props.otherNotes
  );
};

const renderSection = (
  icon: React.ReactNode,
  title: string,
  content?: string | null
) => {
  if (!content) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-semibold text-[#484a54]">{title}</h3>
      </div>
      <div className="pl-7 text-[#777b8b] whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
};

const renderNoInstructionsAlert = () => (
  <Alert>
    <AlertCircleIcon className="h-4 w-4" />
    <AlertDescription>
      No move-in instructions have been provided yet. Please contact your host
      for more information.
    </AlertDescription>
  </Alert>
);

const renderAddressSection = (
  address: string,
  isCopied: boolean,
  onCopy: () => void
) => (
  <div className="flex items-start gap-2 pb-4 border-b">
    <MapPinIcon className="w-5 h-5 text-[#3c8787] flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-[#484a54]">Property Address</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopy}
          className="h-8 gap-2 text-[#3c8787] hover:text-[#2d6666] hover:bg-[#3c8787]/10"
        >
          {isCopied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </Button>
      </div>
      <div className="text-[#777b8b] whitespace-pre-wrap">{address}</div>
    </div>
  </div>
);

const renderInstructionsSections = (
  props: MoveInInstructionsDisplayProps
) => (
  <div className="space-y-4">
    {renderSection(
      <FileTextIcon className="w-5 h-5 text-[#3c8787]" />,
      "Property Access",
      props.propertyAccess
    )}
    {renderSection(
      <CarIcon className="w-5 h-5 text-[#3c8787]" />,
      "Parking Information",
      props.parkingInfo
    )}
    {renderSection(
      <WifiIcon className="w-5 h-5 text-[#3c8787]" />,
      "WiFi Information",
      props.wifiInfo
    )}
    {renderSection(
      <FileTextIcon className="w-5 h-5 text-[#3c8787]" />,
      "Additional Notes",
      props.otherNotes
    )}
  </div>
);

const copyAddressToClipboard = async (
  address: string,
  onSuccess: () => void
) => {
  try {
    await navigator.clipboard.writeText(address);
    onSuccess();
  } catch (error) {
    console.error("Failed to copy address:", error);
  }
};

const resetCopiedState = (
  setCopied: (value: boolean) => void,
  delayMs: number
) => {
  setTimeout(() => setCopied(false), delayMs);
};

export const MoveInInstructionsDisplay: React.FC<
  MoveInInstructionsDisplayProps
> = (props) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyAddress = () => {
    copyAddressToClipboard(props.address, () => {
      setIsCopied(true);
      resetCopiedState(setIsCopied, 2000);
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Move-in Instructions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderAddressSection(props.address, isCopied, handleCopyAddress)}
        {hasInstructions(props)
          ? renderInstructionsSections(props)
          : renderNoInstructionsAlert()}
      </CardContent>
    </Card>
  );
};
