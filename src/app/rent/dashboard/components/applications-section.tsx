'use client';

import { BrandButton } from '@/components/ui/brandButton';
import { SectionEmptyState } from './section-empty-state';
import { SectionHeader } from './section-header';
import { RenterDashboardApplicationCard } from '../renter-dashboard-application-card';
import { formatDateRange, formatOccupants } from '../lib/dashboard-helpers';
import type { DashboardApplication } from '@/app/actions/renter-dashboard';

interface ApplicationsSectionProps {
  applications: DashboardApplication[];
}

const PLACEHOLDER_IMAGE = '/stock_interior.webp';

export const ApplicationsSection = ({ applications }: ApplicationsSectionProps) => {
  if (applications.length === 0) return (
    <section className="mb-8">
      <SectionHeader 
        title="Applications" 
        actions={
          <BrandButton variant="outline" size="xs" href="/app/rent/applications/general">
            Your Application
          </BrandButton>
        }
      />
      <SectionEmptyState
        imageSrc="/empty-states/no-applications.png"
        title="No applications"
      />
    </section>
  );

  return (
    <section className="mb-8 overflow-x-hidden">
      <SectionHeader 
        title="Applications" 
        actions={
          <BrandButton variant="outline" size="xs" href="/app/rent/applications/general">
            Your Application
          </BrandButton>
        }
      />
      <div className="space-y-4">
        {applications.map((app) => {
          const location = app.listing?.city && app.listing?.state
            ? `${app.listing.city}, ${app.listing.state}`
            : app.listing?.state || 'Location not available';

          return (
            <RenterDashboardApplicationCard
              key={app.id}
              title={app.listing?.title || 'Untitled Property'}
              status="Pending"
              dateRange={formatDateRange(app.startDate, app.endDate)}
              location={location}
              guests={formatOccupants(app.trip?.numAdults || 0, app.trip?.numChildren || 0, app.trip?.numPets || 0)}
              imageUrl={app.listing?.listingImages?.[0]?.url || PLACEHOLDER_IMAGE}
              applicationId={app.id}
              userId={app.listing?.user?.id}
            />
          );
        })}
      </div>
    </section>
  );
};
