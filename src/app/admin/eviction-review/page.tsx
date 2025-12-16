import { redirect } from 'next/navigation'
import { checkDeveloperAccess } from '@/utils/roles'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { getVerificationsNeedingReview } from './_actions'
import { AlertTriangle, CheckCircle2, Clock, ExternalLink } from 'lucide-react'

export default async function EvictionReviewPage() {
  if (!(await checkDeveloperAccess())) {
    redirect('/unauthorized')
  }

  const verifications = await getVerificationsNeedingReview()

  const pendingCount = verifications.filter(v => v.evictionReviewStatus === 'pending_review').length
  const reviewedCount = verifications.filter(v => v.evictionReviewStatus === 'reviewed').length

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Eviction Review</CardTitle>
              <p className="text-muted-foreground mt-1">
                Review verifications with eviction hits and enter case details
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="destructive" className="text-sm">
                {pendingCount} Pending
              </Badge>
              <Badge variant="secondary" className="text-sm">
                {reviewedCount} Reviewed
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {verifications.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium">No eviction reviews pending</p>
              <p className="text-muted-foreground">
                All verifications with eviction hits have been reviewed.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {verifications.map((verification) => {
                const isPending = verification.evictionReviewStatus === 'pending_review'
                const reportData = verification.bgsReport?.reportData as any
                const reportUrl = reportData?.reportUrl || reportData?.reportUrls?.html

                return (
                  <Card key={verification.id} className={`border-l-4 ${isPending ? 'border-l-orange-500' : 'border-l-green-500'}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">
                              {verification.user?.firstName} {verification.user?.lastName}
                            </h3>
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
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {verification.user?.email}
                          </p>
                          <div className="flex gap-4 text-sm">
                            <span>
                              <strong>Screening Date:</strong>{' '}
                              {verification.screeningDate
                                ? new Date(verification.screeningDate).toLocaleDateString()
                                : 'N/A'}
                            </span>
                            <span>
                              <strong>Eviction Status:</strong>{' '}
                              <span className={verification.evictionStatus === 'Records Found' ? 'text-red-600 font-medium' : ''}>
                                {verification.evictionStatus || 'Unknown'}
                              </span>
                            </span>
                            <span>
                              <strong>Records Entered:</strong>{' '}
                              {verification.evictionRecords.length}
                            </span>
                          </div>
                          {verification.bgsReport?.orderId && (
                            <p className="text-xs text-muted-foreground">
                              Order ID: {verification.bgsReport.orderId}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {reportUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={reportUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Accio Report
                              </a>
                            </Button>
                          )}
                          <Button asChild>
                            <Link href={`/admin/eviction-review/${verification.id}`}>
                              {isPending ? 'Review' : 'View Details'}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
