'use client';
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function WebLandlord() {
  // State to track selected options
  const [selectedType, setSelectedType] = useState<string>("Single Family");
  const [selectedFurnishing, setSelectedFurnishing] =
    useState<string>("Furnished");
  const [selectedUtilities, setSelectedUtilities] =
    useState<string>("Included in rent");
  const [selectedPets, setSelectedPets] = useState<string>("Pets welcome");

  // Property type options data
  const propertyTypes = [
    {
      id: "single-family",
      name: "Single Family",
      icon: "/group-6.png",
      additionalIcons: [
        {
          src: "/vector-29.svg",
          className: "absolute w-[7px] h-5 top-6 left-[89px]",
        },
        {
          src: "/vector-18.svg",
          className: "absolute w-2.5 h-14 top-[34px] left-[55px]",
        },
        {
          src: "/vector-18.svg",
          className: "absolute w-2 h-[47px] top-11 left-[86px]",
        },
        {
          src: "/vector-61.svg",
          className: "absolute w-[7px] h-[3px] top-[43px] left-[93px]",
        },
        {
          src: "/vector-11.svg",
          className: "absolute w-[103px] h-[3px] top-[90px] left-0",
        },
        {
          src: "/vector-9.svg",
          className: "absolute w-[3px] h-[57px] top-9 left-[52px]",
        },
        {
          src: "/vector-12.svg",
          className: "absolute w-[35px] h-[3px] top-[18px] left-[57px]",
        },
        {
          src: "/vector-10.svg",
          className: "absolute w-[29px] h-[42px] top-[50px] left-[18px]",
        },
        {
          src: "/vector-7.svg",
          className: "absolute w-5 h-5 top-[26px] left-[22px]",
        },
        {
          src: "/vector-19.svg",
          className: "absolute w-[27px] h-[37px] top-0 left-[33px]",
        },
        {
          src: "/vector-14.svg",
          className: "absolute w-4 h-5 top-px left-[61px]",
        },
        {
          src: "/vector-15.svg",
          className: "absolute w-[9px] h-7 top-[19px] left-[90px]",
        },
        {
          src: "/vector-25.svg",
          className: "absolute w-[5px] h-2.5 top-9 left-[90px]",
        },
        {
          src: "/vector-11.svg",
          className: "absolute w-[30px] h-[3px] top-0 left-[34px]",
        },
        {
          src: "/vector-31.svg",
          className: "absolute w-[13px] h-[3px] top-[34px] left-[57px]",
        },
        {
          src: "/vector-14.svg",
          className: "absolute w-[13px] h-5 top-[17px] left-[57px]",
        },
        {
          src: "/vector-45.svg",
          className: "absolute w-1.5 h-[29px] top-[18px] left-[86px]",
        },
        {
          src: "/vector-38.svg",
          className: "absolute w-1.5 h-[11px] top-[35px] left-[61px]",
        },
        {
          src: "/vector-12.svg",
          className: "absolute w-7 h-[3px] top-[43px] left-[61px]",
        },
        {
          src: "/vector-36.svg",
          className: "absolute w-[3px] h-11 top-11 left-[65px]",
        },
        {
          src: "/vector-36.svg",
          className: "absolute w-[3px] h-[49px] top-11 left-[83px]",
        },
        {
          src: "/vector-36.svg",
          className: "absolute w-[3px] h-[50px] top-11 left-[93px]",
        },
        {
          src: "/vector-11.svg",
          className: "absolute w-[27px] h-[3px] top-[68px] left-[18px]",
        },
        {
          src: "/vector-56.svg",
          className: "absolute w-3 h-3.5 top-[51px] left-[69px]",
        },
      ],
    },
    {
      id: "apartment",
      name: "Apartment",
      icon: "/group-7.png",
      additionalIcons: [
        {
          src: "/vector-43.svg",
          className: "absolute w-[124px] h-[3px] top-[121px] left-0",
        },
        {
          src: "/vector-33.svg",
          className: "absolute w-3.5 h-2.5 top-[73px] left-3.5",
        },
        {
          src: "/vector-27.svg",
          className: "absolute w-3.5 h-2.5 top-[73px] left-7",
        },
        {
          src: "/vector-27.svg",
          className: "absolute w-[15px] h-2.5 top-[73px] left-10",
        },
      ],
    },
    {
      id: "townhouse",
      name: "Townhouse",
      icon: "/group-8.png",
      additionalIcons: [
        {
          src: "/group-9.png",
          className: "absolute w-[91px] h-[93px] -top-0.5 -left-0.5",
        },
        {
          src: "/vector-47.svg",
          className: "absolute w-[90px] h-1 top-[88px] left-[7px]",
        },
      ],
    },
    {
      id: "private-room",
      name: "Private Room",
      icon: "/group-10.png",
      additionalIcons: [
        {
          src: "/group-11.png",
          className: "absolute w-[74px] h-[73px] top-0 left-0",
        },
        {
          src: "/vector-34.svg",
          className: "absolute w-[77px] h-[5px] top-[69px] left-px",
        },
      ],
    },
  ];

  // Furnishing options data
  const furnishingOptions = [
    {
      id: "furnished",
      name: "Furnished",
      icon: "/group.png",
      additionalIcons: [
        {
          src: "/vector-1.svg",
          className: "absolute w-36 h-[3px] top-[82px] left-3",
        },
        {
          src: "/vector.svg",
          className: "absolute w-[3px] h-[35px] top-[50px] left-[154px]",
        },
        {
          src: "/vector.svg",
          className: "absolute w-[3px] h-[31px] top-[33px] left-[139px]",
        },
        {
          src: "/vector-49.svg",
          className: "absolute w-[113px] h-[3px] top-[62px] left-[29px]",
        },
        {
          src: "/vector-1.svg",
          className: "absolute w-[114px] h-[3px] top-[45px] left-[27px]",
        },
        {
          src: "/vector-4.svg",
          className: "absolute w-[3px] h-2.5 top-3 left-[148px]",
        },
        {
          src: "/vector-4.svg",
          className: "absolute w-[3px] h-[11px] top-3 left-[19px]",
        },
        {
          src: "/group-1.png",
          className: "absolute w-[30px] h-[30px] top-5 left-[139px]",
        },
        {
          src: "/vector-52.svg",
          className: "absolute w-2.5 h-[17px] top-[82px] left-[133px]",
        },
        {
          src: "/vector-52.svg",
          className: "absolute w-2.5 h-[17px] top-[82px] left-[23px]",
        },
        {
          src: "/group-2.png",
          className: "absolute w-[93px] h-2 top-5 left-[38px]",
        },
        {
          src: "/vector.svg",
          className: "absolute w-[3px] h-[35px] top-[50px] left-3",
        },
        {
          src: "/vector.svg",
          className: "absolute w-[3px] h-[31px] top-[33px] left-[27px]",
        },
        {
          src: "/group-3.png",
          className: "absolute w-[30px] h-[30px] top-5 left-0",
        },
      ],
    },
    {
      id: "unfurnished",
      name: "Unfurnished",
      icon: "/vector-6.svg",
      additionalIcons: [
        {
          src: "/vector-5.svg",
          className: "absolute w-[3px] h-[72px] top-[11px] left-0",
        },
        {
          src: "/group-4.png",
          className: "absolute w-[106px] h-[15px] top-20 left-0",
        },
        {
          src: "/vector-2.svg",
          className: "absolute w-[49px] h-[15px] top-[3px] left-[23px]",
        },
        {
          src: "/vector-2.svg",
          className: "absolute w-[49px] h-[15px] top-[5px] left-8",
        },
        {
          src: "/group-5.png",
          className: "absolute w-[106px] h-[26px] top-0 left-0",
        },
        {
          src: "/vector-26.svg",
          className: "absolute w-1 h-[19px] top-4 left-[21px]",
        },
        {
          src: "/vector-26.svg",
          className: "absolute w-1 h-[18px] top-[21px] left-7",
        },
        {
          src: "/vector-24.svg",
          className: "absolute w-2.5 h-1.5 top-[34px] left-[21px]",
        },
        {
          src: "/vector-21.svg",
          className: "absolute w-3.5 h-[5px] top-[76px] left-[61px]",
        },
        {
          src: "/vector-5.svg",
          className: "absolute w-[3px] h-[73px] top-[22px] left-[51px]",
        },
        {
          src: "/vector-5.svg",
          className: "absolute w-[3px] h-[73px] top-3 left-[103px]",
        },
        {
          src: "/vector-21.svg",
          className: "absolute w-3.5 h-[5px] top-[70px] left-[59px]",
        },
      ],
    },
  ];

  // Utilities options data
  const utilitiesOptions = [
    {
      id: "included",
      name: "Included in rent",
      icon: "/vector-42.svg",
      additionalIcons: [
        {
          src: "/vector-41.svg",
          className: "absolute w-[30px] h-[30px] top-[19px] left-[17px]",
        },
        {
          src: "/group-17.png",
          className: "absolute w-[21px] h-[45px] top-12 left-[17px]",
        },
        {
          src: "/group-18.png",
          className: "absolute w-[21px] h-[45px] top-12 left-[57px]",
        },
        {
          src: "/vector-51.svg",
          className: "absolute w-[25px] h-[9px] top-[91px] left-[35px]",
        },
        {
          src: "/vector-51.svg",
          className: "absolute w-[25px] h-[9px] top-[97px] left-[35px]",
        },
        {
          src: "/vector-16.svg",
          className: "absolute w-[13px] h-2.5 top-[103px] left-[41px]",
        },
        {
          src: "/group-19.png",
          className: "absolute w-2 h-[23px] top-[70px] left-[50px]",
        },
        {
          src: "/group-20.png",
          className: "absolute w-2 h-[23px] top-[70px] left-[38px]",
        },
        {
          src: "/group-21.png",
          className: "absolute w-[95px] h-[65px] top-0 left-0",
        },
        {
          src: "/group-16.png",
          className: "absolute w-[17px] h-[39px] top-[27px] left-[38px]",
        },
      ],
    },
    {
      id: "separate",
      name: "Paid separately",
      icon: "/vector-42.svg",
      additionalIcons: [
        {
          src: "/line-69.svg",
          className: "absolute w-[92px] h-[87px] top-4 left-[13px]",
        },
        {
          src: "/vector-41.svg",
          className: "absolute w-[29px] h-[29px] top-[18px] left-4",
        },
        {
          src: "/group-23.png",
          className: "absolute w-5 h-[42px] top-[45px] left-4",
        },
        {
          src: "/group-24.png",
          className: "absolute w-5 h-[42px] top-[45px] left-[53px]",
        },
        {
          src: "/vector-16.svg",
          className: "absolute w-6 h-[9px] top-[85px] left-[33px]",
        },
        {
          src: "/vector-16.svg",
          className: "absolute w-6 h-[9px] top-[91px] left-[33px]",
        },
        {
          src: "/vector-16.svg",
          className: "absolute w-3 h-2.5 top-[97px] left-[39px]",
        },
        {
          src: "/group-25.png",
          className: "absolute w-2 h-[22px] top-[66px] left-[47px]",
        },
        {
          src: "/group-26.png",
          className: "absolute w-2 h-[22px] top-[66px] left-9",
        },
        {
          src: "/group-27.png",
          className: "absolute w-[90px] h-[61px] top-0 left-0",
        },
        {
          src: "/group-22.png",
          className: "absolute w-[17px] h-[37px] top-9 left-[54px]",
        },
      ],
    },
  ];

  // Pets options data
  const petsOptions = [
    {
      id: "pets-welcome",
      name: "Pets welcome",
      icon: "/group-12.png",
      additionalIcons: [
        {
          src: "/group-13.png",
          className: "absolute w-[72px] h-[73px] top-6 left-[57px]",
        },
      ],
    },
    {
      id: "no-pets",
      name: "No pets",
      icon: "/group-14.png",
      additionalIcons: [
        {
          src: "/group-15.png",
          className: "absolute w-[61px] h-16 top-7 left-[43px]",
        },
        {
          src: "/line-68.svg",
          className: "absolute w-[97px] h-[93px] top-[22px] left-[19px]",
        },
      ],
    },
  ];

  // Helper function to determine if an option is selected
  const isSelected = (category: string, optionName: string) => {
    switch (category) {
      case "type":
        return selectedType === optionName;
      case "furnishing":
        return selectedFurnishing === optionName;
      case "utilities":
        return selectedUtilities === optionName;
      case "pets":
        return selectedPets === optionName;
      default:
        return false;
    }
  };

  return (
    <main className="bg-white flex flex-row justify-center w-full">
      <div className="bg-white overflow-hidden w-full max-w-[1920px] relative py-12">
        {/* Progress bar and navigation */}
        <div className="mx-auto w-full max-w-[885px] mb-12">
          <div className="relative w-full h-[95px]">
            <div className="absolute w-[883px] h-5 top-[46px] left-0">
              <div className="w-full h-[9px] top-1.5 rounded-[10px] absolute left-0 border border-solid border-[#0000004c]" />
              <div className="w-[21px] h-5 left-[115px] bg-[#5c9ac5] rounded-[10.5px/10px] shadow-[0px_4px_4px_#00000040] absolute top-0" />
            </div>

            <div className="absolute w-[120px] h-[7px] top-[53px] left-px bg-[#5c9ac5]" />

            <div className="w-[102px] h-[18px] top-[77px] left-[75px] font-['Poppins',Helvetica] font-normal text-[#3f3f3f] text-sm text-center absolute tracking-[0] leading-[normal]">
              Highlights
            </div>

            <div className="absolute w-[106px] h-[29px] top-0 left-[777px]">
              <div className="h-[29px] bg-white rounded-[15px] border-[0.5px] border-solid border-[#0000004c]">
                <div className="relative w-[89px] h-5 top-1 left-2">
                  <div className="w-[89px] h-5 top-0 left-0 font-['Montserrat',Helvetica] font-medium text-[#3f3f3f] text-xs text-center absolute tracking-[0] leading-[normal]">
                    Save &amp; Exit
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="mx-auto w-full max-w-[891px]">
          <h2 className="font-['Poppins',Helvetica] font-medium text-[#3f3f3f] text-2xl mb-6">
            Listing Highlights
          </h2>

          {/* Property Type Section */}
          <section className="mb-12">
            <h3 className="font-['Poppins',Helvetica] font-normal text-[#3f3f3f] text-2xl mb-6">
              Type
            </h3>
            <div className="flex flex-wrap gap-8">
              {propertyTypes.map((type) => (
                <Card
                  key={type.id}
                  className={`w-[196px] h-[295px] rounded-[30px] relative cursor-pointer transition-all ${
                    isSelected("type", type.name)
                      ? "border-[3px] border-solid border-black shadow-[0px_4px_4px_#00000040]"
                      : "border border-solid border-[#0000004c]"
                  }`}
                  onClick={() => setSelectedType(type.name)}
                >
                  <CardContent className="p-0 h-full flex flex-col items-center justify-center">
                    <div className="relative w-[100px] h-[90px] mb-16">
                      <img
                        src={type.icon}
                        alt={type.name}
                        className="relative"
                      />
                      {type.additionalIcons.map((icon, index) => (
                        <img
                          key={index}
                          src={icon.src}
                          alt=""
                          className={icon.className}
                        />
                      ))}
                    </div>
                    <div className="font-['Poppins',Helvetica] font-medium text-[#2d2f2e99] text-2xl text-center absolute bottom-12">
                      {type.name}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Furnishings Section */}
          <section className="mb-12">
            <h3 className="font-['Poppins',Helvetica] font-normal text-[#3f3f3f] text-2xl mb-6">
              Furnishings
            </h3>
            <div className="flex gap-8">
              {furnishingOptions.map((option) => (
                <Card
                  key={option.id}
                  className={`w-[197px] h-[297px] rounded-[30px] relative cursor-pointer transition-all ${
                    isSelected("furnishing", option.name)
                      ? "border-[3px] border-solid border-black shadow-[0px_4px_4px_#00000040]"
                      : "border border-solid border-[#0000004c]"
                  }`}
                  onClick={() => setSelectedFurnishing(option.name)}
                >
                  <CardContent className="p-0 h-full flex flex-col items-center justify-center">
                    <div className="relative w-[166px] h-24 mb-16">
                      <img
                        src={option.icon}
                        alt={option.name}
                        className="relative"
                      />
                      {option.additionalIcons.map((icon, index) => (
                        <img
                          key={index}
                          src={icon.src}
                          alt=""
                          className={icon.className}
                        />
                      ))}
                    </div>
                    <div className="font-['Poppins',Helvetica] font-medium text-[#2d2f2e99] text-2xl text-center absolute bottom-12">
                      {option.name}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Utilities Section */}
          <section className="mb-12">
            <h3 className="font-['Poppins',Helvetica] font-normal text-[#3f3f3f] text-2xl mb-6">
              Utilities
            </h3>
            <div className="flex gap-8">
              {utilitiesOptions.map((option) => (
                <Card
                  key={option.id}
                  className={`w-[197px] h-[296px] rounded-[30px] relative cursor-pointer transition-all ${
                    isSelected("utilities", option.name)
                      ? "border-[3px] border-solid border-black shadow-[0px_4px_4px_#00000040]"
                      : "border border-solid border-[#0000004c]"
                  }`}
                  onClick={() => setSelectedUtilities(option.name)}
                >
                  <CardContent className="p-0 h-full flex flex-col items-center justify-center">
                    <div className="relative w-[92px] h-[110px] mb-8">
                      <img
                        src={option.icon}
                        alt={option.name}
                        className="relative"
                      />
                      {option.additionalIcons.map((icon, index) => (
                        <img
                          key={index}
                          src={icon.src}
                          alt=""
                          className={icon.className}
                        />
                      ))}
                    </div>
                    <div className="font-['Poppins',Helvetica] font-medium text-[#2d2f2e99] text-2xl text-center absolute bottom-12 px-4">
                      {option.name}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Pets Section */}
          <section className="mb-12">
            <h3 className="font-['Poppins',Helvetica] font-normal text-[#3f3f3f] text-2xl mb-6">
              Pets
            </h3>
            <div className="flex gap-8">
              {petsOptions.map((option) => (
                <Card
                  key={option.id}
                  className={`w-[197px] h-[296px] rounded-[30px] relative cursor-pointer transition-all ${
                    isSelected("pets", option.name)
                      ? "border-[3px] border-solid border-black shadow-[0px_4px_4px_#00000040]"
                      : "border border-solid border-[#0000004c]"
                  }`}
                  onClick={() => setSelectedPets(option.name)}
                >
                  <CardContent className="p-0 h-full flex flex-col items-center justify-center">
                    <div className="relative w-32 h-[97px] mb-16">
                      <img
                        src={option.icon}
                        alt={option.name}
                        className="relative"
                      />
                      {option.additionalIcons.map((icon, index) => (
                        <img
                          key={index}
                          src={icon.src}
                          alt=""
                          className={icon.className}
                        />
                      ))}
                    </div>
                    <div className="font-['Poppins',Helvetica] font-medium text-[#2d2f2e99] text-2xl text-center absolute bottom-12 px-4">
                      {option.name}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>

        {/* Footer with navigation buttons */}
        <Separator className="w-full my-8" />
        <div className="flex justify-between mx-auto w-full max-w-[891px] mt-8">
          <Button className="w-[119px] h-[42px] bg-[#4f4f4f] rounded-[5px] shadow-[0px_4px_4px_#00000040] font-['Montserrat',Helvetica] font-semibold text-white text-base">
            Back
          </Button>
          <Button className="w-[119px] h-[42px] bg-[#4f4f4f] rounded-[5px] shadow-[0px_4px_4px_#00000040] font-['Montserrat',Helvetica] font-semibold text-white text-base">
            Next
          </Button>
        </div>
      </div>
    </main>
  );
};
