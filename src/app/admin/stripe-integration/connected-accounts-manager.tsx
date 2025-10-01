'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, AlertTriangle, CheckCircle, XCircle, RefreshCw, Database, User, RotateCw } from 'lucide-react'
import { getConnectedAccounts, deleteConnectedAccount, updateAccountStatus } from './_actions'
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

type ConnectedAccount = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  stripeAccountId: string | null
  createdAt: Date
  updatedAt: Date
  inDatabase: boolean
  stripeAccount: {
    id: string
    email?: string
    country?: string
    charges_enabled?: boolean
    payouts_enabled?: boolean
    details_submitted?: boolean
    created?: number
    type?: string
    business_profile?: any
    individual?: any
    company?: any
    capabilities?: any
    error?: string
  } | null
}

export function ConnectedAccountsManager() {
  const [matchedAccounts, setMatchedAccounts] = useState<ConnectedAccount[]>([])
  const [orphanedAccounts, setOrphanedAccounts] = useState<ConnectedAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchAccounts = async () => {
    try {
      const data = await getConnectedAccounts()
      setMatchedAccounts(data.matchedAccounts)
      setOrphanedAccounts(data.orphanedAccounts)
    } catch (error) {
      toast.error('Failed to fetch connected accounts')
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

  const handleUpdateStatus = async (userId: string, stripeAccountId: string) => {
    setUpdatingId(userId)
    try {
      const result = await updateAccountStatus(userId, stripeAccountId)
      toast.success(
        `Status updated: Charges ${result.charges_enabled ? 'enabled' : 'disabled'}, Payouts ${result.payouts_enabled ? 'enabled' : 'disabled'}`
      )
      await fetchAccounts()
    } catch (error) {
      toast.error('Failed to update account status from Stripe')
      console.error('Error updating account status:', error)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (userId: string, stripeAccountId: string) => {
    setDeletingId(userId)
    try {
      await deleteConnectedAccount(userId, stripeAccountId)
      toast.success('Connected account deleted successfully')
      await fetchAccounts()
    } catch (error) {
      toast.error('Failed to delete connected account')
      console.error('Error deleting account:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const getAccountStatusBadge = (account: ConnectedAccount['stripeAccount']) => {
    if (!account || account.error) {
      return <Badge variant="destructive">Error</Badge>
    }

    if (account.charges_enabled && account.payouts_enabled) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
    }

    if (account.details_submitted) {
      return <Badge variant="secondary">Pending</Badge>
    }

    return <Badge variant="outline">Incomplete</Badge>
  }

  const renderAccountCard = (account: ConnectedAccount) => (
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
              {account.inDatabase ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Database className="h-3 w-3 mr-1" />
                  In DB
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                  <User className="h-3 w-3 mr-1" />
                  Stripe Only
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{account.email}</p>
          </div>
          {getAccountStatusBadge(account.stripeAccount)}
        </div>

        {account.stripeAccount && !account.stripeAccount.error && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
              <div>
                <span className="text-muted-foreground">Account ID:</span>
                <p className="font-mono text-xs">{account.stripeAccount.id}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>
                <p className="capitalize">{account.stripeAccount.type || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Country:</span>
                <p>{account.stripeAccount.country?.toUpperCase() || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>
                <p>{account.stripeAccount.created ? new Date(account.stripeAccount.created * 1000).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>

            {(account.stripeAccount.individual || account.stripeAccount.business_profile) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3 p-3 bg-gray-50 rounded">
                {account.stripeAccount.individual && (
                  <div>
                    <span className="text-muted-foreground">Individual:</span>
                    <p>{account.stripeAccount.individual.first_name} {account.stripeAccount.individual.last_name}</p>
                    {account.stripeAccount.individual.email && (
                      <p className="text-xs text-muted-foreground">{account.stripeAccount.individual.email}</p>
                    )}
                  </div>
                )}
                {account.stripeAccount.business_profile && (
                  <div>
                    <span className="text-muted-foreground">Business:</span>
                    <p>{account.stripeAccount.business_profile.name || 'N/A'}</p>
                    {account.stripeAccount.business_profile.url && (
                      <p className="text-xs text-muted-foreground">{account.stripeAccount.business_profile.url}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Charges:</span>
                <div className="flex items-center gap-1">
                  {account.stripeAccount.charges_enabled ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>{account.stripeAccount.charges_enabled ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Payouts:</span>
                <div className="flex items-center gap-1">
                  {account.stripeAccount.payouts_enabled ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>{account.stripeAccount.payouts_enabled ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Transfers:</span>
                <div className="flex items-center gap-1">
                  {account.stripeAccount.capabilities?.transfers === 'active' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : account.stripeAccount.capabilities?.transfers === 'pending' ? (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="capitalize">
                    {account.stripeAccount.capabilities?.transfers || 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {account.stripeAccount?.error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>{account.stripeAccount.error}</span>
          </div>
        )}
      </div>

      <div className="ml-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleUpdateStatus(account.id, account.stripeAccountId!)}
          disabled={updatingId === account.id || !account.stripeAccountId}
          title="Sync account status from Stripe"
        >
          {updatingId === account.id ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCw className="h-4 w-4" />
          )}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              disabled={deletingId === account.id}
            >
              {deletingId === account.id ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Connected Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the Stripe Connect account for {account.email}?
                This action cannot be undone and will permanently remove the account from both
                your database and Stripe.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(account.id, account.stripeAccountId!)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading connected accounts...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Matched Accounts Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Matched Accounts ({matchedAccounts.length})</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Stripe accounts linked to users in database
            </p>
          </div>
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
          {matchedAccounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No matched Stripe accounts found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {matchedAccounts.map(renderAccountCard)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orphaned Stripe Accounts Section */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-orange-600">Orphaned Stripe Accounts ({orphanedAccounts.length})</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Stripe accounts without corresponding database users (likely from different account or test mode)
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {orphanedAccounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No orphaned Stripe accounts found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orphanedAccounts.map(renderAccountCard)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}