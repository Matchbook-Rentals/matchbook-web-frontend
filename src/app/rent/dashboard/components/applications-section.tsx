'use client';

import { BrandButton } from '@/components/ui/brandButton';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { SectionEmptyState } from './section-empty-state';
import { RenterDashboardApplicationCard } from '../renter-dashboard-application-card';
import { formatDateRange, formatOccupants } from '../lib/dashboard-helpers';
import type { DashboardApplication } from '@/app/actions/renter-dashboard';

interface ApplicationsSectionProps {
  applications: DashboardApplication[];
}

const PLACEHOLDER_IMAGE = '/stock_interior.webp';

export const ApplicationsSection = ({ applications }: ApplicationsSectionProps) => {
  return (
    <section className="mb-8 overflow-x-hidden">
      <Accordion type="single" collapsible>
        <AccordionItem value="applications" className="border-b-0">
          <div className="flex items-center justify-between">
            <AccordionTrigger className="py-1 mb-4 hover:no-underline justify-start gap-1 flex-1">
              <span className="font-poppins font-semibold text-[#484a54] text-sm">
                Applications
              </span>
            </AccordionTrigger>
            <BrandButton variant="outline" size="xs" href="/app/rent/applications/general" className="mb-4">
              Your Application
            </BrandButton>
          </div>
          <AccordionContent>
            {applications.length === 0 ? (
              <SectionEmptyState
                imageSrc="/empty-states/no-applications.png"
                title="No applications"
              />
            ) : (
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
                      listingId={app.listingId}
                      userId={app.listing?.user?.id}
                    />
                  );
                })}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
};
