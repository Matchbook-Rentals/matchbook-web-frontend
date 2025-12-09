import { redirect } from 'next/navigation'
import { checkAdminAccess } from '@/utils/roles'
import prisma from '@/lib/prismadb'
import { BlogArticle } from '@prisma/client'
import { MarketingPageHeader } from '@/components/marketing-landing-components/marketing-page-header'
import { PAGE_MARGIN } from '@/constants/styles'
import { BrandButton } from '@/components/ui/brandButton'
import { ArticleCard } from '@/app/articles/components/article-card'

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
          <ArticleCard key={article.id} article={article} isAdmin={true} />
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
