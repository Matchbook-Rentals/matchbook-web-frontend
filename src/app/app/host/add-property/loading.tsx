import LoadingSpinner from "@/components/loading-spinner";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Loading add property page...</p>
      </div>
    </div>
  );
}
