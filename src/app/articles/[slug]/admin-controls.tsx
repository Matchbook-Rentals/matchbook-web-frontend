'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BrandButton } from '@/components/ui/brandButton'
import { toggleArticlePublish } from '@/app/manage/articles/new/_actions'
import { useToast } from '@/components/ui/use-toast'

interface AdminControlsProps {
  articleId: string
  articleSlug: string
}

export function AdminControls({ articleId, articleSlug }: AdminControlsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPublishing, setIsPublishing] = useState(false)

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      const result = await toggleArticlePublish(articleId)
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Article published successfully',
        })
        router.refresh()
      } else {
        throw new Error(result.error)
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to publish article',
        variant: 'destructive',
      })
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="flex justify-center gap-4 mt-10 pb-10">
      <BrandButton variant="outline" href={`/manage/articles/${articleSlug}/edit`}>
        Edit
      </BrandButton>
      <BrandButton onClick={handlePublish} disabled={isPublishing} spinOnClick>
        Publish
      </BrandButton>
    </div>
  )
}
