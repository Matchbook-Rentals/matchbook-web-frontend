export default function Loading() {
  return (
    <div className="md:w-4/5 w-[95%] mx-auto flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      <p className="text-gray-600 text-lg">Getting listing info...</p>
    </div>
  );
}