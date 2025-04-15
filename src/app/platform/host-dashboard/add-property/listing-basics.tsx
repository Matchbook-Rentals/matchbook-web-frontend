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
    <section className="w-full max-w-[884px] space-y-8">
      <div className="w-full space-y-3">
        <h2 className="font-medium text-2xl text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
          Give your place a title
        </h2>

        <div className="space-y-3">
          <p className="text-xl text-[#3f3f3f] [font-family:'Poppins',Helvetica] font-normal">
            The best titles are short and descriptive; don&apos;t be afraid to
            have some fun.
          </p>

          <Card className="border-2 border-[#0000004c] rounded-[10px]">
            <CardContent className="p-0">
              <Textarea
                className="border-none min-h-[133px] focus-visible:ring-0 [font-family:'Poppins',Helvetica]"
                placeholder=""
                value={title}
                onChange={handleTitleChange}
                maxLength={35}
              />
            </CardContent>
          </Card>

          <p className="text-xl text-[#3f3f3f] [font-family:'Poppins',Helvetica] font-normal">
            {titleCount}/35 characters
          </p>
        </div>
      </div>

      <div className="w-full space-y-3">
        <h2 className="font-medium text-2xl text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
          Add a description
        </h2>

        <div className="space-y-3">
          <p className="text-xl text-[#3f3f3f] [font-family:'Poppins',Helvetica] font-normal">
          Share what makes your place stand out.
          </p>

          <Card className="border-2 border-[#0000004c] rounded-[10px]">
            <CardContent className="p-0">
              <Textarea
                className="border-none min-h-[200px] focus-visible:ring-0 [font-family:'Poppins',Helvetica]"
                placeholder=""
                value={description}
                onChange={handleDescriptionChange}
                maxLength={1000}
              />
            </CardContent>
          </Card>

          <p className="text-xl text-[#3f3f3f] [font-family:'Poppins',Helvetica] font-normal">
            {descriptionCount}/1,000 characters
          </p>
        </div>
      </div>
    </section>
  );
};
