import { MoreVerticalIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandButton } from "@/components/ui/brandButton";
import { Card, CardContent } from "@/components/ui/card";

interface RenterDashboardApplicationCardProps {
  title: string;
  status: string;
  dateRange: string;
  location: string;
  guests: string;
  imageUrl: string;
  applicationId: string;
  userId?: string;
}

export const RenterDashboardApplicationCard = ({
  title,
  status,
  dateRange,
  location,
  guests,
  imageUrl,
  applicationId,
  userId,
}: RenterDashboardApplicationCardProps): JSX.Element => {
  return (
    <Card className="w-full bg-white rounded-[15px] border-[0.4px] border-[#0b6e6e] shadow-[1px_3px_8px_0_rgba(0,0,0,0.25)]">
      <CardContent className="p-[17px]">
        <div className="flex gap-6">
          {/* Image Column */}
          <div
            className="w-[148px] h-[134px] rounded-xl bg-cover bg-center flex-shrink-0"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />

          {/* Content Grid - 5 rows */}
          <div className="grid grid-cols-[1fr_auto] grid-rows-[auto_auto_auto_auto_1fr] gap-x-4 gap-y-[5px] flex-1 min-w-0">
            {/* Row 1: Title + Badge | More Menu */}
            <div className="flex items-start gap-2">
              <h3 className="[font-family:'Poppins',Helvetica] font-medium text-[#373940] text-base">
                {title}
              </h3>
              <Badge className="h-6 px-2.5 py-1 bg-[#e6f6fd] rounded-full border border-[#00a6e8] hover:bg-[#e6f6fd] flex-shrink-0">
                <span className="[font-family:'Poppins',Helvetica] font-medium text-[#00a6e8] text-[10px] leading-5">
                  {status}
                </span>
              </Badge>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="w-6 h-6 p-0 rounded-[5px] border-[#3c8787]"
            >
              <MoreVerticalIcon className="w-4 h-4 text-[#3c8787]" />
            </Button>

            {/* Row 2: Date */}
            <div className="[font-family:'Poppins',Helvetica] font-light text-black text-xs col-span-2">
              {dateRange}
            </div>

            {/* Row 3: Location */}
            <div className="[font-family:'Poppins',Helvetica] font-normal text-[#777b8b] text-[10px] col-span-2">
              {location}
            </div>

            {/* Row 4: Guests */}
            <div className="[font-family:'Poppins',Helvetica] font-normal text-[#777b8b] text-[10px] col-span-2">
              {guests}
            </div>

            {/* Row 5: Buttons (right aligned) */}
            <div className="col-span-2 flex items-end justify-end gap-3">
              <BrandButton
                variant="outline"
                size="sm"
                href={`/app/rent/applications/${applicationId}`}
                className="w-[115px] h-[29px] px-3.5 py-2.5 rounded-lg border-[#3c8787] hover:bg-transparent"
              >
                <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#3c8787] text-[11px] leading-5">
                  View
                </span>
              </BrandButton>

              {userId && (
                <BrandButton
                  variant="outline"
                  size="sm"
                  href={`/app/rent/messages?userId=${userId}`}
                  className="w-[115px] h-[29px] px-3.5 py-2.5 rounded-lg border-[#3c8787] hover:bg-transparent"
                >
                  <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#3c8787] text-[11px] leading-5">
                    Message Host
                  </span>
                </BrandButton>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
