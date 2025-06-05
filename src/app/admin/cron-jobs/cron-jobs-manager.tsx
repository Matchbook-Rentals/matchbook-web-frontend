'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { getCronJobs, triggerCronJob, CronJob, CronJobResult } from './_actions'
import { Play, Clock, CheckCircle, XCircle, RefreshCw, Loader2 } from 'lucide-react'

export default function CronJobsManager() {
  const [cronJobs, setCronJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [triggeringJobs, setTriggeringJobs] = useState<Set<string>>(new Set())
  const [lastResults, setLastResults] = useState<Record<string, CronJobResult>>({})

  const { toast } = useToast()

  useEffect(() => {
    loadCronJobs()
  }, [])

  const loadCronJobs = async () => {
    setLoading(true)
    try {
      const result = await getCronJobs()
      if (result.success && result.jobs) {
        setCronJobs(result.jobs)
      } else {
        toast({
          title: '❌ Failed to Load',
          description: result.error || 'Failed to load cron jobs',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: '❌ Error',
        description: 'An error occurred while loading cron jobs',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTriggerJob = async (jobId: string) => {
    const job = cronJobs.find(j => j.id === jobId)
    if (!job) return

    setTriggeringJobs(prev => new Set(prev).add(jobId))
    
    try {
      const result = await triggerCronJob(jobId)
      
      // Store the result for display
      setLastResults(prev => ({ ...prev, [jobId]: result }))

      if (result.success) {
        toast({
          title: '✅ Job Executed',
          description: `${job.name} completed successfully in ${result.executionTime}ms`
        })
      } else {
        toast({
          title: '❌ Job Failed',
          description: result.error || 'Cron job execution failed',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: '❌ Execution Error',
        description: 'An error occurred while executing the cron job',
        variant: 'destructive'
      })
    } finally {
      setTriggeringJobs(prev => {
        const newSet = new Set(prev)
        newSet.delete(jobId)
        return newSet
      })
    }
  }

  const getStatusIcon = (jobId: string) => {
    const result = lastResults[jobId]
    const isTriggering = triggeringJobs.has(jobId)

    if (isTriggering) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    }

    if (result) {
      return result.success 
        ? <CheckCircle className="h-4 w-4 text-green-500" />
        : <XCircle className="h-4 w-4 text-red-500" />
    }

    return <Clock className="h-4 w-4 text-gray-400" />
  }

  const getStatusBadge = (jobId: string) => {
    const result = lastResults[jobId]
    const isTriggering = triggeringJobs.has(jobId)

    if (isTriggering) {
      return <Badge variant="secondary">Running</Badge>
    }

    if (result) {
      return result.success 
        ? <Badge variant="default" className="bg-green-500">Success</Badge>
        : <Badge variant="destructive">Failed</Badge>
    }

    return <Badge variant="outline">Idle</Badge>
  }

  const formatExecutionTime = (ms?: number) => {
    if (!ms) return null
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading cron jobs...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Available Jobs ({cronJobs.length})</h3>
          <p className="text-sm text-muted-foreground">
            Trigger cron jobs manually for testing or immediate execution
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadCronJobs}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Separator />

      {cronJobs.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Cron Jobs Available</h3>
            <p className="text-muted-foreground">
              No cron jobs are currently configured in the system.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {cronJobs.map((job) => {
            const result = lastResults[job.id]
            const isTriggering = triggeringJobs.has(job.id)

            return (
              <Card key={job.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(job.id)}
                      <CardTitle className="text-lg">{job.name}</CardTitle>
                      {getStatusBadge(job.id)}
                    </div>
                    <Button
                      onClick={() => handleTriggerJob(job.id)}
                      disabled={isTriggering}
                      size="sm"
                    >
                      {isTriggering ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      {isTriggering ? 'Running...' : 'Trigger'}
                    </Button>
                  </div>
                  <CardDescription>{job.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Endpoint:</span>
                      <code className="ml-2 px-2 py-1 bg-muted rounded text-xs">
                        {job.endpoint}
                      </code>
                    </div>

                    {result && (
                      <div className="mt-4 p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Last Execution Result</span>
                          {result.executionTime && (
                            <span className="text-xs text-muted-foreground">
                              {formatExecutionTime(result.executionTime)}
                            </span>
                          )}
                        </div>
                        
                        {result.success ? (
                          <div className="text-sm text-green-700">
                            <p className="mb-1">✅ {result.message}</p>
                            {result.data && (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-xs text-muted-foreground">
                                  View response data
                                </summary>
                                <pre className="mt-1 p-2 bg-black/5 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(result.data, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-red-700">
                            <p>❌ Error: {result.error}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}