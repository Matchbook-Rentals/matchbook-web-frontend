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
  className = "flex items-end gap-x-1 h-fit hover:bg-gray-100 p-1 rounded-[5px] text-[15px] group"
}) => {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);

  const currentUrl = url || window.location.href;

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
      } catch (error) {
        console.error("Error sharing:", error);
        toast({ title: "Error sharing", description: "Could not share." });
      }
    } else {
      setOpen(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      toast({ title: "Link copied to clipboard!", variant: "success" });
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
      <button onClick={handleShare} className={className}>
        <ShareIcon className="" />
        <span className="hidden xxs:block">Share</span>
      </button>

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