import React from "react";
import { ShareIcon, MailIcon, MessageSquareIcon, CopyIcon } from "lucide-react";
import { useToast } from "./use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const currentUrl = url || `${window.location.origin}${pathname}`;

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

      <Dialog open={open} onOpenChange={setOpen} >
        <DialogContent hideCloseButton>
          <DialogHeader>
            <DialogTitle>Share</DialogTitle>
            <DialogDescription>Select an option to share:</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 my-4">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              <CopyIcon size={18} />
              Copy Link
            </button>
            <button
              onClick={handleEmailShare}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              <MailIcon size={18} />
              Email
            </button>
            <button
              onClick={handleMessageShare}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              <MessageSquareIcon size={18} />
              Message
            </button>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </ >
  );
};

export default ShareButton;
