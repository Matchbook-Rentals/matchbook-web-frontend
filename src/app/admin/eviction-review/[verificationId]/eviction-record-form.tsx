'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { addEvictionRecord, type EvictionRecordInput } from '../_actions'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'

interface EvictionRecordFormProps {
  verificationId: string
  adminUserId: string
}

export function EvictionRecordForm({ verificationId, adminUserId }: EvictionRecordFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    const data: EvictionRecordInput = {
      caseNumber: formData.get('caseNumber') as string,
      filingDate: formData.get('filingDate') as string || undefined,
      dispositionDate: formData.get('dispositionDate') as string || undefined,
      plaintiff: formData.get('plaintiff') as string || undefined,
      defendantAddress: formData.get('defendantAddress') as string || undefined,
      judgmentAmount: formData.get('judgmentAmount')
        ? parseFloat(formData.get('judgmentAmount') as string)
        : undefined,
      disposition: formData.get('disposition') as string || undefined,
      court: formData.get('court') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    }

    try {
      await addEvictionRecord(verificationId, data, adminUserId)
      // Reset form
      e.currentTarget.reset()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add record')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="caseNumber">Case Number *</Label>
          <Input
            id="caseNumber"
            name="caseNumber"
            placeholder="e.g., 20D12681"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="plaintiff">Plaintiff</Label>
          <Input
            id="plaintiff"
            name="plaintiff"
            placeholder="e.g., HAMMOND RESIDENTIAL GROUP"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="filingDate">Filing Date</Label>
          <Input
            id="filingDate"
            name="filingDate"
            type="date"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dispositionDate">Disposition Date</Label>
          <Input
            id="dispositionDate"
            name="dispositionDate"
            type="date"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="judgmentAmount">Judgment Amount ($)</Label>
          <Input
            id="judgmentAmount"
            name="judgmentAmount"
            type="number"
            step="0.01"
            placeholder="e.g., 7267.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="disposition">Disposition</Label>
          <Input
            id="disposition"
            name="disposition"
            placeholder="e.g., JUDGEMENT WITH RESTITUTION OF PREMISES"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="court">Court</Label>
          <Input
            id="court"
            name="court"
            placeholder="e.g., DEKALB COUNTY MAGISTRATE COURT - DECATUR"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="defendantAddress">Defendant Address (at time of eviction)</Label>
          <Input
            id="defendantAddress"
            name="defendantAddress"
            placeholder="e.g., 751 N INDIAN CREEK DR 362, CLARKSTON, GA 30021"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Any additional notes about this eviction record..."
            rows={2}
          />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4 mr-2" />
            Add Eviction Record
          </>
        )}
      </Button>
    </form>
  )
}
