'use client';

export default function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Customize your skeleton UI here */}
      <div className="h-32 bg-gray-200 rounded-md mb-4"></div>
      <div className="h-64 bg-gray-200 rounded-md"></div>
    </div>
  );
}