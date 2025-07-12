import React from "react";
import { HOST_PAGE_STYLE } from "@/constants/styles";
import { HostPageTitle } from "../../[listingId]/(components)/host-page-title";
import TabLayout from "../../components/cards-with-filter-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { LightbulbIcon, MapPinIcon } from "lucide-react";

async function fetchReviews() {
  // Simulate data fetching delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  return [];
}

const UserReviewsSection = (): JSX.Element => {
  const ratingData = [
    { stars: 5, percentage: 40, filled: [true, true, true, true, true] },
    { stars: 4, percentage: 50, filled: [true, true, true, true, false] },
    { stars: 3, percentage: 70, filled: [true, true, true, false, false] },
    { stars: 2, percentage: 30, filled: [true, true, false, false, false] },
    { stars: 1, percentage: 30, filled: [true, false, false, false, false] },
  ];

  return (
    <Card className="flex flex-col w-full items-end gap-8 p-6 relative bg-white rounded-xl shadow-[0px_0px_5px_#00000029]">
      <h2 className="relative self-stretch mt-[-1.00px] font-medium text-gray-900 text-xl tracking-[0] leading-[30px]">
        Overall Reviews Breakdown
      </h2>

      <div className="flex items-start justify-end gap-8 relative self-stretch w-full">
        <Card className="flex flex-col w-[223px] h-[161px] items-center justify-center gap-5 px-0 py-[31px] relative bg-[#faffff] rounded-xl border border-solid border-[#e8eaef]">
          <CardContent className="p-0 flex flex-col items-center">
            <span className="relative w-fit mt-[-12.50px] font-bold text-gray-900 text-5xl text-center whitespace-nowrap">
              4.8
            </span>

            <div className="inline-flex flex-col items-center justify-center gap-2 relative flex-[0_0_auto] mb-[-11.50px]">
              <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
                <span className="relative w-fit mt-[-1.00px] font-medium text-[#020202] text-sm">
                  4.5
                </span>

                <div className="items-center justify-center gap-[3.52px] inline-flex relative flex-[0_0_auto]">
                  {[1, 2, 3, 4, 5].map((_, index) => (
                    <div
                      key={`overall-star-${index}`}
                      className="inline-flex items-center gap-[6.1px] relative flex-[0_0_auto]"
                    >
                      <span className="text-yellow-400 text-lg">★</span>
                    </div>
                  ))}
                </div>
              </div>

              <span className="relative w-fit font-medium text-[#020202] text-sm">
                (2,243 reviews)
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col items-end justify-center gap-2.5 relative flex-1 grow">
          <div className="flex flex-col w-full items-start justify-center gap-2 relative">
            {ratingData.map((rating, index) => (
              <div
                key={`rating-${rating.stars}`}
                className="flex items-center gap-1 relative self-stretch w-full"
              >
                <div className="flex items-center gap-3 relative flex-1 grow">
                  <div className="inline-flex items-center gap-3 relative flex-[0_0_auto]">
                    <div className="inline-flex items-center justify-center gap-[3px] relative flex-[0_0_auto]">
                      {rating.filled.map((isFilled, starIndex) => (
                        <div
                          key={`star-${rating.stars}-${starIndex}`}
                          className="gap-[5.2px] inline-flex items-center relative flex-[0_0_auto]"
                        >
                          <span className={`text-lg ${isFilled ? 'text-yellow-400' : 'text-gray-300'}`}>
                            ★
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="relative w-[122px] mt-[-1.00px] font-medium text-gray-600 text-sm">
                      {rating.stars} Star Rating
                    </div>
                  </div>

                  <div className="relative flex-1 self-stretch grow rounded-lg">
                    <div className="relative w-full h-2.5 top-1.5 bg-[#e9e9eb] rounded-full">
                      <Progress
                        value={rating.percentage}
                        className="h-2.5 bg-[#0b6969] rounded-full"
                      />
                    </div>
                  </div>

                  <div className="relative w-fit mt-[-1.00px] font-medium text-gray-700 text-sm">
                    {rating.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

const OverallReviewsSection = (): JSX.Element => {
  const reviews = [
    {
      id: 1,
      name: "Guy Hawkins",
      time: "1 week ago",
      rating: 4.0,
      location: "2270 CheminBicolas-Austin Austin, TX",
      review:
        "I appreciate the precise short videos (10 mins or less each) because overly long videos tend to make me lose focus. The instructor is very knowledgeable in Web Design and it shows as he shares his knowledge. These were my best 6 months of training. Thanks, Vako.",
      avatar: "/image-2.png",
    },
    {
      id: 2,
      name: "Arlene McCoy",
      time: "1 week ago",
      rating: 4.0,
      location: "2270 CheminBicolas-Austin Austin, TX",
      review:
        "I appreciate the precise short videos (10 mins or less each) because overly long videos tend to make me lose focus. The instructor is very knowledgeable in Web Design and it shows as he shares his knowledge. These were my best 6 months of training. Thanks, Vako.",
      avatar: "/image-1.png",
    },
    {
      id: 3,
      name: "Guy Hawkins",
      time: "1 week ago",
      rating: 4.0,
      location: "2270 CheminBicolas-Austin Austin, TX",
      review:
        "I appreciate the precise short videos (10 mins or less each) because overly long videos tend to make me lose focus. The instructor is very knowledgeable in Web Design and it shows as he shares his knowledge. These were my best 6 months of training. Thanks, Vako.",
      avatar: "/image-2.png",
    },
  ];

  return (
    <section className="flex flex-col items-start gap-[18px] w-full">
      <div className="flex items-start gap-3 w-full">
        <div className="flex flex-col w-full items-start gap-1.5 bg-white rounded-lg">
          <Input
            className="h-12"
            placeholder="Search review by guest name"
            type="search"
          />
        </div>
      </div>

      <Card className="w-full shadow-[0px_0px_5px_#00000029]">
        <CardContent className="p-6 flex flex-col gap-8">
          <div className="flex items-center justify-between w-full">
            <h2 className="font-medium text-gray-900 text-xl leading-8">
              Reviews
            </h2>

            <Select defaultValue="most-recent">
              <SelectTrigger className="w-[157px] h-12 bg-white border-[#e8eaef] font-medium text-gray-700">
                <SelectValue placeholder="Most Recent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="most-recent">Most Recent</SelectItem>
                <SelectItem value="highest-rated">Highest Rated</SelectItem>
                <SelectItem value="lowest-rated">Lowest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col items-start w-full">
            <div className="flex flex-col items-start gap-5 w-full">
              {reviews.map((review, index) => (
                <React.Fragment key={review.id}>
                  <div className="flex flex-col items-end justify-center gap-[22px] w-full">
                    <div className="flex items-start justify-center gap-4 w-full">
                      <Avatar className="w-10 h-10">
                        <AvatarImage
                          src={review.avatar}
                          alt={`${review.name}'s avatar`}
                          className="w-full h-full object-cover"
                        />
                        <AvatarFallback>{review.name.charAt(0)}</AvatarFallback>
                      </Avatar>

                      <div className="flex flex-col items-start gap-3 flex-1">
                        <div className="flex-col items-start gap-2 inline-flex">
                          <div className="inline-flex items-center gap-2">
                            <div className="font-medium text-gray-900">
                              {review.name}
                            </div>
                            <div className="font-medium text-gray-600">
                              •
                            </div>
                            <div className="font-medium text-gray-600 whitespace-nowrap">
                              {review.time}
                            </div>
                          </div>

                          <div className="inline-flex items-start gap-2">
                            <div className="inline-flex items-center gap-[2.68px]">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`text-lg ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <div className="font-medium text-[#696969] text-center whitespace-nowrap">
                              ({review.rating})
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full">
                          <MapPinIcon className="w-5 h-5 text-[#777b8b]" />
                          <div className="flex-1 font-medium text-[#777b8b]">
                            {review.location}
                          </div>
                        </div>

                        <p className="w-full font-medium text-gray-700">
                          {review.review}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        className="flex items-center gap-2 px-4 py-2.5 border-[#bae7cb] shadow-sm"
                      >
                        <LightbulbIcon className="w-6 h-6" />
                        <span className="font-medium text-[#696969] whitespace-nowrap">
                          Helpful
                        </span>
                      </Button>

                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          className="p-2.5 border-[#daf6ff] shadow-sm"
                        >
                          <span className="text-blue-500">👍</span>
                        </Button>

                        <Button
                          variant="outline"
                          className="p-2.5 border-[#ffe4e4] shadow-sm"
                        >
                          <span className="text-red-500">👎</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {index < reviews.length - 1 && (
                    <Separator className="w-full h-px" />
                  )}
                </React.Fragment>
              ))}
            </div>

            <Button className="mt-5 bg-blue-100 text-blue-500 hover:bg-blue-100 hover:text-blue-500">
              <span className="font-medium whitespace-nowrap">Load More</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default async function ReviewsPage() {
  const reviews = await fetchReviews();

  return (
    <div className={`${HOST_PAGE_STYLE} w-[100%] overflow-hidden`}>
      <HostPageTitle title="All Reviews" subtitle="View and manage reviews from your tenants" />
      <div className="flex flex-col w-full max-w-[1192px] mx-auto gap-6">
        <UserReviewsSection />
        <OverallReviewsSection />
      </div>
    </div>
  );
}
