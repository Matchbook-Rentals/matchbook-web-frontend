import { redirect } from 'next/navigation'
import { checkRole } from '@/utils/roles'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Trash2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { getBoldSignStats, deleteAllBoldSignDocuments } from './_actions'
import { DeleteAllButton } from './delete-all-button'

export default async function BoldSignIntegrationPage() {
  if (!checkRole('admin')) {
    redirect('/unauthorized')
  }

  const stats = await getBoldSignStats()

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Link href="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin Dashboard
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            BoldSign Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Manage BoldSign documents and templates used for lease signing workflows.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Document Statistics</h3>
                    <p className="text-muted-foreground text-sm">Overview of BoldSign documents</p>
                  </div>
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Templates:</span>
                    <span className="font-medium">{stats.totalTemplates}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Leases:</span>
                    <span className="font-medium">{stats.totalLeases}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Signed Leases:</span>
                    <span className="font-medium text-green-600">{stats.signedLeases}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Pending Leases:</span>
                    <span className="font-medium text-yellow-600">{stats.pendingLeases}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Danger Zone</h3>
                    <p className="text-muted-foreground text-sm">Irreversible actions</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
                    <h4 className="font-medium text-destructive mb-2">Delete All Documents</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      This will permanently delete all BoldSign templates and leases from the database. 
                      This action cannot be undone.
                    </p>
                    <DeleteAllButton 
                      totalDocuments={stats.totalTemplates + stats.totalLeases}
                      deleteAction={deleteAllBoldSignDocuments}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
                <p className="text-sm text-muted-foreground">
                  Last template created: {stats.lastTemplateCreated ? new Date(stats.lastTemplateCreated).toLocaleDateString() : 'Never'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Last lease created: {stats.lastLeaseCreated ? new Date(stats.lastLeaseCreated).toLocaleDateString() : 'Never'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/admin/boldsign/templates">
                      <FileText className="mr-2 h-4 w-4" />
                      View Templates
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/admin/boldsign/leases">
                      <FileText className="mr-2 h-4 w-4" />
                      View Leases
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}