'use client'

import { BrandButton } from '@/components/ui/brandButton'
import Link from 'next/link'

interface AddPropertyModalProps {
  triggerButton?: React.ReactNode
}

export default function AddPropertyModal({ 
  triggerButton
}: AddPropertyModalProps) {
  const defaultTrigger = (
    <BrandButton data-testid="add-property-trigger" variant="default">
      Add Property
    </BrandButton>
  )

  return (
    <Link href="/app/host/add-property?new=true">
      {triggerButton || defaultTrigger}
    </Link>
  )
}
