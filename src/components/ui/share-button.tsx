import React, { useState, useEffect } from "react";
import { ShareIcon, MailIcon, MessageSquareIcon, CopyIcon } from "lucide-react";
import { useToast } from "./use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { BrandButton } from "@/components/ui/brandButton";
import { usePathname } from 'next/navigation';

interface ShareButtonProps {
  url?: string;
  title?: string;
  text?: string;
  className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  url,
  title = "Share",
  text = "Check out this listing",
  className = ""
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const currentUrl = url || `${window.location.origin}${pathname}`;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleShare = async () => {
    const shareData = {
      title,
      text,
      url: currentUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({ title: "Shared successfully!" });
      } catch (error: any) {
        // User cancelled - this is normal behavior, don't show error
        if (error?.name === 'AbortError') {
          return; // Silent return, no error toast
        }
        
        // Permission denied
        if (error?.name === 'NotAllowedError') {
          toast({ 
            title: "Permission denied", 
            description: "Please allow sharing permissions." 
          });
          return;
        }
        
        // Actual error
        console.error("Error sharing:", error);
        toast({ 
          title: "Error sharing", 
          description: "Could not share. Please try copying the link instead." 
        });
        // Open the fallback dialog for non-cancellation errors
        setOpen(true);
      }
    } else {
      setOpen(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      toast({ title: "Link copied to clipboard!" });
      setOpen(false);
    } catch (error) {
      console.error("Clipboard error:", error);
      toast({ title: "Clipboard error", description: "Could not copy link." });
    }
  };

  const handleEmailShare = () => {
    const subject = title;
    const body = `${text}\n\n${currentUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setOpen(false);
  };

  const handleMessageShare = () => {
    const body = `${text}\n\n${currentUrl}`;
    window.location.href = `sms:?body=${encodeURIComponent(body)}`;
    setOpen(false);
  };

  const shareOptions = (
    <div className="flex flex-col gap-3 my-4">
      <button
        onClick={handleCopyLink}
        className="flex items-center gap-3 px-4 py-4 bg-gray-100 rounded-lg hover:bg-gray-200 
                   min-h-[48px] touch-manipulation active:bg-gray-300 transition-colors"
      >
        <CopyIcon size={20} />
        <span className="text-base">Copy Link</span>
      </button>
      <button
        onClick={handleEmailShare}
        className="flex items-center gap-3 px-4 py-4 bg-gray-100 rounded-lg hover:bg-gray-200 
                   min-h-[48px] touch-manipulation active:bg-gray-300 transition-colors"
      >
        <MailIcon size={20} />
        <span className="text-base">Email</span>
      </button>
      <button
        onClick={handleMessageShare}
        className="flex items-center gap-3 px-4 py-4 bg-gray-100 rounded-lg hover:bg-gray-200 
                   min-h-[48px] touch-manipulation active:bg-gray-300 transition-colors"
      >
        <MessageSquareIcon size={20} />
        <span className="text-base">Message</span>
      </button>
    </div>
  );

  return (
    <>
      <BrandButton 
        onClick={handleShare} 
        className={className + '!w-fit min-w-0 '}
        variant="default"
        leftIcon={<ShareIcon className="h-4 w-4" />}
      >
        <span className="hidden sm:inline">Share</span>
      </BrandButton>

      {/* Mobile Drawer */}
      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent 
            className="pb-safe"
            style={{
              paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))'
            }}
          >
            <DrawerHeader>
              <DrawerTitle>Share</DrawerTitle>
              <DrawerDescription>Select an option to share:</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4">
              {shareOptions}
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 
                             min-h-[44px] touch-manipulation active:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        /* Desktop Dialog */
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent hideCloseButton>
            <DialogHeader>
              <DialogTitle>Share</DialogTitle>
              <DialogDescription>Select an option to share:</DialogDescription>
            </DialogHeader>
            {shareOptions}
            <div className="flex justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default ShareButton;
