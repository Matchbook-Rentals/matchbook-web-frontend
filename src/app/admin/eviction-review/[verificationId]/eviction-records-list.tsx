'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { deleteEvictionRecord } from '../_actions'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'
import type { EvictionRecord } from '@prisma/client'

interface EvictionRecordsListProps {
  records: EvictionRecord[]
  verificationId: string
}

export function EvictionRecordsList({ records, verificationId }: EvictionRecordsListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(recordId: string) {
    if (!confirm('Are you sure you want to delete this eviction record?')) {
      return
    }

    setDeletingId(recordId)
    try {
      await deleteEvictionRecord(recordId, verificationId)
      router.refresh()
    } catch (err) {
      alert('Failed to delete record')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <Card key={record.id} className="bg-gray-50">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{record.caseNumber}</span>
                  {record.judgmentAmount && (
                    <span className="text-red-600 font-medium">
                      ${Number(record.judgmentAmount).toLocaleString()}
                    </span>
                  )}
                </div>

                {record.plaintiff && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Plaintiff:</span> {record.plaintiff}
                  </p>
                )}

                <div className="flex gap-4 text-sm text-muted-foreground">
                  {record.filingDate && (
                    <span>Filed: {new Date(record.filingDate).toLocaleDateString()}</span>
                  )}
                  {record.dispositionDate && (
                    <span>Disposed: {new Date(record.dispositionDate).toLocaleDateString()}</span>
                  )}
                </div>

                {record.disposition && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Disposition:</span> {record.disposition}
                  </p>
                )}

                {record.court && (
                  <p className="text-sm text-muted-foreground">{record.court}</p>
                )}

                {record.defendantAddress && (
                  <p className="text-xs text-muted-foreground">
                    Address: {record.defendantAddress}
                  </p>
                )}

                {record.notes && (
                  <p className="text-sm italic text-muted-foreground mt-2">{record.notes}</p>
                )}

                <p className="text-xs text-muted-foreground mt-2">
                  Added {new Date(record.createdAt).toLocaleString()}
                  {record.enteredBy && ` by ${record.enteredBy}`}
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleDelete(record.id)}
                disabled={deletingId === record.id}
              >
                {deletingId === record.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
