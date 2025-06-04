import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import NotificationCreator from './notification-creator'

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">
          Create and send notifications to users
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Notification</CardTitle>
          <CardDescription>
            Send targeted notifications to specific users or groups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationCreator />
        </CardContent>
      </Card>
    </div>
  )
}