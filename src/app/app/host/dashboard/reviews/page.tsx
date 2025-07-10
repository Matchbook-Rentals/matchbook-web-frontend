import React from "react";

async function fetchReviews() {
  // Simulate data fetching delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  return [];
}

export default async function ReviewsPage() {
  const reviews = await fetchReviews();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
      </div>
      <div className="flex-1 space-y-4">
        <p className="text-muted-foreground">
          {reviews.length === 0 ? "No reviews yet." : `${reviews.length} reviews found.`}
        </p>
      </div>
    </div>
  );
}