'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, RefreshCw, Shield, Trash2, TestTube, User, Database, ExternalLink, RotateCcw } from 'lucide-react'
import { getVerifiedAccounts, getMedallionData, resetUserVerification, testVerification } from './_actions'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type VerifiedAccount = {
  id: string
  email: string | null
  firstName: string | null
  lastName: string | null
  medallionIdentityVerified: boolean | null
  medallionUserId: string | null
  medallionVerificationStatus: string | null
  medallionVerificationStartedAt: Date | null
  medallionVerificationCompletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

type MedallionData = {
  id: string
  email: string | null
  firstName: string | null
  lastName: string | null
  medallionIdentityVerified: boolean | null
  medallionUserId: string | null
  medallionVerificationStatus: string | null
  medallionVerificationStartedAt: Date | null
  medallionVerificationCompletedAt: Date | null
}

export function VerifiedAccountsManager() {
  const [accounts, setAccounts] = useState<VerifiedAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [resettingId, setResettingId] = useState<string | null>(null)
  const [targetUserId, setTargetUserId] = useState('')
  const [medallionData, setMedallionData] = useState<MedallionData | null>(null)
  const [isLoadingUserData, setIsLoadingUserData] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  const fetchAccounts = async () => {
    try {
      const data = await getVerifiedAccounts()
      setAccounts(data)
    } catch (error) {
      toast.error('Failed to fetch verified accounts')
      console.error('Error fetching accounts:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAccounts()
  }

  const handleReset = async (userId: string, userName: string) => {
    setResettingId(userId)
    try {
      await resetUserVerification(userId)
      toast.success(`Verification reset for ${userName}`)
      await fetchAccounts()
      // If this was the currently loaded user, clear the data
      if (medallionData?.id === userId) {
        setMedallionData(null)
      }
    } catch (error) {
      toast.error('Failed to reset verification')
      console.error('Error resetting verification:', error)
    } finally {
      setResettingId(null)
    }
  }

  const handleLoadUser = async () => {
    if (!targetUserId.trim()) {
      toast.error('Please enter a user ID')
      return
    }

    setIsLoadingUserData(true)
    try {
      const data = await getMedallionData(targetUserId)
      setMedallionData(data)
      toast.success('User data loaded successfully')
    } catch (error) {
      toast.error('Failed to load user data')
      console.error('Error loading user data:', error)
    } finally {
      setIsLoadingUserData(false)
    }
  }

  const handleTestVerification = async () => {
    if (!medallionData?.email || !medallionData?.firstName || !medallionData?.lastName) {
      toast.error('Please load a user with complete profile data first')
      return
    }

    setIsTesting(true)
    try {
      await testVerification(medallionData.email, medallionData.firstName, medallionData.lastName)
      toast.success('Test verification initiated successfully')
      // Refresh the loaded user data
      if (medallionData?.id) {
        const updatedData = await getMedallionData(medallionData.id)
        setMedallionData(updatedData)
      }
    } catch (error) {
      toast.error('Failed to run test verification')
      console.error('Error running test verification:', error)
    } finally {
      setIsTesting(false)
    }
  }

  const getVerificationStatusBadge = (status: string | null, verified: boolean | null) => {
    if (verified) {
      return <Badge className="bg-green-100 text-green-800">Verified</Badge>
    }
    if (status === 'pending') {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
    }
    if (status === 'rejected') {
      return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
    }
    return <Badge variant="outline">Not Started</Badge>
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Verified Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading verified accounts...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* User Lookup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Lookup & Testing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="Enter user ID to load data"
              />
            </div>
            <Button onClick={handleLoadUser} disabled={isLoadingUserData}>
              {isLoadingUserData ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Load User'}
            </Button>
          </div>

          {medallionData && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">User ID</Label>
                    <p className="text-sm text-muted-foreground">{medallionData.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-muted-foreground">{medallionData.email || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Name</Label>
                    <p className="text-sm text-muted-foreground">
                      {medallionData.firstName} {medallionData.lastName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Verification Status</Label>
                    <div className="mt-1">
                      {getVerificationStatusBadge(
                        medallionData.medallionVerificationStatus,
                        medallionData.medallionIdentityVerified
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleTestVerification}
                    disabled={isTesting}
                    variant="default"
                  >
                    {isTesting ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <TestTube className="h-4 w-4 mr-2" />
                    )}
                    Run Test Verification
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset Auth Details
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset Authentication Details</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will clear all Medallion verification data for {medallionData.firstName} {medallionData.lastName} ({medallionData.email}).
                          The user account will remain intact, but they will need to verify their identity again if they want to become a host.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleReset(medallionData.id, `${medallionData.firstName} ${medallionData.lastName}`)}
                          className="bg-orange-600 text-white hover:bg-orange-700"
                        >
                          Reset Auth Details
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Verified Accounts List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Verified Accounts ({accounts.length})</CardTitle>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No users have completed Medallion verification yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">
                            {account.firstName || account.lastName
                              ? `${account.firstName || ''} ${account.lastName || ''}`.trim()
                              : account.email
                            }
                          </p>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <Database className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{account.email}</p>
                      </div>
                      {getVerificationStatusBadge(
                        account.medallionVerificationStatus,
                        account.medallionIdentityVerified
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-muted-foreground">User ID:</span>
                        <p className="font-mono text-xs">{account.id.slice(0, 12)}...</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Medallion ID:</span>
                        <p className="font-mono text-xs">{account.medallionUserId?.slice(0, 12)}...</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Completed:</span>
                        <p>{account.medallionVerificationCompletedAt
                          ? new Date(account.medallionVerificationCompletedAt).toLocaleDateString()
                          : 'N/A'
                        }</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <p className="capitalize">{account.medallionVerificationStatus || 'verified'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={resettingId === account.id}
                        >
                          {resettingId === account.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <RotateCcw className="h-4 w-4 mr-1" />
                          )}
                          Reset Auth
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reset Authentication Details</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will clear all Medallion verification data for {account.email}.
                            The user account will remain intact, but they will need to verify their identity again if they want to become a host.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleReset(account.id, `${account.firstName} ${account.lastName}` || account.email || 'user')}
                            className="bg-orange-600 text-white hover:bg-orange-700"
                          >
                            Reset Auth Details
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Quick Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <a href="/app/host/onboarding/identity-verification" target="_blank">
                Test Verification Flow
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/app/host/dashboard/overview" target="_blank">
                Host Dashboard
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/admin/test" target="_blank">
                Back to Test Dashboard
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}