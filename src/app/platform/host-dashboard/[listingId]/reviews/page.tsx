"use client";

import React from "react";
import { useListingDashboard } from '../listing-dashboard-context';
import { UserRating } from '../../../../../components/reviews/host-review';

const sampleReviewData = {
  overallRating: 4.2,
  totalReviews: 3,
  ratingDistribution: [
    { stars: 5, percentage: 33 },
    { stars: 4, percentage: 33 },
    { stars: 3, percentage: 33 },
    { stars: 2, percentage: 0 },
    { stars: 1, percentage: 0 },
  ],
  reviews: [
    {
      name: "Sarah Johnson",
      memberSince: "On Matchbook since 2023",
      overallRating: 5,
      categoryRatings: [
        { category: "Listing Accuracy and Value", rating: 5.0 },
        { category: "Responsiveness and Maintenance", rating: 5.0 },
        { category: "Privacy and Safety", rating: 5.0 },
      ],
      avatarImgUrl: "/placeholderImages/image_2.jpg"
    },
    {
      name: "Mike Chen",
      memberSince: "On Matchbook since 2022",
      overallRating: 4,
      categoryRatings: [
        { category: "Listing Accuracy and Value", rating: 4.0 },
        { category: "Responsiveness and Maintenance", rating: 4.5 },
        { category: "Privacy and Safety", rating: 3.5 },
      ],
      avatarImgUrl: "/placeholderImages/image_3.jpg"
    },
    {
      name: "Emma Rodriguez",
      memberSince: "On Matchbook since 2024",
      overallRating: 3,
      categoryRatings: [
        { category: "Listing Accuracy and Value", rating: 3.0 },
        { category: "Responsiveness and Maintenance", rating: 2.5 },
        { category: "Privacy and Safety", rating: 3.5 },
      ],
      avatarImgUrl: "/placeholderImages/image_4.jpg"
    }
  ]
};

export default function ReviewsPage() {
  const { data } = useListingDashboard();
  
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Reviews</h2>
      <UserRating data={sampleReviewData} />
    </div>
  );
}