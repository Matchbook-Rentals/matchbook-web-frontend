import { redirect } from 'next/navigation'
import { checkAdminAccess } from '@/utils/roles'
import prisma from '@/lib/prismadb'
import { BlogArticle } from '@prisma/client'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ArticleCardMenu } from './components/article-card-menu'
import { MarketingPageHeader } from '@/components/marketing-landing-components/marketing-page-header'
import { PAGE_MARGIN } from '@/constants/styles'
import { BrandButton } from '@/components/ui/brandButton'

async function getBlogArticles(): Promise<BlogArticle[]> {
  const articles = await prisma.blogArticle.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  });
  return articles;
}

export default async function ArticlesManagerPage() {
  if (!(await checkAdminAccess())) {
    redirect('/unauthorized')
  }

  const articles = await getBlogArticles()

  return (
    <div className={`${PAGE_MARGIN} py-10`}>
      <div className="flex justify-center mb-10">
        <MarketingPageHeader
          headerText="Articles"
          breadcrumbText="Articles"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      <div className="flex justify-center mt-10">
        <BrandButton variant="outline" href="/manage/articles/new">
          Create New Article
        </BrandButton>
      </div>
    </div>
  )
}

function ArticleCard({ article }: { article: BlogArticle }) {
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
        <div className="absolute top-3 right-3">
          <ArticleCardMenu articleId={article.id} articleTitle={article.title} />
        </div>
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
