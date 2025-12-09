'use client'

import { useState } from 'react'
import { MoreVertical, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { deleteArticle, toggleArticlePublish } from '../new/_actions'

interface ArticleCardMenuProps {
  articleId: string
  articleTitle: string
  isPublished: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ArticleCardMenu({ articleId, articleTitle, isPublished, open, onOpenChange }: ArticleCardMenuProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const handleEdit = () => {
    router.push(`/manage/articles/${articleId}/edit`)
  }

  const handleView = () => {
    router.push(`/articles/${articleId}`)
  }

  const handleTogglePublish = async () => {
    setIsToggling(true)
    try {
      const result = await toggleArticlePublish(articleId)

      if (result.success) {
        toast({
          title: result.published ? 'Published' : 'Unpublished',
          description: result.message,
        })
        router.refresh()
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update article',
        variant: 'destructive',
      })
    } finally {
      setIsToggling(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${articleTitle}"?`)) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteArticle(articleId)

      if (result.success) {
        toast({
          title: 'Deleted',
          description: 'Article deleted successfully',
        })
        router.refresh()
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete article',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-white rounded-full border border-gray-200 shadow-sm hover:bg-gray-50"
        >
          <MoreVertical className="h-4 w-4 text-gray-600" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={handleView} className="cursor-pointer">
          <Eye className="mr-2 h-4 w-4" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleTogglePublish} className="cursor-pointer">
          {isPublished ? (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              Unpublish
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Publish
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDelete}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
