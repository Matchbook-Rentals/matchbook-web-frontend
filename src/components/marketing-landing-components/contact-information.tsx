import {
  HeadphonesIcon,
  MailIcon,
  MessageSquareIcon,
  UsersIcon,
} from "lucide-react";
import React from "react";
import { Card, CardContent } from "../ui/card";

export const ContactInformation = (): JSX.Element => {
  const contactItems = [
    {
      icon: <MailIcon className="h-6 w-6 text-white" />,
      title: "Media and Press",
      email: "press@matchbookrentals.com",
      href: "mailto:press@matchbookrentals.com",
    },
    {
      icon: <HeadphonesIcon className="h-6 w-6 text-white" />,
      title: "Support",
      email: "support@matchbookrentals.com",
      href: "mailto:support@matchbookrentals.com",
    },
    {
      icon: <MessageSquareIcon className="h-6 w-6 text-white" />,
      title: "General Inquiries",
      email: "info@matchbookrentals.com",
      href: "mailto:info@matchbookrentals.com",
    },
    {
      icon: <UsersIcon className="h-6 w-6 text-white" />,
      title: "Join our Team",
      email: "careers@matchbookrentals.com",
      href: "mailto:careers@matchbookrentals.com",
    },
  ];

  return (
    <Card className="flex flex-col px-12 lg:px-6 py-16 relative bg-[#3c8787] overflow-hidden border-none rounded-[12px_0px_0px_12px] lg:rounded-[12px_0px_0px_12px] rounded-[12px] w-full h-full">
      <h2 className="relative w-full font-['Poppins',Helvetica] font-medium text-white text-[min(3vh,36px)] leading-[100%] tracking-[-2px] text-left">
        Contact Information
      </h2>

      <CardContent className="flex flex-col w-full justify-between lg:justify-between flex-1 p-0 mt-12 lg:mt-16 space-y-6 lg:space-y-0">
        {contactItems.map((item, index) => (
          <div
            key={index}
            className="items-center gap-5 w-full flex relative"
          >
            {item.icon}

            <div className="flex-col flex-1 items-start flex relative gap-1">
              <h3 className="font-['Poppins',Helvetica] font-normal text-white text-[min(1.8vh,18px)] leading-[100%] tracking-[0px]">
                {item.title}
              </h3>

              <a
                className="font-['Poppins',Helvetica] font-normal text-[#f1f1f1] text-[min(1.5vh,14px)] leading-[100%] tracking-[0px] opacity-90"
                href={item.href}
                rel="noopener noreferrer"
                target="_blank"
              >
                {item.email}
              </a>
            </div>
          </div>
        ))}
      </CardContent>

      <div className="absolute w-[243px] h-[227px] top-[-175px] left-[-125px]">
        <svg
          width="243"
          height="227"
          viewBox="0 0 243 227"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M243 227C243 101.635 141.365 0 16 0H0V227H243Z"
            fill="white"
            fillOpacity="0.05"
          />
        </svg>
      </div>
      <div className="absolute w-[243px] h-[227px] bottom-[-175px] right-[-125px]">
        <svg
          width="243"
          height="227"
          viewBox="0 0 243 227"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M243 227C243 101.635 141.365 0 16 0H0V227H243Z"
            fill="white"
            fillOpacity="0.05"
          />
        </svg>
      </div>
    </Card>
  );
};
