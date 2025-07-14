import React from "react";
import { HOST_PAGE_STYLE } from "@/constants/styles";
import { HostPageTitle } from "../../[listingId]/(components)/host-page-title";
import { HostReviewClient } from "./host-review-client";
import { auth } from "@clerk/nextjs/server";

// Utility function to calculate relative time
function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  
  if (diffInDays === 0) {
    return "Today";
  } else if (diffInDays === 1) {
    return "1 day ago";
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else if (diffInWeeks === 1) {
    return "1 week ago";
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks} weeks ago`;
  } else if (diffInMonths === 1) {
    return "1 month ago";
  } else if (diffInMonths < 12) {
    return `${diffInMonths} months ago`;
  } else {
    const diffInYears = Math.floor(diffInMonths / 12);
    return diffInYears === 1 ? "1 year ago" : `${diffInYears} years ago`;
  }
}

// Sample data with dynamic time calculation
const baseSampleReviewsData = {
  overallRating: 4.5,
  totalReviews: 2243,
  averageRating: 4.5,
  ratingBreakdown: [
    { stars: 5, percentage: 40, count: 897 },
    { stars: 4, percentage: 50, count: 1122 },
    { stars: 3, percentage: 70, count: 157 },
    { stars: 2, percentage: 30, count: 67 },
    { stars: 1, percentage: 30, count: 0 },
  ],
  reviews: [
    {
      id: 1,
      name: "Alex Johnson",
      rating: 5.0,
      location: "Downtown Austin, TX",
      review: "Absolutely amazing stay! The property was spotless, perfectly located, and the host was incredibly responsive. Would definitely book again.",
      avatar: "/avatar-1.png",
      createdAt: "2025-07-12T10:30:00Z",
    },
    {
      id: 2,
      name: "Sarah Williams",
      rating: 4.0,
      location: "South Beach, Miami, FL",
      review: "Great location and beautiful apartment. The view was stunning and everything was as described. Minor issue with wifi but quickly resolved.",
      avatar: "/avatar-2.png",
      createdAt: "2025-07-07T14:15:00Z",
    },
    {
      id: 3,
      name: "Michael Chen",
      rating: 5.0,
      location: "Mission District, San Francisco, CA",
      review: "Perfect for our business trip. Clean, modern, and well-equipped kitchen. Host provided excellent local recommendations.",
      avatar: "/avatar-3.png",
      createdAt: "2025-06-30T09:45:00Z",
    },
    {
      id: 4,
      name: "Emily Davis",
      rating: 4.0,
      location: "Capitol Hill, Seattle, WA",
      review: "Loved the cozy atmosphere and the neighborhood was fantastic. Easy access to public transport and great restaurants nearby.",
      avatar: "/avatar-4.png",
      createdAt: "2025-06-23T16:20:00Z",
    },
    {
      id: 5,
      name: "David Rodriguez",
      rating: 5.0,
      location: "Brooklyn Heights, NY",
      review: "Outstanding hospitality! The space was immaculate and the host went above and beyond to ensure our comfort. Highly recommended!",
      avatar: "/avatar-5.png",
      createdAt: "2025-06-14T11:00:00Z",
    },
    {
      id: 6,
      name: "Jessica Thompson",
      rating: 4.0,
      location: "River North, Chicago, IL",
      review: "Stylish apartment with all the amenities we needed. The location was perfect for exploring the city. Would stay here again.",
      avatar: "/avatar-6.png",
      createdAt: "2025-06-10T13:30:00Z",
    },
    {
      id: 7,
      name: "Ryan Martinez",
      rating: 3.0,
      location: "Gaslamp Quarter, San Diego, CA",
      review: "Good value for money. The space was adequate for our needs, though it could use some updates. Host was helpful with check-in.",
      avatar: "/avatar-7.png",
      createdAt: "2025-06-09T08:15:00Z",
    },
    {
      id: 8,
      name: "Amanda Wilson",
      rating: 5.0,
      location: "Pearl District, Portland, OR",
      review: "Exceptional experience from start to finish. The property exceeded our expectations and the host was incredibly welcoming.",
      avatar: "/avatar-8.png",
      createdAt: "2025-06-02T15:45:00Z",
    },
    {
      id: 9,
      name: "James Brown",
      rating: 4.0,
      location: "French Quarter, New Orleans, LA",
      review: "Great location in the heart of the action. The property was clean and comfortable. Parking was a bit challenging but manageable.",
      avatar: "/avatar-9.png",
      createdAt: "2025-05-14T12:20:00Z",
    },
    {
      id: 10,
      name: "Lisa Anderson",
      rating: 5.0,
      location: "Back Bay, Boston, MA",
      review: "Perfect for our family vacation. Spacious, clean, and well-located. Kids loved the nearby park and we enjoyed the local cafes.",
      avatar: "/avatar-10.png",
      createdAt: "2025-05-10T17:30:00Z",
    },
    {
      id: 11,
      name: "Kevin Taylor",
      rating: 4.0,
      location: "Midtown, Atlanta, GA",
      review: "Solid choice for business travelers. Good workspace setup and reliable internet. Host provided helpful local business recommendations.",
      avatar: "/avatar-11.png",
      createdAt: "2025-04-14T09:00:00Z",
    },
    {
      id: 12,
      name: "Nicole Garcia",
      rating: 5.0,
      location: "South End, Charlotte, NC",
      review: "Absolutely loved our stay! The attention to detail was impressive and the host made us feel like VIPs. Will definitely return.",
      avatar: "/avatar-12.png",
      createdAt: "2025-04-08T14:15:00Z",
    },
    {
      id: 13,
      name: "Christopher Lee",
      rating: 3.0,
      location: "Capitol Peak, Denver, CO",
      review: "Decent place with good mountain views. Some appliances were showing age but overall functional. Host was responsive to questions.",
      avatar: "/avatar-13.png",
      createdAt: "2025-03-14T11:45:00Z",
    },
    {
      id: 14,
      name: "Rachel White",
      rating: 5.0,
      location: "Old Town, Scottsdale, AZ",
      review: "Incredible desert retreat! The property was beautifully designed and the outdoor space was perfect for relaxing after long days.",
      avatar: "/avatar-14.png",
      createdAt: "2025-03-10T16:20:00Z",
    },
    {
      id: 15,
      name: "Mark Harris",
      rating: 4.0,
      location: "Belltown, Seattle, WA",
      review: "Great urban experience. Walking distance to everything we wanted to see. Property was modern and well-maintained.",
      avatar: "/avatar-15.png",
      createdAt: "2025-02-14T13:30:00Z",
    },
    {
      id: 16,
      name: "Stephanie Clark",
      rating: 5.0,
      location: "Arts District, Los Angeles, CA",
      review: "Fantastic stay in a vibrant neighborhood. The loft was stylish and comfortable. Host provided great local art gallery recommendations.",
      avatar: "/avatar-16.png",
      createdAt: "2025-02-08T10:00:00Z",
    },
    {
      id: 17,
      name: "Thomas Lewis",
      rating: 4.0,
      location: "Medical District, Houston, TX",
      review: "Convenient location for our medical appointments. Clean and comfortable with easy parking. Host was understanding of our needs.",
      avatar: "/avatar-17.png",
      createdAt: "2025-01-14T15:45:00Z",
    },
    {
      id: 18,
      name: "Jennifer Walker",
      rating: 5.0,
      location: "Wynwood, Miami, FL",
      review: "Amazing artistic neighborhood and the property fit right in! Unique decor and perfect for Instagram photos. Loved every minute.",
      avatar: "/avatar-18.png",
      createdAt: "2025-01-10T12:15:00Z",
    },
    {
      id: 19,
      name: "Daniel Hall",
      rating: 4.0,
      location: "Inner Richmond, San Francisco, CA",
      review: "Good value in an expensive city. Property was clean and functional. Host provided helpful transportation tips for getting around.",
      avatar: "/avatar-19.png",
      createdAt: "2024-12-14T09:30:00Z",
    },
    {
      id: 20,
      name: "Megan Young",
      rating: 5.0,
      location: "East Village, New York, NY",
      review: "Perfect NYC experience! The apartment had character and charm while being modern and comfortable. Host was a true New Yorker with great tips.",
      avatar: "/avatar-20.png",
      createdAt: "2024-12-10T14:00:00Z",
    },
  ]
};

// Function to generate sample data with calculated time fields
function generateSampleReviewsData() {
  return {
    ...baseSampleReviewsData,
    reviews: baseSampleReviewsData.reviews.map(review => ({
      ...review,
      time: getRelativeTime(review.createdAt)
    }))
  };
}

async function fetchReviews() {
  // Simulate data fetching delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  return generateSampleReviewsData();
}

export default async function ReviewsPage() {
  const reviewsData = await fetchReviews();
  
  // Check if user is admin
  const { sessionClaims } = await auth();
  const isAdmin = sessionClaims?.metadata?.role === 'admin';

  return (
    <div className={`${HOST_PAGE_STYLE} flex flex-col min-h-0 flex-1`}>
      <HostPageTitle title="All Reviews" subtitle="View and manage reviews from your tenants" />
      <HostReviewClient mockData={reviewsData} isAdmin={isAdmin} />
    </div>
  );
}
