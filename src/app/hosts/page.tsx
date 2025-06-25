import { HomeIcon, Star } from "lucide-react";
import React from "react";
import MatchbookHeader from "../../components/marketing-landing-components/matchbook-header";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

export const HeroFrame = (): JSX.Element => {
  return (
    <Card className="w-[1143px] px-[100px] py-10 flex flex-col items-center justify-center gap-3 rounded-xl border border-[#d1d5da]">
      <CardContent className="p-0 flex flex-col items-center w-full">
        <div className="flex flex-col items-center">
          <p className="w-fit [font-family:'Lora',Helvetica] font-semibold text-[#0b6969] text-base text-center">
            Earn More, Keep More
          </p>
          <h1 className="w-fit [font-family:'Lora',Helvetica] font-medium text-gray-neutral900 text-[56px] text-center tracking-[-2.00px]">
            Become a Host
          </h1>
        </div>

        <Breadcrumb className="mt-3">
          <BreadcrumbList className="flex items-center gap-[15px]">
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <HomeIcon className="w-6 h-6" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="font-text-md-regular text-gray-3500">
              /
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink className="[font-family:'Poppins',Helvetica] font-normal text-gray-3900 text-base leading-6">
                Become a host
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </CardContent>
    </Card>
  );
};

export const HostsLoveMatchbook = (): JSX.Element => {
  // Feature data for mapping
  const features = [
    {
      id: 1,
      title: "We Don't Charge You a Dime",
      description: "MatchBook is completely free for Host.",
      imageUrl: "/marketing-images/hosts-love-us/1.png",
    },
    {
      id: 2,
      title: "Application Management Simplified",
      description:
        "Receive, review, and approve applications effortlessly on our platform.",
      imageUrl: "/marketing-images/hosts-love-us/2.png",
    },
    {
      id: 3,
      title: "Collect Rent Automatically",
      description:
        "Rent is automatically collected and securely transferred to you every month.",
      imageUrl: "/marketing-images/hosts-love-us/3.png",
      overlay: true,
    },
    {
      id: 4,
      title: "Connect with MatchBook Verified Renters",
      description:
        "Choose to accept only MatchBook Verified Renters for a worry-free experience.",
      imageUrl: "/marketing-images/hosts-love-us/4.png",
    },
  ];

  return (
    <section className="flex flex-col items-center gap-14 px-[150px] py-16">
      <header className="inline-flex flex-col items-center gap-1">
        <h1 className="w-fit mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-gray-neutral900 text-[40px] text-center tracking-[-2.00px] leading-[normal]">
          Why Hosts Love MatchBook
        </h1>
      </header>

      <div className="flex flex-col items-start gap-6 w-full">
        {/* First row of cards */}
        <div className="flex items-center gap-6 w-full">
          {features.slice(0, 2).map((feature) => (
            <Card
              key={feature.id}
              className="flex flex-col min-w-80 items-start gap-5 flex-1 self-stretch border-none"
            >
              <div
                className={`w-full h-60 rounded-xl bg-cover bg-center`}
                style={{ backgroundImage: `url(${feature.imageUrl})` }}
              />
              <CardContent className="flex flex-col items-start gap-6 p-0 w-full">
                <div className="flex-col gap-4 flex items-start w-full">
                  <div className="flex-col gap-2 flex items-start w-full">
                    <div className="gap-4 flex items-start w-full">
                      <h2 className="flex-1 mt-[-1.00px] font-['Poppins',Helvetica] text-2xl tracking-[0] leading-8">
                        <span className="font-semibold text-[#101828]">
                          {feature.id}.{" "}
                        </span>
                        <span className="text-[#101828]">{feature.title}</span>
                      </h2>
                    </div>
                    <p className="font-['Poppins',Helvetica] font-normal text-[#484a54] text-base tracking-[0] leading-6">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Second row of cards */}
        <div className="flex items-center gap-6 w-full">
          {features.slice(2, 4).map((feature) => (
            <Card
              key={feature.id}
              className="flex flex-col min-w-80 items-start gap-5 flex-1 self-stretch border-none"
            >
              <div
                className={`w-full h-60 rounded-xl bg-cover bg-center ${feature.overlay ? "bg-[linear-gradient(0deg,rgba(0,0,0,0.03)_0%,rgba(0,0,0,0.03)_100%)]" : ""}`}
                style={{ backgroundImage: `url(${feature.imageUrl})` }}
              />
              <CardContent className="flex flex-col items-start gap-6 p-0 w-full">
                <div className="flex-col gap-4 flex items-start w-full">
                  <div className="flex-col gap-2 flex items-start w-full">
                    <div className="gap-4 flex items-start w-full">
                      <h2 className="flex-1 mt-[-1.00px] font-['Poppins',Helvetica] font-normal text-[#101828] text-2xl tracking-[0] leading-8">
                        <span className="font-semibold">{feature.id}. </span>
                        <span>{feature.title}</span>
                      </h2>
                    </div>
                    <p className="font-['Poppins',Helvetica] font-normal text-[#484a54] text-base tracking-[0] leading-6">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Button
        className="w-[221px] bg-teal-600 hover:bg-teal-700 text-white"
        asChild
      >
        <a href="#">List Your Property</a>
      </Button>
    </section>
  );
};

export const ReviewsSection = (): JSX.Element => {
  // Review data for mapping
  const reviews = [
    {
      name: "Alina",
      avatar: "/image-2.png",
      rating: 5,
      position: "top-[234px] left-[11px] w-[324px]",
      vectorSrc: "/vector.svg",
      vectorPosition: "w-[229px] h-[220px] top-[-163px] left-[244px]",
    },
    {
      name: "Aliyana",
      avatar: "/avatar-3.png",
      rating: 5,
      position: "top-[228px] left-[632px] w-[482px]",
      vectorSrc: "/vector-3.svg",
      vectorPosition: "w-[198px] h-[183px] top-[-134px] left-[351px]",
    },
    {
      name: "Ahmed",
      avatar: "/image.png",
      rating: 4,
      position: "top-[626px] left-[632px] w-[482px]",
      vectorSrc: "/vector-1.svg",
      vectorPosition: "w-[177px] h-[194px] top-[-158px] left-[346px]",
    },
    {
      name: "John Wick",
      avatar: "/image-1.png",
      rating: 4,
      position: "top-[644px] left-0 w-[482px]",
      vectorSrc: "/vector-2.svg",
      vectorPosition: "w-56 h-[232px] top-[-171px] left-[362px]",
    },
  ];

  // Generate stars based on rating
  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, index) => (
        <Star
          key={`star-${index}`}
          className={`w-3.5 h-3.5 ${
            index < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          }`}
        />
      ));
  };

  return (
    <section className="relative w-full max-w-[1440px] h-[853px] bg-[#0b6969] mx-auto">
      <div className="relative w-[1114px] h-[679px] top-[87px] left-[226px] overflow-visible">
        <div className="relative h-[955px] top-[-104px]">
          <img
            className="absolute h-[80%] top-10 left-[37px] scale-[]"
            alt="Background shape"
            src="/marketing-images/reviews-section/Vector.png"
          />


          {/* Main content */}
          <div className="flex flex-col w-[565px] items-center gap-4 absolute top-[370px] left-[189px]">
            <h1 className="relative self-stretch mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-gray-neutral900 text-[40px] text-center tracking-[-2.00px] leading-[normal]">
              Real Reviews, Reliable Renters, Worry-Free Renting
            </h1>

            <p className="relative self-stretch font-text-heading-xsmall-regular font-[number:var(--text-heading-xsmall-regular-font-weight)] text-gray-neutral600 text-[length:var(--text-heading-xsmall-regular-font-size)] text-center tracking-[var(--text-heading-xsmall-regular-letter-spacing)] leading-[var(--text-heading-xsmall-regular-line-height)] [font-style:var(--text-heading-xsmall-regular-font-style)]">
              Choose renters you can trust. Our review system gives you insight
              into their past rentals, making worry-free renting a reality.
            </p>
          </div>

          {/* Review cards */}
          {reviews.map((review, index) => (
            <Card
              key={`review-${index}`}
              className={`flex items-center gap-3 p-3 absolute ${review.position} bg-white rounded-lg overflow-hidden shadow-[0px_4px_12px_#00000026]`}
            >
              <CardContent className="flex items-center gap-3 p-0">
                <Avatar className="relative w-12 h-12 rounded-full overflow-hidden">
                  <AvatarImage
                    src={review.avatar}
                    alt={`${review.name}'s avatar`}
                    className="relative h-12 -top-px -left-px rounded-full border-[0.75px] border-solid border-[#00000014] bg-cover bg-[50%_50%]"
                  />
                  <AvatarFallback>{review.name.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex flex-col items-start">
                  <div className="inline-flex items-center gap-3">
                    <div className="relative w-fit mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-gray-neutral900 text-base tracking-[0] leading-[normal]">
                      {review.name}
                    </div>

                    <div className="inline-flex items-center gap-1">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                </div>

                <img
                  className={`absolute ${review.vectorPosition}`}
                  alt="Vector"
                  src={review.vectorSrc}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default function HostsPage(): React.ReactNode {
  return (
    <div className="bg-background">
      <MatchbookHeader />
      <div className="flex justify-center p-8">
        <HeroFrame />
      </div>
      <HostsLoveMatchbook />
      <ReviewsSection />
    </div>
  );
}
