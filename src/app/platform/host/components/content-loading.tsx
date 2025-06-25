import LoadingSpinner from "@/components/ui/spinner";

interface ContentLoadingProps {
  message?: string;
}

export default function ContentLoading({ message = "Loading..." }: ContentLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <LoadingSpinner />
      <p className="text-gray-600 text-lg">{message}</p>
    </div>
  );
}