"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Countdown from "@/components/marketing-landing-components/countdown";
import BrevoIframe from "@/components/home-components/brevo-iframe";

interface CountdownDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  autoOpen?: boolean;
}

const CountdownDialog = ({ isOpen, setIsOpen, autoOpen = false }: CountdownDialogProps) => {
  //useEffect(() => {
  //  if (autoOpen) {
  //    const timer = setTimeout(() => {
  //      setIsOpen(true);
  //    }, 1000);
  //
  //    return () => clearTimeout(timer);
  //  }
  //}, [setIsOpen, autoOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        xOnRight
        className="
        w-[95%] sm:w-4/5 md:w-3/5
        h-fit pb-8 pt-0
        px-6 sm:px-10
         rounded-lg flex flex-col items-start md:max-h-[700px]   ">
        <h1 className="text-3xl sm:text-4xl text-left  mt-8  mb-2 font-semibold">Get ready for launch!</h1>
        <BrevoIframe />
      </DialogContent>
    </Dialog>
  );
};

export default CountdownDialog;