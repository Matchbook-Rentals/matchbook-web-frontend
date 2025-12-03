'use client'

import { MoreVertical, Pencil, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'

interface ArticleCardMenuProps {
  articleId: string
  articleTitle: string
}

export function ArticleCardMenu({ articleId, articleTitle }: ArticleCardMenuProps) {
  const router = useRouter()

  const handleEdit = () => {
    router.push(`/manage/articles/${articleId}/edit`)
  }

  const handleView = () => {
    router.push(`/articles/${articleId}`)
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${articleTitle}"?`)) {
      return
    }
    // TODO: Implement delete functionality
    console.log('Delete article:', articleId)
  }

  return (
    <DropdownMenu>
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
