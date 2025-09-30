'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  sendVerificationCode,
  verifyPhoneNumber,
  updateAlertPreferences,
  updateQuietHours,
  toggleAlertsEnabled,
  sendTestAlert,
} from './_actions'
import { CheckCircle2, XCircle, Loader2, Bell, BellOff, Send } from 'lucide-react'

interface Subscription {
  id: string
  phoneNumber: string
  phoneVerified: boolean
  phoneVerifiedAt: Date | null
  alertsEnabled: boolean
  alertOnDispute: boolean
  alertOnRefund: boolean
  alertOnPaymentFailure: boolean
  alertOnTransferFailure: boolean
  alertOnMatchCreated: boolean
  alertOnBookingCreated: boolean
  alertOnPaymentSuccess: boolean
  quietHoursStart: string | null
  quietHoursEnd: string | null
  quietHoursTimezone: string | null
  lastAlertSentAt: Date | null
  alertsSentToday: number
  dailyAlertLimit: number
  createdAt: Date
  updatedAt: Date
}

interface SMSAlertsManagerProps {
  initialSubscription: {
    exists: boolean
    subscription?: Subscription
  }
}

export function SMSAlertsManager({ initialSubscription }: SMSAlertsManagerProps) {
  const [subscription, setSubscription] = useState(initialSubscription.subscription)
  const [phoneNumber, setPhoneNumber] = useState(initialSubscription.subscription?.phoneNumber || '')
  const [verificationCode, setVerificationCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [alertPreferences, setAlertPreferences] = useState({
    alertOnDispute: subscription?.alertOnDispute ?? true,
    alertOnRefund: subscription?.alertOnRefund ?? true,
    alertOnPaymentFailure: subscription?.alertOnPaymentFailure ?? true,
    alertOnTransferFailure: subscription?.alertOnTransferFailure ?? false,
    alertOnMatchCreated: subscription?.alertOnMatchCreated ?? false,
    alertOnBookingCreated: subscription?.alertOnBookingCreated ?? false,
    alertOnPaymentSuccess: subscription?.alertOnPaymentSuccess ?? false,
  })

  const [quietHours, setQuietHours] = useState({
    start: subscription?.quietHoursStart || '',
    end: subscription?.quietHoursEnd || '',
    timezone: subscription?.quietHoursTimezone || 'America/New_York',
  })

  const handleSendVerificationCode = async () => {
    setIsSendingCode(true)
    setMessage(null)

    const result = await sendVerificationCode(phoneNumber)

    if (result.success) {
      setMessage({ type: 'success', text: 'Verification code sent! Check your phone.' })
      // Refresh subscription data
      window.location.reload()
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to send verification code' })
    }

    setIsSendingCode(false)
  }

  const handleVerifyCode = async () => {
    setIsVerifying(true)
    setMessage(null)

    const result = await verifyPhoneNumber(verificationCode)

    if (result.success) {
      setMessage({ type: 'success', text: 'Phone number verified successfully!' })
      setVerificationCode('')
      // Refresh subscription data
      window.location.reload()
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to verify code' })
    }

    setIsVerifying(false)
  }

  const handleUpdatePreferences = async (updatedPreferences: typeof alertPreferences) => {
    const result = await updateAlertPreferences(updatedPreferences)

    if (result.success) {
      setMessage({ type: 'success', text: 'Preferences updated successfully' })
      setAlertPreferences(updatedPreferences)
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update preferences' })
    }
  }

  const handleUpdateQuietHours = async () => {
    const result = await updateQuietHours({
      quietHoursStart: quietHours.start || null,
      quietHoursEnd: quietHours.end || null,
      quietHoursTimezone: quietHours.timezone || null,
    })

    if (result.success) {
      setMessage({ type: 'success', text: 'Quiet hours updated successfully' })
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update quiet hours' })
    }
  }

  const handleToggleAlerts = async (enabled: boolean) => {
    const result = await toggleAlertsEnabled(enabled)

    if (result.success) {
      setMessage({ type: 'success', text: `Alerts ${enabled ? 'enabled' : 'disabled'} successfully` })
      setSubscription(prev => prev ? { ...prev, alertsEnabled: enabled } : undefined)
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to toggle alerts' })
    }
  }

  const handleSendTestAlert = async () => {
    setIsSendingTest(true)
    setMessage(null)

    const result = await sendTestAlert()

    if (result.success) {
      setMessage({ type: 'success', text: 'Test alert sent! Check your phone.' })
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to send test alert' })
    }

    setIsSendingTest(false)
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Phone Verification Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Phone Verification
            {subscription?.phoneVerified && (
              <Badge variant="default" className="ml-2">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Verify your phone number to receive SMS alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!subscription?.phoneVerified ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (E.164 format)</Label>
                <div className="flex gap-2">
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isSendingCode}
                  />
                  <Button onClick={handleSendVerificationCode} disabled={isSendingCode || !phoneNumber}>
                    {isSendingCode ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Code'
                    )}
                  </Button>
                </div>
              </div>

              {subscription && (
                <div className="space-y-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      type="text"
                      placeholder="123456"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      disabled={isVerifying}
                      maxLength={6}
                    />
                    <Button onClick={handleVerifyCode} disabled={isVerifying || !verificationCode}>
                      {isVerifying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        'Verify'
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Code sent to {subscription.phoneNumber}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Phone Number:</strong> {subscription.phoneNumber}
              </p>
              <p className="text-sm text-muted-foreground">
                Verified on {new Date(subscription.phoneVerifiedAt!).toLocaleDateString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {subscription?.phoneVerified && (
        <>
          {/* Alert Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Alert Status
                <Switch
                  checked={subscription.alertsEnabled}
                  onCheckedChange={handleToggleAlerts}
                />
              </CardTitle>
              <CardDescription>
                {subscription.alertsEnabled ? 'Alerts are enabled' : 'Alerts are disabled'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Alerts sent today</p>
                  <p className="text-2xl font-bold">{subscription.alertsSentToday}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Daily limit</p>
                  <p className="text-2xl font-bold">{subscription.dailyAlertLimit}</p>
                </div>
                {subscription.lastAlertSentAt && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Last alert sent</p>
                    <p className="font-medium">{new Date(subscription.lastAlertSentAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Alert Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Alert Preferences</CardTitle>
              <CardDescription>
                Choose which events trigger SMS alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="disputes">Payment Disputes</Label>
                  <p className="text-sm text-muted-foreground">Get notified when customers dispute charges</p>
                </div>
                <Switch
                  id="disputes"
                  checked={alertPreferences.alertOnDispute}
                  onCheckedChange={(checked) => {
                    const updated = { ...alertPreferences, alertOnDispute: checked }
                    handleUpdatePreferences(updated)
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="refunds">Refunds</Label>
                  <p className="text-sm text-muted-foreground">Get notified when refunds are processed</p>
                </div>
                <Switch
                  id="refunds"
                  checked={alertPreferences.alertOnRefund}
                  onCheckedChange={(checked) => {
                    const updated = { ...alertPreferences, alertOnRefund: checked }
                    handleUpdatePreferences(updated)
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="payment-failures">Payment Failures</Label>
                  <p className="text-sm text-muted-foreground">Get notified when payments fail</p>
                </div>
                <Switch
                  id="payment-failures"
                  checked={alertPreferences.alertOnPaymentFailure}
                  onCheckedChange={(checked) => {
                    const updated = { ...alertPreferences, alertOnPaymentFailure: checked }
                    handleUpdatePreferences(updated)
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="transfer-failures">Transfer Failures</Label>
                  <p className="text-sm text-muted-foreground">Get notified when transfers to hosts fail (critical)</p>
                </div>
                <Switch
                  id="transfer-failures"
                  checked={alertPreferences.alertOnTransferFailure}
                  onCheckedChange={(checked) => {
                    const updated = { ...alertPreferences, alertOnTransferFailure: checked }
                    handleUpdatePreferences(updated)
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="match-created">Match Created</Label>
                  <p className="text-sm text-muted-foreground">Get notified when renters are matched with properties</p>
                </div>
                <Switch
                  id="match-created"
                  checked={alertPreferences.alertOnMatchCreated}
                  onCheckedChange={(checked) => {
                    const updated = { ...alertPreferences, alertOnMatchCreated: checked }
                    handleUpdatePreferences(updated)
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="booking-created">Booking Created</Label>
                  <p className="text-sm text-muted-foreground">Get notified when bookings are created</p>
                </div>
                <Switch
                  id="booking-created"
                  checked={alertPreferences.alertOnBookingCreated}
                  onCheckedChange={(checked) => {
                    const updated = { ...alertPreferences, alertOnBookingCreated: checked }
                    handleUpdatePreferences(updated)
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="payment-success">Payment Success</Label>
                  <p className="text-sm text-muted-foreground">Get notified when payments are successfully processed</p>
                </div>
                <Switch
                  id="payment-success"
                  checked={alertPreferences.alertOnPaymentSuccess}
                  onCheckedChange={(checked) => {
                    const updated = { ...alertPreferences, alertOnPaymentSuccess: checked }
                    handleUpdatePreferences(updated)
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quiet Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Quiet Hours</CardTitle>
              <CardDescription>
                Optionally disable alerts during certain hours (disputes and transfers ignore quiet hours)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quiet-start">Start Time</Label>
                  <Input
                    id="quiet-start"
                    type="time"
                    value={quietHours.start}
                    onChange={(e) => setQuietHours({ ...quietHours, start: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quiet-end">End Time</Label>
                  <Input
                    id="quiet-end"
                    type="time"
                    value={quietHours.end}
                    onChange={(e) => setQuietHours({ ...quietHours, end: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={quietHours.timezone} onValueChange={(value) => setQuietHours({ ...quietHours, timezone: value })}>
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern</SelectItem>
                      <SelectItem value="America/Chicago">Central</SelectItem>
                      <SelectItem value="America/Denver">Mountain</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific</SelectItem>
                      <SelectItem value="America/Anchorage">Alaska</SelectItem>
                      <SelectItem value="Pacific/Honolulu">Hawaii</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleUpdateQuietHours}>Save Quiet Hours</Button>
            </CardContent>
          </Card>

          {/* Test Alert */}
          <Card>
            <CardHeader>
              <CardTitle>Test Alert</CardTitle>
              <CardDescription>
                Send a test SMS to verify your setup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleSendTestAlert} disabled={isSendingTest}>
                {isSendingTest ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Test Alert
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
