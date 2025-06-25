import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ApplicantCardProps {
  imageUrl: string;
  name: string;
  isVerified: boolean;
  rating: number;
}

const ApplicantCard: React.FC<ApplicantCardProps> = ({ imageUrl, name, isVerified, rating }) => {
  return (
    <Card className={isVerified ? "bg-primaryBrand/80" : "bg-gray-100"}>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <img
            alt='user-image'
            src={imageUrl}
            className='rounded-full w-8 h-8 mr-3'
          />
          <div>
            <p className="font-semibold">{name}</p>
            <Badge variant={isVerified ? "secondary" : "outline"}>
              {isVerified ? "Verified" : "Unverified"} (mocked)
            </Badge>
          </div>
        </div>
        <span>⭐ {rating} (m)</span>
      </CardContent>
    </Card>
  );
};

export default ApplicantCard;