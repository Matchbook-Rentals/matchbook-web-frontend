'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Badge } from "@/components/ui/badge"
import { Download, Database, Image, DollarSign, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { exportAllListings, getExportStats } from './_actions'
import { useEffect } from 'react'

interface ExportStats {
  totalListings: number
  totalImages: number
  totalPricingTiers: number
}

export default function ExportListingsPage() {
  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })
  const [stats, setStats] = useState<ExportStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoadingStats(true)
    try {
      const result = await getExportStats()
      if (result.success && result.data) {
        setStats(result.data)
      } else {
        setExportStatus({
          type: 'error',
          message: result.error || 'Failed to load export statistics'
        })
      }
    } catch (error) {
      setExportStatus({
        type: 'error',
        message: 'Failed to load export statistics'
      })
    } finally {
      setLoadingStats(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    setExportStatus({ type: null, message: '' })

    try {
      const result = await exportAllListings()

      if (!result.success) {
        setExportStatus({
          type: 'error',
          message: result.error || 'Export failed'
        })
        return
      }

      // Create downloadable JSON file
      const exportData = result.data
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `matchbook-listings-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setExportStatus({
        type: 'success',
        message: `Successfully exported ${exportData?.totalCount || 0} listings with all relations`
      })

    } catch (error) {
      setExportStatus({
        type: 'error',
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Export Listings</h1>
        <p className="text-muted-foreground">
          Export all production listings with their complete relations for staging migration.
          All listings will be exported with photos, pricing, amenities, bedrooms, and reviews.
        </p>
      </div>

      {/* Export Statistics */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Export Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading statistics...
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.totalListings}</div>
                  <div className="text-sm text-muted-foreground">Listings</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Image className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.totalImages}</div>
                  <div className="text-sm text-muted-foreground">Images</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <DollarSign className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.totalPricingTiers}</div>
                  <div className="text-sm text-muted-foreground">Pricing Tiers</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">Failed to load statistics</div>
          )}
        </CardContent>
      </Card>

      {/* Export Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>What will be exported?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">✓ Listing Data</Badge>
              <span className="text-sm">Title, description, location, amenities, pricing</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">✓ Photos</Badge>
              <span className="text-sm">All listing images with categories and rankings</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">✓ Pricing</Badge>
              <span className="text-sm">Monthly pricing tiers for different lease lengths</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">✓ Bedrooms</Badge>
              <span className="text-sm">Room configurations and bed types</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">✓ Availability</Badge>
              <span className="text-sm">Blocked date ranges and unavailable periods</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">✓ Reviews</Badge>
              <span className="text-sm">Published listing reviews</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">✓ PDF Templates</Badge>
              <span className="text-sm">Listing-specific lease documents</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> User ownership, approval status, and third-party integrations will be reset during import.
                All imported listings will be assigned to the importing user and marked as test listings pending approval.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Action */}
      <Card>
        <CardHeader>
          <CardTitle>Export All Listings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              onClick={handleExport}
              disabled={isExporting || !stats}
              size="lg"
              className="w-full"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting Listings...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export {stats?.totalListings || 0} Listings
                </>
              )}
            </Button>

            {/* Status Messages */}
            {exportStatus.type && (
              <div className={`p-3 rounded-lg border ${
                exportStatus.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-start gap-2">
                  {exportStatus.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-500 mt-0.5" />
                  )}
                  <div className={`text-sm ${
                    exportStatus.type === 'success'
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-red-800 dark:text-red-200'
                  }`}>
                    {exportStatus.message}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}