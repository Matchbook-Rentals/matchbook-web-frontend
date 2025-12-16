'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { CriminalRecord } from '@prisma/client'

interface CriminalRecordsListProps {
  records: CriminalRecord[]
}

export function CriminalRecordsList({ records }: CriminalRecordsListProps) {
  return (
    <div className="space-y-3">
      {records.map((record) => (
        <Card key={record.id} className="bg-gray-50">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-medium">{record.caseNumber}</span>
                {record.crimeType && (
                  <Badge
                    variant={record.crimeType === 'Felony' ? 'destructive' : 'secondary'}
                  >
                    {record.crimeType}
                  </Badge>
                )}
                {record.disposition && (
                  <Badge
                    variant={record.disposition === 'PENDING' ? 'outline' : 'default'}
                    className={record.disposition === 'Guilty' ? 'bg-red-100 text-red-800' : ''}
                  >
                    {record.disposition}
                  </Badge>
                )}
              </div>

              {record.charge && (
                <p className="font-medium">{record.charge}</p>
              )}

              <div className="flex gap-4 text-sm text-muted-foreground">
                {record.filingDate && (
                  <span>Filed: {new Date(record.filingDate).toLocaleDateString()}</span>
                )}
                {record.dispositionDate && (
                  <span>Disposed: {new Date(record.dispositionDate).toLocaleDateString()}</span>
                )}
                {record.pendingDate && (
                  <span>Pending until: {new Date(record.pendingDate).toLocaleDateString()}</span>
                )}
              </div>

              {record.sentenceComments && (
                <p className="text-sm bg-yellow-50 p-2 rounded">
                  <span className="font-medium">Sentence:</span> {record.sentenceComments}
                </p>
              )}

              <div className="flex gap-4 text-sm text-muted-foreground">
                {record.jurisdiction && (
                  <span>{record.jurisdiction} County, {record.jurisdictionState}</span>
                )}
                {record.courtSource && (
                  <span>{record.courtSource}</span>
                )}
              </div>

              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>Identified by:</span>
                {record.identifiedByName && <Badge variant="outline" className="text-xs">Name</Badge>}
                {record.identifiedByDob && <Badge variant="outline" className="text-xs">DOB</Badge>}
                {record.identifiedBySsn && <Badge variant="outline" className="text-xs">SSN</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
