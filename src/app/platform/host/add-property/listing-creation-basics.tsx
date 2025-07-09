import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface ListingBasicsProps {
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
}

export const ListingBasics = ({ title, setTitle, description, setDescription }: ListingBasicsProps): JSX.Element => {
  const [titleCount, setTitleCount] = useState(title.length);
  const [descriptionCount, setDescriptionCount] = useState(description.length);

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTitle(e.target.value);
    setTitleCount(e.target.value.length);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    setDescriptionCount(e.target.value.length);
  };

  return (
    <section className="w-full md:max-w-[884px] space-y-8">
      <div className="w-full space-y-1.5">
        <h2 className="text-[#484A54] [font-family:'Poppins',Helvetica] text-sm font-medium">
          Give your place a title
        </h2>

        <div className="space-y-3">
          <p className="text-[#838799] [font-family:'Poppins',Helvetica] text-xs font-normal">
            The best titles are short and descriptive; don&apos;t be afraid to
            have some fun.
          </p>

          <Card className="border-2 border-[#D0D5DD] rounded-[10px]">
            <CardContent className="p-0">
              <Textarea
                className="border-none min-h-[133px] focus-visible:ring-2 focus-visible:ring-gray-800 [font-family:'Poppins',Helvetica] text-base font-normal text-black placeholder:text-[#667085] placeholder:[font-family:'Poppins',Helvetica] bg-[#D0D5DD]/10"
                placeholder="Enter a title..."
                value={title}
                onChange={handleTitleChange}
                maxLength={35}
                minLength={6}
              />
            </CardContent>
          </Card>

          <p className="text-[#838799] [font-family:'Poppins',Helvetica] text-xs font-normal">
            {titleCount}/35 characters
          </p>
        </div>
      </div>

      <div className="w-full space-y-1.5">
        <h2 className="text-[#484A54] [font-family:'Poppins',Helvetica] text-sm font-medium">
          Add a description
        </h2>

        <div className="space-y-3">
          <p className="text-[#838799] [font-family:'Poppins',Helvetica] text-xs font-normal">
          Share what makes your place stand out.
          </p>

          <Card className="border-2 border-[#D0D5DD] rounded-[10px]">
            <CardContent className="p-0">
              <Textarea
                className="border-none min-h-[200px] focus-visible:ring-2 focus-visible:ring-gray-800 [font-family:'Poppins',Helvetica] text-base font-normal text-black placeholder:text-[#667085] placeholder:[font-family:'Poppins',Helvetica] bg-[#D0D5DD]/10"
                placeholder="Enter a description..."
                value={description}
                onChange={handleDescriptionChange}
                maxLength={1000}
                minLength={6}
              />
            </CardContent>
          </Card>

          <p className="text-[#838799] [font-family:'Poppins',Helvetica] text-xs font-normal">
            {descriptionCount}/1,000 characters
          </p>
        </div>
      </div>
    </section>
  );
};
