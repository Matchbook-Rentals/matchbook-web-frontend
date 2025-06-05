import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import CronJobsManager from './cron-jobs-manager'

export default function CronJobsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cron Jobs</h1>
        <p className="text-muted-foreground">
          Manually trigger and monitor system cron jobs
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Cron Jobs</CardTitle>
          <CardDescription>
            Trigger cron jobs manually for testing or immediate execution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CronJobsManager />
        </CardContent>
      </Card>
    </div>
  )
}