'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { BrandButton } from '@/components/ui/brandButton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AddPropertyModalTest() {
  const { user } = useUser()
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Link href="/admin/test" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Test Dashboard
        </Link>
        <h1 className="text-3xl font-bold mb-2">Add Property Modal Test</h1>
        <p className="text-muted-foreground">
          Test the property creation modal with different start options
        </p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Property Modal Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                Finish Property
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>How would you like to start?</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <BrandButton 
                  variant="default" 
                  className="w-full"
                  onClick={() => {
                    setIsModalOpen(false)
                    console.log('Pick up where you left off clicked')
                  }}
                >
                  Pick up where you left off
                </BrandButton>
                <BrandButton 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setIsModalOpen(false)
                    console.log('Start with a blank listing clicked')
                  }}
                >
                  Start with a blank listing
                </BrandButton>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}