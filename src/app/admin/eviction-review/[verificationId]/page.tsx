import { redirect, notFound } from 'next/navigation'
import { checkDeveloperAccess } from '@/utils/roles'
import { auth } from '@clerk/nextjs/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { getVerificationDetails } from '../_actions'
import { AlertTriangle, ArrowLeft, ExternalLink, CheckCircle2, Clock } from 'lucide-react'
import { EvictionRecordForm } from './eviction-record-form'
import { EvictionRecordsList } from './eviction-records-list'
import { ReviewActions } from './review-actions'
import { CriminalRecordsList } from './criminal-records-list'

export default async function EvictionReviewDetailPage({
  params,
}: {
  params: { verificationId: string }
}) {
  if (!(await checkDeveloperAccess())) {
    redirect('/unauthorized')
  }

  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  const verification = await getVerificationDetails(params.verificationId)

  if (!verification) {
    notFound()
  }

  const reportData = verification.bgsReport?.reportData as any
  const reportUrl = reportData?.reportUrl || reportData?.reportUrls?.html
  const isPending = verification.evictionReviewStatus === 'pending_review'

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      {/* Back Link */}
      <Link
        href="/admin/eviction-review"
        className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Eviction Review
      </Link>

      {/* Header Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                {verification.user?.firstName} {verification.user?.lastName}
                {isPending ? (
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending Review
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Reviewed
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{verification.user?.email}</CardDescription>
            </div>
            <ReviewActions
              verificationId={verification.id}
              currentStatus={verification.evictionReviewStatus || 'pending_review'}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Screening Date</p>
              <p className="font-medium">
                {verification.screeningDate
                  ? new Date(verification.screeningDate).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Valid Until</p>
              <p className="font-medium">
                {verification.validUntil
                  ? new Date(verification.validUntil).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Eviction Status</p>
              <p className={`font-medium ${verification.evictionStatus === 'Records Found' ? 'text-red-600' : ''}`}>
                {verification.evictionStatus || 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Criminal Status</p>
              <p className={`font-medium ${verification.criminalStatus === 'Records Found' ? 'text-red-600' : ''}`}>
                {verification.criminalStatus || 'Unknown'}
              </p>
            </div>
          </div>

          {/* Accio Report Link */}
          {reportUrl && (
            <div className="mt-4 pt-4 border-t">
              <a
                href={reportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View Full Accio Report
              </a>
              {verification.bgsReport?.orderId && (
                <span className="ml-4 text-sm text-muted-foreground">
                  Order ID: {verification.bgsReport.orderId}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Eviction Records Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Eviction Records ({verification.evictionRecords.length})
          </CardTitle>
          <CardDescription>
            Enter eviction case details from the Accio report. These details are not included in the webhook and must be entered manually.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Existing Records */}
          {verification.evictionRecords.length > 0 && (
            <EvictionRecordsList
              records={verification.evictionRecords}
              verificationId={verification.id}
            />
          )}

          {/* Add New Record Form */}
          <div className={verification.evictionRecords.length > 0 ? 'mt-6 pt-6 border-t' : ''}>
            <h4 className="font-medium mb-4">Add Eviction Record</h4>
            <EvictionRecordForm
              verificationId={verification.id}
              adminUserId={userId}
            />
          </div>
        </CardContent>
      </Card>

      {/* Criminal Records Section (Read-only, auto-extracted from webhook) */}
      {verification.criminalRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Criminal Records ({verification.criminalRecords.length})
            </CardTitle>
            <CardDescription>
              These records were automatically extracted from the Accio webhook.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CriminalRecordsList records={verification.criminalRecords} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
