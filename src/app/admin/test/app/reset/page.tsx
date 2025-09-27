'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  User,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Trash2,
  FileText,
  CreditCard,
  Home,
  Image as ImageIcon,
  UserCheck
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  searchUserByEmail,
  searchUserById,
  getUserApplicationSummary,
  resetUserApplications,
  deleteSpecificApplication
} from './_actions'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  fullName?: string
}

interface Application {
  id: string
  isDefault: boolean
  isComplete: boolean
  tripId?: string
  createdAt: Date
  identificationCount: number
  incomeCount: number
  residentialHistoryCount: number
  verificationImageCount: number
}

interface ApplicationSummary {
  userId: string
  userEmail: string
  applicationCount: number
  applications: Application[]
}

export default function ApplicationResetPage() {
  const [searchType, setSearchType] = useState<'email' | 'userId'>('email')
  const [searchValue, setSearchValue] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [foundUser, setFoundUser] = useState<User | null>(null)
  const [applicationSummary, setApplicationSummary] = useState<ApplicationSummary | null>(null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'reset-all' | 'delete-specific'
    applicationId?: string
  } | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
    details?: any
  }>({ type: null, message: '' })

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      setStatus({ type: 'error', message: 'Please enter a search value' })
      return
    }

    setIsSearching(true)
    setStatus({ type: null, message: '' })
    setFoundUser(null)
    setApplicationSummary(null)

    try {
      const result = searchType === 'email'
        ? await searchUserByEmail(searchValue.trim())
        : await searchUserById(searchValue.trim())

      if (result.success && result.user) {
        setFoundUser(result.user)
        await loadApplicationSummary(result.user.id)
      } else {
        setStatus({ type: 'error', message: result.error || 'User not found' })
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsSearching(false)
    }
  }

  const loadApplicationSummary = async (userId: string) => {
    setIsLoadingSummary(true)
    try {
      const result = await getUserApplicationSummary(userId)
      if (result.success && result.data) {
        setApplicationSummary(result.data)
      } else {
        setStatus({ type: 'error', message: result.error || 'Failed to load application data' })
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: `Failed to load application data: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsLoadingSummary(false)
    }
  }

  const handleResetAll = () => {
    setConfirmAction({ type: 'reset-all' })
    setShowConfirmDialog(true)
  }

  const handleDeleteSpecific = (applicationId: string) => {
    setConfirmAction({ type: 'delete-specific', applicationId })
    setShowConfirmDialog(true)
  }

  const confirmReset = async () => {
    if (!confirmAction || !foundUser) return

    setIsResetting(true)
    setShowConfirmDialog(false)
    setStatus({ type: null, message: '' })

    try {
      const result = confirmAction.type === 'reset-all'
        ? await resetUserApplications(foundUser.id)
        : await deleteSpecificApplication(confirmAction.applicationId!)

      if (result.success) {
        setStatus({
          type: 'success',
          message: confirmAction.type === 'reset-all'
            ? 'All applications successfully reset'
            : 'Application successfully deleted',
          details: result.data
        })
        // Reload application summary
        await loadApplicationSummary(foundUser.id)
      } else {
        setStatus({ type: 'error', message: result.error || 'Reset failed' })
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: `Reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsResetting(false)
      setConfirmAction(null)
    }
  }

  const clearSearch = () => {
    setSearchValue('')
    setFoundUser(null)
    setApplicationSummary(null)
    setStatus({ type: null, message: '' })
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Application Reset</h1>
        <p className="text-muted-foreground">
          Reset a user&apos;s application state to make them appear as if they&apos;ve never filled out an application.
          This will permanently delete all application data including identifications, income proofs, and residential history.
        </p>
      </div>

      {/* Search Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="search-value">
                  Search by {searchType === 'email' ? 'Email' : 'User ID'}
                </Label>
                <Input
                  id="search-value"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={searchType === 'email' ? 'user@example.com' : 'user_xxxxxxxxxxxx'}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm">Search Type</Label>
                <div className="flex gap-2">
                  <Button
                    variant={searchType === 'email' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSearchType('email')}
                  >
                    Email
                  </Button>
                  <Button
                    variant={searchType === 'userId' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSearchType('userId')}
                  >
                    User ID
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchValue.trim()}
                className="flex-1"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search User
                  </>
                )}
              </Button>
              {(foundUser || status.type) && (
                <Button variant="outline" onClick={clearSearch}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Info */}
      {foundUser && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">User ID</Badge>
                <span className="font-mono text-sm">{foundUser.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Email</Badge>
                <span>{foundUser.email}</span>
              </div>
              {foundUser.fullName && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Name</Badge>
                  <span>{foundUser.fullName}</span>
                </div>
              )}
            </div>

            {/* Debug Info */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm">
                <div className="font-medium text-blue-800 dark:text-blue-200 mb-2">Debug Info:</div>
                <div className="space-y-1 text-blue-700 dark:text-blue-300">
                  <div>✓ This user ID will be used for deletion</div>
                  <div>✓ Check server console for detailed deletion logs</div>
                  <div>✓ Applications found: {applicationSummary?.applicationCount || 0}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Application Summary */}
      {foundUser && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Application Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading application data...
              </div>
            ) : applicationSummary ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold">{applicationSummary.applicationCount}</div>
                  <div className="text-muted-foreground">
                    {applicationSummary.applicationCount === 1 ? 'Application' : 'Applications'}
                  </div>
                </div>

                {applicationSummary.applications.length > 0 ? (
                  <div className="space-y-4">
                    {applicationSummary.applications.map((app, index) => (
                      <Card key={app.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant={app.isDefault ? "default" : "secondary"}>
                                  {app.isDefault ? 'Default' : 'Trip-Specific'}
                                </Badge>
                                <Badge variant={app.isComplete ? "default" : "outline"}>
                                  {app.isComplete ? 'Complete' : 'Incomplete'}
                                </Badge>
                                {app.tripId && (
                                  <Badge variant="outline">Trip: {app.tripId.slice(-8)}</Badge>
                                )}
                              </div>

                              <div className="text-sm text-muted-foreground">
                                Created: {new Date(app.createdAt).toLocaleDateString()}
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div className="flex items-center gap-1">
                                  <UserCheck className="h-3 w-3" />
                                  {app.identificationCount} IDs
                                </div>
                                <div className="flex items-center gap-1">
                                  <CreditCard className="h-3 w-3" />
                                  {app.incomeCount} Income
                                </div>
                                <div className="flex items-center gap-1">
                                  <Home className="h-3 w-3" />
                                  {app.residentialHistoryCount} History
                                </div>
                                <div className="flex items-center gap-1">
                                  <ImageIcon className="h-3 w-3" />
                                  {app.verificationImageCount} Images
                                </div>
                              </div>
                            </div>

                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteSpecific(app.id)}
                              disabled={isResetting}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <Separator />

                    <Button
                      variant="destructive"
                      onClick={handleResetAll}
                      disabled={isResetting}
                      className="w-full"
                    >
                      {isResetting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Reset All Applications
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <div className="text-lg font-medium">No Applications Found</div>
                    <div className="text-sm">This user has not created any applications yet.</div>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Status Messages */}
      {status.type && (
        <Card className={`mb-6 ${
          status.type === 'success'
            ? 'border-green-200 dark:border-green-800'
            : 'border-red-200 dark:border-red-800'
        }`}>
          <CardContent className="pt-4">
            <div className={`p-4 rounded-lg ${
              status.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20'
                : 'bg-red-50 dark:bg-red-900/20'
            }`}>
              <div className="flex items-start gap-2">
                {status.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className={`font-medium ${
                    status.type === 'success'
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-red-800 dark:text-red-200'
                  }`}>
                    {status.message}
                  </div>

                  {status.details && (
                    <div className="mt-3 text-sm">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <div>Applications: {status.details.deletedApplications}</div>
                        <div>Identifications: {status.details.deletedIdentifications}</div>
                        <div>Incomes: {status.details.deletedIncomes}</div>
                        <div>Residential History: {status.details.deletedResidentialHistories}</div>
                        <div>Verification Images: {status.details.deletedVerificationImages}</div>
                        <div>ID Photos: {status.details.deletedIDPhotos}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Application Reset
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === 'reset-all' ? (
                <>
                  This will permanently delete <strong>ALL</strong> application data for{' '}
                  <strong>{foundUser?.email}</strong>, including:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>All application records</li>
                    <li>Identity verification documents</li>
                    <li>Income documentation</li>
                    <li>Residential history</li>
                    <li>All uploaded verification images</li>
                  </ul>
                </>
              ) : (
                <>
                  This will permanently delete the selected application and all its related data.
                </>
              )}
              <div className="mt-3 p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded text-yellow-800 dark:text-yellow-200">
                <strong>This action cannot be undone.</strong> The user will appear as if they never filled out an application.
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmReset}>
              Yes, Delete {confirmAction?.type === 'reset-all' ? 'All Applications' : 'Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}