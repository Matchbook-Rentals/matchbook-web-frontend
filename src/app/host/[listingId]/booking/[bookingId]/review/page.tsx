import { StarIcon } from "lucide-react";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface ReviewPageProps {
  params: {
    listingId: string;
    bookingId: string;
  };
}

export default function HostReviewPage({ params }: ReviewPageProps) {
  const stars = Array.from({ length: 5 }, (_, index) => index);

  return (
    <Card className="flex flex-col items-start gap-2.5 p-10 relative bg-white rounded-lg overflow-hidden border-0 shadow-none">
      <CardContent className="w-[777px] gap-8 flex-[0_0_auto] flex flex-col items-start relative p-0">
        <div className="w-[730px] h-[42px] gap-2 flex flex-col items-start relative">
          <h1 className="relative self-stretch h-[42px] mt-[-1.00px] [font-family:'Poppins',Helvetica] font-bold text-blackblack-500 text-[28px] tracking-[0] leading-[33.6px]">
            LEAVE A REVIEW
          </h1>
        </div>

        <div className="flex flex-col items-start justify-center gap-6 relative self-stretch w-full flex-[0_0_auto]">
          <div className="relative flex items-center justify-center self-stretch mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#373940] text-base tracking-[0.15px] leading-[normal]">
            Please Rate Your Stay
          </div>

          <div className="flex gap-1">
            {stars.map((index) => (
              <StarIcon
                key={index}
                className="w-6 h-6 fill-gray-300 text-gray-300 cursor-pointer hover:fill-star-dark hover:text-star-dark transition-colors"
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col items-start justify-center gap-6 relative self-stretch w-full flex-[0_0_auto]">
          <div className="relative flex items-center justify-center self-stretch mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#373940] text-base tracking-[0.15px] leading-[normal]">
            Write your review
          </div>

          <Textarea
            placeholder="Write here.."
            className="h-[120px] resize-none bg-white border-[#e6e6e6] [font-family:'Poppins',Helvetica] font-normal text-[#7e7e7e] text-base tracking-[0.50px] leading-[normal] placeholder:text-[#7e7e7e]"
          />
        </div>
      </CardContent>
    </Card>
  );
}