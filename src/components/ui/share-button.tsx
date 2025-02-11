import React from "react";
import { ShareIcon } from "lucide-react";
import { useToast } from "./use-toast";

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

  const handleShare = async () => {
    const shareData = {
      title,
      text,
      url: url || window.location.href,
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
      try {
        await navigator.clipboard.writeText(url || window.location.href);
        toast({ title: "Link copied to clipboard!" });
      } catch (error) {
        console.error("Clipboard error:", error);
        toast({ title: "Clipboard error", description: "Could not copy link." });
      }
    }
  };

  return (
    <button onClick={handleShare} className={className}>
      <ShareIcon className="" />
      <span className="hidden xxs:block">Share</span>
    </button>
  );
};

export default ShareButton;