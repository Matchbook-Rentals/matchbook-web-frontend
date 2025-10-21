import { headers } from 'next/headers';
import { Skeleton } from "@/components/ui/skeleton";

const FormFieldSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-5 w-28" />
    <Skeleton className="h-10 w-full" />
  </div>
);

const SectionCardSkeleton = ({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="flex flex-col items-start gap-8 p-6 relative w-full bg-neutral-50 rounded-xl">
    <div className="flex flex-col items-start gap-5 w-full">
      <Skeleton className="h-7 w-48" /> {/* Section title */}
      {children}
    </div>
  </section>
);

export default function ApplicationLoading() {
  const userAgent = headers().get('user-agent') || '';
  const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);

  return (
    <div className='bg-gray-50'>
      <div className="flex flex-col w-full mx-auto max-w-[1200px] items-start justify-center gap-4 p-4">

        {/* Header Section Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 py-0 w-full">
          <Skeleton className="w-[77px] h-[44px] rounded-lg" /> {/* Back button */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-56" /> {/* Page title */}
            <Skeleton className="h-6 w-full max-w-md" /> {/* Subtitle */}
          </div>
        </div>

        {/* Personal Information Section */}
        <SectionCardSkeleton title="Personal Information">
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4 w-full`}>
            <FormFieldSkeleton />
            <FormFieldSkeleton />
            <FormFieldSkeleton />
            <FormFieldSkeleton />
          </div>
          <div className="w-full">
            <FormFieldSkeleton />
          </div>
        </SectionCardSkeleton>

        {/* Identification Section */}
        <SectionCardSkeleton title="Identification">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <FormFieldSkeleton />
            <FormFieldSkeleton />
          </div>
          <div className="space-y-2 w-full">
            <Skeleton className="h-5 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-24 w-24 rounded-lg" />
              <Skeleton className="h-24 w-24 rounded-lg" />
            </div>
          </div>
        </SectionCardSkeleton>

        {/* Income Section */}
        <SectionCardSkeleton title="Income">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <FormFieldSkeleton />
            <FormFieldSkeleton />
          </div>
          <div className="space-y-2 w-full">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </SectionCardSkeleton>

        {/* Residential History Section */}
        <SectionCardSkeleton title="Residential History">
          <div className="space-y-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormFieldSkeleton />
              <FormFieldSkeleton />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormFieldSkeleton />
              <FormFieldSkeleton />
            </div>
            <FormFieldSkeleton />
          </div>
        </SectionCardSkeleton>

        {/* Questionnaire Section */}
        <SectionCardSkeleton title="Questionnaire">
          <div className="space-y-6 w-full">
            <div className="space-y-3">
              <Skeleton className="h-5 w-64" />
              <div className="flex gap-4">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-5 w-56" />
              <div className="flex gap-4">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
              </div>
            </div>
          </div>
        </SectionCardSkeleton>
      </div>

      {/* Footer Skeleton */}
      <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 shadow-lg">
        <div className="max-w-[1200px] mx-auto px-4 py-4">
          <div className="flex justify-end">
            <Skeleton className="h-12 w-40 rounded-lg" /> {/* Save Application button */}
          </div>
        </div>
      </div>
    </div>
  );
}
