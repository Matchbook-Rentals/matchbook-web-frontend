import { MapPinIcon } from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Occupant {
  type: string;
  count: number;
  icon: string;
}

interface HostApplicationCardProps {
  name: string;
  status: string;
  dates: string;
  address: string;
  description: string;
  price: string;
  occupants: Occupant[];
  profileImage?: string;
  onApplicationDetails?: () => void;
  onMessageGuest?: () => void;
  className?: string;
}

export const HostApplicationCard: React.FC<HostApplicationCardProps> = ({
  name,
  status,
  dates,
  address,
  description,
  price,
  occupants,
  profileImage = "/image-35.png",
  onApplicationDetails,
  onMessageGuest,
  className = "",
}) => {

  return (
    <Card className={`w-full p-6 rounded-xl ${className}`}>
      <CardContent className="p-0">
        <div className="flex items-start gap-2 w-full">
          <div className="flex items-start gap-6 flex-1">
            {/* Profile Image */}
            <div 
              className="relative w-[81px] h-[85px] rounded-xl bg-cover bg-[50%_50%]" 
              style={{ backgroundImage: `url(${profileImage})` }}
            />

            {/* Applicant Details */}
            <div className="flex flex-col items-start gap-2.5 flex-1">
              <div className="flex flex-col items-start justify-center gap-2 w-full">
                <div className="flex items-start gap-2">
                  <div className="font-text-label-large-medium text-[#484a54] text-[length:var(--text-label-large-medium-font-size)] tracking-[var(--text-label-large-medium-letter-spacing)] leading-[var(--text-label-large-medium-line-height)]">
                    {name}
                  </div>

                  <Badge className="px-2.5 py-1 bg-[#e9f7ee] text-[#1ca34e] border-[#1ca34e] font-medium rounded-full">
                    {status}
                  </Badge>
                </div>

                <div className="font-text-label-small-regular text-[#777b8b] text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)]">
                  {dates}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full">
                <MapPinIcon className="w-5 h-5 text-[#777b8b]" />
                <div className="flex-1 font-text-label-medium-regular text-[#777b8b] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)]">
                  {address}
                </div>
              </div>

              <div className="w-full font-text-label-medium-regular text-[#777b8b] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)]">
                {description}
              </div>

              <div className="flex items-center gap-6 w-full">
                {occupants.map((occupant, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center justify-center gap-1.5 py-1.5 rounded-full"
                  >
                    <img
                      className="w-5 h-5"
                      alt={occupant.type}
                      src={occupant.icon}
                    />
                    <div className="font-medium text-[#344054] text-sm leading-5 whitespace-nowrap">
                      {occupant.count} {occupant.type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Price and Actions */}
          <div className="flex flex-col items-end justify-center gap-2 self-stretch">
            <div className="flex flex-col items-start gap-2.5 flex-1">
              <Button
                variant="outline"
                size="icon"
                className="p-2.5 rounded-lg border-[#3c8787]"
              >
                <img className="w-5 h-5" alt="Frame" src="/frame.svg" />
              </Button>
            </div>

            <div className="flex flex-col items-end justify-center gap-3 w-full">
              <div className="w-full font-semibold text-[#484a54] text-xl text-right">
                {price}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="px-3.5 py-2.5 border-[#3c8787] text-[#3c8787] font-semibold text-sm"
                  onClick={onApplicationDetails}
                >
                  Application Details
                </Button>

                <Button 
                  className="bg-[#3c8787] text-white"
                  onClick={onMessageGuest}
                >
                  Message Guest
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};