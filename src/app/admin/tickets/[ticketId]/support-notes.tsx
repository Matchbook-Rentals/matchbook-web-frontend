'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { updateTicketSupportNotes } from '@/app/actions/tickets'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle } from 'lucide-react'

interface SupportNotesProps {
  ticketId: string
  defaultNotes: string
}

export function SupportNotes({ ticketId, defaultNotes }: SupportNotesProps) {
  const [notes, setNotes] = useState(defaultNotes)
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  
  const handleSubmit = async (formData: FormData) => {
    const supportNotes = formData.get('supportNotes') as string
    
    try {
      const result = await updateTicketSupportNotes(ticketId, supportNotes)
      
      if (result.error) {
        setStatus({ type: 'error', message: result.error })
      } else if (result.success) {
        setStatus({ type: 'success', message: 'Notes saved successfully' })
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to save notes' })
    }
    
    // Clear status after 3 seconds
    setTimeout(() => {
      setStatus(null)
    }, 3000)
  }
  
  return (
    <>
      <h3 className="text-sm font-medium text-gray-500 mb-2">Support Notes</h3>
      <form action={handleSubmit}>
        <textarea
          name="supportNotes"
          rows={4}
          className="w-full rounded-md border border-gray-300 p-2"
          placeholder="Internal notes, possible errors, steps taken thus far..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="mt-2 flex flex-col gap-2">
          <Button type="submit">
            Save Notes
          </Button>
          
          {status && (
            <Alert className={status.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
              <div className="flex items-center gap-2">
                {status.type === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <AlertDescription className={status.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                  {status.message}
                </AlertDescription>
              </div>
            </Alert>
          )}
        </div>
      </form>
    </>
  )
}