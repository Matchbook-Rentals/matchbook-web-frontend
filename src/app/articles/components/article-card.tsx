'use client'

import { useState } from 'react'
import { BlogArticle } from '@prisma/client'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ArticleCardMenu } from '@/app/manage/articles/components/article-card-menu'

interface ArticleCardProps {
  article: BlogArticle
  isAdmin: boolean
}

export function ArticleCard({ article, isAdmin }: ArticleCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(new Date(date))
  }

  const truncateExcerpt = (text: string | null, maxLength: number = 80) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  return (
    <div className="flex flex-col">
      <div className="relative rounded-lg overflow-hidden aspect-[4/3]">
        {article.imageUrl ? (
          <Image
            src={article.imageUrl}
            alt={article.title || 'Article image'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No image</span>
          </div>
        )}
        {isAdmin && !article.published && (
          <button
            onClick={() => setMenuOpen(true)}
            className="absolute top-3 left-3 bg-black/50 px-2 py-1 rounded cursor-pointer hover:bg-black/70 transition-colors"
          >
            <span className="text-orange-400 text-sm font-medium">Unpublished</span>
          </button>
        )}
        {isAdmin && (
          <div className="absolute top-3 right-3">
            <ArticleCardMenu
              articleId={article.id}
              articleTitle={article.title}
              isPublished={article.published}
              open={menuOpen}
              onOpenChange={setMenuOpen}
            />
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="text-xl font-semibold text-gray-900">{article.title}</h3>
        <p className="text-sm text-gray-500 mt-1">{formatDate(article.createdAt)}</p>
        <p className="text-gray-600 mt-2 text-sm leading-relaxed">
          {truncateExcerpt(article.excerpt)}
        </p>
      </div>

      <div className="mt-3">
        <Link
          href={`/articles/${article.slug}`}
          className="inline-flex items-center text-[#3c8787] font-medium hover:opacity-80 transition-opacity"
        >
          Read More
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
