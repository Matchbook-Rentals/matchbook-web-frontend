'use client'
import { Dialog, DialogTrigger, DialogContent } from "../ui/dialog";
import Countdown from "./countdown";
import BrevoIframe from "../home-components/brevo-iframe";
import { DialogOverlay } from "../ui/dialog";

interface SubscribeDialogProps {
  triggerText: string;
  triggerClassNames?: string;
  isOpen?: boolean;
  setOpen?: (open: boolean) => void;
}

export default function SubscribeDialog({
  triggerText,
  triggerClassNames,
  isOpen,
  setOpen
}: SubscribeDialogProps) {

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger className={triggerClassNames}>
        {triggerText}
      </DialogTrigger>
      <DialogContent
        className="
        w-[95%] sm:w-4/5 md:w-3/5 
        h-[80vh] sm:h-[84vh] md:h-[77vh] px-1 pt-4 
      ">
        <div
          className=" overflow-y-scroll overflow-x-hidden px-2"
          style={{
            scrollbarWidth: "none",
            height: "100%",
          }}
        >
          <Countdown />
          <BrevoIframe />
        </div>
      </DialogContent >
    </Dialog >
  );
};
