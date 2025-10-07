import { checkRole } from "@/utils/roles";
import { LeasesPageClient } from "./leases-page-client";
import { getPdfTemplateStats, deleteAllPdfTemplates } from "./_actions";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteAllButton } from "@/app/admin/boldsign/delete-all-button";
import { AlertTriangle } from "lucide-react";

export default async function LeasesPage({ params }: { params: { listingId: string } }) {
  const listingId = params.listingId;

  // Check if user is admin_dev and in development environment
  const isAdminDev = await checkRole('admin_dev');
  const isDevelopment = process.env.NODE_ENV === 'development';
  const showDeleteAll = isAdminDev && isDevelopment;

  // Get stats for delete all button
  let stats = { totalTemplates: 0, lastTemplateCreated: null };
  if (showDeleteAll) {
    stats = await getPdfTemplateStats(listingId);
  }

  return (
    <>
      <LeasesPageClient listingId={listingId} />

      {/* Admin Section - Only visible to admin_dev in production */}
      {showDeleteAll && stats.totalTemplates > 0 && (
        <div className="px-6 pb-8">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h3 className="text-lg font-semibold text-destructive">Admin: Danger Zone</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                This section is only visible to admin_dev users in development.
                Delete all PDF templates and their associated files for this listing.
              </p>
              <DeleteAllButton
                totalDocuments={stats.totalTemplates}
                deleteAction={async () => {
                  'use server';
                  return await deleteAllPdfTemplates(listingId);
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

